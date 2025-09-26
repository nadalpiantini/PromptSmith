/**
 * Unit Tests for PromptOrchestrator
 * Tests the orchestration of the processing pipeline
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { PromptOrchestrator } from '../../../src/core/orchestrator.js';
import {
  ProcessInput,
  ProcessResult,
  EvaluationResult,
  ComparisonResult,
  SavedPrompt,
  SearchResult,
  ValidationResult,
  PromptDomain,
  PromptTone
} from '../../../src/types/prompt.js';
import {
  createMockProcessResult,
  createMockAnalysisResult,
  createMockValidationResult,
  createMockQualityScore
} from '../../utils/test-helpers.js';

// Mock all services
jest.mock('../../../src/services/index.js', () => ({
  services: {
    cache: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn()
    },
    store: {
      save: jest.fn(),
      search: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    telemetry: {
      track: jest.fn(),
      error: jest.fn(),
      performance: jest.fn()
    },
    refine: {
      refine: jest.fn()
    },
    score: {
      score: jest.fn()
    },
    template: {
      render: jest.fn(),
      compile: jest.fn()
    }
  }
}));

// Mock core components
jest.mock('../../../src/core/analyzer.js', () => ({
  PromptAnalyzer: jest.fn().mockImplementation(() => ({
    analyze: jest.fn().mockResolvedValue(createMockAnalysisResult())
  }))
}));

jest.mock('../../../src/core/optimizer.js', () => ({
  PromptOptimizer: jest.fn().mockImplementation(() => ({
    optimize: jest.fn().mockResolvedValue({
      optimized: 'Optimized prompt',
      systemPrompt: 'System prompt',
      enhancements: [],
      templateVariables: [],
      contextSuggestions: []
    })
  }))
}));

jest.mock('../../../src/core/validator.js', () => ({
  PromptValidator: jest.fn().mockImplementation(() => ({
    validate: jest.fn().mockResolvedValue(createMockValidationResult())
  }))
}));

describe('PromptOrchestrator', () => {
  let orchestrator: PromptOrchestrator;
  let mockCache: any;
  let mockStore: any;
  let mockTelemetry: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const { services } = await import('../../../src/services/index.js');
    mockCache = services.cache;
    mockStore = services.store;
    mockTelemetry = services.telemetry;

    orchestrator = new PromptOrchestrator();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should process a simple prompt successfully', async () => {
      const input: ProcessInput = {
        raw: 'Create a user table',
        domain: PromptDomain.SQL,
        tone: PromptTone.TECHNICAL
      };

      mockCache.get.mockResolvedValueOnce(null); // No cache hit
      mockCache.set.mockResolvedValueOnce(true);

      const result = await orchestrator.process(input);

      expect(result).toBeDefined();
      expect(result.refined).toBeDefined();
      expect(result.system).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);

      // Verify pipeline was executed
      expect(mockCache.get).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
      expect(mockTelemetry.track).toHaveBeenCalled();
    });

    it('should return cached result when available', async () => {
      const input: ProcessInput = {
        raw: 'Create a user table',
        domain: PromptDomain.SQL
      };

      const cachedResult = createMockProcessResult();
      mockCache.get.mockResolvedValueOnce(cachedResult);

      const result = await orchestrator.process(input);

      expect(result).toEqual(cachedResult);
      expect(mockCache.set).not.toHaveBeenCalled(); // Should not update cache
      expect(mockTelemetry.track).toHaveBeenCalledWith('cache_hit', expect.any(Object));
    });

    it('should handle processing errors gracefully', async () => {
      const input: ProcessInput = {
        raw: 'Create a user table',
        domain: PromptDomain.SQL
      };

      mockCache.get.mockResolvedValueOnce(null);
      // Mock analyzer to throw error
      const analyzer = (orchestrator as any).analyzer;
      analyzer.analyze.mockRejectedValueOnce(new Error('Analysis failed'));

      await expect(orchestrator.process(input)).rejects.toThrow('Analysis failed');
      expect(mockTelemetry.error).toHaveBeenCalled();
    });

    it('should apply domain-specific processing', async () => {
      const domains = ['sql', 'branding', 'cine', 'saas', 'devops', 'general'] as const;

      for (const domain of domains) {
        const input: ProcessInput = {
          raw: 'Test prompt',
          domain
        };

        mockCache.get.mockResolvedValueOnce(null);
        mockCache.set.mockResolvedValueOnce(true);

        const result = await orchestrator.process(input);

        expect(result).toBeDefined();
        expect(result.metadata?.domain).toBe(domain);
      }
    });

    it('should handle template variables', async () => {
      const input: ProcessInput = {
        raw: 'Create {{type}} for {{purpose}}',
        domain: PromptDomain.GENERAL,
        variables: {
          type: 'function',
          purpose: 'authentication'
        }
      };

      mockCache.get.mockResolvedValueOnce(null);
      mockCache.set.mockResolvedValueOnce(true);

      const result = await orchestrator.process(input);

      expect(result).toBeDefined();
      expect(result.metadata?.hasVariables).toBe(true);
    });

    it('should include performance metrics', async () => {
      const input: ProcessInput = {
        raw: 'Create a database',
        domain: PromptDomain.SQL
      };

      mockCache.get.mockResolvedValueOnce(null);
      mockCache.set.mockResolvedValueOnce(true);

      const result = await orchestrator.process(input);

      expect(result.metadata?.processingTime).toBeDefined();
      expect(result.metadata?.processingTime).toBeGreaterThan(0);
      expect(mockTelemetry.performance).toHaveBeenCalled();
    });
  });

  describe('evaluate', () => {
    it('should evaluate a prompt', async () => {
      const result = await orchestrator.evaluate('Create a user table', ['clarity', 'specificity']);

      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.validation).toBeDefined();
    });

    it('should track evaluation telemetry', async () => {
      await orchestrator.evaluate('Test prompt');

      expect(mockTelemetry.track).toHaveBeenCalledWith('prompt_evaluated', expect.any(Object));
    });

    it('should handle evaluation errors', async () => {
      const analyzer = (orchestrator as any).analyzer;
      analyzer.analyze.mockRejectedValueOnce(new Error('Analysis error'));

      await expect(orchestrator.evaluate('Test prompt')).rejects.toThrow('Analysis error');
      expect(mockTelemetry.error).toHaveBeenCalled();
    });
  });

  describe('compare', () => {
    it('should compare multiple prompt variants', async () => {
      const variants = [
        'Create a user table',
        'Generate a database table for users',
        'Make table for user data'
      ];

      const result = await orchestrator.compare(variants);

      expect(result).toBeDefined();
      expect(result.winner).toBeDefined();
      expect(result.analysis).toBeInstanceOf(Array);
      expect(result.analysis.length).toBe(variants.length);
      expect(result.recommendation).toBeDefined();
    });

    it('should identify the best variant', async () => {
      const variants = [
        'do thing', // Poor
        'Create a PostgreSQL users table with id, name, email columns' // Good
      ];

      // Mock different scores for variants
      const scorer = (orchestrator as any).scorer;
      scorer.score.mockResolvedValueOnce(createMockQualityScore({ overall: 0.3 }));
      scorer.score.mockResolvedValueOnce(createMockQualityScore({ overall: 0.9 }));

      const result = await orchestrator.compare(variants);

      expect(result.winner).toBe(1); // Second variant should win
    });

    it('should handle comparison errors', async () => {
      const variants = ['test1', 'test2'];

      const analyzer = (orchestrator as any).analyzer;
      analyzer.analyze.mockRejectedValueOnce(new Error('Comparison failed'));

      await expect(orchestrator.compare(variants)).rejects.toThrow('Comparison failed');
    });

    it('should require at least 2 variants', async () => {
      await expect(orchestrator.compare(['single'])).rejects.toThrow();
      await expect(orchestrator.compare([])).rejects.toThrow();
    });
  });

  describe('save', () => {
    it('should save a prompt to the store', async () => {
      const prompt = 'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100))';
      const metadata = {
        name: 'User Table Creation',
        domain: PromptDomain.SQL,
        description: 'User table creation',
        tags: ['database', 'users'],
        author: 'test'
      };

      mockStore.save.mockResolvedValueOnce({
        id: 'test-id',
        prompt,
        metadata,
        score: createMockQualityScore(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await orchestrator.save(prompt, metadata);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(mockStore.save).toHaveBeenCalledWith(expect.objectContaining({
        prompt,
        metadata
      }));
      expect(mockTelemetry.track).toHaveBeenCalledWith('prompt_saved', expect.any(Object));
    });

    it('should validate before saving', async () => {
      const prompt = '';
      const metadata = {
        name: 'Empty Prompt',
        domain: PromptDomain.SQL,
        description: 'Empty prompt'
      };

      const validator = (orchestrator as any).validator;
      validator.validate.mockResolvedValueOnce({
        isValid: false,
        errors: [{ type: 'empty', message: 'Prompt is empty' }],
        warnings: [],
        suggestions: [],
        qualityMetrics: {}
      });

      await expect(orchestrator.save(prompt, metadata)).rejects.toThrow('Invalid prompt');
    });

    it('should clear cache after saving', async () => {
      const prompt = 'Test prompt';
      const metadata = {
        name: 'Test Prompt',
        domain: PromptDomain.GENERAL,
        description: 'Test'
      };

      mockStore.save.mockResolvedValueOnce({
        id: 'test-id',
        prompt,
        metadata,
        score: createMockQualityScore(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await orchestrator.save(prompt, metadata);

      expect(mockCache.clear).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search prompts in the store', async () => {
      const searchParams = {
        query: 'user table',
        domain: PromptDomain.SQL,
        limit: 10
      };

      const mockResults: SearchResult[] = [
        {
          id: '1',
          prompt: 'CREATE TABLE users',
          score: createMockQualityScore(),
          relevance: 0.9,
          metadata: {
            domain: PromptDomain.SQL,
            description: 'User table'
          }
        }
      ];

      mockStore.search.mockResolvedValueOnce(mockResults);

      const results = await orchestrator.search(searchParams);

      expect(results).toEqual(mockResults);
      expect(mockStore.search).toHaveBeenCalledWith(searchParams);
      expect(mockTelemetry.track).toHaveBeenCalledWith('prompt_search', expect.any(Object));
    });

    it('should handle empty search results', async () => {
      mockStore.search.mockResolvedValueOnce([]);

      const results = await orchestrator.search({ query: 'nonexistent' });

      expect(results).toEqual([]);
    });

    it('should handle search errors', async () => {
      mockStore.search.mockRejectedValueOnce(new Error('Search failed'));

      await expect(orchestrator.search({ query: 'test' })).rejects.toThrow('Search failed');
      expect(mockTelemetry.error).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should retrieve a prompt by ID', async () => {
      const mockPrompt: SavedPrompt = {
        id: 'test-id',
        prompt: 'Test prompt',
        metadata: {
          domain: PromptDomain.GENERAL,
          description: 'Test'
        },
        score: createMockQualityScore(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockStore.get.mockResolvedValueOnce(mockPrompt);

      const result = await orchestrator.get('test-id');

      expect(result).toEqual(mockPrompt);
      expect(mockStore.get).toHaveBeenCalledWith('test-id');
    });

    it('should handle not found', async () => {
      mockStore.get.mockResolvedValueOnce(null);

      const result = await orchestrator.get('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return system statistics', async () => {
      const stats = await orchestrator.getStats(7);

      expect(stats).toBeDefined();
      expect(stats.totalProcessed).toBeGreaterThanOrEqual(0);
      expect(stats.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(stats.cacheHitRate).toBeLessThanOrEqual(1);
      expect(stats.averageScore).toBeDefined();
      expect(stats.domainBreakdown).toBeDefined();
      expect(stats.topEnhancements).toBeInstanceOf(Array);
    });
  });

  describe('validate', () => {
    it('should validate a prompt', async () => {
      const prompt = 'CREATE TABLE users';

      const mockValidation = createMockValidationResult();
      const validator = (orchestrator as any).validator;
      validator.validate.mockResolvedValueOnce(mockValidation);

      const result = await orchestrator.validate(prompt, 'sql');

      expect(result).toEqual(mockValidation);
      expect(validator.validate).toHaveBeenCalledWith(prompt, 'sql');
    });
  });

  describe('cache key generation', () => {
    it('should generate consistent cache keys', () => {
      const input1: ProcessInput = {
        raw: 'Create table',
        domain: PromptDomain.SQL,
        tone: PromptTone.TECHNICAL
      };

      const input2: ProcessInput = {
        raw: 'Create table',
        domain: PromptDomain.SQL,
        tone: PromptTone.TECHNICAL
      };

      const key1 = (orchestrator as any).generateCacheKey(input1);
      const key2 = (orchestrator as any).generateCacheKey(input2);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different inputs', () => {
      const input1: ProcessInput = {
        raw: 'Create table',
        domain: PromptDomain.SQL
      };

      const input2: ProcessInput = {
        raw: 'Create table',
        domain: PromptDomain.BRANDING
      };

      const key1 = (orchestrator as any).generateCacheKey(input1);
      const key2 = (orchestrator as any).generateCacheKey(input2);

      expect(key1).not.toBe(key2);
    });
  });
});