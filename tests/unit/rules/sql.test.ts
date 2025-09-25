/**
 * Unit Tests for SQL Domain Rules
 * Tests SQL-specific optimization and validation rules
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SQLRules } from '../../../src/rules/sql.js';
import { DomainRule, DomainEnhancement } from '../../../src/types/domain.js';

describe('SQLRules', () => {
  let sqlRules: SQLRules;

  beforeEach(() => {
    sqlRules = new SQLRules();
  });

  describe('getRules', () => {
    it('should return SQL-specific rules', () => {
      const rules = sqlRules.getRules();

      expect(rules).toBeInstanceOf(Array);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every(r => r.domain === 'sql')).toBe(true);
    });

    it('should have rules for common SQL operations', () => {
      const rules = sqlRules.getRules();

      const hasTableRules = rules.some(r => r.pattern.test('create table'));
      const hasSelectRules = rules.some(r => r.pattern.test('select from'));
      const hasIndexRules = rules.some(r => r.pattern.test('create index'));

      expect(hasTableRules).toBe(true);
      expect(hasSelectRules).toBe(true);
      expect(hasIndexRules).toBe(true);
    });

    it('should have appropriate priorities', () => {
      const rules = sqlRules.getRules();

      rules.forEach(rule => {
        expect(rule.priority).toBeGreaterThanOrEqual(1);
        expect(rule.priority).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('getSystemPrompt', () => {
    it('should return SQL-specific system prompt', () => {
      const prompt = sqlRules.getSystemPrompt();

      expect(prompt).toBeDefined();
      expect(prompt.toLowerCase()).toContain('sql');
      expect(prompt.toLowerCase()).toContain('database');
      expect(prompt).toContain('You are');
    });

    it('should mention key SQL concepts', () => {
      const prompt = sqlRules.getSystemPrompt();

      const concepts = ['schema', 'query', 'optimization', 'index', 'performance'];
      const mentionedConcepts = concepts.filter(c => prompt.toLowerCase().includes(c));

      expect(mentionedConcepts.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('enhance', () => {
    it('should enhance basic table creation prompt', () => {
      const prompt = 'create table users';
      const enhancements = sqlRules.enhance(prompt);

      expect(enhancements).toBeInstanceOf(Array);
      expect(enhancements.length).toBeGreaterThan(0);
      expect(enhancements.some(e => e.type === 'structure')).toBe(true);
    });

    it('should suggest column specifications', () => {
      const prompt = 'create table products';
      const enhancements = sqlRules.enhance(prompt);

      const columnEnhancement = enhancements.find(e =>
        e.enhancement.toLowerCase().includes('column') ||
        e.enhancement.toLowerCase().includes('field')
      );

      expect(columnEnhancement).toBeDefined();
    });

    it('should suggest indexes for performance', () => {
      const prompt = 'create table with millions of records';
      const enhancements = sqlRules.enhance(prompt);

      const indexEnhancement = enhancements.find(e =>
        e.enhancement.toLowerCase().includes('index')
      );

      expect(indexEnhancement).toBeDefined();
    });

    it('should enhance SELECT queries', () => {
      const prompt = 'select all from users';
      const enhancements = sqlRules.enhance(prompt);

      expect(enhancements.some(e =>
        e.enhancement.includes('WHERE') ||
        e.enhancement.includes('specific columns')
      )).toBe(true);
    });

    it('should suggest JOIN optimizations', () => {
      const prompt = 'join users and orders tables';
      const enhancements = sqlRules.enhance(prompt);

      const joinEnhancement = enhancements.find(e =>
        e.enhancement.toLowerCase().includes('join') ||
        e.enhancement.toLowerCase().includes('foreign key')
      );

      expect(joinEnhancement).toBeDefined();
    });

    it('should handle schema design prompts', () => {
      const prompt = 'design database schema for e-commerce';
      const enhancements = sqlRules.enhance(prompt);

      expect(enhancements.length).toBeGreaterThan(2);
      expect(enhancements.some(e => e.type === 'schema')).toBe(true);
    });

    it('should suggest normalization', () => {
      const prompt = 'create database with user data and orders';
      const enhancements = sqlRules.enhance(prompt);

      const normalizationEnhancement = enhancements.find(e =>
        e.enhancement.toLowerCase().includes('normal') ||
        e.enhancement.toLowerCase().includes('relationship')
      );

      expect(normalizationEnhancement).toBeDefined();
    });

    it('should handle migration prompts', () => {
      const prompt = 'migrate database from MySQL to PostgreSQL';
      const enhancements = sqlRules.enhance(prompt);

      expect(enhancements.some(e => e.type === 'migration')).toBe(true);
    });

    it('should suggest transaction handling', () => {
      const prompt = 'update multiple tables atomically';
      const enhancements = sqlRules.enhance(prompt);

      const transactionEnhancement = enhancements.find(e =>
        e.enhancement.toLowerCase().includes('transaction')
      );

      expect(transactionEnhancement).toBeDefined();
    });

    it('should handle backup and recovery prompts', () => {
      const prompt = 'backup database daily';
      const enhancements = sqlRules.enhance(prompt);

      expect(enhancements.some(e =>
        e.enhancement.toLowerCase().includes('backup') ||
        e.enhancement.toLowerCase().includes('recovery')
      )).toBe(true);
    });

    it('should prioritize security enhancements', () => {
      const prompt = 'user authentication table';
      const enhancements = sqlRules.enhance(prompt);

      const securityEnhancement = enhancements.find(e =>
        e.enhancement.toLowerCase().includes('encrypt') ||
        e.enhancement.toLowerCase().includes('hash') ||
        e.enhancement.toLowerCase().includes('security')
      );

      expect(securityEnhancement).toBeDefined();
      if (securityEnhancement) {
        expect(securityEnhancement.impact).toBeGreaterThan(0.7);
      }
    });

    it('should suggest data types', () => {
      const prompt = 'create table for storing prices';
      const enhancements = sqlRules.enhance(prompt);

      const dataTypeEnhancement = enhancements.find(e =>
        e.enhancement.toLowerCase().includes('decimal') ||
        e.enhancement.toLowerCase().includes('numeric') ||
        e.enhancement.toLowerCase().includes('data type')
      );

      expect(dataTypeEnhancement).toBeDefined();
    });

    it('should handle performance tuning prompts', () => {
      const prompt = 'optimize slow query';
      const enhancements = sqlRules.enhance(prompt);

      expect(enhancements.some(e => e.type === 'performance')).toBe(true);
      expect(enhancements.some(e =>
        e.enhancement.includes('EXPLAIN') ||
        e.enhancement.includes('index') ||
        e.enhancement.includes('statistics')
      )).toBe(true);
    });

    it('should suggest constraints', () => {
      const prompt = 'create user registration table';
      const enhancements = sqlRules.enhance(prompt);

      const constraintEnhancement = enhancements.find(e =>
        e.enhancement.toLowerCase().includes('unique') ||
        e.enhancement.toLowerCase().includes('not null') ||
        e.enhancement.toLowerCase().includes('constraint')
      );

      expect(constraintEnhancement).toBeDefined();
    });

    it('should handle stored procedures', () => {
      const prompt = 'create stored procedure for reporting';
      const enhancements = sqlRules.enhance(prompt);

      expect(enhancements.some(e =>
        e.enhancement.toLowerCase().includes('procedure') ||
        e.enhancement.toLowerCase().includes('function')
      )).toBe(true);
    });

    it('should suggest proper naming conventions', () => {
      const prompt = 'create tbl_usr for application';
      const enhancements = sqlRules.enhance(prompt);

      const namingEnhancement = enhancements.find(e =>
        e.enhancement.toLowerCase().includes('naming') ||
        e.enhancement.toLowerCase().includes('convention')
      );

      expect(namingEnhancement).toBeDefined();
    });

    it('should handle NoSQL to SQL conversion', () => {
      const prompt = 'convert MongoDB collection to SQL table';
      const enhancements = sqlRules.enhance(prompt);

      expect(enhancements.some(e =>
        e.enhancement.toLowerCase().includes('schema') ||
        e.enhancement.toLowerCase().includes('structure')
      )).toBe(true);
    });

    it('should return empty array for non-SQL prompts', () => {
      const prompt = 'write a marketing email';
      const enhancements = sqlRules.enhance(prompt);

      expect(enhancements).toBeInstanceOf(Array);
      expect(enhancements.length).toBe(0);
    });
  });

  describe('validate', () => {
    it('should validate proper SQL syntax', () => {
      const validSQL = 'SELECT * FROM users WHERE active = true';
      const result = sqlRules.validate(validSQL);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should warn about SELECT *', () => {
      const prompt = 'SELECT * FROM large_table';
      const result = sqlRules.validate(prompt);

      expect(result.warnings.some(w => w.message.includes('SELECT *'))).toBe(true);
      expect(result.suggestions.some(s => s.includes('specific columns'))).toBe(true);
    });

    it('should detect missing WHERE clause in UPDATE/DELETE', () => {
      const dangerousUpdate = 'UPDATE users SET active = false';
      const result = sqlRules.validate(dangerousUpdate);

      expect(result.warnings.some(w => w.message.includes('WHERE'))).toBe(true);
      expect(result.suggestions.some(s => s.includes('WHERE clause'))).toBe(true);
    });

    it('should validate table creation statements', () => {
      const createTable = 'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100))';
      const result = sqlRules.validate(createTable);

      expect(result.isValid).toBe(true);
      expect(result.domainSpecificChecks?.sql?.syntaxValid).toBe(true);
    });

    it('should suggest improvements for vague prompts', () => {
      const vague = 'make database';
      const result = sqlRules.validate(vague);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('specific'))).toBe(true);
    });

    it('should validate JOIN syntax', () => {
      const join = 'SELECT * FROM users JOIN orders ON users.id = orders.user_id';
      const result = sqlRules.validate(join);

      expect(result.isValid).toBe(true);
      expect(result.domainSpecificChecks?.sql?.hasJoins).toBe(true);
    });

    it('should detect SQL injection risks', () => {
      const risky = 'SELECT * FROM users WHERE name = ' + "'admin' OR '1'='1'";
      const result = sqlRules.validate(risky);

      expect(result.warnings.some(w => w.type === 'security')).toBe(true);
      expect(result.suggestions.some(s => s.toLowerCase().includes('parameter'))).toBe(true);
    });

    it('should validate index creation', () => {
      const index = 'CREATE INDEX idx_users_email ON users(email)';
      const result = sqlRules.validate(index);

      expect(result.isValid).toBe(true);
      expect(result.domainSpecificChecks?.sql?.hasIndexes).toBe(true);
    });

    it('should suggest database type when not specified', () => {
      const generic = 'create database schema';
      const result = sqlRules.validate(generic);

      expect(result.suggestions.some(s =>
        s.includes('PostgreSQL') ||
        s.includes('MySQL') ||
        s.includes('database type')
      )).toBe(true);
    });
  });

  describe('getExamples', () => {
    it('should provide relevant SQL examples', () => {
      const examples = sqlRules.getExamples('create table');

      expect(examples).toBeInstanceOf(Array);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples.every(e => e.includes('CREATE TABLE'))).toBe(true);
    });

    it('should provide query examples', () => {
      const examples = sqlRules.getExamples('select query');

      expect(examples.some(e => e.includes('SELECT'))).toBe(true);
      expect(examples.some(e => e.includes('WHERE'))).toBe(true);
    });

    it('should provide join examples', () => {
      const examples = sqlRules.getExamples('join tables');

      expect(examples.some(e => e.includes('JOIN'))).toBe(true);
      expect(examples.some(e => e.includes('INNER') || e.includes('LEFT'))).toBe(true);
    });

    it('should return empty array for non-SQL prompts', () => {
      const examples = sqlRules.getExamples('write a poem');

      expect(examples).toEqual([]);
    });
  });
});