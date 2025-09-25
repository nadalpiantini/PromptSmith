/**
 * Unit Tests for evaluate_prompt tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PromptSmithServer } from '../../../src/server/index.js';
import {
  createMockEvaluationResult,
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

describe('evaluate_prompt tool', () => {
  let server: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const serverModule = await import('../../../src/server/index.js');
    server = new serverModule.PromptSmithServer();
  });

  describe('valid inputs', () => {
    it('should evaluate a simple prompt successfully', async () => {
      const mockResult = createMockEvaluationResult();
      mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

      const result = await server.handleEvaluatePrompt({
        prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
      });

      expect(mockOrchestrator.evaluate).toHaveBeenCalledWith(
        TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
        undefined,
        undefined
      );

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();

      // Validate evaluation result structure
      expect(responseData.data).toHaveProperty('score');
      expect(responseData.data).toHaveProperty('breakdown');
      expect(responseData.data).toHaveProperty('recommendations');
    });

    it('should evaluate prompts with specific criteria', async () => {
      const criteria = ['clarity', 'specificity', 'completeness'];
      const mockResult = createMockEvaluationResult({
        breakdown: {
          clarity: {
            score: 0.9,
            factors: [
              { name: 'specific_terms', weight: 0.6, score: 0.95, description: 'Excellent use of specific terms' }
            ]
          },
          specificity: {
            score: 0.85,
            factors: [
              { name: 'technical_details', weight: 0.8, score: 0.9, description: 'Good technical specificity' }
            ]
          },
          structure: {
            score: 0.8,
            factors: [
              { name: 'logical_flow', weight: 0.7, score: 0.85, description: 'Clear logical structure' }
            ]
          },
          completeness: {
            score: 0.75,
            factors: [
              { name: 'requirements', weight: 0.9, score: 0.8, description: 'Most requirements specified' }
            ]
          }
        }
      });
      mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

      const result = await server.handleEvaluatePrompt({
        prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
        criteria,
      });

      expect(mockOrchestrator.evaluate).toHaveBeenCalledWith(
        TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
        criteria,
        undefined
      );

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);

      // Check that evaluation focused on specified criteria
      expect(responseData.data.breakdown.clarity).toBeDefined();
      expect(responseData.data.breakdown.specificity).toBeDefined();
      expect(responseData.data.breakdown.completeness).toBeDefined();
    });

    it('should evaluate prompts with domain context', async () => {
      const mockResult = createMockEvaluationResult({
        score: {
          clarity: 0.85,
          specificity: 0.9,
          structure: 0.8,
          completeness: 0.75,
          overall: 0.825,
        }
      });
      mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

      const result = await server.handleEvaluatePrompt({
        prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
        domain: 'sql',
      });

      expect(mockOrchestrator.evaluate).toHaveBeenCalledWith(
        TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
        undefined,
        'sql'
      );

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.score.overall).toBeGreaterThan(0.8);
    });

    it('should evaluate different quality aspects correctly', async () => {
      const testCases = [
        {
          prompt: 'Create a table',
          expectedScore: { clarity: 0.6, specificity: 0.4, completeness: 0.3 },
          description: 'Simple but incomplete prompt'
        },
        {
          prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
          expectedScore: { clarity: 0.9, specificity: 0.95, completeness: 0.8 },
          description: 'Technical prompt with good specificity'
        },
        {
          prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.ambiguous,
          expectedScore: { clarity: 0.3, specificity: 0.2, completeness: 0.2 },
          description: 'Ambiguous prompt with low quality scores'
        }
      ];

      for (const testCase of testCases) {
        const mockResult = createMockEvaluationResult({
          score: {
            ...testCase.expectedScore,
            structure: 0.7,
            overall: (testCase.expectedScore.clarity + testCase.expectedScore.specificity + testCase.expectedScore.completeness + 0.7) / 4,
          }
        });
        mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

        const result = await server.handleEvaluatePrompt({
          prompt: testCase.prompt,
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);

        // Validate scores are within expected ranges
        expect(responseData.data.score.clarity).toBeCloseTo(testCase.expectedScore.clarity, 1);
        expect(responseData.data.score.specificity).toBeCloseTo(testCase.expectedScore.specificity, 1);
      }
    });
  });

  describe('recommendations generation', () => {
    it('should provide critical recommendations for poor quality prompts', async () => {
      const mockResult = createMockEvaluationResult({
        score: {
          clarity: 0.3,
          specificity: 0.2,
          structure: 0.4,
          completeness: 0.25,
          overall: 0.2875,
        },
        recommendations: [
          {
            type: 'critical',
            title: 'Improve Clarity',
            description: 'The prompt is too vague and lacks specific requirements',
            impact: 'high',
          },
          {
            type: 'critical',
            title: 'Add Specificity',
            description: 'Include technical details and constraints',
            impact: 'high',
          }
        ]
      });
      mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

      const result = await server.handleEvaluatePrompt({
        prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.ambiguous,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.recommendations).toHaveLength(2);

      const criticalRecs = responseData.data.recommendations.filter((r: any) => r.type === 'critical');
      expect(criticalRecs).toHaveLength(2);
      expect(criticalRecs[0].impact).toBe('high');
    });

    it('should provide improvement suggestions for medium quality prompts', async () => {
      const mockResult = createMockEvaluationResult({
        score: {
          clarity: 0.7,
          specificity: 0.6,
          structure: 0.8,
          completeness: 0.5,
          overall: 0.65,
        },
        recommendations: [
          {
            type: 'important',
            title: 'Enhance Completeness',
            description: 'Consider adding success criteria and expected outcomes',
            impact: 'medium',
          },
          {
            type: 'suggestion',
            title: 'Add Context',
            description: 'Providing more context could improve results',
            impact: 'low',
          }
        ]
      });
      mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

      const result = await server.handleEvaluatePrompt({
        prompt: 'Create a user management system with authentication',
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.recommendations).toHaveLength(2);

      const importantRecs = responseData.data.recommendations.filter((r: any) => r.type === 'important');
      expect(importantRecs).toHaveLength(1);
    });

    it('should provide minimal suggestions for high quality prompts', async () => {
      const mockResult = createMockEvaluationResult({
        score: {
          clarity: 0.95,
          specificity: 0.9,
          structure: 0.92,
          completeness: 0.88,
          overall: 0.9125,
        },
        recommendations: [
          {
            type: 'suggestion',
            title: 'Minor Enhancement',
            description: 'Consider adding edge case handling instructions',
            impact: 'low',
          }
        ]
      });
      mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

      const result = await server.handleEvaluatePrompt({
        prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.recommendations).toHaveLength(1);
      expect(responseData.data.recommendations[0].type).toBe('suggestion');
      expect(responseData.data.recommendations[0].impact).toBe('low');
    });
  });

  describe('quality breakdown analysis', () => {
    it('should provide detailed breakdown for all quality dimensions', async () => {
      const mockResult = createMockEvaluationResult();
      mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

      const result = await server.handleEvaluatePrompt({
        prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.complex,
      });

      const responseData = JSON.parse(result.content[0].text);
      const breakdown = responseData.data.breakdown;

      // Validate breakdown structure
      expect(breakdown).toHaveProperty('clarity');
      expect(breakdown).toHaveProperty('specificity');
      expect(breakdown).toHaveProperty('structure');
      expect(breakdown).toHaveProperty('completeness');

      // Validate each dimension has score and factors
      Object.values(breakdown).forEach((dimension: any) => {
        expect(dimension).toHaveProperty('score');
        expect(dimension).toHaveProperty('factors');
        expect(Array.isArray(dimension.factors)).toBe(true);

        dimension.factors.forEach((factor: any) => {
          expect(factor).toHaveProperty('name');
          expect(factor).toHaveProperty('weight');
          expect(factor).toHaveProperty('score');
          expect(factor).toHaveProperty('description');
        });
      });
    });
  });

  describe('input validation', () => {
    it('should reject missing prompt', async () => {
      await expect(server.handleEvaluatePrompt({})).rejects.toThrow(
        'Prompt is required and must be a string'
      );
    });

    it('should reject empty prompt', async () => {
      await expect(server.handleEvaluatePrompt({ prompt: '' })).rejects.toThrow(
        'Prompt is required and must be a string'
      );
    });

    it('should reject non-string prompt', async () => {
      await expect(server.handleEvaluatePrompt({ prompt: 123 })).rejects.toThrow(
        'Prompt is required and must be a string'
      );
    });

    it('should handle optional parameters correctly', async () => {
      const mockResult = createMockEvaluationResult();
      mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

      await server.handleEvaluatePrompt({
        prompt: 'Test prompt',
        criteria: ['clarity'],
        domain: 'general',
      });

      expect(mockOrchestrator.evaluate).toHaveBeenCalledWith(
        'Test prompt',
        ['clarity'],
        'general'
      );
    });
  });

  describe('error handling', () => {
    it('should handle evaluation errors gracefully', async () => {
      const error = new Error('Evaluation failed');
      mockOrchestrator.evaluate.mockRejectedValueOnce(error);

      await expect(server.handleEvaluatePrompt({
        prompt: 'Test prompt',
      })).rejects.toThrow('Tool execution failed: Evaluation failed');
    });

    it('should handle malformed criteria arrays', async () => {
      const mockResult = createMockEvaluationResult();
      mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

      const result = await server.handleEvaluatePrompt({
        prompt: 'Test prompt',
        criteria: ['invalid_criteria', 'clarity'],
      });

      // Should still work, orchestrator handles invalid criteria
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
    });
  });

  describe('performance', () => {
    it('should complete evaluation within performance threshold', async () => {
      const mockResult = createMockEvaluationResult();
      mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

      const { duration } = await measurePerformance(async () => {
        return await server.handleEvaluatePrompt({
          prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
        });
      });

      expectWithinPerformanceThreshold(
        duration,
        TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.evaluate_prompt,
        'evaluate_prompt'
      );
    });

    it('should handle concurrent evaluation requests', async () => {
      const mockResult = createMockEvaluationResult();
      mockOrchestrator.evaluate.mockResolvedValue(mockResult);

      const promises = Array.from({ length: 3 }, (_, i) =>
        server.handleEvaluatePrompt({
          prompt: `Test prompt ${i}`,
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);

      results.forEach((result) => {
        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
      });
    });
  });

  describe('response format validation', () => {
    it('should return properly formatted MCP tool response', async () => {
      const mockResult = createMockEvaluationResult();
      mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

      const result = await server.handleEvaluatePrompt({
        prompt: 'Test prompt',
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

      // Validate evaluation result fields
      const requiredFields = ['score', 'breakdown', 'recommendations'];
      requiredFields.forEach(field => {
        expect(responseData.data).toHaveProperty(field);
      });
    });

    it('should include comparisons when provided', async () => {
      const mockResult = createMockEvaluationResult({
        comparisons: [
          {
            name: 'Industry Average',
            values: { current: 0.8, average: 0.65 },
            winner: 'current',
            significance: 0.15,
          }
        ]
      });
      mockOrchestrator.evaluate.mockResolvedValueOnce(mockResult);

      const result = await server.handleEvaluatePrompt({
        prompt: 'High quality prompt with detailed specifications',
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.comparisons).toBeDefined();
      expect(responseData.data.comparisons).toHaveLength(1);
    });
  });
});