/**
 * Mock Service Implementations
 * Comprehensive mocks for all external services and dependencies
 */

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
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  const mockFrom = {
    select: jest.fn().mockReturnValue({
      ...mockSelect,
      then: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  };

  return {
    from: jest.fn().mockReturnValue(mockFrom),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
}

// Mock Redis client
export function createMockRedisClient() {
  const store = new Map<string, string>();

  return {
    get: jest.fn().mockImplementation((key: string) =>
      Promise.resolve(store.get(key) || null)
    ),
    set: jest.fn().mockImplementation((key: string, value: string, ttl?: number) => {
      store.set(key, value);
      return Promise.resolve('OK');
    }),
    del: jest.fn().mockImplementation((key: string) => {
      const existed = store.has(key);
      store.delete(key);
      return Promise.resolve(existed ? 1 : 0);
    }),
    exists: jest.fn().mockImplementation((key: string) =>
      Promise.resolve(store.has(key) ? 1 : 0)
    ),
    keys: jest.fn().mockImplementation((pattern: string) => {
      // Simple pattern matching for tests
      const keys = Array.from(store.keys());
      if (pattern === '*') return Promise.resolve(keys);

      const regex = new RegExp(pattern.replace('*', '.*'));
      return Promise.resolve(keys.filter(key => regex.test(key)));
    }),
    flushall: jest.fn().mockImplementation(() => {
      store.clear();
      return Promise.resolve('OK');
    }),
    quit: jest.fn().mockResolvedValue('OK'),
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
      }),
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
        }),
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
    }),
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
    readFile: jest.fn().mockImplementation((path: string) => {
      if (files.has(path)) {
        return Promise.resolve(files.get(path));
      }
      return Promise.reject(new Error(`File not found: ${path}`));
    }),
    writeFile: jest.fn().mockImplementation((path: string, content: string) => {
      files.set(path, content);
      return Promise.resolve();
    }),
    exists: jest.fn().mockImplementation((path: string) =>
      Promise.resolve(files.has(path))
    ),
    unlink: jest.fn().mockImplementation((path: string) => {
      const existed = files.has(path);
      files.delete(path);
      return existed ? Promise.resolve() : Promise.reject(new Error(`File not found: ${path}`));
    }),
    mkdir: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockImplementation((path: string) => {
      if (!files.has(path)) {
        return Promise.reject(new Error(`File not found: ${path}`));
      }
      return Promise.resolve({
        isFile: () => true,
        isDirectory: () => false,
        size: files.get(path)?.length || 0,
        mtime: new Date(),
      });
    }),
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
    }),
    sendTemplate: jest.fn().mockResolvedValue({
      messageId: 'mock-template-message-id',
      response: 'Template sent',
    }),
  };
}

// Mock webhook service
export function createMockWebhookService() {
  const deliveries: any[] = [];

  return {
    send: jest.fn().mockImplementation((url: string, payload: any) => {
      deliveries.push({ url, payload, timestamp: new Date() });
      return Promise.resolve({ status: 200, response: 'OK' });
    }),
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
    add: jest.fn().mockImplementation((name: string, data: any, options?: any) => {
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
    }),
    process: jest.fn().mockImplementation((processor: Function) => {
      // Mock job processing
      setImmediate(() => {
        const waitingJobs = jobs.filter(job => job.status === 'waiting');
        waitingJobs.forEach(job => {
          job.status = 'completed';
          processor(job);
        });
      });
    }),
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
    track: jest.fn().mockImplementation((event: string, properties: any) => {
      events.push({
        event,
        properties,
        timestamp: new Date(),
        userId: 'mock-user-id',
      });
      return Promise.resolve();
    }),
    identify: jest.fn().mockImplementation((userId: string, traits: any) => {
      events.push({
        event: 'identify',
        properties: { userId, ...traits },
        timestamp: new Date(),
      });
      return Promise.resolve();
    }),
    getEvents: jest.fn().mockReturnValue(events),
    clearEvents: jest.fn().mockImplementation(() => {
      events.length = 0;
    }),
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
    ...overrides,
  };
}

// Mock environment setup
export function setupMockEnvironment() {
  // Store original modules
  const originalModules = {
    '@supabase/supabase-js': jest.fn(),
    'ioredis': jest.fn(),
    'openai': jest.fn(),
    'natural': jest.fn(),
    'winston': jest.fn(),
    'crypto': jest.fn(),
  };

  // Mock all external dependencies
  jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn().mockReturnValue(createMockSupabaseClient()),
  }));

  jest.mock('ioredis', () => jest.fn().mockImplementation(() => createMockRedisClient()));

  jest.mock('openai', () => ({
    OpenAI: jest.fn().mockImplementation(() => createMockOpenAIClient()),
  }));

  jest.mock('winston', () => createMockLogger());

  jest.mock('crypto', () => createMockCrypto());

  return {
    cleanup: () => {
      // Restore original modules if needed
      Object.keys(originalModules).forEach(module => {
        jest.unmock(module);
      });
    },
  };
}