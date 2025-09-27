/**
 * Unit Tests for PromptValidator
 * Tests the validation and quality checking functionality
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PromptValidator } from '../../../src/core/validator';
import { ValidationResult, PromptDomain } from '../../../src/types/prompt';
import { createMockAnalysisResult } from '../../utils/test-helpers';

describe('PromptValidator', () => {
  let validator: PromptValidator;

  beforeEach(() => {
    validator = new PromptValidator();
  });

  describe('validate', () => {
    it('should validate a well-structured prompt', async () => {
      const prompt = 'Create a PostgreSQL database schema with users, products, and orders tables. Include primary keys, foreign key relationships, and appropriate indexes.';
      const analysis = createMockAnalysisResult();

      const result = await validator.validate(prompt, analysis);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.qualityMetrics.clarity).toBeGreaterThan(0.7);
      expect(result.qualityMetrics.specificity).toBeGreaterThan(0.7);
      expect(result.qualityMetrics.structure).toBeGreaterThan(0.7);
    });

    it('should detect clarity issues', async () => {
      const vaguePrompt = 'do something with the stuff';
      const analysis = createMockAnalysisResult({ ambiguityScore: 0.9 });

      const result = await validator.validate(vaguePrompt, analysis);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code.includes('clarity'))).toBe(true);
      expect(result.qualityMetrics.clarity).toBeLessThan(0.3);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should detect specificity issues', async () => {
      const unspecificPrompt = 'Create a database';
      const analysis = createMockAnalysisResult({ technicalTerms: ['database'] });

      const result = await validator.validate(unspecificPrompt, analysis);

      expect(result.warnings.some(w => w.code.includes('specificity'))).toBe(true);
      expect(result.qualityMetrics.specificity).toBeLessThan(0.5);
      expect(result.suggestions.some(s => s.type === 'enhancement')).toBe(true);
    });

    it('should detect structure issues in long prompts', async () => {
      const unstructuredPrompt = 'Create database users products orders authentication logging monitoring caching queuing messaging notifications emails templates styles scripts deployment testing documentation';
      const analysis = createMockAnalysisResult({ complexity: 0.8, readabilityScore: 0.2 });

      const result = await validator.validate(unstructuredPrompt, analysis);

      expect(result.warnings.some(w => w.code.includes('structure'))).toBe(true);
      expect(result.qualityMetrics.structure).toBeLessThan(0.5);
      expect(result.suggestions.some(s => s.message.toLowerCase().includes('structure'))).toBe(true);
    });

    it('should validate SQL domain prompts', async () => {
      const sqlPrompt = 'SELECT * FROM users WHERE active = true';
      const analysis = createMockAnalysisResult({ domainHints: ['sql'], technicalTerms: ['SELECT', 'FROM', 'WHERE'] });

      const result = await validator.validate(sqlPrompt, analysis);

      expect(result.isValid).toBe(true);
      expect(result.qualityMetrics.consistency).toBeGreaterThan(0.8);
    });

    it('should validate branding domain prompts', async () => {
      const brandingPrompt = 'Create compelling marketing copy for our new eco-friendly product line targeting millennials';
      const analysis = createMockAnalysisResult({ domainHints: ['branding', 'marketing'], technicalTerms: ['marketing', 'targeting'] });

      const result = await validator.validate(brandingPrompt, analysis);

      expect(result.isValid).toBe(true);
      expect(result.qualityMetrics.actionability).toBeGreaterThan(0.6);
    });

    it('should validate cinema domain prompts', async () => {
      const cinemaPrompt = 'Write an opening scene for a thriller set in New York';
      const analysis = createMockAnalysisResult({ domainHints: ['cinema', 'screenplay'], technicalTerms: ['scene', 'thriller'] });

      const result = await validator.validate(cinemaPrompt, analysis);

      expect(result.isValid).toBe(true);
      expect(result.qualityMetrics.structure).toBeGreaterThan(0.5);
    });

    it('should validate SaaS domain prompts', async () => {
      const saasPrompt = 'As a user, I want to reset my password so that I can regain access to my account';
      const analysis = createMockAnalysisResult({ domainHints: ['saas', 'product'], technicalTerms: ['user', 'password', 'account'] });

      const result = await validator.validate(saasPrompt, analysis);

      expect(result.isValid).toBe(true);
      expect(result.qualityMetrics.completeness).toBeGreaterThan(0.7);
    });

    it('should validate DevOps domain prompts', async () => {
      const devopsPrompt = 'Create a CI/CD pipeline with Docker, Kubernetes, and GitHub Actions';
      const analysis = createMockAnalysisResult({ domainHints: ['devops', 'deployment'], technicalTerms: ['CI/CD', 'Docker', 'Kubernetes'] });

      const result = await validator.validate(devopsPrompt, analysis);

      expect(result.isValid).toBe(true);
      expect(result.qualityMetrics.specificity).toBeGreaterThan(0.6);
    });

    it('should detect completeness issues', async () => {
      const incompletePrompt = 'Create a function that';
      const analysis = createMockAnalysisResult({ complexity: 0.2, technicalTerms: ['function'] });

      const result = await validator.validate(incompletePrompt, analysis);

      expect(result.errors.some(e => e.code.includes('completeness'))).toBe(true);
      expect(result.qualityMetrics.completeness).toBeLessThan(0.3);
      expect(result.suggestions.some(s => s.message.includes('complete'))).toBe(true);
    });

    it('should provide actionable suggestions', async () => {
      const improvablePrompt = 'make api';
      const analysis = createMockAnalysisResult({ ambiguityScore: 0.8, technicalTerms: ['api'] });

      const result = await validator.validate(improvablePrompt, analysis);

      expect(result.suggestions.length).toBeGreaterThan(0);
      result.suggestions.forEach(suggestion => {
        expect(suggestion.type).toBeDefined();
        expect(suggestion.message).toBeDefined();
        if (suggestion.before && suggestion.after) {
          expect(suggestion.after.length).toBeGreaterThan(suggestion.before.length);
        }
      });
    });

    it('should handle empty prompts', async () => {
      const analysis = createMockAnalysisResult({ tokens: [], complexity: 0 });
      const result = await validator.validate('', analysis);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code.includes('empty'))).toBe(true);
      expect(result.qualityMetrics.clarity).toBe(0);
      expect(result.qualityMetrics.completeness).toBe(0);
    });

    it('should handle whitespace-only prompts', async () => {
      const analysis = createMockAnalysisResult({ tokens: [], complexity: 0 });
      const result = await validator.validate('   \n\t  ', analysis);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code.includes('empty'))).toBe(true);
    });

    it('should validate prompts with variables', async () => {
      const templatePrompt = 'Create a {{type}} for {{purpose}} with {{features}}';
      const analysis = createMockAnalysisResult({ hasVariables: true });

      const result = await validator.validate(templatePrompt, analysis);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code.includes('template'))).toBe(true);
      expect(result.suggestions.some(s => s.message.includes('variable'))).toBe(true);
    });

    it('should detect redundancy in prompts', async () => {
      const redundantPrompt = 'Create a new user account for a new user with new credentials';
      const analysis = createMockAnalysisResult({ technicalTerms: ['user', 'account', 'credentials'] });

      const result = await validator.validate(redundantPrompt, analysis);

      expect(result.warnings.some(w => w.code.includes('redundancy'))).toBe(true);
      expect(result.suggestions.some(s => s.message.toLowerCase().includes('redundant'))).toBe(true);
    });

    it('should validate consistency across metrics', async () => {
      const goodPrompt = 'Develop a RESTful API with the following endpoints:\n- GET /users - Retrieve all users\n- POST /users - Create a new user\n- PUT /users/:id - Update user by ID\n- DELETE /users/:id - Delete user by ID';
      const analysis = createMockAnalysisResult({ readabilityScore: 0.9, complexity: 0.7, technicalTerms: ['RESTful', 'API', 'endpoints'] });

      const result = await validator.validate(goodPrompt, analysis);

      expect(result.isValid).toBe(true);
      expect(result.qualityMetrics.consistency).toBeGreaterThan(0.8);
      expect(result.qualityMetrics.structure).toBeGreaterThan(0.8);
      expect(result.qualityMetrics.clarity).toBeGreaterThan(0.8);
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'Create a comprehensive system that '.repeat(100) +
        'handles all aspects of user management, authentication, authorization, and auditing.';
      const analysis = createMockAnalysisResult({ complexity: 0.9, technicalTerms: ['system', 'user', 'authentication'] });

      const result = await validator.validate(longPrompt, analysis);

      expect(result).toBeDefined();
      expect(result.warnings.some(w => w.code.includes('length'))).toBe(true);
      expect(result.suggestions.some(s => s.message.includes('break down'))).toBe(true);
    });

    it('should detect inappropriate content', async () => {
      const inappropriatePrompt = 'Create a system to hack into databases';
      const analysis = createMockAnalysisResult({ technicalTerms: ['system', 'hack', 'databases'] });

      const result = await validator.validate(inappropriatePrompt, analysis);

      expect(result.warnings.some(w => w.code.includes('content'))).toBe(true);
      expect(result.suggestions.some(s => s.message.includes('ethical'))).toBe(true);
    });

    it('should validate code snippets in prompts', async () => {
      const codePrompt = 'Fix this function: function add(a, b) { return a + b; }';
      const analysis = createMockAnalysisResult({ technicalTerms: ['function', 'add'], complexity: 0.6 });

      const result = await validator.validate(codePrompt, analysis);

      expect(result.isValid).toBe(true);
      expect(result.qualityMetrics.specificity).toBeGreaterThan(0.7);
    });

    it('should calculate actionability score', async () => {
      const actionablePrompt = 'Create a Python function that calculates the factorial of a number using recursion';
      const nonActionablePrompt = 'Tell me about functions';
      const actionableAnalysis = createMockAnalysisResult({ technicalTerms: ['Python', 'function', 'factorial'], complexity: 0.8 });
      const nonActionableAnalysis = createMockAnalysisResult({ ambiguityScore: 0.8, complexity: 0.2 });

      const actionableResult = await validator.validate(actionablePrompt, actionableAnalysis);
      const nonActionableResult = await validator.validate(nonActionablePrompt, nonActionableAnalysis);

      expect(actionableResult.qualityMetrics.actionability).toBeGreaterThan(0.7);
      expect(nonActionableResult.qualityMetrics.actionability).toBeLessThan(0.4);
    });

    it('should handle prompts in different languages', async () => {
      const spanishPrompt = 'Crear una tabla de usuarios con autenticación';
      const analysis = createMockAnalysisResult({ language: 'es', domainHints: ['sql'] });

      const result = await validator.validate(spanishPrompt, analysis);

      expect(result).toBeDefined();
      expect(result.warnings.some(w => w.code.includes('language'))).toBe(true);
      expect(result.suggestions.some(s => s.message.includes('English'))).toBe(true);
    });

    it('should validate domain-specific terminology', async () => {
      const sqlWithWrongTerms = 'Make a SQL collection for users';  // 'collection' is MongoDB term
      const analysis = createMockAnalysisResult({ domainHints: ['sql'], technicalTerms: ['SQL', 'collection', 'users'] });

      const result = await validator.validate(sqlWithWrongTerms, analysis);

      expect(result.warnings.some(w => w.code.includes('terminology'))).toBe(true);
      expect(result.suggestions.some(s => s.message.includes('table'))).toBe(true);
    });
  });

  describe('performance', () => {
    it('should validate prompts quickly', async () => {
      const prompt = 'Create a comprehensive REST API with authentication, authorization, and database integration';
      const analysis = createMockAnalysisResult();

      const startTime = Date.now();
      await validator.validate(prompt, analysis);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(300); // Should complete within 300ms
    });

    it('should handle concurrent validations', async () => {
      const prompts = Array(20).fill('Create a database table').map((p, i) => `${p} ${i}`);
      const analysis = createMockAnalysisResult();

      const startTime = Date.now();
      await Promise.all(prompts.map(p => validator.validate(p, analysis)));
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should handle 20 concurrent validations within 1 second
    });
  });

  describe('edge cases', () => {
    it('should handle null or undefined gracefully', async () => {
      const emptyAnalysis = createMockAnalysisResult({ tokens: [], complexity: 0 });
      
      // @ts-ignore - Testing runtime behavior
      const result1 = await validator.validate(null, emptyAnalysis);
      expect(result1.isValid).toBe(false);
      expect(result1.errors.some(e => e.code.includes('empty'))).toBe(true);

      // @ts-ignore - Testing runtime behavior
      const result2 = await validator.validate(undefined, emptyAnalysis);
      expect(result2.isValid).toBe(false);
      expect(result2.errors.some(e => e.code.includes('empty'))).toBe(true);
    });

    it('should handle invalid domains gracefully', async () => {
      const analysis = createMockAnalysisResult();
      
      // @ts-ignore - Testing invalid domain
      const result = await validator.validate('test prompt', analysis);

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      // Should fall back to general validation
    });

    it('should handle special characters and symbols', async () => {
      const specialPrompt = 'Create a function: λ(x) => x² + √x - ∑(1/n)';
      const analysis = createMockAnalysisResult({ technicalTerms: ['function'], complexity: 0.7 });

      const result = await validator.validate(specialPrompt, analysis);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.qualityMetrics.clarity).toBeGreaterThan(0.5);
    });

    it('should handle mixed case and formatting', async () => {
      const mixedPrompt = 'CrEaTe A DaTaBaSe TaBLe FoR UsErS';
      const analysis = createMockAnalysisResult({ domainHints: ['sql'], technicalTerms: ['database', 'table', 'users'] });

      const result = await validator.validate(mixedPrompt, analysis);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code.includes('formatting'))).toBe(true);
      expect(result.suggestions.some(s => s.message.includes('formatting'))).toBe(true);
    });
  });
});