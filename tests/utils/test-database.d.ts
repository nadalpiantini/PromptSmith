/**
 * Test Database Utilities
 * Mock database implementations and utilities for testing
 */
export interface TestDatabaseConfig {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
}
export declare class TestDatabase {
    private data;
    private sequences;
    private tables;
    constructor();
    private initializeTables;
    from(table: string): TestTableQuery;
    rpc(functionName: string, params?: any): {
        data: any[];
        error: null;
    } | {
        data: {
            total_prompts: number;
            recent_prompts: number;
            total_events: number;
            avg_quality_score: number;
            domains: any[];
            period_days: any;
        };
        error: null;
    } | {
        data: {
            score: number;
            breakdown: {
                clarity: number;
                specificity: number;
                structure: number;
                completeness: number;
            };
        };
        error: null;
    };
    getAll(table: string): any[];
    insert(table: string, record: any): any;
    update(table: string, id: any, updates: any): any;
    delete(table: string, id: any): boolean;
    findById(table: string, id: any): any | null;
    findWhere(table: string, criteria: any): any[];
    clear(table?: string): void;
    getSize(table?: string): number;
    private getNextId;
    private mockSearchPrompts;
    private mockGetStats;
    private mockCalculateQualityScore;
    private calculateRelevance;
}
declare class TestTableQuery {
    private db;
    private table;
    constructor(db: TestDatabase, table: string);
    select(columns?: string): TestSelectQuery;
    insert(data: any | any[]): {
        select: () => {
            single: () => Promise<{
                data: any;
                error: null;
            }>;
            then: (callback: Function) => Promise<any>;
        };
        then: (callback: Function) => Promise<any>;
    };
    update(updates: any): TestUpdateQuery;
    delete(): TestDeleteQuery;
}
declare class TestSelectQuery {
    private db;
    private table;
    private columns?;
    private filters;
    private orderBy;
    private limitValue;
    private offsetValue;
    constructor(db: TestDatabase, table: string, columns?: string | undefined);
    eq(column: string, value: any): this;
    neq(column: string, value: any): this;
    gt(column: string, value: any): this;
    lt(column: string, value: any): this;
    like(column: string, pattern: string): this;
    in(column: string, values: any[]): this;
    order(column: string, options?: {
        ascending?: boolean;
    }): this;
    limit(count: number): this;
    offset(count: number): this;
    range(from: number, to: number): this;
    single(): Promise<{
        data: any;
        error: null;
    }>;
    maybeSingle(): Promise<{
        data: any;
        error: null;
    }>;
    then(callback: Function): Promise<any>;
    private executeQuery;
}
declare class TestUpdateQuery {
    private db;
    private table;
    private updates;
    private filters;
    constructor(db: TestDatabase, table: string, updates: any);
    eq(column: string, value: any): this;
    select(): {
        single: () => Promise<{
            data: any;
            error: null;
        } | {
            data: null;
            error: {
                message: string;
            };
        }>;
    };
}
declare class TestDeleteQuery {
    private db;
    private table;
    private filters;
    constructor(db: TestDatabase, table: string);
    eq(column: string, value: any): this;
    then(callback: Function): Promise<any>;
}
export declare function createTestDatabase(): TestDatabase;
export declare function seedTestDatabase(db: TestDatabase): TestDatabase;
export declare function mockDatabaseOperations(): {
    supabase: {
        from: (table: string) => TestTableQuery;
        rpc: (fn: string, params: any) => {
            data: any[];
            error: null;
        } | {
            data: {
                total_prompts: number;
                recent_prompts: number;
                total_events: number;
                avg_quality_score: number;
                domains: any[];
                period_days: any;
            };
            error: null;
        } | {
            data: {
                score: number;
                breakdown: {
                    clarity: number;
                    specificity: number;
                    structure: number;
                    completeness: number;
                };
            };
            error: null;
        };
    };
    database: TestDatabase;
    cleanup: () => void;
};
export {};
//# sourceMappingURL=test-database.d.ts.map