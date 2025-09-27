/**
 * Unit Tests for PromptOptimizer
 * Tests the optimization and enhancement functionality
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PromptOptimizer } from '../../../src/core/optimizer';
import { OptimizationResult, PromptDomain } from '../../../src/types/prompt';
import { createMockAnalysisResult } from '../../utils/test-helpers';

describe('PromptOptimizer', () => {
  let optimizer: PromptOptimizer;

  beforeEach(() => {
    optimizer = new PromptOptimizer();
  });

  describe('optimize', () => {
    it('should optimize a simple prompt', async () => {
      const rawPrompt = 'make user table';
      const analysis = createMockAnalysisResult();

      const result = await optimizer.optimize(rawPrompt, analysis, 'sql');

      expect(result).toBeDefined();
      expect(result.optimized).toBeDefined();
      expect(result.optimized.length).toBeGreaterThan(rawPrompt.length);
      expect(result.enhancements).toBeInstanceOf(Array);
      expect(result.enhancements.length).toBeGreaterThan(0);
    });

    it('should apply SQL domain rules', async () => {
      const rawPrompt = 'create table for users';
      const analysis = createMockAnalysisResult({
        domainHints: ['sql', 'database'],
        technicalTerms: ['table', 'users']
      });

      const result = await optimizer.optimize(rawPrompt, analysis, 'sql');

      expect(result.optimized.toLowerCase()).toContain('create table');
      expect(result.enhancements.some(e => e.type === 'technical')).toBe(true);
      expect(result.systemPrompt).toContain('SQL');
    });

    it('should apply branding domain rules', async () => {
      const rawPrompt = 'write marketing copy for product';
      const analysis = createMockAnalysisResult({
        domainHints: ['marketing', 'branding'],
        intent: { category: 'content_creation', confidence: 0.8, subcategories: ['marketing'] }
      });

      const result = await optimizer.optimize(rawPrompt, analysis, 'branding');

      expect(result.systemPrompt).toContain('brand');
      expect(result.enhancements.some(e => e.type === 'tone')).toBe(true);
    });

    it('should apply cinema domain rules', async () => {
      const rawPrompt = 'write scene for movie';
      const analysis = createMockAnalysisResult({
        domainHints: ['cinema', 'screenplay'],
        intent: { category: 'creative_writing', confidence: 0.85, subcategories: ['screenplay'] }
      });

      const result = await optimizer.optimize(rawPrompt, analysis, 'cine');

      expect(result.systemPrompt.toLowerCase()).toContain('screenplay');
      expect(result.optimized).toContain('scene');
      expect(result.enhancements.some(e => e.type === 'structure')).toBe(true);
    });

    it('should apply SaaS domain rules', async () => {
      const rawPrompt = 'create user story for feature';
      const analysis = createMockAnalysisResult({
        domainHints: ['saas', 'product'],
        technicalTerms: ['user', 'feature']
      });

      const result = await optimizer.optimize(rawPrompt, analysis, 'saas');

      expect(result.systemPrompt.toLowerCase()).toContain('product');
      expect(result.optimized.toLowerCase()).toContain('user story');
      expect(result.enhancements.some(e => e.type === 'structure')).toBe(true);
    });

    it('should apply DevOps domain rules', async () => {
      const rawPrompt = 'create deployment pipeline';
      const analysis = createMockAnalysisResult({
        domainHints: ['devops', 'deployment'],
        technicalTerms: ['deployment', 'pipeline']
      });

      const result = await optimizer.optimize(rawPrompt, analysis, 'devops');

      expect(result.systemPrompt.toLowerCase()).toContain('devops');
      expect(result.optimized.toLowerCase()).toContain('pipeline');
      expect(result.enhancements.some(e => e.type === 'technical')).toBe(true);
    });

    it('should handle general domain with smart detection', async () => {
      const rawPrompt = 'help me with database design';
      const analysis = createMockAnalysisResult({
        domainHints: ['database', 'sql'],
        technicalTerms: ['database']
      });

      const result = await optimizer.optimize(rawPrompt, analysis, 'general');

      // Should detect SQL domain hints and apply appropriate optimizations
      expect(result.optimized).toContain('database');
      expect(result.enhancements.length).toBeGreaterThan(0);
    });

    it('should add clarity enhancements for ambiguous prompts', async () => {
      const rawPrompt = 'do the thing with the stuff';
      const analysis = createMockAnalysisResult({
        ambiguityScore: 0.9,
        complexity: 0.1
      });

      const result = await optimizer.optimize(rawPrompt, analysis, 'general');

      expect(result.enhancements.some(e => e.type === 'clarity')).toBe(true);
      expect(result.enhancements.some(e => e.type === 'specificity')).toBe(true);
    });

    it('should add structure enhancements for unstructured prompts', async () => {
      const rawPrompt = 'create api endpoints users products orders authentication logging monitoring';
      const analysis = createMockAnalysisResult({
        complexity: 0.7,
        readabilityScore: 0.3
      });

      const result = await optimizer.optimize(rawPrompt, analysis, 'general');

      expect(result.enhancements.some(e => e.type === 'structure')).toBe(true);
      expect(result.optimized).toContain('\n'); // Should add line breaks for structure
    });

    it('should preserve variables in template prompts', async () => {
      const rawPrompt = 'Create function for {{action}} that takes {{input}} and returns {{output}}';
      const analysis = createMockAnalysisResult({
        hasVariables: true
      });

      const result = await optimizer.optimize(rawPrompt, analysis, 'general');

      expect(result.optimized).toContain('{{action}}');
      expect(result.optimized).toContain('{{input}}');
      expect(result.optimized).toContain('{{output}}');
      expect(result.templateVariables).toBeInstanceOf(Array);
      expect(result.templateVariables).toContain('action');
    });

    it('should generate appropriate system prompts', async () => {
      const domains = ['sql', 'branding', 'cine', 'saas', 'devops', 'general'];

      for (const domain of domains) {
        const result = await optimizer.optimize('test prompt', createMockAnalysisResult(), domain);

        expect(result.systemPrompt).toBeDefined();
        expect(result.systemPrompt.length).toBeGreaterThan(50);
        expect(result.systemPrompt).toContain('You are');
      }
    });

    it('should handle empty prompts', async () => {
      const result = await optimizer.optimize('', createMockAnalysisResult(), 'general');

      expect(result).toBeDefined();
      expect(result.optimized).toBe('');
      expect(result.enhancements).toEqual([]);
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'Create a system that '.repeat(100);
      const analysis = createMockAnalysisResult({
        complexity: 0.95,
        tokens: Array(500).fill({ text: 'word', pos: 'NOUN', lemma: 'word', isStopWord: false, sentiment: 0 })
      });

      const result = await optimizer.optimize(longPrompt, analysis, 'general');

      expect(result).toBeDefined();
      expect(result.enhancements.some(e => e.type === 'structure')).toBe(true);
      expect(result.optimized.length).toBeGreaterThan(0);
    });

    it('should add context suggestions when needed', async () => {
      const vague = 'improve performance';
      const analysis = createMockAnalysisResult({
        ambiguityScore: 0.8,
        technicalTerms: ['performance']
      });

      const result = await optimizer.optimize(vague, analysis, 'general');

      expect(result.contextSuggestions).toBeInstanceOf(Array);
      expect(result.contextSuggestions?.length).toBeGreaterThan(0);
      expect(result.contextSuggestions?.[0]).toContain('specific');
    });

    it('should detect and enhance code-related prompts', async () => {
      const codePrompt = 'write function to calculate fibonacci';
      const analysis = createMockAnalysisResult({
        technicalTerms: ['function', 'fibonacci'],
        intent: { category: 'code_generation', confidence: 0.9, subcategories: ['algorithm'] }
      });

      const result = await optimizer.optimize(codePrompt, analysis, 'general');

      expect(result.optimized.toLowerCase()).toContain('function');
      expect(result.enhancements.some(e => e.type === 'technical' || e.type === 'specificity')).toBe(true);
    });

    it('should handle multi-language prompts', async () => {
      const mixedPrompt = 'Create une tabla pour users avec authentication';
      const analysis = createMockAnalysisResult({
        language: 'mixed',
        domainHints: ['sql', 'database']
      });

      const result = await optimizer.optimize(mixedPrompt, analysis, 'sql');

      expect(result).toBeDefined();
      expect(result.optimized).toContain('table');
      expect(result.optimized).toContain('users');
      expect(result.optimized).toContain('authentication');
    });

    it('should prioritize enhancements based on analysis scores', async () => {
      const prompt = 'make thing';
      const analysisLowClarity = createMockAnalysisResult({
        ambiguityScore: 0.9,
        readabilityScore: 0.8,
        complexity: 0.1
      });

      const result = await optimizer.optimize(prompt, analysisLowClarity, 'general');

      // Should prioritize clarity improvements when ambiguity is high
      const clarityEnhancements = result.enhancements.filter(e => e.type === 'clarity');
      const otherEnhancements = result.enhancements.filter(e => e.type !== 'clarity');

      expect(clarityEnhancements.length).toBeGreaterThan(0);
      if (otherEnhancements.length > 0 && clarityEnhancements.length > 0) {
        // Both should have impact property defined
        expect(clarityEnhancements[0].impact).toBeDefined();
        expect(otherEnhancements[0].impact).toBeDefined();
      }
    });
  });

  describe('performance', () => {
    it('should optimize prompts efficiently', async () => {
      const prompt = 'Create a comprehensive API with authentication and database';
      const analysis = createMockAnalysisResult();

      const startTime = Date.now();
      await optimizer.optimize(prompt, analysis, 'general');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    it('should handle batch optimizations efficiently', async () => {
      const prompts = Array(10).fill('Create a database table');
      const analysis = createMockAnalysisResult();

      const startTime = Date.now();
      await Promise.all(prompts.map(p => optimizer.optimize(p, analysis, 'sql')));
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // Should handle 10 prompts within 2 seconds
    });
  });

  describe('edge cases', () => {
    it('should handle null or undefined gracefully', async () => {
      const analysis = createMockAnalysisResult();

      // @ts-ignore - Testing runtime behavior
      const result1 = await optimizer.optimize(null, analysis, 'general');
      expect(result1.optimized).toBe('');

      // @ts-ignore - Testing runtime behavior
      const result2 = await optimizer.optimize(undefined, analysis, 'general');
      expect(result2.optimized).toBe('');
    });

    it('should handle invalid domain gracefully', async () => {
      const prompt = 'test prompt';
      const analysis = createMockAnalysisResult();

      // @ts-ignore - Testing runtime behavior with invalid domain
      const result = await optimizer.optimize(prompt, analysis, 'invalid-domain' as any);

      expect(result).toBeDefined();
      expect(result.optimized).toBeDefined();
      // Should fall back to general domain
      expect(result.systemPrompt).toContain('You are');
    });
  });
});