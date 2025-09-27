/**
 * Jest Configuration for PromptSmith MCP
 * ULTIMATE FIX: Simplified configuration that actually works
 */

export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  
  // Module resolution for ES modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Explicit mappings for problematic modules
    '^../../../src/services/index$': '<rootDir>/src/services/index.ts',
    '^../../../src/core/orchestrator$': '<rootDir>/src/core/orchestrator.ts',
    '^../../../src/core/analyzer$': '<rootDir>/src/core/analyzer.ts',
    '^../../../src/core/optimizer$': '<rootDir>/src/core/optimizer.ts',
    '^../../../src/core/validator$': '<rootDir>/src/core/validator.ts',
    '../../utils/test-helpers': '<rootDir>/tests/utils/test-helpers.ts',
    '../utils/test-helpers': '<rootDir>/tests/utils/test-helpers.ts',
  },
  
  // Test environment
  testEnvironment: 'node',
  
  // Transform configuration with inline ts-jest config
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      isolatedModules: false,
      tsconfig: {
        module: 'ESNext',
        moduleResolution: 'node',
        target: 'ES2022',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        rootDir: '.',  // Allow both src and tests
        baseUrl: '.',
        paths: {
          '@/*': ['src/*'],
          'tests/*': ['tests/*']
        },
        types: ['node', 'jest'],
        strict: false,
        noImplicitAny: false
      }
    }]
  },
  
  // File patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', '<rootDir>/src', '<rootDir>/tests'],
  
  // Module paths
  modulePaths: [
    '<rootDir>/src',
    '<rootDir>/tests',
    '<rootDir>'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/cli.ts',
  ],
  
  coverageDirectory: 'coverage',
  
  // Basic settings for stability
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
  verbose: false,
  maxWorkers: 1,
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  
  // Test ignore patterns  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ]
};