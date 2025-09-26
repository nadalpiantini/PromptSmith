import Redis from 'ioredis';

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  memoryUsage: number;
}

export interface CacheOptions {
  ttl?: number;
  serialize?: boolean;
  compress?: boolean;
  namespace?: string;
}

export class CacheService {
  private redis: Redis | null;
  private stats: { hits: number; misses: number };
  private defaultTTL: number = 3600; // 1 hour
  private keyPrefix: string = 'promptsmith:';
  private developmentMode: boolean;
  private mockCache: Map<string, { value: any; expiry: number }> = new Map();

  constructor() {
    this.stats = { hits: 0, misses: 0 };

    // Check if cache is enabled
    this.developmentMode = process.env.CACHE_ENABLED === 'false' || 
                          process.env.NODE_ENV === 'development';

    if (this.developmentMode) {
      console.log('CacheService: Running in development/offline mode - using in-memory cache');
      this.redis = null;
      return;
    }

    // Initialize Redis connection
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000
      });

      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      this.redis.on('reconnecting', () => {
        console.log('Redis reconnecting...');
      });

    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      throw new Error('Cache service initialization failed');
    }
  }

  async get<T = any>(
    key: string,
    options: Pick<CacheOptions, 'namespace' | 'serialize'> = {}
  ): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options.namespace);

      if (this.developmentMode) {
        // Mock cache implementation
        const cached = this.mockCache.get(fullKey);
        if (!cached || cached.expiry < Date.now()) {
          this.stats.misses++;
          this.mockCache.delete(fullKey);
          return null;
        }
        this.stats.hits++;
        return cached.value as T;
      }

      const cached = await this.redis!.get(fullKey);

      if (cached === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;

      // Default to JSON deserialization unless explicitly disabled
      if (options.serialize !== false) {
        try {
          return JSON.parse(cached) as T;
        } catch (parseError) {
          console.error('Failed to parse cached value:', parseError);
          // Return raw string if JSON parsing fails
          return cached as T;
        }
      }

      return cached as T;

    } catch (error) {
      console.error('Cache get operation failed:', error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T = any>(
    key: string,
    value: T,
    ttlOrOptions?: number | CacheOptions
  ): Promise<boolean> {
    try {
      let options: CacheOptions = {};
      let ttl = this.defaultTTL;

      if (typeof ttlOrOptions === 'number') {
        ttl = ttlOrOptions;
      } else if (ttlOrOptions) {
        options = ttlOrOptions;
        ttl = options.ttl || this.defaultTTL;
      }

      const fullKey = this.buildKey(key, options.namespace);

      if (this.developmentMode) {
        // Mock cache implementation
        const expiry = Date.now() + (ttl * 1000);
        this.mockCache.set(fullKey, { value, expiry });
        return true;
      }

      // Serialize value (default to JSON unless explicitly disabled)
      let serializedValue: string;
      if (options.serialize !== false) {
        try {
          serializedValue = JSON.stringify(value);
        } catch (serializeError) {
          console.error('Failed to serialize cache value:', serializeError);
          serializedValue = String(value);
        }
      } else {
        serializedValue = String(value);
      }

      // Set with TTL
      const result = await this.redis.setex(fullKey, ttl, serializedValue);
      return result === 'OK';

    } catch (error) {
      console.error('Cache set operation failed:', error);
      return false;
    }
  }

  async has(key: string, namespace?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, namespace);
      const exists = await this.redis.exists(fullKey);
      return exists === 1;
    } catch (error) {
      console.error('Cache has operation failed:', error);
      return false;
    }
  }

  async delete(key: string, namespace?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, namespace);
      const deleted = await this.redis.del(fullKey);
      return deleted === 1;
    } catch (error) {
      console.error('Cache delete operation failed:', error);
      return false;
    }
  }

  async deletePattern(pattern: string, namespace?: string): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern, namespace);
      const keys = await this.redis.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      const deleted = await this.redis.del(...keys);
      return deleted;
    } catch (error) {
      console.error('Cache deletePattern operation failed:', error);
      return 0;
    }
  }

  async clear(namespace?: string): Promise<boolean> {
    try {
      const pattern = namespace
        ? `${this.keyPrefix}${namespace}:*`
        : `${this.keyPrefix}*`;

      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return true;
      }

      const deleted = await this.redis.del(...keys);
      return deleted > 0;
    } catch (error) {
      console.error('Cache clear operation failed:', error);
      return false;
    }
  }

  async getTTL(key: string, namespace?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key, namespace);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      console.error('Cache getTTL operation failed:', error);
      return -1;
    }
  }

  async extend(key: string, ttl: number, namespace?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, namespace);
      const result = await this.redis.expire(fullKey, ttl);
      return result === 1;
    } catch (error) {
      console.error('Cache extend operation failed:', error);
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const memoryLines = info.split('\r\n');
      const usedMemoryLine = memoryLines.find(line => line.startsWith('used_memory:'));
      const memoryUsage = usedMemoryLine
        ? parseInt(usedMemoryLine.split(':')[1], 10)
        : 0;

      // Get approximate size by counting keys
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      const size = keys.length;

      const total = this.stats.hits + this.stats.misses;
      const hitRate = total > 0 ? this.stats.hits / total : 0;

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate,
        size,
        memoryUsage
      };
    } catch (error) {
      console.error('Cache getStats operation failed:', error);
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: 0,
        size: 0,
        memoryUsage: 0
      };
    }
  }

  async resetStats(): Promise<void> {
    this.stats = { hits: 0, misses: 0 };
  }

  // Multi-get for batch operations
  async mget<T = any>(keys: string[], namespace?: string): Promise<Array<T | null>> {
    try {
      const fullKeys = keys.map(key => this.buildKey(key, namespace));
      const values = await this.redis.mget(...fullKeys);

      return values.map((value, index) => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }

        this.stats.hits++;

        try {
          return JSON.parse(value) as T;
        } catch (parseError) {
          console.error(`Failed to parse cached value for key ${keys[index]}:`, parseError);
          return value as T;
        }
      });
    } catch (error) {
      console.error('Cache mget operation failed:', error);
      this.stats.misses += keys.length;
      return keys.map(() => null);
    }
  }

  // Multi-set for batch operations
  async mset(keyValuePairs: Array<[string, any]>, ttl?: number, namespace?: string): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();

      for (const [key, value] of keyValuePairs) {
        const fullKey = this.buildKey(key, namespace);
        const serializedValue = JSON.stringify(value);

        if (ttl) {
          pipeline.setex(fullKey, ttl, serializedValue);
        } else {
          pipeline.setex(fullKey, this.defaultTTL, serializedValue);
        }
      }

      const results = await pipeline.exec();
      return results?.every(([error, result]) => error === null && result === 'OK') || false;
    } catch (error) {
      console.error('Cache mset operation failed:', error);
      return false;
    }
  }

  // Increment operations for counters
  async increment(key: string, amount: number = 1, namespace?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key, namespace);
      return await this.redis.incrby(fullKey, amount);
    } catch (error) {
      console.error('Cache increment operation failed:', error);
      return 0;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      if (this.developmentMode) {
        return true; // Always return true for mock cache
      }
      
      const result = await this.redis!.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Cache ping failed:', error);
      return false;
    }
  }

  // Connection management
  async disconnect(): Promise<void> {
    try {
      if (this.developmentMode) {
        this.mockCache.clear();
        return;
      }
      
      await this.redis!.quit();
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }

  // Private helpers
  private buildKey(key: string, namespace?: string): string {
    if (namespace) {
      return `${this.keyPrefix}${namespace}:${key}`;
    }
    return `${this.keyPrefix}${key}`;
  }

  // Cache-aside pattern helpers
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    const data = await fetcher();

    // Set in cache for next time
    await this.set(key, data, options);

    return data;
  }

  // Distributed locking
  async lock(key: string, ttl: number = 10, namespace?: string): Promise<boolean> {
    try {
      const lockKey = this.buildKey(`lock:${key}`, namespace);
      const result = await this.redis.set(lockKey, '1', 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error) {
      console.error('Cache lock operation failed:', error);
      return false;
    }
  }

  async unlock(key: string, namespace?: string): Promise<boolean> {
    try {
      const lockKey = this.buildKey(`lock:${key}`, namespace);
      const deleted = await this.redis.del(lockKey);
      return deleted === 1;
    } catch (error) {
      console.error('Cache unlock operation failed:', error);
      return false;
    }
  }
}