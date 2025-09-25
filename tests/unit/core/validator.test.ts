/**
 * Unit Tests for PromptValidator
 * Tests the validation and quality checking functionality
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PromptValidator } from '../../../src/core/validator.js';
import { ValidationResult, PromptDomain } from '../../../src/types/prompt.js';

describe('PromptValidator', () => {
  let validator: PromptValidator;

  beforeEach(() => {
    validator = new PromptValidator();
  });

  describe('validate', () => {
    it('should validate a well-structured prompt', async () => {
      const prompt = 'Create a PostgreSQL database schema with users, products, and orders tables. Include primary keys, foreign key relationships, and appropriate indexes.';

      const result = await validator.validate(prompt, 'sql');

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.qualityMetrics.clarity).toBeGreaterThan(0.7);
      expect(result.qualityMetrics.specificity).toBeGreaterThan(0.7);
      expect(result.qualityMetrics.structure).toBeGreaterThan(0.7);
    });

    it('should detect clarity issues', async () => {
      const vaguePrompt = 'do something with the stuff';

      const result = await validator.validate(vaguePrompt, 'general');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'clarity')).toBe(true);
      expect(result.qualityMetrics.clarity).toBeLessThan(0.3);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should detect specificity issues', async () => {
      const unspecificPrompt = 'Create a database';

      const result = await validator.validate(unspecificPrompt, 'sql');

      expect(result.warnings.some(w => w.type === 'specificity')).toBe(true);
      expect(result.qualityMetrics.specificity).toBeLessThan(0.5);
      expect(result.suggestions.some(s => s.type === 'enhancement')).toBe(true);
    });

    it('should detect structure issues in long prompts', async () => {
      const unstructuredPrompt = 'Create database users products orders authentication logging monitoring caching queuing messaging notifications emails templates styles scripts deployment testing documentation';

      const result = await validator.validate(unstructuredPrompt, 'general');

      expect(result.warnings.some(w => w.type === 'structure')).toBe(true);
      expect(result.qualityMetrics.structure).toBeLessThan(0.5);
      expect(result.suggestions.some(s => s.message.toLowerCase().includes('structure'))).toBe(true);
    });

    it('should validate SQL domain prompts', async () => {
      const sqlPrompt = 'SELECT * FROM users WHERE active = true';

      const result = await validator.validate(sqlPrompt, 'sql');

      expect(result.isValid).toBe(true);
      expect(result.qualityMetrics.consistency).toBeGreaterThan(0.8);
      expect(result.domainSpecificChecks).toBeDefined();
      expect(result.domainSpecificChecks?.sql).toBeDefined();
    });

    it('should validate branding domain prompts', async () => {
      const brandingPrompt = 'Create compelling marketing copy for our new eco-friendly product line targeting millennials';

      const result = await validator.validate(brandingPrompt, 'branding');

      expect(result.isValid).toBe(true);
      expect(result.domainSpecificChecks?.branding).toBeDefined();
      expect(result.qualityMetrics.actionability).toBeGreaterThan(0.6);
    });

    it('should validate cinema domain prompts', async () => {
      const cinemaPrompt = 'Write an opening scene for a thriller set in New York';

      const result = await validator.validate(cinemaPrompt, 'cine');

      expect(result.isValid).toBe(true);
      expect(result.domainSpecificChecks?.cinema).toBeDefined();
      expect(result.qualityMetrics.structure).toBeGreaterThan(0.5);
    });

    it('should validate SaaS domain prompts', async () => {
      const saasPrompt = 'As a user, I want to reset my password so that I can regain access to my account';

      const result = await validator.validate(saasPrompt, 'saas');

      expect(result.isValid).toBe(true);
      expect(result.domainSpecificChecks?.saas).toBeDefined();
      expect(result.qualityMetrics.completeness).toBeGreaterThan(0.7);
    });

    it('should validate DevOps domain prompts', async () => {
      const devopsPrompt = 'Create a CI/CD pipeline with Docker, Kubernetes, and GitHub Actions';

      const result = await validator.validate(devopsPrompt, 'devops');

      expect(result.isValid).toBe(true);
      expect(result.domainSpecificChecks?.devops).toBeDefined();
      expect(result.qualityMetrics.specificity).toBeGreaterThan(0.6);
    });

    it('should detect completeness issues', async () => {
      const incompletePrompt = 'Create a function that';

      const result = await validator.validate(incompletePrompt, 'general');

      expect(result.errors.some(e => e.type === 'completeness')).toBe(true);
      expect(result.qualityMetrics.completeness).toBeLessThan(0.3);
      expect(result.suggestions.some(s => s.message.includes('complete'))).toBe(true);
    });

    it('should provide actionable suggestions', async () => {
      const improvablePrompt = 'make api';

      const result = await validator.validate(improvablePrompt, 'general');

      expect(result.suggestions.length).toBeGreaterThan(0);
      result.suggestions.forEach(suggestion => {
        expect(suggestion.type).toBeDefined();
        expect(suggestion.message).toBeDefined();
        expect(suggestion.before).toBeDefined();
        expect(suggestion.after).toBeDefined();
        expect(suggestion.after.length).toBeGreaterThan(suggestion.before.length);
      });
    });

    it('should handle empty prompts', async () => {
      const result = await validator.validate('', 'general');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'empty')).toBe(true);
      expect(result.qualityMetrics.clarity).toBe(0);
      expect(result.qualityMetrics.completeness).toBe(0);
    });

    it('should handle whitespace-only prompts', async () => {
      const result = await validator.validate('   \n\t  ', 'general');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'empty')).toBe(true);
    });

    it('should validate prompts with variables', async () => {
      const templatePrompt = 'Create a {{type}} for {{purpose}} with {{features}}';

      const result = await validator.validate(templatePrompt, 'general');

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.type === 'template')).toBe(true);
      expect(result.suggestions.some(s => s.message.includes('variable'))).toBe(true);
    });

    it('should detect redundancy in prompts', async () => {
      const redundantPrompt = 'Create a new user account for a new user with new credentials';

      const result = await validator.validate(redundantPrompt, 'general');

      expect(result.warnings.some(w => w.type === 'redundancy')).toBe(true);
      expect(result.suggestions.some(s => s.message.toLowerCase().includes('redundant'))).toBe(true);
    });

    it('should validate consistency across metrics', async () => {
      const goodPrompt = 'Develop a RESTful API with the following endpoints:\n- GET /users - Retrieve all users\n- POST /users - Create a new user\n- PUT /users/:id - Update user by ID\n- DELETE /users/:id - Delete user by ID';

      const result = await validator.validate(goodPrompt, 'general');

      expect(result.isValid).toBe(true);
      expect(result.qualityMetrics.consistency).toBeGreaterThan(0.8);
      expect(result.qualityMetrics.structure).toBeGreaterThan(0.8);
      expect(result.qualityMetrics.clarity).toBeGreaterThan(0.8);
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'Create a comprehensive system that '.repeat(100) +
        'handles all aspects of user management, authentication, authorization, and auditing.';

      const result = await validator.validate(longPrompt, 'general');

      expect(result).toBeDefined();
      expect(result.warnings.some(w => w.type === 'length')).toBe(true);
      expect(result.suggestions.some(s => s.message.includes('break down'))).toBe(true);
    });

    it('should detect inappropriate content', async () => {
      const inappropriatePrompt = 'Create a system to hack into databases';

      const result = await validator.validate(inappropriatePrompt, 'general');

      expect(result.warnings.some(w => w.type === 'content')).toBe(true);
      expect(result.suggestions.some(s => s.message.includes('ethical'))).toBe(true);
    });

    it('should validate code snippets in prompts', async () => {
      const codePrompt = 'Fix this function: function add(a, b) { return a + b; }';

      const result = await validator.validate(codePrompt, 'general');

      expect(result.isValid).toBe(true);
      expect(result.qualityMetrics.specificity).toBeGreaterThan(0.7);
    });

    it('should calculate actionability score', async () => {
      const actionablePrompt = 'Create a Python function that calculates the factorial of a number using recursion';
      const nonActionablePrompt = 'Tell me about functions';

      const actionableResult = await validator.validate(actionablePrompt, 'general');
      const nonActionableResult = await validator.validate(nonActionablePrompt, 'general');

      expect(actionableResult.qualityMetrics.actionability).toBeGreaterThan(0.7);
      expect(nonActionableResult.qualityMetrics.actionability).toBeLessThan(0.4);
    });

    it('should handle prompts in different languages', async () => {
      const spanishPrompt = 'Crear una tabla de usuarios con autenticación';

      const result = await validator.validate(spanishPrompt, 'sql');

      expect(result).toBeDefined();
      expect(result.warnings.some(w => w.type === 'language')).toBe(true);
      expect(result.suggestions.some(s => s.message.includes('English'))).toBe(true);
    });

    it('should validate domain-specific terminology', async () => {
      const sqlWithWrongTerms = 'Make a SQL collection for users';  // 'collection' is MongoDB term

      const result = await validator.validate(sqlWithWrongTerms, 'sql');

      expect(result.warnings.some(w => w.type === 'terminology')).toBe(true);
      expect(result.suggestions.some(s => s.message.includes('table'))).toBe(true);
    });
  });

  describe('performance', () => {
    it('should validate prompts quickly', async () => {
      const prompt = 'Create a comprehensive REST API with authentication, authorization, and database integration';

      const startTime = Date.now();
      await validator.validate(prompt, 'general');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(300); // Should complete within 300ms
    });

    it('should handle concurrent validations', async () => {
      const prompts = Array(20).fill('Create a database table').map((p, i) => `${p} ${i}`);

      const startTime = Date.now();
      await Promise.all(prompts.map(p => validator.validate(p, 'sql')));
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should handle 20 concurrent validations within 1 second
    });
  });

  describe('edge cases', () => {
    it('should handle null or undefined gracefully', async () => {
      // @ts-ignore - Testing runtime behavior
      const result1 = await validator.validate(null, 'general');
      expect(result1.isValid).toBe(false);
      expect(result1.errors.some(e => e.type === 'empty')).toBe(true);

      // @ts-ignore - Testing runtime behavior
      const result2 = await validator.validate(undefined, 'general');
      expect(result2.isValid).toBe(false);
      expect(result2.errors.some(e => e.type === 'empty')).toBe(true);
    });

    it('should handle invalid domains gracefully', async () => {
      // @ts-ignore - Testing invalid domain
      const result = await validator.validate('test prompt', 'invalid-domain');

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      // Should fall back to general validation
    });

    it('should handle special characters and symbols', async () => {
      const specialPrompt = 'Create a function: λ(x) => x² + √x - ∑(1/n)';

      const result = await validator.validate(specialPrompt, 'general');

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.qualityMetrics.clarity).toBeGreaterThan(0.5);
    });

    it('should handle mixed case and formatting', async () => {
      const mixedPrompt = 'CrEaTe A DaTaBaSe TaBLe FoR UsErS';

      const result = await validator.validate(mixedPrompt, 'sql');

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.type === 'formatting')).toBe(true);
      expect(result.suggestions.some(s => s.message.includes('formatting'))).toBe(true);
    });
  });
});