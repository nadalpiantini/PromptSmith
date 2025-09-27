/**
 * Unit Tests for PromptAnalyzer
 * Tests the core analysis functionality for prompt processing
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PromptAnalyzer } from '../../../src/core/analyzer';
import { AnalysisResult } from '../../../src/types/prompt';

describe('PromptAnalyzer', () => {
  let analyzer: PromptAnalyzer;

  beforeEach(() => {
    analyzer = new PromptAnalyzer();
  });

  describe('analyze', () => {
    it('should analyze a simple prompt successfully', async () => {
      const prompt = 'Create a user authentication system';
      const result = await analyzer.analyze(prompt);

      expect(result).toBeDefined();
      expect(result.tokens).toBeInstanceOf(Array);
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.complexity).toBeGreaterThanOrEqual(0);
      expect(result.complexity).toBeLessThanOrEqual(1);
      expect(result.ambiguityScore).toBeGreaterThanOrEqual(0);
      expect(result.ambiguityScore).toBeLessThanOrEqual(1);
      expect(result.language).toBe('en');
      expect(result.hasVariables).toBe(false);
    });

    it('should extract entities from technical prompts', async () => {
      const prompt = 'Create a PostgreSQL database with user table and authentication';
      const result = await analyzer.analyze(prompt);

      expect(result.entities).toBeInstanceOf(Array);
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.entities.some(e => e.text.toLowerCase().includes('postgresql'))).toBe(true);
    });

    it('should detect intent correctly for SQL prompts', async () => {
      const prompt = 'Generate a SQL query to select all users from the database';
      const result = await analyzer.analyze(prompt);

      expect(result.intent).toBeDefined();
      expect(result.intent.category).toBeTruthy();
      expect(result.intent.confidence).toBeGreaterThan(0);
      expect(result.intent.confidence).toBeLessThanOrEqual(1);
    });

    it('should detect variables in template prompts', async () => {
      const prompt = 'Create a function that takes {{userName}} and returns {{greeting}}';
      const result = await analyzer.analyze(prompt);

      expect(result.hasVariables).toBe(true);
    });

    it('should calculate complexity for nested prompts', async () => {
      const simplePrompt = 'Create a table';
      const complexPrompt = 'Create a comprehensive e-commerce platform with user authentication, payment processing, inventory management, and real-time analytics dashboard';

      const simpleResult = await analyzer.analyze(simplePrompt);
      const complexResult = await analyzer.analyze(complexPrompt);

      expect(complexResult.complexity).toBeGreaterThan(simpleResult.complexity);
    });

    it('should extract technical terms', async () => {
      const prompt = 'Implement OAuth2 authentication with JWT tokens and refresh mechanism';
      const result = await analyzer.analyze(prompt);

      expect(result.technicalTerms).toBeInstanceOf(Array);
      expect(result.technicalTerms).toContain('OAuth2');
      expect(result.technicalTerms).toContain('JWT');
    });

    it('should detect domain hints', async () => {
      const sqlPrompt = 'Create a database schema with foreign keys and indexes';
      const result = await analyzer.analyze(sqlPrompt);

      expect(result.domainHints).toBeInstanceOf(Array);
      expect(result.domainHints.some(hint => hint.toLowerCase().includes('sql') || hint.toLowerCase().includes('database'))).toBe(true);
    });

    it('should handle empty prompts gracefully', async () => {
      const result = await analyzer.analyze('');

      expect(result).toBeDefined();
      expect(result.tokens).toEqual([]);
      expect(result.complexity).toBe(0);
      expect(result.ambiguityScore).toBe(1);
    });

    it('should handle non-English prompts', async () => {
      const prompt = 'Crear una tabla de usuarios con autenticación';
      const result = await analyzer.analyze(prompt);

      expect(result).toBeDefined();
      expect(result.language).toBeDefined();
      // Language detection might vary, but should handle gracefully
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    it('should calculate readability score', async () => {
      const clearPrompt = 'Create a user table with id and name';
      const unclearPrompt = 'Make thing do stuff with data and things for users maybe';

      const clearResult = await analyzer.analyze(clearPrompt);
      const unclearResult = await analyzer.analyze(unclearPrompt);

      expect(clearResult.readabilityScore).toBeGreaterThan(unclearResult.readabilityScore);
    });

    it('should analyze sentiment', async () => {
      const positivePrompt = 'Create an amazing, excellent user experience';
      const neutralPrompt = 'Create a database table';
      const negativePrompt = 'Fix the terrible, broken authentication system';

      const positiveResult = await analyzer.analyze(positivePrompt);
      const neutralResult = await analyzer.analyze(neutralPrompt);
      const negativeResult = await analyzer.analyze(negativePrompt);

      expect(positiveResult.sentimentScore).toBeGreaterThan(neutralResult.sentimentScore);
      expect(negativeResult.sentimentScore).toBeLessThan(neutralResult.sentimentScore);
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'Create a comprehensive system that ' +
        'handles user authentication, authorization, session management, ' +
        'password reset flows, two-factor authentication, OAuth integration, ' +
        'user profile management, role-based access control, audit logging, ' +
        'compliance with GDPR and CCPA, encrypted data storage, secure API endpoints, ' +
        'rate limiting, CSRF protection, XSS prevention, SQL injection prevention, ' +
        'and includes comprehensive unit tests, integration tests, and documentation. ' +
        'The system should be scalable, maintainable, and follow SOLID principles.';

      const result = await analyzer.analyze(longPrompt);

      expect(result).toBeDefined();
      expect(result.complexity).toBeGreaterThan(0.7);
      expect(result.tokens.length).toBeGreaterThan(50);
      expect(result.technicalTerms.length).toBeGreaterThan(5);
    });

    it('should detect code snippets in prompts', async () => {
      const promptWithCode = 'Create a function like this: function getData() { return fetch("/api/data"); }';
      const result = await analyzer.analyze(promptWithCode);

      expect(result).toBeDefined();
      expect(result.technicalTerms).toContain('function');
      expect(result.complexity).toBeGreaterThan(0.3);
    });
  });

  describe('performance', () => {
    it('should analyze prompts within acceptable time', async () => {
      const prompt = 'Create a REST API with CRUD operations for user management';
      const startTime = Date.now();

      await analyzer.analyze(prompt);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should cache repeated analysis (if implemented)', async () => {
      const prompt = 'Create a user authentication system';

      const startTime1 = Date.now();
      await analyzer.analyze(prompt);
      const duration1 = Date.now() - startTime1;

      const startTime2 = Date.now();
      await analyzer.analyze(prompt);
      const duration2 = Date.now() - startTime2;

      // Second analysis should be faster or equal (due to potential caching)
      expect(duration2).toBeLessThanOrEqual(duration1 + 10); // 10ms tolerance
    });
  });

  describe('edge cases', () => {
    it('should handle special characters', async () => {
      const prompt = 'Create a table with fields: $price, @username, #tag, %discount';
      const result = await analyzer.analyze(prompt);

      expect(result).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.hasVariables).toBe(true);
    });

    it('should handle unicode and emojis', async () => {
      const prompt = 'Create a fun 🎉 user interface with 你好 multilingual support';
      const result = await analyzer.analyze(prompt);

      expect(result).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    it('should handle malformed input', async () => {
      const malformedPrompts = [
        '   \n\t  ',  // Whitespace only
        '!!!###$$$',  // Special chars only
        'a'.repeat(10000),  // Very long single word
        '\0\0\0',  // Null characters
      ];

      for (const prompt of malformedPrompts) {
        const result = await analyzer.analyze(prompt);
        expect(result).toBeDefined();
        expect(result.complexity).toBeGreaterThanOrEqual(0);
        expect(result.complexity).toBeLessThanOrEqual(1);
      }
    });
  });
});