/**
 * Test Database Utilities
 * Mock database implementations and utilities for testing
 */
export class TestDatabase {
    data;
    sequences;
    tables;
    constructor() {
        this.data = new Map();
        this.sequences = new Map();
        this.tables = new Set();
        this.initializeTables();
    }
    initializeTables() {
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
    from(table) {
        if (!this.tables.has(table)) {
            throw new Error(`Table '${table}' does not exist`);
        }
        return new TestTableQuery(this, table);
    }
    rpc(functionName, params) {
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
    getAll(table) {
        const tableData = this.data.get(table) || [];
        return [...tableData];
    }
    insert(table, record) {
        if (!this.data.has(table)) {
            this.data.set(table, []);
        }
        const records = this.data.get(table);
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
    update(table, id, updates) {
        const records = this.data.get(table) || [];
        const index = records.findIndex((r) => r.id === id);
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
    delete(table, id) {
        const records = this.data.get(table) || [];
        const index = records.findIndex((r) => r.id === id);
        if (index === -1) {
            return false;
        }
        records.splice(index, 1);
        return true;
    }
    findById(table, id) {
        const records = this.data.get(table) || [];
        return records.find((r) => r.id === id) || null;
    }
    findWhere(table, criteria) {
        const records = this.data.get(table) || [];
        return records.filter((record) => {
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
    clear(table) {
        if (table) {
            this.data.delete(table);
        }
        else {
            this.data.clear();
            this.sequences.clear();
            this.initializeTables();
        }
    }
    getSize(table) {
        if (table) {
            return this.data.get(table)?.length || 0;
        }
        else {
            return Array.from(this.data.values()).reduce((sum, records) => sum + records.length, 0);
        }
    }
    getNextId(table) {
        const seqKey = `${table}_id_seq`;
        const nextId = this.sequences.get(seqKey) || 1;
        this.sequences.set(seqKey, nextId + 1);
        return nextId;
    }
    // Mock RPC implementations
    mockSearchPrompts(params) {
        const { query, domain, tags, min_score, limit = 20, offset = 0 } = params;
        const prompts = this.getAll('prompts');
        let results = prompts.filter((prompt) => {
            if (domain && prompt.domain !== domain)
                return false;
            if (min_score && prompt.quality_score < min_score)
                return false;
            if (tags && !tags.every((tag) => prompt.tags?.includes(tag)))
                return false;
            if (query) {
                const searchText = `${prompt.prompt} ${prompt.name} ${prompt.description}`.toLowerCase();
                return searchText.includes(query.toLowerCase());
            }
            return true;
        });
        // Simple relevance scoring
        if (query) {
            results = results.map((prompt) => ({
                ...prompt,
                relevance: this.calculateRelevance(prompt, query),
            })).sort((a, b) => b.relevance - a.relevance);
        }
        return {
            data: results.slice(offset, offset + limit),
            error: null,
        };
    }
    mockGetStats(params) {
        const { days = 7 } = params;
        const prompts = this.getAll('prompts');
        const events = this.getAll('analytics_events');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const recentPrompts = prompts.filter((p) => new Date(p.created_at) >= cutoffDate);
        const recentEvents = events.filter((e) => new Date(e.created_at) >= cutoffDate);
        return {
            data: {
                total_prompts: prompts.length,
                recent_prompts: recentPrompts.length,
                total_events: recentEvents.length,
                avg_quality_score: prompts.reduce((sum, p) => sum + (p.quality_score || 0), 0) / prompts.length || 0,
                domains: [...new Set(prompts.map((p) => p.domain))],
                period_days: days,
            },
            error: null,
        };
    }
    mockCalculateQualityScore(params) {
        const { prompt } = params;
        // Simple quality scoring algorithm for testing
        const length = prompt.length;
        const wordCount = prompt.split(' ').length;
        const hasQuestionMark = prompt.includes('?');
        const hasSpecificTerms = /\b(create|implement|design|build|develop)\b/i.test(prompt);
        let score = 0.5; // Base score
        // Length scoring
        if (length > 50 && length < 500)
            score += 0.2;
        else if (length >= 500)
            score += 0.1;
        // Word count scoring
        if (wordCount >= 10 && wordCount <= 100)
            score += 0.15;
        // Specificity scoring
        if (hasSpecificTerms)
            score += 0.1;
        if (hasQuestionMark)
            score -= 0.05; // Questions are often less specific
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
    calculateRelevance(prompt, query) {
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
    db;
    table;
    constructor(db, table) {
        this.db = db;
        this.table = table;
    }
    select(columns) {
        return new TestSelectQuery(this.db, this.table, columns);
    }
    insert(data) {
        const records = Array.isArray(data) ? data : [data];
        const results = records.map(record => this.db.insert(this.table, record));
        return {
            select: () => ({
                single: async () => ({ data: results[0], error: null }),
                then: async (callback) => callback({ data: results, error: null }),
            }),
            then: async (callback) => callback({ data: results, error: null }),
        };
    }
    update(updates) {
        return new TestUpdateQuery(this.db, this.table, updates);
    }
    delete() {
        return new TestDeleteQuery(this.db, this.table);
    }
}
class TestSelectQuery {
    db;
    table;
    columns;
    filters = [];
    orderBy = null;
    limitValue = null;
    offsetValue = 0;
    constructor(db, table, columns) {
        this.db = db;
        this.table = table;
        this.columns = columns;
    }
    eq(column, value) {
        this.filters.push({ type: 'eq', column, value });
        return this;
    }
    neq(column, value) {
        this.filters.push({ type: 'neq', column, value });
        return this;
    }
    gt(column, value) {
        this.filters.push({ type: 'gt', column, value });
        return this;
    }
    lt(column, value) {
        this.filters.push({ type: 'lt', column, value });
        return this;
    }
    like(column, pattern) {
        this.filters.push({ type: 'like', column, value: pattern });
        return this;
    }
    in(column, values) {
        this.filters.push({ type: 'in', column, value: values });
        return this;
    }
    order(column, options) {
        this.orderBy = { column, ascending: options?.ascending ?? true };
        return this;
    }
    limit(count) {
        this.limitValue = count;
        return this;
    }
    offset(count) {
        this.offsetValue = count;
        return this;
    }
    range(from, to) {
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
    async then(callback) {
        const results = await this.executeQuery();
        return callback({ data: results, error: null });
    }
    async executeQuery() {
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
                const aVal = a[this.orderBy.column];
                const bVal = b[this.orderBy.column];
                let comparison = 0;
                if (aVal < bVal)
                    comparison = -1;
                else if (aVal > bVal)
                    comparison = 1;
                return this.orderBy.ascending ? comparison : -comparison;
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
    db;
    table;
    updates;
    filters = [];
    constructor(db, table, updates) {
        this.db = db;
        this.table = table;
        this.updates = updates;
    }
    eq(column, value) {
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
    db;
    table;
    filters = [];
    constructor(db, table) {
        this.db = db;
        this.table = table;
    }
    eq(column, value) {
        this.filters.push({ type: 'eq', column, value });
        return this;
    }
    async then(callback) {
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
export function createTestDatabase() {
    return new TestDatabase();
}
export function seedTestDatabase(db) {
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
            from: (table) => testDb.from(table),
            rpc: (fn, params) => testDb.rpc(fn, params),
        },
        // Raw database access for tests
        database: testDb,
        // Cleanup function
        cleanup: () => testDb.clear(),
    };
}
//# sourceMappingURL=test-database.js.map