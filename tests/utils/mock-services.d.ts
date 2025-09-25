/**
 * Mock Service Implementations
 * Comprehensive mocks for all external services and dependencies
 */
export declare function createMockSupabaseClient(): {
    from: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    rpc: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare function createMockRedisClient(): {
    get: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    set: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    del: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    exists: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    keys: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    flushall: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    quit: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare function createMockOpenAIClient(): {
    completions: {
        create: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    };
    chat: {
        completions: {
            create: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
        };
    };
};
export declare function createMockNLPService(): {
    tokenize: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    analyze: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    extractKeywords: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    detectLanguage: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    calculateReadability: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    extractEntities: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare function createMockFileSystem(): {
    readFile: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    writeFile: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    exists: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    unlink: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    mkdir: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    stat: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare function createMockLogger(): {
    info: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    warn: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    error: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    debug: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    trace: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    child: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare function createMockCrypto(): {
    randomUUID: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    createHash: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    randomBytes: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare function createMockEmailService(): {
    send: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    sendTemplate: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare function createMockWebhookService(): {
    send: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getDeliveries: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    clearDeliveries: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare function createMockQueueService(): {
    add: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    process: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getJobs: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    clearJobs: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare function createMockAnalyticsService(): {
    track: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    identify: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getEvents: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    clearEvents: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare function createMockServices(overrides?: any): any;
export declare function setupMockEnvironment(): {
    cleanup: () => void;
};
//# sourceMappingURL=mock-services.d.ts.map