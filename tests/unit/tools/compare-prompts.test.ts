/**
 * Unit Tests for compare_prompts tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PromptSmithServer } from '../../../src/server/index';
import {
  createMockComparisonResult,
  createMockOrchestrator,
  measurePerformance,
  expectWithinPerformanceThreshold,
  TEST_CONSTANTS,
} from '../../utils/test-helpers';
import { setupMockEnvironment } from '../../utils/mock-services';

// Mock the orchestrator
const mockOrchestrator = createMockOrchestrator();
jest.mock('../../../src/core/orchestrator', () => ({
  PromptOrchestrator: jest.fn().mockImplementation(() => mockOrchestrator),
}));

// Mock external services
setupMockEnvironment();

describe('compare_prompts tool', () => {
  let server: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const serverModule = await import('../../../src/server/index');
    server = new serverModule.PromptSmithServer();
  });

  describe('valid inputs', () => {
    it('should compare two prompts successfully', async () => {
      const variants = [
        TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
        TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
      ];

      const mockResult = createMockComparisonResult({
        variants: [
          {
            id: 'variant_0',
            prompt: variants[0],
            score: { clarity: 0.6, specificity: 0.4, structure: 0.7, completeness: 0.3, overall: 0.5 },
            metrics: [
              { name: 'Length', value: variants[0].length, unit: 'characters', better: 'optimal' },
              { name: 'Complexity', value: 0.3, unit: 'score', better: 'balanced' },
            ],
          },
          {
            id: 'variant_1',
            prompt: variants[1],
            score: { clarity: 0.9, specificity: 0.95, structure: 0.85, completeness: 0.8, overall: 0.875 },
            metrics: [
              { name: 'Length', value: variants[1].length, unit: 'characters', better: 'optimal' },
              { name: 'Complexity', value: 0.8, unit: 'score', better: 'balanced' },
            ],
          },
        ],
        winner: 'variant_1',
      });
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const result = await server.handleComparePrompts({
        variants,
      });

      expect(mockOrchestrator.compare).toHaveBeenCalledWith(variants, undefined);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();

      // Validate comparison result structure
      expect(responseData.data).toHaveProperty('variants');
      expect(responseData.data).toHaveProperty('winner');
      expect(responseData.data).toHaveProperty('metrics');
      expect(responseData.data).toHaveProperty('summary');

      expect(responseData.data.variants).toHaveLength(2);
      expect(responseData.data.winner).toBe('variant_1');
    });

    it('should compare multiple prompts with test input context', async () => {
      const variants = [
        'Create a table',
        'Create a comprehensive table with proper structure',
        'Design and implement a normalized database table',
      ];
      const testInput = 'user management system';

      const mockResult = createMockComparisonResult({
        variants: variants.map((prompt, i) => ({
          id: `variant_${i}`,
          prompt,
          score: {
            clarity: 0.5 + i * 0.2,
            specificity: 0.4 + i * 0.25,
            structure: 0.6 + i * 0.15,
            completeness: 0.3 + i * 0.3,
            overall: 0.45 + i * 0.225
          },
          metrics: [
            { name: 'Length', value: prompt.length, unit: 'characters', better: 'optimal' },
            { name: 'Complexity', value: 0.3 + i * 0.2, unit: 'score', better: 'balanced' },
          ],
        })),
        winner: 'variant_2',
      });
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const result = await server.handleComparePrompts({
        variants,
        testInput,
      });

      expect(mockOrchestrator.compare).toHaveBeenCalledWith(variants, testInput);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.variants).toHaveLength(3);
      expect(responseData.data.winner).toBe('variant_2');
    });

    it('should handle variants with significantly different quality scores', async () => {
      const variants = [
        TEST_CONSTANTS.SAMPLE_PROMPTS.ambiguous, // Low quality
        TEST_CONSTANTS.SAMPLE_PROMPTS.technical,  // High quality
      ];

      const mockResult = createMockComparisonResult({
        variants: [
          {
            id: 'variant_0',
            prompt: variants[0],
            score: { clarity: 0.2, specificity: 0.1, structure: 0.3, completeness: 0.15, overall: 0.1875 },
            metrics: [
              { name: 'Clarity Score', value: 0.2, unit: 'score', better: 'higher' },
              { name: 'Error Count', value: 5, unit: 'count', better: 'lower' },
            ],
          },
          {
            id: 'variant_1',
            prompt: variants[1],
            score: { clarity: 0.95, specificity: 0.9, structure: 0.85, completeness: 0.8, overall: 0.875 },
            metrics: [
              { name: 'Clarity Score', value: 0.95, unit: 'score', better: 'higher' },
              { name: 'Error Count', value: 0, unit: 'count', better: 'lower' },
            ],
          },
        ],
        winner: 'variant_1',
        summary: 'variant_1 achieved the highest quality score of 87.5% (average: 53.1%). Key advantages include better clarity and completeness.',
      });
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const result = await server.handleComparePrompts({
        variants,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.winner).toBe('variant_1');

      // Check that the quality difference is significant
      const winnerScore = responseData.data.variants.find((v: any) => v.id === 'variant_1').score.overall;
      const loserScore = responseData.data.variants.find((v: any) => v.id === 'variant_0').score.overall;
      expect(winnerScore - loserScore).toBeGreaterThan(0.5);
    });

    it('should compare prompts from different domains', async () => {
      const variants = [
        'Create a user table', // SQL domain
        'Design a brand identity', // Branding domain
        'Write a movie scene', // Cinema domain
      ];

      const mockResult = createMockComparisonResult({
        variants: variants.map((prompt, i) => ({
          id: `variant_${i}`,
          prompt,
          score: {
            clarity: 0.7 + i * 0.1,
            specificity: 0.6 + i * 0.1,
            structure: 0.75 + i * 0.05,
            completeness: 0.5 + i * 0.15,
            overall: 0.6375 + i * 0.1
          },
          metrics: [
            { name: 'Domain Specificity', value: 0.8 + i * 0.1, unit: 'score', better: 'higher' },
            { name: 'Cross-Domain Applicability', value: 0.3 - i * 0.1, unit: 'score', better: 'balanced' },
          ],
        })),
        winner: 'variant_2',
      });
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const result = await server.handleComparePrompts({
        variants,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.variants).toHaveLength(3);

      // Each variant should have domain-specific metrics
      responseData.data.variants.forEach((variant: any) => {
        expect(variant.metrics).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'Domain Specificity' }),
          ])
        );
      });
    });
  });

  describe('comparison metrics', () => {
    it('should provide detailed metrics comparison', async () => {
      const variants = [
        'Short prompt',
        'This is a more detailed and comprehensive prompt with better specifications',
      ];

      const mockResult = createMockComparisonResult({
        metrics: [
          {
            name: 'Overall Quality',
            values: { variant_0: 0.6, variant_1: 0.85 },
            winner: 'variant_1',
            significance: 0.25,
          },
          {
            name: 'Clarity',
            values: { variant_0: 0.5, variant_1: 0.9 },
            winner: 'variant_1',
            significance: 0.4,
          },
          {
            name: 'Length',
            values: { variant_0: 12, variant_1: 78 },
            winner: 'variant_1',
            significance: 66,
          },
        ],
      });
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const result = await server.handleComparePrompts({
        variants,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.metrics).toHaveLength(3);

      responseData.data.metrics.forEach((metric: any) => {
        expect(metric).toHaveProperty('name');
        expect(metric).toHaveProperty('values');
        expect(metric).toHaveProperty('winner');
        expect(metric).toHaveProperty('significance');
      });
    });

    it('should handle close competition scenarios', async () => {
      const variants = [
        'Create a comprehensive user table with proper indexing',
        'Design a well-structured user table with appropriate constraints',
      ];

      const mockResult = createMockComparisonResult({
        variants: [
          {
            id: 'variant_0',
            prompt: variants[0],
            score: { clarity: 0.85, specificity: 0.8, structure: 0.82, completeness: 0.78, overall: 0.8125 },
            metrics: [],
          },
          {
            id: 'variant_1',
            prompt: variants[1],
            score: { clarity: 0.83, specificity: 0.82, structure: 0.8, completeness: 0.8, overall: 0.8125 },
            metrics: [],
          },
        ],
        winner: 'variant_0', // Tie-breaker based on some criteria
        summary: 'variant_0 and variant_1 achieved nearly identical quality scores (81.3%). The difference is marginal with variant_0 having slightly better clarity.',
      });
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const result = await server.handleComparePrompts({
        variants,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);

      // Both variants should have similar scores
      const scores = responseData.data.variants.map((v: any) => v.score.overall);
      const scoreDiff = Math.abs(scores[0] - scores[1]);
      expect(scoreDiff).toBeLessThan(0.1); // Very close scores
    });
  });

  describe('input validation', () => {
    it('should reject missing variants', async () => {
      await expect(server.handleComparePrompts({})).rejects.toThrow(
        'At least 2 prompt variants are required'
      );
    });

    it('should reject non-array variants', async () => {
      await expect(server.handleComparePrompts({
        variants: 'not an array',
      })).rejects.toThrow(
        'At least 2 prompt variants are required'
      );
    });

    it('should reject insufficient number of variants', async () => {
      await expect(server.handleComparePrompts({
        variants: ['Only one variant'],
      })).rejects.toThrow(
        'At least 2 prompt variants are required'
      );
    });

    it('should handle empty string variants', async () => {
      const variants = ['', 'Valid prompt'];

      const mockResult = createMockComparisonResult({
        variants: [
          {
            id: 'variant_0',
            prompt: '',
            score: { clarity: 0, specificity: 0, structure: 0, completeness: 0, overall: 0 },
            metrics: [],
          },
          {
            id: 'variant_1',
            prompt: 'Valid prompt',
            score: { clarity: 0.8, specificity: 0.7, structure: 0.75, completeness: 0.6, overall: 0.7125 },
            metrics: [],
          },
        ],
        winner: 'variant_1',
      });
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const result = await server.handleComparePrompts({
        variants,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.winner).toBe('variant_1');
    });
  });

  describe('edge cases', () => {
    it('should handle identical prompts', async () => {
      const variants = ['Create a table', 'Create a table'];

      const mockResult = createMockComparisonResult({
        variants: [
          {
            id: 'variant_0',
            prompt: 'Create a table',
            score: { clarity: 0.6, specificity: 0.4, structure: 0.7, completeness: 0.3, overall: 0.5 },
            metrics: [],
          },
          {
            id: 'variant_1',
            prompt: 'Create a table',
            score: { clarity: 0.6, specificity: 0.4, structure: 0.7, completeness: 0.3, overall: 0.5 },
            metrics: [],
          },
        ],
        winner: 'variant_0', // Arbitrary choice for identical prompts
        summary: 'Both variants are identical and achieved the same quality score of 50.0%.',
      });
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const result = await server.handleComparePrompts({
        variants,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);

      // Both variants should have identical scores
      const scores = responseData.data.variants.map((v: any) => v.score.overall);
      expect(scores[0]).toBe(scores[1]);
    });

    it('should handle very long prompts', async () => {
      const variants = [
        'A'.repeat(5000), // Very long prompt
        'Short prompt',
      ];

      const mockResult = createMockComparisonResult({
        variants: [
          {
            id: 'variant_0',
            prompt: variants[0],
            score: { clarity: 0.3, specificity: 0.4, structure: 0.2, completeness: 0.6, overall: 0.375 },
            metrics: [
              { name: 'Length', value: 5000, unit: 'characters', better: 'optimal' },
              { name: 'Readability', value: 0.2, unit: 'score', better: 'higher' },
            ],
          },
          {
            id: 'variant_1',
            prompt: variants[1],
            score: { clarity: 0.8, specificity: 0.5, structure: 0.9, completeness: 0.4, overall: 0.65 },
            metrics: [
              { name: 'Length', value: 12, unit: 'characters', better: 'optimal' },
              { name: 'Readability', value: 0.9, unit: 'score', better: 'higher' },
            ],
          },
        ],
        winner: 'variant_1',
      });
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const result = await server.handleComparePrompts({
        variants,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.winner).toBe('variant_1'); // Shorter, clearer prompt wins
    });

    it('should handle maximum number of variants', async () => {
      const variants = Array.from({ length: 10 }, (_, i) => `Prompt variant ${i + 1}`);

      const mockResult = createMockComparisonResult({
        variants: variants.map((prompt, i) => ({
          id: `variant_${i}`,
          prompt,
          score: {
            clarity: 0.5 + (i * 0.05),
            specificity: 0.6 + (i * 0.04),
            structure: 0.7 + (i * 0.03),
            completeness: 0.4 + (i * 0.06),
            overall: 0.55 + (i * 0.045)
          },
          metrics: [],
        })),
        winner: 'variant_9', // Highest index should have best score
      });
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const result = await server.handleComparePrompts({
        variants,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.variants).toHaveLength(10);
      expect(responseData.data.winner).toBe('variant_9');
    });
  });

  describe('error handling', () => {
    it('should handle comparison errors gracefully', async () => {
      const error = new Error('Comparison failed');
      
      // Set up the error mock after server initialization
      mockOrchestrator.compare.mockRejectedValueOnce(error);

      await expect(server.handleComparePrompts({
        variants: ['Prompt 1', 'Prompt 2'],
      })).rejects.toThrow('Comparison failed');
    });
  });

  describe('performance', () => {
    it('should complete comparison within performance threshold', async () => {
      const variants = [
        TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
        TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
      ];

      const mockResult = createMockComparisonResult();
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const { duration } = await measurePerformance(async () => {
        return await server.handleComparePrompts({ variants });
      });

      expectWithinPerformanceThreshold(
        duration,
        TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.compare_prompts,
        'compare_prompts'
      );
    });

    it('should handle multiple variants efficiently', async () => {
      const variants = Array.from({ length: 5 }, (_, i) => `Test prompt ${i}`);

      const mockResult = createMockComparisonResult({
        variants: variants.map((prompt, i) => ({
          id: `variant_${i}`,
          prompt,
          score: { clarity: 0.7, specificity: 0.6, structure: 0.8, completeness: 0.5, overall: 0.65 },
          metrics: [],
        })),
      });
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const { result, duration } = await measurePerformance(async () => {
        return await server.handleComparePrompts({ variants });
      });

      // Should still be within reasonable time even with more variants
      expect(duration).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.compare_prompts);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.variants).toHaveLength(5);
    });
  });

  describe('response format validation', () => {
    it('should return properly formatted MCP tool response', async () => {
      const variants = ['Prompt 1', 'Prompt 2'];
      const mockResult = createMockComparisonResult();
      mockOrchestrator.compare.mockResolvedValueOnce(mockResult);

      const result = await server.handleComparePrompts({ variants });

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

      // Validate comparison result fields
      const requiredFields = ['variants', 'winner', 'metrics', 'summary'];
      requiredFields.forEach(field => {
        expect(responseData.data).toHaveProperty(field);
      });

      // Validate variants structure
      responseData.data.variants.forEach((variant: any) => {
        expect(variant).toHaveProperty('id');
        expect(variant).toHaveProperty('prompt');
        expect(variant).toHaveProperty('score');
        expect(variant).toHaveProperty('metrics');
      });
    });
  });
});