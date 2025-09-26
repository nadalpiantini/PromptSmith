/**
 * Unit Tests for get_prompt tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PromptSmithServer } from '../../../src/server/index.js';
import { services } from '../../../src/services/index.js';
import {
  createMockSavedPrompt,
  measurePerformance,
  expectWithinPerformanceThreshold,
  TEST_CONSTANTS,
} from '../../utils/test-helpers.js';
import { setupMockEnvironment, createMockServices } from '../../utils/mock-services.js';

// Mock external services
setupMockEnvironment();

// Mock services
const mockServices = createMockServices();
jest.mock('../../../src/services/index.js', () => ({
  services: mockServices,
}));

describe('get_prompt tool', () => {
  let server: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const serverModule = await import('../../../src/server/index.js');
    server = new serverModule.PromptSmithServer();
  });

  describe('valid inputs', () => {
    it('should retrieve a prompt by ID successfully', async () => {
      const promptId = 'prompt_123';
      const mockPrompt = createMockSavedPrompt({ id: promptId });
      mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

      const result = await server.handleGetPrompt({
        id: promptId,
      });

      expect(mockServices.store.getById).toHaveBeenCalledWith(promptId);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();

      // Validate prompt structure
      expect(responseData.data).toHaveProperty('id', promptId);
      expect(responseData.data).toHaveProperty('name');
      expect(responseData.data).toHaveProperty('domain');
      expect(responseData.data).toHaveProperty('tags');
      expect(responseData.data).toHaveProperty('prompt');
      expect(responseData.data).toHaveProperty('score');
      expect(responseData.data).toHaveProperty('metadata');
      expect(responseData.data).toHaveProperty('createdAt');
      expect(responseData.data).toHaveProperty('updatedAt');
    });

    it('should retrieve prompts from different domains', async () => {
      for (const domain of TEST_CONSTANTS.DOMAINS) {
        const promptId = `${domain}_prompt_123`;
        const mockPrompt = createMockSavedPrompt({
          id: promptId,
          domain: domain as any,
          name: `${domain} prompt`,
        });
        mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

        const result = await server.handleGetPrompt({
          id: promptId,
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
        expect(responseData.data.domain).toBe(domain);
        expect(responseData.data.id).toBe(promptId);
      }
    });

    it('should retrieve prompt with comprehensive metadata', async () => {
      const promptId = 'comprehensive_prompt_123';
      const mockPrompt = createMockSavedPrompt({
        id: promptId,
        name: 'Comprehensive Database Schema',
        domain: 'sql' as any,
        tags: ['database', 'schema', 'advanced', 'postgresql'],
        description: 'Advanced database schema design with constraints and indexes',
        prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
        systemPrompt: 'You are an expert database architect specializing in PostgreSQL.',
        score: {
          clarity: 0.92,
          specificity: 0.88,
          structure: 0.9,
          completeness: 0.85,
          overall: 0.8875,
        },
        metadata: {
          name: 'Comprehensive Database Schema',
          domain: 'sql',
          description: 'Advanced database schema design with constraints and indexes',
          tags: ['database', 'schema', 'advanced', 'postgresql'],
          isPublic: true,
          authorId: 'expert_architect_123',
        },
      });
      mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

      const result = await server.handleGetPrompt({
        id: promptId,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);

      const prompt = responseData.data;
      expect(prompt.name).toBe('Comprehensive Database Schema');
      expect(prompt.domain).toBe('sql');
      expect(prompt.tags).toHaveLength(4);
      expect(prompt.description).toContain('Advanced database schema');
      expect(prompt.systemPrompt).toContain('expert database architect');
      expect(prompt.score.overall).toBeGreaterThan(0.88);
      expect(prompt.metadata.isPublic).toBe(true);
      expect(prompt.metadata.version).toBe('2.0.0');
    });

    it('should retrieve prompt with usage statistics', async () => {
      const promptId = 'popular_prompt_123';
      const mockPrompt = createMockSavedPrompt({
        id: promptId,
        name: 'Popular Template',
      });
      // Note: Usage stats would typically be included in the saved prompt or fetched separately
      mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

      const result = await server.handleGetPrompt({
        id: promptId,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.name).toBe('Popular Template');
    });

    it('should retrieve both public and private prompts', async () => {
      const testCases = [
        { id: 'public_prompt_123', isPublic: true },
        { id: 'private_prompt_456', isPublic: false },
      ];

      for (const testCase of testCases) {
        const mockPrompt = createMockSavedPrompt({
          id: testCase.id,
          metadata: {
            name: 'Test Prompt',
            domain: 'general',
            isPublic: testCase.isPublic,
          },
        });
        mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

        const result = await server.handleGetPrompt({
          id: testCase.id,
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
        expect(responseData.data.metadata.isPublic).toBe(testCase.isPublic);
      }
    });
  });

  describe('error handling', () => {
    it('should handle missing prompt ID', async () => {
      await expect(server.handleGetPrompt({})).rejects.toThrow(
        'Prompt ID is required and must be a string'
      );
    });

    it('should handle empty prompt ID', async () => {
      await expect(server.handleGetPrompt({ id: '' })).rejects.toThrow(
        'Prompt ID is required and must be a string'
      );
    });

    it('should handle non-string prompt ID', async () => {
      await expect(server.handleGetPrompt({ id: 123 })).rejects.toThrow(
        'Prompt ID is required and must be a string'
      );
    });

    it('should handle prompt not found', async () => {
      const nonExistentId = 'nonexistent_prompt_123';
      mockServices.store.getById.mockResolvedValueOnce(null);

      await expect(server.handleGetPrompt({
        id: nonExistentId,
      })).rejects.toThrow(`Prompt with ID ${nonExistentId} not found`);
    });

    it('should handle database connection errors', async () => {
      const promptId = 'test_prompt_123';
      const error = new Error('Database connection failed');
      mockServices.store.getById.mockRejectedValueOnce(error);

      await expect(server.handleGetPrompt({
        id: promptId,
      })).rejects.toThrow('Tool execution failed: Database connection failed');
    });

    it('should handle malformed prompt data', async () => {
      const promptId = 'malformed_prompt_123';
      const malformedPrompt = { id: promptId }; // Missing required fields
      mockServices.store.getById.mockResolvedValueOnce(malformedPrompt);

      const result = await server.handleGetPrompt({
        id: promptId,
      });

      // Should still succeed but with limited data
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(promptId);
    });

    it('should handle special characters in ID', async () => {
      const specialIds = [
        'prompt-with-dashes',
        'prompt_with_underscores',
        'prompt.with.dots',
        'prompt123with456numbers',
      ];

      for (const promptId of specialIds) {
        const mockPrompt = createMockSavedPrompt({ id: promptId });
        mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

        const result = await server.handleGetPrompt({
          id: promptId,
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
        expect(responseData.data.id).toBe(promptId);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very long prompt IDs', async () => {
      const longId = 'a'.repeat(100) + '_prompt_123';
      const mockPrompt = createMockSavedPrompt({ id: longId });
      mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

      const result = await server.handleGetPrompt({
        id: longId,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(longId);
    });

    it('should handle prompts with very long content', async () => {
      const promptId = 'long_content_prompt_123';
      const longPrompt = TEST_CONSTANTS.SAMPLE_PROMPTS.complex.repeat(10);
      const mockPrompt = createMockSavedPrompt({
        id: promptId,
        prompt: longPrompt,
      });
      mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

      const result = await server.handleGetPrompt({
        id: promptId,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.prompt).toBe(longPrompt);
      expect(responseData.data.prompt.length).toBeGreaterThan(1000);
    });

    it('should handle prompts with many tags', async () => {
      const promptId = 'many_tags_prompt_123';
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i + 1}`);
      const mockPrompt = createMockSavedPrompt({
        id: promptId,
        tags: manyTags,
      });
      mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

      const result = await server.handleGetPrompt({
        id: promptId,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.tags).toHaveLength(20);
      expect(responseData.data.tags).toEqual(manyTags);
    });

    it('should handle prompts with null or undefined optional fields', async () => {
      const promptId = 'minimal_prompt_123';
      const mockPrompt = createMockSavedPrompt({
        id: promptId,
        name: 'Minimal Prompt',
        description: undefined,
        systemPrompt: null,
        tags: [],
      });
      mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

      const result = await server.handleGetPrompt({
        id: promptId,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.name).toBe('Minimal Prompt');
      expect(responseData.data.tags).toEqual([]);
    });
  });

  describe('performance', () => {
    it('should complete retrieval within performance threshold', async () => {
      const promptId = 'performance_test_prompt_123';
      const mockPrompt = createMockSavedPrompt({ id: promptId });
      mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

      const { duration } = await measurePerformance(async () => {
        return await server.handleGetPrompt({
          id: promptId,
        });
      });

      expectWithinPerformanceThreshold(
        duration,
        TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.get_prompt,
        'get_prompt'
      );
    });

    it('should handle concurrent retrieval requests efficiently', async () => {
      const promptIds = ['prompt_1', 'prompt_2', 'prompt_3', 'prompt_4', 'prompt_5'];

      // Set up mock responses for all prompts
      promptIds.forEach(id => {
        const mockPrompt = createMockSavedPrompt({ id });
        mockServices.store.getById.mockResolvedValueOnce(mockPrompt);
      });

      const promises = promptIds.map(id =>
        server.handleGetPrompt({ id })
      );

      const { result: results, duration } = await measurePerformance(async () => {
        return await Promise.all(promises);
      });

      expect(duration).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.get_prompt * 2);
      expect(results).toHaveLength(5);

      results.forEach((result, index) => {
        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
        expect(responseData.data.id).toBe(promptIds[index]);
      });
    });

    it('should handle large prompt retrieval efficiently', async () => {
      const promptId = 'large_prompt_123';
      const largePrompt = 'A'.repeat(50000); // 50KB prompt
      const mockPrompt = createMockSavedPrompt({
        id: promptId,
        prompt: largePrompt,
      });
      mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

      const { result, duration } = await measurePerformance(async () => {
        return await server.handleGetPrompt({
          id: promptId,
        });
      });

      // Should still be reasonably fast even for large prompts
      expect(duration).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.get_prompt * 3);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.prompt.length).toBe(50000);
    });
  });

  describe('response format validation', () => {
    it('should return properly formatted MCP tool response', async () => {
      const promptId = 'format_test_prompt_123';
      const mockPrompt = createMockSavedPrompt({ id: promptId });
      mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

      const result = await server.handleGetPrompt({
        id: promptId,
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

      // Validate prompt data structure
      const requiredFields = [
        'id', 'name', 'domain', 'tags', 'prompt', 'score',
        'metadata', 'createdAt', 'updatedAt'
      ];
      requiredFields.forEach(field => {
        expect(responseData.data).toHaveProperty(field);
      });
    });

    it('should preserve all data types correctly', async () => {
      const promptId = 'data_types_test_123';
      const mockPrompt = createMockSavedPrompt({
        id: promptId,
        score: {
          clarity: 0.85,
          specificity: 0.9,
          structure: 0.8,
          completeness: 0.75,
          overall: 0.825,
        },
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-15T12:30:00Z'),
        metadata: {
          name: 'Data Types Test',
          domain: 'general',
          isPublic: false,
        },
      });
      mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

      const result = await server.handleGetPrompt({
        id: promptId,
      });

      const responseData = JSON.parse(result.content[0].text);
      const prompt = responseData.data;

      // Validate number types
      expect(typeof prompt.score.overall).toBe('number');
      expect(prompt.score.overall).toBe(0.825);

      // Validate boolean types
      expect(typeof prompt.metadata.isPublic).toBe('boolean');
      expect(prompt.metadata.isPublic).toBe(false);

      // Validate string types
      expect(typeof prompt.metadata.version).toBe('string');
      expect(prompt.metadata.version).toBe('1.2.0');

      // Validate date strings
      expect(typeof prompt.createdAt).toBe('string');
      expect(prompt.createdAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should handle optional fields correctly in response', async () => {
      const testCases = [
        {
          description: 'with all optional fields',
          mockData: {
            description: 'Full description',
            systemPrompt: 'System prompt text',
          }
        },
        {
          description: 'without optional fields',
          mockData: {
            description: undefined,
            systemPrompt: undefined,
          }
        }
      ];

      for (const testCase of testCases) {
        const promptId = `optional_fields_test_${testCases.indexOf(testCase)}`;
        const mockPrompt = createMockSavedPrompt({
          id: promptId,
          ...testCase.mockData,
        });
        mockServices.store.getById.mockResolvedValueOnce(mockPrompt);

        const result = await server.handleGetPrompt({
          id: promptId,
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);

        // Optional fields should be present in structure but may be null/undefined
        if (testCase.mockData.description) {
          expect(responseData.data.description).toBe(testCase.mockData.description);
        }
        if (testCase.mockData.systemPrompt) {
          expect(responseData.data.systemPrompt).toBe(testCase.mockData.systemPrompt);
        }
      }
    });
  });
});