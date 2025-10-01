/**
 * Mock Service Implementations
 * Comprehensive mocks for all external services and dependencies
 */

// @ts-nocheck
import { jest } from '@jest/globals';

// Mock Supabase client
export function createMockSupabaseClient() {
  const mockSelect = {
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null } as any),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null } as any),
  };

  const mockFrom = {
    select: jest.fn().mockReturnValue({
      ...mockSelect,
      then: jest.fn().mockResolvedValue({ data: [], error: null } as any),
    }),
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: null } as any),
      }),
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null } as any),
        }),
      }),
    }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null } as any),
    }),
  };

  return {
    from: jest.fn().mockReturnValue(mockFrom),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null } as any),
  };
}

// Mock Redis client
export function createMockRedisClient() {
  const store = new Map<string, string>();

  return {
    get: jest.fn().mockImplementation(((key: unknown) =>
      Promise.resolve(store.get(key as string) || null)
    ) as any),
    set: jest.fn().mockImplementation(((key: unknown, value: unknown, ttl?: unknown) => {
      store.set(key as string, value as string);
      return Promise.resolve('OK');
    }) as any),
    del: jest.fn().mockImplementation(((key: unknown) => {
      const existed = store.has(key as string);
      store.delete(key as string);
      return Promise.resolve(existed ? 1 : 0);
    }) as any),
    exists: jest.fn().mockImplementation(((key: unknown) =>
      Promise.resolve(store.has(key as string) ? 1 : 0)
    ) as any),
    keys: jest.fn().mockImplementation(((pattern: unknown) => {
      // Simple pattern matching for tests
      const keys = Array.from(store.keys());
      const patternStr = pattern as string;
      if (patternStr === '*') return Promise.resolve(keys);

      const regex = new RegExp(patternStr.replace('*', '.*'));
      return Promise.resolve(keys.filter(key => regex.test(key)));
    }) as any),
    flushall: jest.fn().mockImplementation(() => {
      store.clear();
      return Promise.resolve('OK');
    }),
    quit: jest.fn().mockResolvedValue('OK' as any),
  };
}

// Mock OpenAI client
export function createMockOpenAIClient() {
  return {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{
          text: 'Mocked OpenAI response',
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      } as any),
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mocked ChatGPT response',
              role: 'assistant',
            },
            finish_reason: 'stop',
          }],
          usage: {
            prompt_tokens: 15,
            completion_tokens: 25,
            total_tokens: 40,
          },
        } as any),
      },
    },
  };
}

// Mock Natural Language Processing services
export function createMockNLPService() {
  return {
    tokenize: jest.fn().mockReturnValue([
      { text: 'Create', pos: 'VERB', lemma: 'create' },
      { text: 'a', pos: 'DET', lemma: 'a' },
      { text: 'user', pos: 'NOUN', lemma: 'user' },
      { text: 'table', pos: 'NOUN', lemma: 'table' },
    ]),
    analyze: jest.fn().mockResolvedValue({
      sentiment: 0.1,
      entities: [{ text: 'user table', label: 'TECH', confidence: 0.9 }],
      complexity: 0.3,
      readability: 0.8,
    } as any),
    extractKeywords: jest.fn().mockReturnValue(['user', 'table', 'create']),
    detectLanguage: jest.fn().mockReturnValue('en'),
    calculateReadability: jest.fn().mockReturnValue(0.8),
    extractEntities: jest.fn().mockReturnValue([
      { text: 'user table', label: 'TECH', start: 8, end: 18, confidence: 0.9 }
    ]),
  };
}

// Mock file system operations
export function createMockFileSystem() {
  const files = new Map<string, string>();

  return {
    readFile: jest.fn().mockImplementation(((path: unknown) => {
      const pathStr = path as string;
      if (files.has(pathStr)) {
        return Promise.resolve(files.get(pathStr));
      }
      return Promise.reject(new Error(`File not found: ${pathStr}`));
    }) as any),
    writeFile: jest.fn().mockImplementation(((path: unknown, content: unknown) => {
      files.set(path as string, content as string);
      return Promise.resolve();
    }) as any),
    exists: jest.fn().mockImplementation(((path: unknown) =>
      Promise.resolve(files.has(path as string))
    ) as any),
    unlink: jest.fn().mockImplementation(((path: unknown) => {
      const pathStr = path as string;
      const existed = files.has(pathStr);
      files.delete(pathStr);
      return existed ? Promise.resolve() : Promise.reject(new Error(`File not found: ${pathStr}`));
    }) as any),
    mkdir: jest.fn().mockResolvedValue(undefined as any),
    stat: jest.fn().mockImplementation(((path: unknown) => {
      const pathStr = path as string;
      if (!files.has(pathStr)) {
        return Promise.reject(new Error(`File not found: ${pathStr}`));
      }
      return Promise.resolve({
        isFile: () => true,
        isDirectory: () => false,
        size: files.get(pathStr)?.length || 0,
        mtime: new Date(),
      });
    }) as any),
  };
}

// Mock logger
export function createMockLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

// Mock crypto utilities
export function createMockCrypto() {
  return {
    randomUUID: jest.fn().mockReturnValue('mock-uuid-123'),
    createHash: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mock-hash-456'),
    }),
    randomBytes: jest.fn().mockReturnValue(Buffer.from('mock-random-bytes')),
  };
}

// Mock email service
export function createMockEmailService() {
  return {
    send: jest.fn().mockResolvedValue({
      messageId: 'mock-message-id',
      response: 'Message sent',
    } as any),
    sendTemplate: jest.fn().mockResolvedValue({
      messageId: 'mock-template-message-id',
      response: 'Template sent',
    } as any),
  };
}

// Mock webhook service
export function createMockWebhookService() {
  const deliveries: any[] = [];

  return {
    send: jest.fn().mockImplementation(((url: unknown, payload: unknown) => {
      deliveries.push({ url, payload, timestamp: new Date() });
      return Promise.resolve({ status: 200, response: 'OK' });
    }) as any),
    getDeliveries: jest.fn().mockReturnValue(deliveries),
    clearDeliveries: jest.fn().mockImplementation(() => {
      deliveries.length = 0;
    }),
  };
}

// Mock queue service
export function createMockQueueService() {
  const jobs: any[] = [];

  return {
    add: jest.fn().mockImplementation(((name: unknown, data: unknown, options?: unknown) => {
      const job = {
        id: `job-${Date.now()}`,
        name,
        data,
        options,
        status: 'waiting',
        createdAt: new Date(),
      };
      jobs.push(job);
      return Promise.resolve(job);
    }) as any),
    process: jest.fn().mockImplementation(((processor: unknown) => {
      // Mock job processing
      setImmediate(() => {
        const waitingJobs = jobs.filter(job => job.status === 'waiting');
        waitingJobs.forEach(job => {
          job.status = 'completed';
          (processor as Function)(job);
        });
      });
    }) as any),
    getJobs: jest.fn().mockReturnValue(jobs),
    clearJobs: jest.fn().mockImplementation(() => {
      jobs.length = 0;
    }),
  };
}

// Mock analytics service
export function createMockAnalyticsService() {
  const events: any[] = [];

  return {
    track: jest.fn().mockImplementation(((event: unknown, properties: unknown) => {
      events.push({
        event,
        properties,
        timestamp: new Date(),
        userId: 'mock-user-id',
      });
      return Promise.resolve();
    }) as any),
    identify: jest.fn().mockImplementation(((userId: unknown, traits: unknown) => {
      events.push({
        event: 'identify',
        properties: { userId, ...traits as any },
        timestamp: new Date(),
      });
      return Promise.resolve();
    }) as any),
    getEvents: jest.fn().mockReturnValue(events),
    clearEvents: jest.fn().mockImplementation(() => {
      events.length = 0;
    }),
  };
}

// Mock store service
export function createMockStoreService() {
  return {
    save: jest.fn(),
    getById: jest.fn(),
    search: jest.fn(),
    getStats: jest.fn(),
  };
}

// Mock refine service
export function createMockRefineService() {
  return {
    refine: jest.fn(),
  };
}

// Mock score service
export function createMockScoreService() {
  return {
    score: jest.fn(),
    evaluate: jest.fn(),
  };
}

// Mock cache service
export function createMockCacheService() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    has: jest.fn(),
  };
}

// Mock telemetry service
export function createMockTelemetryService() {
  return {
    track: jest.fn(),
    trackError: jest.fn(),
    trackMetric: jest.fn(),
    getStats: jest.fn(),
  };
}

// Mock observability service
export function createMockObservabilityService() {
  return {
    track: jest.fn(),
    trackError: jest.fn(),
    trackMetric: jest.fn(),
    getStats: jest.fn(),
  };
}

// Service factory for easy mocking
export function createMockServices(overrides?: any) {
  return {
    supabase: createMockSupabaseClient(),
    redis: createMockRedisClient(),
    openai: createMockOpenAIClient(),
    nlp: createMockNLPService(),
    fs: createMockFileSystem(),
    logger: createMockLogger(),
    crypto: createMockCrypto(),
    email: createMockEmailService(),
    webhook: createMockWebhookService(),
    queue: createMockQueueService(),
    analytics: createMockAnalyticsService(),
    // Add the missing services
    store: createMockStoreService(),
    refine: createMockRefineService(),
    score: createMockScoreService(),
    cache: createMockCacheService(),
    telemetry: createMockTelemetryService(),
    observability: createMockObservabilityService(),
    ...overrides,
  };
}

// Mock environment setup - Updated to work properly with Jest
export function setupMockEnvironment() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-key-123';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  process.env.TELEMETRY_ENABLED = 'false';
  process.env.OPENAI_API_KEY = 'test-openai-key';

  // Return cleanup function
  return {
    cleanup: () => {
      delete process.env.NODE_ENV;
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.REDIS_URL;
      delete process.env.TELEMETRY_ENABLED;
      delete process.env.OPENAI_API_KEY;
    },
  };
}

// Global mock setup for common modules
export function setupGlobalMocks() {
  // Mock console methods to reduce noise during testing
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  // Mock timers if needed
  jest.useFakeTimers();

  return {
    restore: () => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    }
  };
}