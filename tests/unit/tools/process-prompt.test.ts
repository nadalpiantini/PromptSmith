/**
 * Unit Tests for process_prompt tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PromptSmithServer } from '../../../src/server/index.js';
import {
  createMockProcessResult,
  createMockOrchestrator,
  expectValidProcessResult,
  measurePerformance,
  expectWithinPerformanceThreshold,
  TEST_CONSTANTS,
} from '../../utils/test-helpers.js';
import { setupMockEnvironment } from '../../utils/mock-services.js';

// Mock the orchestrator
const mockOrchestrator = createMockOrchestrator();
jest.mock('../../../src/core/orchestrator.js', () => ({
  PromptOrchestrator: jest.fn().mockImplementation(() => mockOrchestrator),
}));

// Mock external services
setupMockEnvironment();

describe('process_prompt tool', () => {
  let server: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create server instance with mocked dependencies
    const serverModule = await import('../../../src/server/index.js');
    server = new serverModule.PromptSmithServer();
  });

  describe('valid inputs', () => {
    it('should process a simple prompt successfully', async () => {
      const mockResult = createMockProcessResult();
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const result = await server.handleProcessPrompt({
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
          domain: 'saas' as any,
          tone: 'professional' as any,
          processingTime: 2500,
          version: '1.0.0',
          cacheHit: false,
          rulesApplied: ['saas_optimization', 'complexity_reduction'],
        },
      });
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const result = await server.handleProcessPrompt({
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
            domain: domain as any,
            tone: 'professional' as any,
            processingTime: 1000,
            version: '1.0.0',
            cacheHit: false,
            rulesApplied: [`${domain}_optimization`],
          },
        });
        mockOrchestrator.process.mockResolvedValueOnce(mockResult);

        const result = await server.handleProcessPrompt({
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
            domain: 'general' as any,
            tone: tone as any,
            processingTime: 1000,
            version: '1.0.0',
            cacheHit: false,
            rulesApplied: [`tone_${tone}`],
          },
        });
        mockOrchestrator.process.mockResolvedValueOnce(mockResult);

        const result = await server.handleProcessPrompt({
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
          type: 'basic' as any,
        },
      });
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const result = await server.handleProcessPrompt({
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
      await expect(server.handleProcessPrompt({})).rejects.toThrow(
        'Raw prompt is required and must be a string'
      );
    });

    it('should reject empty raw prompt', async () => {
      await expect(server.handleProcessPrompt({ raw: '' })).rejects.toThrow(
        'Raw prompt is required and must be a string'
      );
    });

    it('should reject non-string raw prompt', async () => {
      await expect(server.handleProcessPrompt({ raw: 123 })).rejects.toThrow(
        'Raw prompt is required and must be a string'
      );
    });

    it('should use default values for optional parameters', async () => {
      const mockResult = createMockProcessResult();
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      await server.handleProcessPrompt({
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

      await expect(server.handleProcessPrompt({
        raw: 'Test prompt',
      })).rejects.toThrow('Tool execution failed: Processing failed');
    });

    it('should handle timeout scenarios', async () => {
      mockOrchestrator.process.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 6000)
        )
      );

      await expect(server.handleProcessPrompt({
        raw: 'Complex prompt that times out',
      })).rejects.toThrow();
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'A'.repeat(20000);

      const mockResult = createMockProcessResult({
        original: longPrompt,
        suggestions: ['Consider breaking down this complex prompt into smaller parts'],
      });
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const result = await server.handleProcessPrompt({
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
          domain: 'general' as any,
          processingTime: 1500,
          version: '1.0.0',
          cacheHit: false,
          rulesApplied: [],
        },
      });
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const { duration } = await measurePerformance(async () => {
        return await server.handleProcessPrompt({
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
        server.handleProcessPrompt({
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
          domain: 'general' as any,
          cacheHit: true,
          processingTime: 50, // Much faster due to cache
          version: '1.0.0',
          rulesApplied: [],
        },
      });
      mockOrchestrator.process.mockResolvedValueOnce(cachedResult);

      const result = await server.handleProcessPrompt({
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

      const result = await server.handleProcessPrompt({
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
          type: 'basic' as any,
        },
      });
      mockOrchestrator.process.mockResolvedValueOnce(mockResult);

      const result = await server.handleProcessPrompt({
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

      const result = await server.handleProcessPrompt({
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