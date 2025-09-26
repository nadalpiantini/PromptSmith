/**
 * Unit Tests for search_prompts tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PromptSmithServer } from '../../../src/server/index.js';
import {
  createMockSearchResult,
  createMockOrchestrator,
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

describe('search_prompts tool', () => {
  let server: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const serverModule = await import('../../../src/server/index.js');
    server = new serverModule.PromptSmithServer();
  });

  describe('basic search functionality', () => {
    it('should search prompts without parameters', async () => {
      const mockResults = [
        createMockSearchResult(),
        createMockSearchResult({
          id: 'prompt_124',
          name: 'Product Table Creation',
          domain: 'sql' as any,
          tags: ['database', 'product'],
        }),
      ];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({});

      expect(mockOrchestrator.search).toHaveBeenCalledWith({
        query: undefined,
        domain: undefined,
        tags: undefined,
        minScore: undefined,
        sortBy: 'relevance',
        limit: 20,
        offset: 0,
        isPublic: undefined,
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.results).toHaveLength(2);
      expect(responseData.data.total).toBe(2);
    });

    it('should search prompts with query string', async () => {
      const query = 'user table database';
      const mockResults = [
        createMockSearchResult({
          name: 'User Table Creation',
          relevance: 0.95,
        }),
        createMockSearchResult({
          id: 'prompt_125',
          name: 'User Management Database',
          relevance: 0.87,
        }),
      ];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({
        query,
      });

      expect(mockOrchestrator.search).toHaveBeenCalledWith({
        query,
        domain: undefined,
        tags: undefined,
        minScore: undefined,
        sortBy: 'relevance',
        limit: 20,
        offset: 0,
        isPublic: undefined,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.results).toHaveLength(2);

      // Should be sorted by relevance
      expect(responseData.data.results[0].relevance).toBeGreaterThan(
        responseData.data.results[1].relevance
      );
    });

    it('should filter by domain', async () => {
      const mockResults = [
        createMockSearchResult({ domain: 'sql' as any }),
        createMockSearchResult({
          id: 'prompt_126',
          domain: 'sql' as any,
          name: 'Advanced SQL Queries',
        }),
      ];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({
        domain: 'sql',
      });

      expect(mockOrchestrator.search).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'sql',
        })
      );

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);

      responseData.data.results.forEach((result: any) => {
        expect(result.domain).toBe('sql');
      });
    });

    it('should filter by tags', async () => {
      const tags = ['database', 'postgresql'];
      const mockResults = [
        createMockSearchResult({ tags: ['database', 'postgresql', 'table'] }),
        createMockSearchResult({
          id: 'prompt_127',
          tags: ['database', 'postgresql', 'index'],
        }),
      ];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({
        tags,
      });

      expect(mockOrchestrator.search).toHaveBeenCalledWith(
        expect.objectContaining({
          tags,
        })
      );

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);

      responseData.data.results.forEach((result: any) => {
        expect(result.tags).toEqual(
          expect.arrayContaining(['database', 'postgresql'])
        );
      });
    });

    it('should filter by minimum score', async () => {
      const minScore = 0.8;
      const mockResults = [
        createMockSearchResult({
          score: { clarity: 0.9, specificity: 0.85, structure: 0.88, completeness: 0.82, overall: 0.8625 },
        }),
        createMockSearchResult({
          id: 'prompt_128',
          score: { clarity: 0.85, specificity: 0.8, structure: 0.82, completeness: 0.78, overall: 0.8125 },
        }),
      ];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({
        minScore,
      });

      expect(mockOrchestrator.search).toHaveBeenCalledWith(
        expect.objectContaining({
          minScore,
        })
      );

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);

      responseData.data.results.forEach((result: any) => {
        expect(result.score.overall).toBeGreaterThanOrEqual(minScore);
      });
    });
  });

  describe('sorting and pagination', () => {
    it('should sort by different criteria', async () => {
      const sortCriteria = ['score', 'created', 'updated', 'relevance'];

      for (const sortBy of sortCriteria) {
        const mockResults = [
          createMockSearchResult({ id: 'first' }),
          createMockSearchResult({ id: 'second' }),
        ];
        mockOrchestrator.search.mockResolvedValueOnce(mockResults);

        await server.handleSearchPrompts({
          query: 'test',
          sortBy: sortBy as any,
        });

        expect(mockOrchestrator.search).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy,
          })
        );
      }
    });

    it('should handle pagination with limit and offset', async () => {
      const mockResults = Array.from({ length: 10 }, (_, i) =>
        createMockSearchResult({ id: `prompt_${130 + i}` })
      );
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({
        limit: 10,
        offset: 20,
      });

      expect(mockOrchestrator.search).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20,
        })
      );

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.results).toHaveLength(10);
      expect(responseData.data.params.offset).toBe(20);
    });

    it('should respect limit boundaries', async () => {
      const limits = [1, 5, 50, 100];

      for (const limit of limits) {
        const mockResults = Array.from({ length: Math.min(limit, 25) }, (_, i) =>
          createMockSearchResult({ id: `prompt_${i}` })
        );
        mockOrchestrator.search.mockResolvedValueOnce(mockResults);

        const result = await server.handleSearchPrompts({
          limit,
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.data.results.length).toBeLessThanOrEqual(limit);
      }
    });
  });

  describe('complex search scenarios', () => {
    it('should handle multi-criteria search', async () => {
      const searchParams = {
        query: 'authentication security',
        domain: 'devops',
        tags: ['oauth', 'security'],
        minScore: 0.75,
        sortBy: 'score' as any,
        limit: 5,
      };

      const mockResults = [
        createMockSearchResult({
          name: 'OAuth Security Implementation',
          domain: 'devops' as any,
          tags: ['oauth', 'security', 'authentication'],
          score: { clarity: 0.9, specificity: 0.85, structure: 0.8, completeness: 0.82, overall: 0.8425 },
          relevance: 0.92,
        }),
      ];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts(searchParams);

      expect(mockOrchestrator.search).toHaveBeenCalledWith({
        ...searchParams,
        offset: 0,
        isPublic: undefined,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.results).toHaveLength(1);

      const foundResult = responseData.data.results[0];
      expect(foundResult.domain).toBe('devops');
      expect(foundResult.tags).toEqual(expect.arrayContaining(['oauth', 'security']));
      expect(foundResult.score.overall).toBeGreaterThanOrEqual(0.75);
    });

    it('should filter by public/private status', async () => {
      const publicResults = [
        createMockSearchResult({
          name: 'Public Template',
          description: 'Public prompt template',
        }),
      ];
      mockOrchestrator.search.mockResolvedValueOnce(publicResults);

      const result = await server.handleSearchPrompts({
        isPublic: true,
      });

      expect(mockOrchestrator.search).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublic: true,
        })
      );

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
    });

    it('should return empty results when no matches', async () => {
      mockOrchestrator.search.mockResolvedValueOnce([]);

      const result = await server.handleSearchPrompts({
        query: 'nonexistent prompt query',
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.results).toHaveLength(0);
      expect(responseData.data.total).toBe(0);
    });

    it('should handle fuzzy search matching', async () => {
      const mockResults = [
        createMockSearchResult({
          name: 'User Authentication',
          relevance: 0.78, // Lower relevance for fuzzy match
        }),
      ];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({
        query: 'user auth', // Fuzzy query
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.results).toHaveLength(1);
      expect(responseData.data.results[0].name).toContain('User Authentication');
    });
  });

  describe('search result metadata', () => {
    it('should include usage statistics in results', async () => {
      const mockResults = [
        createMockSearchResult({
          usage: {
            count: 25,
            successRate: 0.94,
            avgResponseTime: 1100,
            lastUsed: new Date('2024-01-10T00:00:00Z'),
          },
        }),
      ];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({
        query: 'popular prompt',
      });

      const responseData = JSON.parse(result.content[0].text);
      const searchResult = responseData.data.results[0];

      expect(searchResult.usage).toBeDefined();
      expect(searchResult.usage.count).toBe(25);
      expect(searchResult.usage.successRate).toBe(0.94);
      expect(searchResult.usage.avgResponseTime).toBe(1100);
      expect(searchResult.usage.lastUsed).toBeDefined();
    });

    it('should include quality scores in results', async () => {
      const mockResults = [
        createMockSearchResult({
          score: {
            clarity: 0.88,
            specificity: 0.92,
            structure: 0.85,
            completeness: 0.79,
            overall: 0.86,
          },
        }),
      ];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({
        minScore: 0.8,
      });

      const responseData = JSON.parse(result.content[0].text);
      const searchResult = responseData.data.results[0];

      expect(searchResult.score).toBeDefined();
      expect(searchResult.score.overall).toBe(0.86);
      expect(searchResult.score.clarity).toBe(0.88);
    });

    it('should include relevance scores for query-based searches', async () => {
      const mockResults = [
        createMockSearchResult({ relevance: 0.95 }),
        createMockSearchResult({
          id: 'prompt_140',
          relevance: 0.82,
        }),
      ];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({
        query: 'database design',
      });

      const responseData = JSON.parse(result.content[0].text);

      responseData.data.results.forEach((result: any) => {
        expect(result.relevance).toBeDefined();
        expect(result.relevance).toBeGreaterThanOrEqual(0);
        expect(result.relevance).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('error handling', () => {
    it('should handle search errors gracefully', async () => {
      const error = new Error('Search failed');
      mockOrchestrator.search.mockRejectedValueOnce(error);

      await expect(server.handleSearchPrompts({
        query: 'test query',
      })).rejects.toThrow('Tool execution failed: Search failed');
    });

    it('should handle database connection errors', async () => {
      const error = new Error('Database connection failed');
      mockOrchestrator.search.mockRejectedValueOnce(error);

      await expect(server.handleSearchPrompts({
        domain: 'sql',
      })).rejects.toThrow('Tool execution failed: Database connection failed');
    });

    it('should handle invalid parameters gracefully', async () => {
      // Invalid minScore should be handled by orchestrator
      const mockResults: any[] = [];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({
        minScore: 1.5, // Invalid score > 1
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.results).toHaveLength(0);
    });
  });

  describe('performance', () => {
    it('should complete search within performance threshold', async () => {
      const mockResults = [createMockSearchResult()];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const { duration } = await measurePerformance(async () => {
        return await server.handleSearchPrompts({
          query: 'test search',
        });
      });

      expectWithinPerformanceThreshold(
        duration,
        TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.search_prompts,
        'search_prompts'
      );
    });

    it('should handle large result sets efficiently', async () => {
      const mockResults = Array.from({ length: 100 }, (_, i) =>
        createMockSearchResult({ id: `prompt_${i}` })
      );
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const { result, duration } = await measurePerformance(async () => {
        return await server.handleSearchPrompts({
          limit: 100,
        });
      });

      expect(duration).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.search_prompts * 2);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.results).toHaveLength(100);
    });

    it('should handle concurrent search requests', async () => {
      const mockResults = [createMockSearchResult()];
      mockOrchestrator.search.mockResolvedValue(mockResults);

      const promises = Array.from({ length: 5 }, (_, i) =>
        server.handleSearchPrompts({
          query: `search query ${i}`,
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

  describe('response format validation', () => {
    it('should return properly formatted MCP tool response', async () => {
      const mockResults = [createMockSearchResult()];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({
        query: 'test',
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

      // Validate search result fields
      const requiredFields = ['results', 'total', 'params'];
      requiredFields.forEach(field => {
        expect(responseData.data).toHaveProperty(field);
      });
    });

    it('should include search parameters in response', async () => {
      const mockResults = [createMockSearchResult()];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const searchParams = {
        query: 'test query',
        domain: 'sql',
        tags: ['test'],
        minScore: 0.7,
        sortBy: 'score' as any,
        limit: 15,
        offset: 5,
      };

      const result = await server.handleSearchPrompts(searchParams);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.params).toMatchObject({
        ...searchParams,
        isPublic: undefined,
      });
    });

    it('should validate individual search result structure', async () => {
      const mockResults = [createMockSearchResult()];
      mockOrchestrator.search.mockResolvedValueOnce(mockResults);

      const result = await server.handleSearchPrompts({
        query: 'structure test',
      });

      const responseData = JSON.parse(result.content[0].text);
      const searchResult = responseData.data.results[0];

      // Validate search result fields
      const requiredResultFields = [
        'id', 'name', 'domain', 'tags', 'prompt', 'score',
        'usage', 'createdAt', 'relevance'
      ];
      requiredResultFields.forEach(field => {
        expect(searchResult).toHaveProperty(field);
      });

      // Validate nested structures
      expect(searchResult.score).toHaveProperty('overall');
      expect(searchResult.usage).toHaveProperty('count');
      expect(Array.isArray(searchResult.tags)).toBe(true);
    });
  });
});