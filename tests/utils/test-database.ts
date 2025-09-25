/**
 * Test Database Utilities
 * Mock database implementations and utilities for testing
 */

import { jest } from '@jest/globals';

export interface TestDatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

export class TestDatabase {
  private data: Map<string, any>;
  private sequences: Map<string, number>;
  private tables: Set<string>;

  constructor() {
    this.data = new Map();
    this.sequences = new Map();
    this.tables = new Set();
    this.initializeTables();
  }

  private initializeTables() {
    const tableSchemas = [
      'prompts',
      'prompt_metadata',
      'users',
      'sessions',
      'analytics_events',
      'quality_scores',
      'usage_stats',
    ];

    tableSchemas.forEach(table => {
      this.tables.add(table);
      this.sequences.set(`${table}_id_seq`, 1);
    });
  }

  // Mock Supabase-like operations
  from(table: string) {
    if (!this.tables.has(table)) {
      throw new Error(`Table '${table}' does not exist`);
    }

    return new TestTableQuery(this, table);
  }

  rpc(functionName: string, params?: any) {
    // Mock stored procedure calls
    switch (functionName) {
      case 'search_prompts':
        return this.mockSearchPrompts(params);
      case 'get_stats':
        return this.mockGetStats(params);
      case 'calculate_quality_score':
        return this.mockCalculateQualityScore(params);
      default:
        throw new Error(`Unknown RPC function: ${functionName}`);
    }
  }

  // Internal data access methods
  getAll(table: string): any[] {
    const tableData = this.data.get(table) || [];
    return [...tableData];
  }

  insert(table: string, record: any): any {
    if (!this.data.has(table)) {
      this.data.set(table, []);
    }

    const records = this.data.get(table)!;
    const id = this.getNextId(table);
    const newRecord = {
      id,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    records.push(newRecord);
    return newRecord;
  }

  update(table: string, id: any, updates: any): any {
    const records = this.data.get(table) || [];
    const index = records.findIndex((r: any) => r.id === id);

    if (index === -1) {
      throw new Error(`Record with id ${id} not found in table ${table}`);
    }

    const updatedRecord = {
      ...records[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    records[index] = updatedRecord;
    return updatedRecord;
  }

  delete(table: string, id: any): boolean {
    const records = this.data.get(table) || [];
    const index = records.findIndex((r: any) => r.id === id);

    if (index === -1) {
      return false;
    }

    records.splice(index, 1);
    return true;
  }

  findById(table: string, id: any): any | null {
    const records = this.data.get(table) || [];
    return records.find((r: any) => r.id === id) || null;
  }

  findWhere(table: string, criteria: any): any[] {
    const records = this.data.get(table) || [];
    return records.filter((record: any) => {
      return Object.keys(criteria).every(key => {
        const recordValue = record[key];
        const criteriaValue = criteria[key];

        if (criteriaValue === null) {
          return recordValue === null;
        }

        if (typeof criteriaValue === 'string') {
          return recordValue?.toString().toLowerCase().includes(criteriaValue.toLowerCase());
        }

        return recordValue === criteriaValue;
      });
    });
  }

  clear(table?: string) {
    if (table) {
      this.data.delete(table);
    } else {
      this.data.clear();
      this.sequences.clear();
      this.initializeTables();
    }
  }

  getSize(table?: string): number {
    if (table) {
      return this.data.get(table)?.length || 0;
    } else {
      return Array.from(this.data.values()).reduce((sum, records) => sum + records.length, 0);
    }
  }

  private getNextId(table: string): number {
    const seqKey = `${table}_id_seq`;
    const nextId = this.sequences.get(seqKey) || 1;
    this.sequences.set(seqKey, nextId + 1);
    return nextId;
  }

  // Mock RPC implementations
  private mockSearchPrompts(params: any) {
    const { query, domain, tags, min_score, limit = 20, offset = 0 } = params;
    const prompts = this.getAll('prompts');

    let results = prompts.filter((prompt: any) => {
      if (domain && prompt.domain !== domain) return false;
      if (min_score && prompt.quality_score < min_score) return false;
      if (tags && !tags.every((tag: string) => prompt.tags?.includes(tag))) return false;
      if (query) {
        const searchText = `${prompt.prompt} ${prompt.name} ${prompt.description}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      }
      return true;
    });

    // Simple relevance scoring
    if (query) {
      results = results.map((prompt: any) => ({
        ...prompt,
        relevance: this.calculateRelevance(prompt, query),
      })).sort((a: any, b: any) => b.relevance - a.relevance);
    }

    return {
      data: results.slice(offset, offset + limit),
      error: null,
    };
  }

  private mockGetStats(params: any) {
    const { days = 7 } = params;
    const prompts = this.getAll('prompts');
    const events = this.getAll('analytics_events');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentPrompts = prompts.filter((p: any) =>
      new Date(p.created_at) >= cutoffDate
    );

    const recentEvents = events.filter((e: any) =>
      new Date(e.created_at) >= cutoffDate
    );

    return {
      data: {
        total_prompts: prompts.length,
        recent_prompts: recentPrompts.length,
        total_events: recentEvents.length,
        avg_quality_score: prompts.reduce((sum: number, p: any) => sum + (p.quality_score || 0), 0) / prompts.length || 0,
        domains: [...new Set(prompts.map((p: any) => p.domain))],
        period_days: days,
      },
      error: null,
    };
  }

  private mockCalculateQualityScore(params: any) {
    const { prompt } = params;

    // Simple quality scoring algorithm for testing
    const length = prompt.length;
    const wordCount = prompt.split(' ').length;
    const hasQuestionMark = prompt.includes('?');
    const hasSpecificTerms = /\b(create|implement|design|build|develop)\b/i.test(prompt);

    let score = 0.5; // Base score

    // Length scoring
    if (length > 50 && length < 500) score += 0.2;
    else if (length >= 500) score += 0.1;

    // Word count scoring
    if (wordCount >= 10 && wordCount <= 100) score += 0.15;

    // Specificity scoring
    if (hasSpecificTerms) score += 0.1;
    if (hasQuestionMark) score -= 0.05; // Questions are often less specific

    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score));

    return {
      data: {
        score,
        breakdown: {
          clarity: score * 0.9 + 0.1,
          specificity: score * 1.1,
          structure: score,
          completeness: score * 0.8 + 0.2,
        }
      },
      error: null,
    };
  }

  private calculateRelevance(prompt: any, query: string): number {
    const queryLower = query.toLowerCase();
    const promptText = `${prompt.prompt} ${prompt.name} ${prompt.description}`.toLowerCase();

    let relevance = 0;

    // Exact match in title gets highest score
    if (prompt.name?.toLowerCase().includes(queryLower)) {
      relevance += 0.4;
    }

    // Match in description
    if (prompt.description?.toLowerCase().includes(queryLower)) {
      relevance += 0.3;
    }

    // Match in prompt content
    if (prompt.prompt?.toLowerCase().includes(queryLower)) {
      relevance += 0.2;
    }

    // Word-level matching
    const queryWords = queryLower.split(' ');
    const matchingWords = queryWords.filter(word => promptText.includes(word));
    relevance += (matchingWords.length / queryWords.length) * 0.1;

    return Math.min(1, relevance);
  }
}

class TestTableQuery {
  constructor(private db: TestDatabase, private table: string) {}

  select(columns?: string) {
    return new TestSelectQuery(this.db, this.table, columns);
  }

  insert(data: any | any[]) {
    const records = Array.isArray(data) ? data : [data];
    const results = records.map(record => this.db.insert(this.table, record));

    return {
      select: () => ({
        single: async () => ({ data: results[0], error: null }),
        then: async (callback: Function) => callback({ data: results, error: null }),
      }),
      then: async (callback: Function) => callback({ data: results, error: null }),
    };
  }

  update(updates: any) {
    return new TestUpdateQuery(this.db, this.table, updates);
  }

  delete() {
    return new TestDeleteQuery(this.db, this.table);
  }
}

class TestSelectQuery {
  private filters: any[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;
  private offsetValue: number = 0;

  constructor(private db: TestDatabase, private table: string, private columns?: string) {}

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ type: 'gt', column, value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ type: 'lt', column, value });
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push({ type: 'like', column, value: pattern });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: 'in', column, value: values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  offset(count: number) {
    this.offsetValue = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single() {
    return this.executeQuery().then(results => ({
      data: results.length > 0 ? results[0] : null,
      error: null,
    }));
  }

  maybeSingle() {
    return this.single();
  }

  async then(callback: Function) {
    const results = await this.executeQuery();
    return callback({ data: results, error: null });
  }

  private async executeQuery(): Promise<any[]> {
    let records = this.db.getAll(this.table);

    // Apply filters
    for (const filter of this.filters) {
      records = records.filter(record => {
        const fieldValue = record[filter.column];

        switch (filter.type) {
          case 'eq':
            return fieldValue === filter.value;
          case 'neq':
            return fieldValue !== filter.value;
          case 'gt':
            return fieldValue > filter.value;
          case 'lt':
            return fieldValue < filter.value;
          case 'like':
            return fieldValue?.toString().includes(filter.value.replace('%', ''));
          case 'in':
            return filter.value.includes(fieldValue);
          default:
            return true;
        }
      });
    }

    // Apply ordering
    if (this.orderBy) {
      records.sort((a, b) => {
        const aVal = a[this.orderBy!.column];
        const bVal = b[this.orderBy!.column];

        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;

        return this.orderBy!.ascending ? comparison : -comparison;
      });
    }

    // Apply pagination
    if (this.offsetValue > 0) {
      records = records.slice(this.offsetValue);
    }

    if (this.limitValue !== null) {
      records = records.slice(0, this.limitValue);
    }

    return records;
  }
}

class TestUpdateQuery {
  private filters: any[] = [];

  constructor(private db: TestDatabase, private table: string, private updates: any) {}

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  select() {
    return {
      single: async () => {
        const records = this.db.getAll(this.table);
        const matchingRecords = records.filter(record => {
          return this.filters.every(filter => {
            return record[filter.column] === filter.value;
          });
        });

        if (matchingRecords.length > 0) {
          const updated = this.db.update(this.table, matchingRecords[0].id, this.updates);
          return { data: updated, error: null };
        }

        return { data: null, error: { message: 'No matching records found' } };
      },
    };
  }
}

class TestDeleteQuery {
  private filters: any[] = [];

  constructor(private db: TestDatabase, private table: string) {}

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  async then(callback: Function) {
    const records = this.db.getAll(this.table);
    const toDelete = records.filter(record => {
      return this.filters.every(filter => {
        return record[filter.column] === filter.value;
      });
    });

    toDelete.forEach(record => {
      this.db.delete(this.table, record.id);
    });

    return callback({ data: toDelete, error: null });
  }
}

// Utility functions for test setup
export function createTestDatabase(): TestDatabase {
  return new TestDatabase();
}

export function seedTestDatabase(db: TestDatabase) {
  // Seed with sample data for testing
  const samplePrompts = [
    {
      name: 'User Table Creation',
      prompt: 'Create a comprehensive user table with authentication fields',
      domain: 'sql',
      tags: ['database', 'user', 'table'],
      description: 'SQL template for creating user tables',
      quality_score: 0.85,
      is_public: true,
    },
    {
      name: 'API Design Guide',
      prompt: 'Design a RESTful API with proper error handling and documentation',
      domain: 'devops',
      tags: ['api', 'rest', 'documentation'],
      description: 'Guidelines for API design',
      quality_score: 0.92,
      is_public: true,
    },
    {
      name: 'Brand Identity Creation',
      prompt: 'Create a comprehensive brand identity including logo, colors, and typography',
      domain: 'branding',
      tags: ['brand', 'logo', 'design'],
      description: 'Brand identity development template',
      quality_score: 0.78,
      is_public: false,
    },
  ];

  samplePrompts.forEach(prompt => {
    db.insert('prompts', prompt);
  });

  return db;
}

export function mockDatabaseOperations() {
  const testDb = createTestDatabase();
  seedTestDatabase(testDb);

  return {
    // Supabase-like client mock
    supabase: {
      from: (table: string) => testDb.from(table),
      rpc: (fn: string, params: any) => testDb.rpc(fn, params),
    },

    // Raw database access for tests
    database: testDb,

    // Cleanup function
    cleanup: () => testDb.clear(),
  };
}