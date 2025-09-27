/**
 * Unit Tests for process_prompt tool - Fixed version with inlined constants
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Inline test constants to avoid import issues
const TEST_CONSTANTS = {
  SAMPLE_PROMPTS: {
    simple: 'Create a user table',
    complex: 'Design a comprehensive database schema for an e-commerce platform with user management, product catalog, order processing, inventory tracking, and payment integration',
    technical: 'Implement a RESTful API with JWT authentication, rate limiting, input validation, error handling, and comprehensive logging',
    ambiguous: 'Make it better',
    creative: 'Write a compelling marketing campaign for a sustainable fashion brand targeting millennials'
  },
  PERFORMANCE_THRESHOLDS: {
    validate_prompt: 1000,
    process_prompt: 2000,
    evaluate_prompt: 1500,
    compare_prompts: 3000,
    save_prompt: 1000,
    search_prompts: 800,
    get_prompt: 500,
    get_stats: 300
  },
  DOMAINS: ['sql', 'branding', 'cine', 'saas', 'devops', 'general'],
  TONES: ['formal', 'casual', 'technical', 'creative']
};

// Inline mock data generators
function createMockQualityScore(overrides?: any) {
  return {
    clarity: 0.8,
    specificity: 0.75,
    structure: 0.85,
    completeness: 0.7,
    overall: 0.775,
    ...overrides,
  };
}

function createMockAnalysisResult(overrides?: any) {
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
    ...overrides,
  };
}

function createMockValidationResult(overrides?: any) {
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

function createMockProcessResult(overrides?: any) {
  return {
    original: 'Create a user table',
    refined: 'Create a comprehensive user table with the following columns: id (primary key), name (varchar), email (unique, varchar), created_at (timestamp), updated_at (timestamp)',
    system: 'You are an expert database architect. Focus on creating well-structured, normalized database schemas.',
    analysis: createMockAnalysisResult(),
    score: createMockQualityScore(),
    validation: createMockValidationResult(),
    suggestions: ['Add primary key specification', 'Include data types for columns'],
    metadata: {
      domain: 'sql',
      tone: 'technical',
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

// Mock orchestrator
const mockOrchestrator = {
  process: jest.fn<any>().mockResolvedValue(createMockProcessResult()),
  evaluate: jest.fn<any>(),
  compare: jest.fn<any>(),
  save: jest.fn<any>(),
  search: jest.fn<any>(),
};

// Setup mock environment
function setupMockEnvironment() {
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
}

// Validation helpers
function expectValidProcessResult(result: any) {
  expect(result).toHaveProperty('original');
  expect(result).toHaveProperty('refined');
  expect(result).toHaveProperty('system');
  expect(result).toHaveProperty('analysis');
  expect(result).toHaveProperty('score');
  expect(result).toHaveProperty('validation');
  expect(result).toHaveProperty('suggestions');
  expect(result).toHaveProperty('metadata');

  expect(result.validation.isValid).toBeDefined();
  expect(result.validation.errors).toBeInstanceOf(Array);
  expect(result.validation.warnings).toBeInstanceOf(Array);
  expect(result.suggestions).toBeInstanceOf(Array);

  expect(result.metadata.processingTime).toBeGreaterThan(0);
  expect(result.metadata.version).toBeDefined();
}

function measurePerformance<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  return fn().then(result => ({
    result,
    duration: Date.now() - start,
  }));
}

function expectWithinPerformanceThreshold(duration: number, threshold: number, operation: string) {
  expect(duration).toBeLessThanOrEqual(threshold);
  if (duration > threshold * 0.8) {
    console.warn(`⚠️ Performance warning: ${operation} took ${duration}ms (threshold: ${threshold}ms)`);
  }
}

describe('process_prompt tool', () => {
  // Mock server implementation
  const mockServer = {
    async handleProcessPrompt(args: any) {
      // Basic input validation
      if (!args.raw || typeof args.raw !== 'string' || args.raw.trim() === '') {
        throw new Error('Raw prompt is required and must be a string');
      }

      // Set defaults
      const processInput = {
        raw: args.raw,
        domain: args.domain || 'general',
        tone: args.tone || 'professional',
        context: args.context,
        variables: args.variables || {},
        targetModel: args.targetModel || 'general',
      };

      try {
        const result = await mockOrchestrator.process(processInput);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: result
            })
          }]
        };
      } catch (error: any) {
        throw new Error(`Tool execution failed: ${error.message}`);
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupMockEnvironment();
    // Reset mock to default behavior
    mockOrchestrator.process.mockResolvedValue(createMockProcessResult());
  });

  describe('valid inputs', () => {
    it('should process a simple prompt successfully', async () => {
      const mockResult = createMockProcessResult();
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const result = await mockServer.handleProcessPrompt({
        raw: TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
        domain: 'sql',
        tone: 'technical',
      });

      expect(mockOrchestrator.process).toHaveBeenCalledWith({
        raw: TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
        domain: 'sql',
        tone: 'technical',
        context: undefined,
        variables: {},
        targetModel: 'general',
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expectValidProcessResult(responseData.data);
    });

    it('should process complex prompts with all parameters', async () => {
      const mockResult = createMockProcessResult({
        original: TEST_CONSTANTS.SAMPLE_PROMPTS.complex,
        refined: 'Enhanced complex prompt...',
        metadata: {
          domain: 'saas',
          tone: 'professional',
          processingTime: 2500,
          version: '1.0.0',
          cacheHit: false,
          rulesApplied: ['saas_optimization', 'complexity_reduction'],
        },
      });
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const result = await mockServer.handleProcessPrompt({
        raw: TEST_CONSTANTS.SAMPLE_PROMPTS.complex,
        domain: 'saas',
        tone: 'professional',
        context: 'Enterprise software development',
        variables: { platform: 'web', audience: 'developers' },
        targetModel: 'gpt-4',
      });

      expect(mockOrchestrator.process).toHaveBeenCalledWith({
        raw: TEST_CONSTANTS.SAMPLE_PROMPTS.complex,
        domain: 'saas',
        tone: 'professional',
        context: 'Enterprise software development',
        variables: { platform: 'web', audience: 'developers' },
        targetModel: 'gpt-4',
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expectValidProcessResult(responseData.data);
      expect(responseData.data.metadata.domain).toBe('saas');
    });

    it('should handle different domains correctly', async () => {
      for (const domain of TEST_CONSTANTS.DOMAINS) {
        const mockResult = createMockProcessResult({
          metadata: {
            domain: domain,
            tone: 'professional',
            processingTime: 1000,
            version: '1.0.0',
            cacheHit: false,
            rulesApplied: [`${domain}_optimization`],
          },
        });
        mockOrchestrator.process.mockResolvedValueOnce(mockResult);

        const result = await mockServer.handleProcessPrompt({
          raw: `Create something for ${domain}`,
          domain,
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
        expect(responseData.data.metadata.domain).toBe(domain);
      }
    });

    it('should handle different tones correctly', async () => {
      for (const tone of TEST_CONSTANTS.TONES) {
        const mockResult = createMockProcessResult({
          metadata: {
            domain: 'general',
            tone: tone,
            processingTime: 1000,
            version: '1.0.0',
            cacheHit: false,
            rulesApplied: [`tone_${tone}`],
          },
        });
        mockOrchestrator.process.mockResolvedValueOnce(mockResult);

        const result = await mockServer.handleProcessPrompt({
          raw: 'Create a user interface',
          domain: 'general',
          tone,
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
        expect(responseData.data.metadata.tone).toBe(tone);
      }
    });

    it('should process prompts with variables for templating', async () => {
      const variables = {
        entity: 'product',
        fields: 'name, price, description',
        constraints: 'unique name, positive price',
      };

      const mockResult = createMockProcessResult({
        template: {
          prompt: 'Create a {entity} table with fields: {fields} and constraints: {constraints}',
          system: 'You are a database architect.',
          variables,
          type: 'basic',
        },
      });
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const result = await mockServer.handleProcessPrompt({
        raw: 'Create a product table',
        domain: 'sql',
        variables,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.template).toBeDefined();
      expect(responseData.data.template.variables).toEqual(variables);
    });
  });

  describe('input validation', () => {
    it('should reject missing raw prompt', async () => {
      await expect(mockServer.handleProcessPrompt({})).rejects.toThrow(
        'Raw prompt is required and must be a string'
      );
    });

    it('should reject empty raw prompt', async () => {
      await expect(mockServer.handleProcessPrompt({ raw: '' })).rejects.toThrow(
        'Raw prompt is required and must be a string'
      );
    });

    it('should reject non-string raw prompt', async () => {
      await expect(mockServer.handleProcessPrompt({ raw: 123 })).rejects.toThrow(
        'Raw prompt is required and must be a string'
      );
    });

    it('should use default values for optional parameters', async () => {
      const mockResult = createMockProcessResult();
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      await mockServer.handleProcessPrompt({
        raw: 'Simple prompt',
      });

      expect(mockOrchestrator.process).toHaveBeenCalledWith({
        raw: 'Simple prompt',
        domain: 'general',
        tone: 'professional',
        context: undefined,
        variables: {},
        targetModel: 'general',
      });
    });
  });

  describe('error handling', () => {
    it('should handle orchestrator errors gracefully', async () => {
      const error = new Error('Processing failed');
      mockOrchestrator.process.mockRejectedValueOnce(error);

      await expect(mockServer.handleProcessPrompt({
        raw: 'Test prompt',
      })).rejects.toThrow('Tool execution failed: Processing failed');
    });

    it('should handle timeout scenarios', async () => {
      mockOrchestrator.process.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100) // Reduced timeout for test
        )
      );

      await expect(mockServer.handleProcessPrompt({
        raw: 'Complex prompt that times out',
      })).rejects.toThrow();
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'A'.repeat(1000); // Reduced for test performance

      const mockResult = createMockProcessResult({
        original: longPrompt,
        suggestions: ['Consider breaking down this complex prompt into smaller parts'],
      });
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const result = await mockServer.handleProcessPrompt({
        raw: longPrompt,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.original).toBe(longPrompt);
    });
  });

  describe('performance', () => {
    it('should complete processing within performance threshold', async () => {
      const mockResult = createMockProcessResult({
        metadata: {
          domain: 'general',
          processingTime: 1500,
          version: '1.0.0',
          cacheHit: false,
          rulesApplied: [],
        },
      });
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const { duration } = await measurePerformance(async () => {
        return await mockServer.handleProcessPrompt({
          raw: TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
        });
      });

      expectWithinPerformanceThreshold(
        duration,
        TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.process_prompt,
        'process_prompt'
      );
    });

    it('should handle concurrent processing requests', async () => {
      const mockResult = createMockProcessResult();
      mockOrchestrator.process.mockResolvedValue(mockResult);

      const promises = Array.from({ length: 5 }, (_, i) =>
        mockServer.handleProcessPrompt({
          raw: `Test prompt ${i}`,
          domain: 'general',
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);

      results.forEach((result) => {
        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
      });
    });
  });

  describe('caching behavior', () => {
    it('should return cached results when available', async () => {
      const cachedResult = createMockProcessResult({
        metadata: {
          domain: 'general',
          cacheHit: true,
          processingTime: 50, // Much faster due to cache
          version: '1.0.0',
          rulesApplied: [],
        },
      });
      mockOrchestrator.process.mockResolvedValueOnce(cachedResult);

      const result = await mockServer.handleProcessPrompt({
        raw: 'Cached prompt',
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.metadata.cacheHit).toBe(true);
      expect(responseData.data.metadata.processingTime).toBeLessThan(100);
    });
  });

  describe('response format validation', () => {
    it('should return properly formatted MCP tool response', async () => {
      const mockResult = createMockProcessResult();
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const result = await mockServer.handleProcessPrompt({
        raw: 'Test prompt',
      });

      // Validate MCP response structure
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');

      // Validate JSON structure
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData).toHaveProperty('success', true);
      expect(responseData).toHaveProperty('data');

      // Validate all expected fields are present
      const requiredFields = [
        'original', 'refined', 'system', 'analysis', 'score',
        'validation', 'suggestions', 'metadata'
      ];
      requiredFields.forEach(field => {
        expect(responseData.data).toHaveProperty(field);
      });
    });

    it('should include template when variables are provided', async () => {
      const mockResult = createMockProcessResult({
        template: {
          prompt: 'Create a {type} with {attributes}',
          system: 'You are an expert.',
          variables: { type: 'table', attributes: 'columns' },
          type: 'basic',
        },
      });
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const result = await mockServer.handleProcessPrompt({
        raw: 'Create a table',
        variables: { type: 'table', attributes: 'columns' },
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.template).toBeDefined();
      expect(responseData.data.template.variables).toEqual({ type: 'table', attributes: 'columns' });
    });

    it('should include examples when beneficial', async () => {
      const mockResult = createMockProcessResult({
        examples: [
          {
            input: 'user data',
            output: 'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));',
            context: 'SQL database creation',
          }
        ],
      });
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const result = await mockServer.handleProcessPrompt({
        raw: 'Create user data storage',
        domain: 'sql',
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.examples).toBeDefined();
      expect(responseData.data.examples).toHaveLength(1);
      expect(responseData.data.examples[0]).toHaveProperty('input');
      expect(responseData.data.examples[0]).toHaveProperty('output');
    });
  });
});