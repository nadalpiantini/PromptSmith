/**
 * Jest Test Setup
 * Global test setup and configuration
 */

import { jest, expect, beforeEach, afterEach } from '@jest/globals';

// Fix SIGINT listener warning - increase max listeners for test environment
process.setMaxListeners(20);

// Increase timeout for all tests
jest.setTimeout(30000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.TELEMETRY_ENABLED = 'false';

// Global test utilities - moved to separate .d.ts file

// Custom Jest matchers
expect.extend({
  toBeValidMCPResponse(received: any) {
    const pass = received &&
      received.jsonrpc === '2.0' &&
      typeof received.id !== 'undefined' &&
      (received.result !== undefined || received.error !== undefined);

    if (pass) {
      return {
        message: () => `Expected ${JSON.stringify(received)} not to be a valid MCP response`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${JSON.stringify(received)} to be a valid MCP response`,
        pass: false,
      };
    }
  },

  toBeValidPromptResponse(received: any) {
    const pass = received &&
      typeof received.original === 'string' &&
      typeof received.refined === 'string' &&
      received.score &&
      typeof received.score.overall === 'number';

    if (pass) {
      return {
        message: () => `Expected ${JSON.stringify(received)} not to be a valid prompt response`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${JSON.stringify(received)} to be a valid prompt response`,
        pass: false,
      };
    }
  },
});

// Console suppression for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Suppress console output during tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Clean up any remaining event listeners to prevent memory leaks
  if (process.listenerCount('SIGINT') > 1) {
    process.removeAllListeners('SIGINT');
  }
  if (process.listenerCount('SIGTERM') > 1) {
    process.removeAllListeners('SIGTERM');
  }
});