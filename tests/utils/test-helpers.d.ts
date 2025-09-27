/**
 * Test Helper Utilities
 * Common utilities and mock implementations for testing
 */
import { ProcessInput, ProcessResult, EvaluationResult, QualityScore, AnalysisResult, ValidationResult, SavedPrompt, SearchResult, ComparisonResult } from '../../src/types/prompt';
export declare function createMockQualityScore(overrides?: Partial<QualityScore>): QualityScore;
export declare function createMockAnalysisResult(overrides?: Partial<AnalysisResult>): AnalysisResult;
export declare function createMockValidationResult(overrides?: Partial<ValidationResult>): ValidationResult;
export declare function createMockProcessInput(overrides?: Partial<ProcessInput>): ProcessInput;
export declare function createMockProcessResult(overrides?: Partial<ProcessResult>): ProcessResult;
export declare function createMockEvaluationResult(overrides?: Partial<EvaluationResult>): EvaluationResult;
export declare function createMockSavedPrompt(overrides?: Partial<SavedPrompt>): SavedPrompt;
export declare function createMockSearchResult(overrides?: Partial<SearchResult>): SearchResult;
export declare function createMockComparisonResult(overrides?: Partial<ComparisonResult>): ComparisonResult;
export declare function createMockOrchestrator(): {
    process: import("jest-mock").Mock<any>;
    evaluate: import("jest-mock").Mock<any>;
    compare: import("jest-mock").Mock<any>;
    save: import("jest-mock").Mock<any>;
    search: import("jest-mock").Mock<any>;
};
export declare function createMockStoreService(): {
    save: import("jest-mock").Mock<any>;
    getById: import("jest-mock").Mock<any>;
    search: import("jest-mock").Mock<any>;
    getStats: import("jest-mock").Mock<any>;
};
export declare function createMockTelemetryService(): {
    track: import("jest-mock").Mock<any>;
    error: import("jest-mock").Mock<any>;
    getStats: import("jest-mock").Mock<any>;
};
export declare function createMockServices(): {
    store: {
        save: import("jest-mock").Mock<any>;
        getById: import("jest-mock").Mock<any>;
        search: import("jest-mock").Mock<any>;
        getStats: import("jest-mock").Mock<any>;
    };
    telemetry: {
        track: import("jest-mock").Mock<any>;
        error: import("jest-mock").Mock<any>;
        getStats: import("jest-mock").Mock<any>;
    };
    healthCheck: import("jest-mock").Mock<any>;
    shutdown: import("jest-mock").Mock<any>;
};
export declare function expectValidQualityScore(score: QualityScore): void;
export declare function expectValidAnalysisResult(analysis: AnalysisResult): void;
export declare function expectValidProcessResult(result: ProcessResult): void;
export declare function measurePerformance<T>(fn: () => Promise<T>): Promise<{
    result: T;
    duration: number;
}>;
export declare function expectWithinPerformanceThreshold(duration: number, threshold: number, operation: string): void;
export declare function createTestDatabase(): {
    clear: () => void;
    set: (key: string, value: any) => Map<any, any>;
    get: (key: string) => any;
    has: (key: string) => boolean;
    delete: (key: string) => boolean;
    size: () => number;
    values: () => any[];
    keys: () => any[];
};
export declare function setupTestEnvironment(overrides?: Record<string, string>): void;
export declare function cleanupTestEnvironment(): void;
//# sourceMappingURL=test-helpers.d.ts.map