/**
 * Unit Tests for validate_prompt tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PromptSmithServer } from '../../../src/server/index.js';
import {
  createMockAnalysisResult,
  createMockValidationResult,
  measurePerformance,
  expectWithinPerformanceThreshold,
  TEST_CONSTANTS,
} from '../../utils/test-helpers.js';
import { setupMockEnvironment } from '../../utils/mock-services.js';

// Mock the analyzer and validator
const mockAnalyzer = {
  analyze: jest.fn<any>().mockResolvedValue(createMockAnalysisResult()),
};

const mockValidator = {
  validate: jest.fn<any>().mockResolvedValue(createMockValidationResult()),
};

// Mock the imports
jest.mock('../../../src/core/analyzer.js', () => ({
  PromptAnalyzer: jest.fn().mockImplementation(() => mockAnalyzer),
}));

jest.mock('../../../src/core/validator.js', () => ({
  PromptValidator: jest.fn().mockImplementation(() => mockValidator),
}));

// Mock external services
setupMockEnvironment();

describe('validate_prompt tool', () => {
  let server: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const serverModule = await import('../../../src/server/index.js');
    server = new serverModule.PromptSmithServer();
  });

  describe('valid inputs', () => {
    it('should validate a simple prompt successfully', async () => {
      const prompt = TEST_CONSTANTS.SAMPLE_PROMPTS.simple;

      const mockAnalysis = createMockAnalysisResult({
        complexity: 0.3,
        ambiguityScore: 0.2,
        readabilityScore: 0.8,
        technicalTerms: ['table', 'user'],
        domainHints: ['sql'],
      });

      const mockValidation = createMockValidationResult({
        isValid: true,
        errors: [],
        warnings: [
          {
            code: 'missing_constraints',
            message: 'Consider adding column constraints',
            suggestion: 'Add PRIMARY KEY and data types',
            position: { start: 8, end: 18 },
          }
        ],
        suggestions: [
          {
            type: 'enhancement',
            message: 'Add column specifications for better clarity',
            before: 'Create a user table',
            after: 'Create a user table with id (PRIMARY KEY), name (VARCHAR), email (VARCHAR UNIQUE)',
          }
        ],
      });

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await server.handleValidatePrompt({
        prompt,
        domain: 'sql',
      });

      expect(mockAnalyzer.analyze).toHaveBeenCalledWith(prompt);
      expect(mockValidator.validate).toHaveBeenCalledWith(prompt, mockAnalysis);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();

      // Validate response structure
      expect(responseData.data).toHaveProperty('isValid', true);
      expect(responseData.data).toHaveProperty('errors');
      expect(responseData.data).toHaveProperty('warnings');
      expect(responseData.data).toHaveProperty('suggestions');
      expect(responseData.data).toHaveProperty('analysis');

      expect(responseData.data.errors).toHaveLength(0);
      expect(responseData.data.warnings).toHaveLength(1);
      expect(responseData.data.suggestions).toHaveLength(1);
    });

    it('should validate prompts with errors and warnings', async () => {
      const prompt = TEST_CONSTANTS.SAMPLE_PROMPTS.ambiguous;

      const mockAnalysis = createMockAnalysisResult({
        complexity: 0.1,
        ambiguityScore: 0.8,
        readabilityScore: 0.3,
        technicalTerms: [],
        domainHints: [],
      });

      const mockValidation = createMockValidationResult({
        isValid: false,
        errors: [
          {
            code: 'vague_requirements',
            message: 'The prompt is too vague and lacks specific requirements',
            severity: 'high',
            position: { start: 0, end: prompt.length },
          },
          {
            code: 'missing_context',
            message: 'No domain-specific context provided',
            severity: 'medium',
            position: { start: 5, end: 10 },
          }
        ],
        warnings: [
          {
            code: 'low_specificity',
            message: 'Consider adding more specific details',
            suggestion: 'Define what kind of "good" and for which use case',
          }
        ],
        suggestions: [
          {
            type: 'fix',
            message: 'Replace vague terms with specific requirements',
            before: 'Make something good for users',
            after: 'Create a user-friendly dashboard with clear navigation and responsive design',
          }
        ],
      });

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await server.handleValidatePrompt({
        prompt,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.isValid).toBe(false);
      expect(responseData.data.errors).toHaveLength(2);
      expect(responseData.data.warnings).toHaveLength(1);

      // Validate error structure
      const firstError = responseData.data.errors[0];
      expect(firstError).toHaveProperty('code', 'vague_requirements');
      expect(firstError).toHaveProperty('message');
      expect(firstError).toHaveProperty('severity', 'high');
      expect(firstError).toHaveProperty('position');
    });

    it('should validate high-quality prompts with minimal issues', async () => {
      const prompt = TEST_CONSTANTS.SAMPLE_PROMPTS.technical;

      const mockAnalysis = createMockAnalysisResult({
        complexity: 0.8,
        ambiguityScore: 0.1,
        readabilityScore: 0.9,
        technicalTerms: ['OAuth', 'PKCE', 'authentication', 'API'],
        domainHints: ['devops', 'security'],
      });

      const mockValidation = createMockValidationResult({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [
          {
            type: 'optimization',
            message: 'Consider adding error handling specifications',
            before: 'Implement OAuth 2.0 with PKCE flow',
            after: 'Implement OAuth 2.0 with PKCE flow including error handling for invalid grants and network failures',
          }
        ],
        qualityMetrics: {
          clarity: 0.95,
          specificity: 0.9,
          structure: 0.88,
          completeness: 0.82,
          consistency: 0.9,
          actionability: 0.85,
        },
      });

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await server.handleValidatePrompt({
        prompt,
        domain: 'devops',
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.isValid).toBe(true);
      expect(responseData.data.errors).toHaveLength(0);
      expect(responseData.data.warnings).toHaveLength(0);
      expect(responseData.data.suggestions).toHaveLength(1);

      // Should have high-quality analysis scores
      expect(responseData.data.analysis.readabilityScore).toBeGreaterThan(0.85);
      expect(responseData.data.analysis.technicalTerms).toHaveLength(4);
    });

    it('should validate prompts for different domains', async () => {
      const domainPrompts = {
        sql: 'CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE)',
        branding: 'Design a minimalist logo for a sustainable tech company',
        cine: 'Write a dramatic scene where the protagonist faces their biggest fear',
        saas: 'Build a subscription management dashboard with usage analytics',
        devops: 'Set up CI/CD pipeline with automated testing and deployment',
        general: 'Create a comprehensive project plan with milestones',
      };

      for (const [domain, prompt] of Object.entries(domainPrompts)) {
        const mockAnalysis = createMockAnalysisResult({
          domainHints: [domain],
          technicalTerms: domain === 'sql' ? ['TABLE', 'SERIAL', 'PRIMARY KEY'] : ['project', 'plan'],
        });

        const mockValidation = createMockValidationResult({
          isValid: true,
          errors: [],
          warnings: [],
        });

        (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
        (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

        const result = await server.handleValidatePrompt({
          prompt,
          domain,
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
        expect(responseData.data.analysis.domainHints).toContain(domain);
      }
    });

    it('should provide detailed analysis metrics', async () => {
      const prompt = TEST_CONSTANTS.SAMPLE_PROMPTS.complex;

      const mockAnalysis = createMockAnalysisResult({
        complexity: 0.7,
        ambiguityScore: 0.15,
        readabilityScore: 0.85,
        technicalTerms: ['database', 'e-commerce', 'authentication', 'analytics', 'scalability'],
        domainHints: ['saas', 'database'],
        tokens: [
          { text: 'Design', pos: 'VERB', lemma: 'design', isStopWord: false, sentiment: 0.1 },
          { text: 'comprehensive', pos: 'ADJ', lemma: 'comprehensive', isStopWord: false, sentiment: 0.2 },
          { text: 'database', pos: 'NOUN', lemma: 'database', isStopWord: false, sentiment: 0 },
        ],
        entities: [
          { text: 'e-commerce platform', label: 'PRODUCT', start: 45, end: 65, confidence: 0.9 },
          { text: 'database schema', label: 'TECH', start: 15, end: 30, confidence: 0.85 },
        ],
      });

      const mockValidation = createMockValidationResult({
        isValid: true,
        errors: [],
        warnings: [
          {
            code: 'complexity_high',
            message: 'High complexity prompt may benefit from breaking into smaller parts',
            suggestion: 'Consider splitting into separate prompts for each component',
          }
        ],
      });

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await server.handleValidatePrompt({
        prompt,
        domain: 'saas',
      });

      const responseData = JSON.parse(result.content[0].text);
      const analysis = responseData.data.analysis;

      expect(analysis.complexity).toBe(0.7);
      expect(analysis.readabilityScore).toBe(0.85);
      expect(analysis.ambiguityScore).toBe(0.15);
      expect(analysis.technicalTerms).toBe(5); // Count of technical terms
      expect(analysis.domainHints).toEqual(['saas', 'database']);
    });
  });

  describe('validation categories', () => {
    it('should identify critical validation errors', async () => {
      const prompt = '';

      const mockAnalysis = createMockAnalysisResult({
        complexity: 0,
        ambiguityScore: 1.0,
        readabilityScore: 0,
      });

      const mockValidation = createMockValidationResult({
        isValid: false,
        errors: [
          {
            code: 'empty_prompt',
            message: 'Prompt cannot be empty',
            severity: 'critical',
          },
          {
            code: 'no_actionable_content',
            message: 'No actionable instructions found',
            severity: 'critical',
          }
        ],
      });

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await server.handleValidatePrompt({
        prompt,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.isValid).toBe(false);
      expect(responseData.data.errors).toHaveLength(2);
      expect(responseData.data.errors.every((e: any) => e.severity === 'critical')).toBe(true);
    });

    it('should categorize different types of suggestions', async () => {
      const prompt = 'Create user interface';

      const mockAnalysis = createMockAnalysisResult({
        complexity: 0.4,
        ambiguityScore: 0.6,
      });

      const mockValidation = createMockValidationResult({
        isValid: true,
        errors: [],
        warnings: [
          {
            code: 'missing_specifications',
            message: 'Interface specifications are vague',
            suggestion: 'Specify UI components, layout, and interaction patterns',
          }
        ],
        suggestions: [
          {
            type: 'enhancement',
            message: 'Add specific UI component requirements',
            before: 'Create user interface',
            after: 'Create a responsive user interface with navigation bar, content area, and sidebar',
          },
          {
            type: 'fix',
            message: 'Define target platform and devices',
            before: 'user interface',
            after: 'web user interface optimized for desktop and mobile',
          },
          {
            type: 'optimization',
            message: 'Consider accessibility requirements',
            after: 'Include ARIA labels and keyboard navigation support',
          }
        ],
      });

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await server.handleValidatePrompt({
        prompt,
      });

      const responseData = JSON.parse(result.content[0].text);
      const suggestions = responseData.data.suggestions;

      expect(suggestions).toHaveLength(3);
      expect(suggestions.find((s: any) => s.type === 'enhancement')).toBeDefined();
      expect(suggestions.find((s: any) => s.type === 'fix')).toBeDefined();
      expect(suggestions.find((s: any) => s.type === 'optimization')).toBeDefined();
    });

    it('should provide position information for issues', async () => {
      const prompt = 'Create something nice for users';

      const mockAnalysis = createMockAnalysisResult();

      const mockValidation = createMockValidationResult({
        isValid: false,
        errors: [
          {
            code: 'vague_term',
            message: 'Term "something" is too vague',
            severity: 'medium',
            position: { start: 7, end: 16 },
          },
          {
            code: 'ambiguous_adjective',
            message: 'Term "nice" is subjective and ambiguous',
            severity: 'low',
            position: { start: 17, end: 21 },
          }
        ],
        warnings: [
          {
            code: 'generic_target',
            message: 'Target audience "users" is too generic',
            suggestion: 'Specify user demographics or use cases',
            position: { start: 26, end: 31 },
          }
        ],
      });

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await server.handleValidatePrompt({
        prompt,
      });

      const responseData = JSON.parse(result.content[0].text);

      responseData.data.errors.forEach((error: any) => {
        expect(error.position).toHaveProperty('start');
        expect(error.position).toHaveProperty('end');
        expect(error.position.start).toBeGreaterThanOrEqual(0);
        expect(error.position.end).toBeGreaterThan(error.position.start);
      });

      responseData.data.warnings.forEach((warning: any) => {
        if (warning.position) {
          expect(warning.position.start).toBeGreaterThanOrEqual(0);
          expect(warning.position.end).toBeGreaterThan(warning.position.start);
        }
      });
    });
  });

  describe('input validation', () => {
    it('should reject missing prompt', async () => {
      await expect(server.handleValidatePrompt({})).rejects.toThrow(
        'Prompt is required and must be a string'
      );
    });

    it('should reject empty prompt', async () => {
      await expect(server.handleValidatePrompt({ prompt: '' })).rejects.toThrow(
        'Prompt is required and must be a string'
      );
    });

    it('should reject non-string prompt', async () => {
      await expect(server.handleValidatePrompt({ prompt: 123 })).rejects.toThrow(
        'Prompt is required and must be a string'
      );
    });

    it('should use default domain when not specified', async () => {
      const mockAnalysis = createMockAnalysisResult();
      const mockValidation = createMockValidationResult();

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await server.handleValidatePrompt({
        prompt: 'Test prompt',
      });

      expect(mockAnalyzer.analyze).toHaveBeenCalledWith('Test prompt');
      expect(mockValidator.validate).toHaveBeenCalledWith('Test prompt', mockAnalysis);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
    });

    it('should handle domain parameter correctly', async () => {
      const mockAnalysis = createMockAnalysisResult();
      const mockValidation = createMockValidationResult();

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      await server.handleValidatePrompt({
        prompt: 'Test prompt',
        domain: 'sql',
      });

      // Domain is passed to the handler but analyzer/validator work with the analyzed result
      expect(mockAnalyzer.analyze).toHaveBeenCalledWith('Test prompt');
    });
  });

  describe('error handling', () => {
    it('should handle analyzer errors', async () => {
      const error = new Error('Analysis failed');
      (mockAnalyzer.analyze as jest.Mock).mockRejectedValueOnce(error);

      await expect(server.handleValidatePrompt({
        prompt: 'Test prompt',
      })).rejects.toThrow('Tool execution failed: Analysis failed');
    });

    it('should handle validator errors', async () => {
      const mockAnalysis = createMockAnalysisResult();
      const error = new Error('Validation failed');

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockRejectedValueOnce(error);

      await expect(server.handleValidatePrompt({
        prompt: 'Test prompt',
      })).rejects.toThrow('Tool execution failed: Validation failed');
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'A'.repeat(50000);

      const mockAnalysis = createMockAnalysisResult({
        complexity: 0.2,
        readabilityScore: 0.3,
        technicalTerms: [],
      });

      const mockValidation = createMockValidationResult({
        isValid: false,
        errors: [
          {
            code: 'excessive_length',
            message: 'Prompt is too long and may be difficult to process',
            severity: 'medium',
          }
        ],
        warnings: [
          {
            code: 'readability_poor',
            message: 'Very long prompts often have poor readability',
            suggestion: 'Consider breaking into smaller, focused prompts',
          }
        ],
      });

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await server.handleValidatePrompt({
        prompt: longPrompt,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.isValid).toBe(false);
      expect(responseData.data.errors.some((e: any) => e.code === 'excessive_length')).toBe(true);
    });
  });

  describe('performance', () => {
    it('should complete validation within performance threshold', async () => {
      const mockAnalysis = createMockAnalysisResult();
      const mockValidation = createMockValidationResult();

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const { duration } = await measurePerformance(async () => {
        return await server.handleValidatePrompt({
          prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
        });
      });

      expectWithinPerformanceThreshold(
        duration,
        TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.validate_prompt,
        'validate_prompt'
      );
    });

    it('should handle concurrent validation requests', async () => {
      const mockAnalysis = createMockAnalysisResult();
      const mockValidation = createMockValidationResult();

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValue(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValue(mockValidation);

      const promises = Array.from({ length: 5 }, (_, i) =>
        server.handleValidatePrompt({
          prompt: `Test prompt ${i}`,
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
      const mockAnalysis = createMockAnalysisResult();
      const mockValidation = createMockValidationResult();

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await server.handleValidatePrompt({
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

      // Validate validation result fields
      const requiredFields = ['isValid', 'errors', 'warnings', 'suggestions', 'analysis'];
      requiredFields.forEach(field => {
        expect(responseData.data).toHaveProperty(field);
      });
    });

    it('should include condensed analysis information', async () => {
      const mockAnalysis = createMockAnalysisResult({
        complexity: 0.65,
        readabilityScore: 0.8,
        ambiguityScore: 0.25,
        technicalTerms: ['database', 'user', 'authentication'],
        domainHints: ['sql', 'security'],
      });

      const mockValidation = createMockValidationResult();

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await server.handleValidatePrompt({
        prompt: 'Create secure user database',
      });

      const responseData = JSON.parse(result.content[0].text);
      const analysis = responseData.data.analysis;

      expect(analysis).toHaveProperty('complexity', 0.65);
      expect(analysis).toHaveProperty('readabilityScore', 0.8);
      expect(analysis).toHaveProperty('ambiguityScore', 0.25);
      expect(analysis).toHaveProperty('technicalTerms', 3); // Count
      expect(analysis).toHaveProperty('domainHints', ['sql', 'security']);
    });

    it('should preserve all validation details', async () => {
      const mockAnalysis = createMockAnalysisResult();

      const mockValidation = createMockValidationResult({
        isValid: false,
        errors: [
          {
            code: 'test_error',
            message: 'Test error message',
            severity: 'high',
            position: { start: 0, end: 5 },
          }
        ],
        warnings: [
          {
            code: 'test_warning',
            message: 'Test warning message',
            suggestion: 'Test suggestion',
            position: { start: 6, end: 10 },
          }
        ],
        suggestions: [
          {
            type: 'enhancement',
            message: 'Test enhancement',
            before: 'old text',
            after: 'new text',
          }
        ],
      });

      (mockAnalyzer.analyze as jest.Mock).mockResolvedValueOnce(mockAnalysis);
      (mockValidator.validate as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await server.handleValidatePrompt({
        prompt: 'Test validation prompt',
      });

      const responseData = JSON.parse(result.content[0].text);

      // All validation details should be preserved
      expect(responseData.data.errors[0]).toMatchObject({
        code: 'test_error',
        message: 'Test error message',
        severity: 'high',
        position: { start: 0, end: 5 },
      });

      expect(responseData.data.warnings[0]).toMatchObject({
        code: 'test_warning',
        message: 'Test warning message',
        suggestion: 'Test suggestion',
        position: { start: 6, end: 10 },
      });

      expect(responseData.data.suggestions[0]).toMatchObject({
        type: 'enhancement',
        message: 'Test enhancement',
        before: 'old text',
        after: 'new text',
      });
    });
  });
});