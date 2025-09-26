/**
 * Jest Configuration for PromptSmith MCP Server
 * Comprehensive test configuration with coverage and TypeScript support
 */

/** @type {import('jest').Config} */
export default {
  // Test environment
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  // Module resolution
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // TypeScript configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2022',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        strict: false,
        skipLibCheck: true,
      },
    }],
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts',
  ],

  // Test setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary'
  ],

  // Coverage collection patterns
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/types/**', // Type definitions
    '!src/cli.ts', // CLI entry point
  ],

  // Test execution configuration
  verbose: true,
  testTimeout: 30000, // 30 seconds for integration tests
  maxWorkers: '50%', // Use half the available CPU cores

  // Test organization with projects (disabled for now - running single config)
  // projects: [
  //   {
  //     displayName: 'unit',
  //     testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
  //   },
  //   {
  //     displayName: 'integration',
  //     testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
  //   },
  //   {
  //     displayName: 'performance',
  //     testMatch: ['<rootDir>/tests/performance/**/*.test.ts'],
  //   },
  // ],

  // Reporter configuration
  reporters: [
    'default'
  ],

  // Module handling
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],

  // Error handling
  errorOnDeprecated: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  // Watch mode configuration - disabled for basic setup

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/test-results/',
  ],

  // Cache configuration
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // Global setup and teardown - disabled for now

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles for debugging
  detectOpenHandles: true,
};