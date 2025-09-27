/**
 * Test Helper Utilities
 * Common utilities and mock implementations for testing
 */

import { jest } from '@jest/globals';
import {
  ProcessInput,
  ProcessResult,
  EvaluationResult,
  QualityScore,
  AnalysisResult,
  ValidationResult,
  SavedPrompt,
  SearchResult,
  ComparisonResult,
  PromptDomain,
  PromptTone,
  SaveMetadata,
  SearchParams,
} from '../../src/types/prompt';

// Export TEST_CONSTANTS from the centralized file
export { TEST_CONSTANTS } from './test-constants';

// Mock data generators
export function createMockQualityScore(overrides?: Partial<QualityScore>): QualityScore {
  return {
    clarity: 0.8,
    specificity: 0.75,
    structure: 0.85,
    completeness: 0.7,
    overall: 0.775,
    ...overrides,
  };
}

export function createMockAnalysisResult(overrides?: Partial<AnalysisResult>): AnalysisResult {
  return {
    tokens: [
      { text: 'Create', pos: 'VERB', lemma: 'create', isStopWord: false, sentiment: 0.1 },
      { text: 'a', pos: 'DET', lemma: 'a', isStopWord: true, sentiment: 0 },
      { text: 'user', pos: 'NOUN', lemma: 'user', isStopWord: false, sentiment: 0 },
      { text: 'table', pos: 'NOUN', lemma: 'table', isStopWord: false, sentiment: 0 },
    ],
    entities: [
      { text: 'user table', label: 'TECH', start: 8, end: 18, confidence: 0.9 }
    ],
    intent: { category: 'database_creation', confidence: 0.85, subcategories: ['table', 'schema'] },
    complexity: 0.3,
    ambiguityScore: 0.2,
    hasVariables: false,
    language: 'en',
    domainHints: ['sql', 'database'],
    sentimentScore: 0.05,
    readabilityScore: 0.8,
    technicalTerms: ['table', 'user'],
    estimatedTokens: 4,
    ...overrides,
  };
}

export function createMockValidationResult(overrides?: Partial<ValidationResult>): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [
      {
        type: 'enhancement',
        message: 'Consider adding column specifications',
        before: 'Create a user table',
        after: 'Create a user table with id, name, email columns',
      }
    ],
    qualityMetrics: {
      clarity: 0.8,
      specificity: 0.6,
      structure: 0.9,
      completeness: 0.5,
      consistency: 0.8,
      actionability: 0.7,
    },
    ...overrides,
  };
}

export function createMockProcessInput(overrides?: Partial<ProcessInput>): ProcessInput {
  return {
    raw: 'Create a user table',
    domain: PromptDomain.SQL,
    tone: PromptTone.TECHNICAL,
    context: 'Database design for web application',
    variables: {},
    targetModel: 'general',
    ...overrides,
  };
}

export function createMockProcessResult(overrides?: Partial<ProcessResult>): ProcessResult {
  return {
    original: 'Create a user table',
    refined: 'Create a comprehensive user table with the following columns: id (primary key), name (varchar), email (unique, varchar), created_at (timestamp), updated_at (timestamp)',
    system: 'You are an expert database architect. Focus on creating well-structured, normalized database schemas.',
    analysis: createMockAnalysisResult(),
    score: createMockQualityScore(),
    validation: createMockValidationResult(),
    suggestions: ['Add primary key specification', 'Include data types for columns'],
    metadata: {
      domain: PromptDomain.SQL,
      tone: PromptTone.TECHNICAL,
      processingTime: 1500,
      version: '1.0.0',
      cacheHit: false,
      rulesApplied: ['sql_table_structure', 'primary_key_requirement'],
    },
    template: {
      prompt: 'Create a {table_type} table with columns: {columns}',
      system: 'You are an expert database architect.',
      variables: { table_type: 'user', columns: 'id, name, email' },
      type: 'basic' as any,
    },
    examples: [
      {
        input: 'user table',
        output: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR(100), email VARCHAR(255) UNIQUE);',
        context: 'PostgreSQL syntax',
      }
    ],
    ...overrides,
  };
}

export function createMockEvaluationResult(overrides?: Partial<EvaluationResult>): EvaluationResult {
  return {
    score: createMockQualityScore(),
    breakdown: {
      clarity: {
        score: 0.8,
        factors: [
          { name: 'specific_terms', weight: 0.4, score: 0.9, description: 'Uses clear technical terms' },
          { name: 'ambiguous_language', weight: 0.3, score: 0.7, description: 'Minimal ambiguous phrasing' },
        ],
      },
      specificity: {
        score: 0.75,
        factors: [
          { name: 'technical_details', weight: 0.5, score: 0.8, description: 'Good technical specificity' },
        ],
      },
      structure: {
        score: 0.85,
        factors: [
          { name: 'logical_flow', weight: 0.6, score: 0.9, description: 'Clear logical structure' },
        ],
      },
      completeness: {
        score: 0.7,
        factors: [
          { name: 'requirements', weight: 0.7, score: 0.7, description: 'Most requirements covered' },
        ],
      },
    },
    recommendations: [
      {
        type: 'important',
        title: 'Add Technical Specifications',
        description: 'Consider adding more specific database constraints and data types',
        impact: 'medium',
      }
    ],
    ...overrides,
  };
}

export function createMockSavedPrompt(overrides?: Partial<SavedPrompt>): SavedPrompt {
  return {
    id: 'prompt_123',
    name: 'User Table Creation',
    domain: PromptDomain.SQL,
    tags: ['database', 'table', 'user'],
    description: 'Template for creating user tables',
    prompt: 'Create a comprehensive user table...',
    systemPrompt: 'You are an expert database architect.',
    score: createMockQualityScore(),
    metadata: {
      name: 'User Table Creation',
      domain: 'sql',
      tags: ['database', 'table'],
      description: 'Template for creating user tables',
      isPublic: false,
      authorId: 'user_456',
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

export function createMockSearchResult(overrides?: Partial<SearchResult>): SearchResult {
  return {
    id: 'prompt_123',
    name: 'User Table Creation',
    domain: PromptDomain.SQL,
    tags: ['database', 'table'],
    description: 'Template for creating user tables',
    prompt: 'Create a comprehensive user table...',
    score: createMockQualityScore(),
    usage: {
      count: 15,
      successRate: 0.93,
      avgResponseTime: 1200,
      lastUsed: new Date('2024-01-15T00:00:00Z'),
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    relevance: 0.95,
    ...overrides,
  };
}

export function createMockComparisonResult(overrides?: Partial<ComparisonResult>): ComparisonResult {
  return {
    variants: [
      {
        id: 'variant_0',
        prompt: 'Create a user table',
        score: createMockQualityScore({ overall: 0.6 }),
        metrics: [
          { name: 'Length', value: 18, unit: 'characters', better: 'optimal' },
          { name: 'Complexity', value: 0.3, unit: 'score', better: 'balanced' },
        ],
      },
      {
        id: 'variant_1',
        prompt: 'Create a comprehensive user table with proper schema design',
        score: createMockQualityScore({ overall: 0.85 }),
        metrics: [
          { name: 'Length', value: 58, unit: 'characters', better: 'optimal' },
          { name: 'Complexity', value: 0.7, unit: 'score', better: 'balanced' },
        ],
      },
    ],
    winner: 'variant_1',
    metrics: [
      {
        name: 'Overall Quality',
        values: { variant_0: 0.6, variant_1: 0.85 },
        winner: 'variant_1',
        significance: 0.25,
      }
    ],
    summary: 'variant_1 achieved the highest quality score of 85.0% (average: 72.5%). Key advantages include better specificity and completeness.',
    ...overrides,
  };
}

// Mock service factories
export function createMockOrchestrator(): any {
  return {
    process: (jest.fn() as any).mockResolvedValue(createMockProcessResult()),
    evaluate: (jest.fn() as any).mockResolvedValue(createMockEvaluationResult()),
    compare: (jest.fn() as any).mockResolvedValue(createMockComparisonResult()),
    save: (jest.fn() as any).mockResolvedValue(createMockSavedPrompt()),
    search: (jest.fn() as any).mockResolvedValue([createMockSearchResult()]),
    getById: (jest.fn() as any).mockResolvedValue(createMockSavedPrompt()),
    getStats: (jest.fn() as any).mockResolvedValue({
      totalProcessed: 100,
      totalSaved: 50,
      averageQuality: 0.75,
      cacheHitRate: 0.60,
      uptime: process.uptime(),
      topDomain: 'general'
    }),
    validate: (jest.fn() as any).mockResolvedValue(createMockValidationResult()),
  };
}

export function createMockStoreService(): any {
  return {
    save: (jest.fn() as any).mockResolvedValue(createMockSavedPrompt()),
    getById: (jest.fn() as any).mockResolvedValue(createMockSavedPrompt()),
    search: (jest.fn() as any).mockResolvedValue([createMockSearchResult()]),
    getStats: (jest.fn() as any).mockResolvedValue({
      totalPrompts: 150,
      totalDomains: 6,
      avgQualityScore: 0.78,
      topDomains: ['sql', 'general', 'saas'],
    }),
  };
}

export function createMockTelemetryService(): any {
  return {
    track: (jest.fn() as any).mockResolvedValue(undefined),
    error: (jest.fn() as any).mockResolvedValue(undefined),
    getStats: (jest.fn() as any).mockResolvedValue({
      events: 250,
      errors: 5,
      avgProcessingTime: 1200,
      successRate: 0.98,
    }),
  };
}

export function createMockCacheService(): any {
  return {
    get: (jest.fn() as any).mockResolvedValue(null),
    set: (jest.fn() as any).mockResolvedValue(true),
    delete: (jest.fn() as any).mockResolvedValue(true),
    clear: (jest.fn() as any).mockResolvedValue(undefined),
    has: (jest.fn() as any).mockResolvedValue(false),
  };
}

export function createMockServices(): any {
  return {
    store: createMockStoreService(),
    telemetry: createMockTelemetryService(),
    cache: createMockCacheService(),
    healthCheck: (jest.fn() as any).mockResolvedValue({
      status: 'healthy',
      uptime: 86400,
      database: 'connected',
      cache: 'available',
    }),
    shutdown: (jest.fn() as any).mockResolvedValue(undefined),
  };
}

// Test assertions and matchers
export function expectValidQualityScore(score: QualityScore): void {
  expect(score.clarity).toBeGreaterThanOrEqual(0);
  expect(score.clarity).toBeLessThanOrEqual(1);
  expect(score.specificity).toBeGreaterThanOrEqual(0);
  expect(score.specificity).toBeLessThanOrEqual(1);
  expect(score.structure).toBeGreaterThanOrEqual(0);
  expect(score.structure).toBeLessThanOrEqual(1);
  expect(score.completeness).toBeGreaterThanOrEqual(0);
  expect(score.completeness).toBeLessThanOrEqual(1);
  expect(score.overall).toBeGreaterThanOrEqual(0);
  expect(score.overall).toBeLessThanOrEqual(1);
}

export function expectValidAnalysisResult(analysis: AnalysisResult): void {
  expect(analysis.tokens).toBeInstanceOf(Array);
  expect(analysis.entities).toBeInstanceOf(Array);
  expect(analysis.intent).toHaveProperty('category');
  expect(analysis.intent).toHaveProperty('confidence');
  expect(analysis.complexity).toBeGreaterThanOrEqual(0);
  expect(analysis.complexity).toBeLessThanOrEqual(1);
  expect(analysis.ambiguityScore).toBeGreaterThanOrEqual(0);
  expect(analysis.ambiguityScore).toBeLessThanOrEqual(1);
  expect(analysis.domainHints).toBeInstanceOf(Array);
  expect(analysis.technicalTerms).toBeInstanceOf(Array);
}

export function expectValidProcessResult(result: ProcessResult): void {
  expect(result).toHaveProperty('original');
  expect(result).toHaveProperty('refined');
  expect(result).toHaveProperty('system');
  expect(result).toHaveProperty('analysis');
  expect(result).toHaveProperty('score');
  expect(result).toHaveProperty('validation');
  expect(result).toHaveProperty('suggestions');
  expect(result).toHaveProperty('metadata');

  expectValidAnalysisResult(result.analysis);
  expectValidQualityScore(result.score);

  expect(result.validation.isValid).toBeDefined();
  expect(result.validation.errors).toBeInstanceOf(Array);
  expect(result.validation.warnings).toBeInstanceOf(Array);
  expect(result.suggestions).toBeInstanceOf(Array);

  expect(result.metadata.processingTime).toBeGreaterThan(0);
  expect(result.metadata.version).toBeDefined();
}

// Performance testing utilities
export function measurePerformance<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  return fn().then(result => ({
    result,
    duration: Date.now() - start,
  }));
}

export function expectWithinPerformanceThreshold(duration: number, threshold: number, operation: string): void {
  expect(duration).toBeLessThanOrEqual(threshold);
  if (duration > threshold * 0.8) {
    console.warn(`⚠️ Performance warning: ${operation} took ${duration}ms (threshold: ${threshold}ms)`);
  }
}

// Database test utilities
export function createTestDatabase() {
  // Mock database implementation for testing
  const data = new Map();

  return {
    clear: () => data.clear(),
    set: (key: string, value: any) => data.set(key, value),
    get: (key: string) => data.get(key),
    has: (key: string) => data.has(key),
    delete: (key: string) => data.delete(key),
    size: () => data.size,
    values: () => Array.from(data.values()),
    keys: () => Array.from(data.keys()),
  };
}

// Environment setup utilities - Fixed type issue
export function setupTestEnvironment(overrides?: Record<string, string>): void {
  const testEnv: Record<string, string> = {
    NODE_ENV: 'test',
    TELEMETRY_ENABLED: 'false',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-key-123',
    REDIS_URL: 'redis://localhost:6379/1',
    ...overrides,
  };

  Object.keys(testEnv).forEach(key => {
    process.env[key] = testEnv[key];
  });
}

export function cleanupTestEnvironment(): void {
  delete process.env.NODE_ENV;
  delete process.env.TELEMETRY_ENABLED;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.REDIS_URL;
}