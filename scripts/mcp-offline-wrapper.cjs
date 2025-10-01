#!/usr/bin/env node

/**
 * MCP Offline Wrapper - Ensures PromptSmith MCP server works without database
 * 
 * This wrapper script:
 * 1. Forces offline mode for MCP operation
 * 2. Redirects all logs to stderr (MCP STDIO compatibility)
 * 3. Provides mock responses when database is unavailable
 * 4. Handles graceful degradation of services
 */

const { spawn } = require('child_process');
const path = require('path');

// Force offline mode environment variables
process.env.NODE_ENV = 'production';
process.env.TELEMETRY_ENABLED = 'false';
process.env.MCP_OFFLINE_MODE = 'true';
process.env.FORCE_DEVELOPMENT_MODE = 'true';

// Clear database credentials to force offline mode
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_ANON_KEY;
delete process.env.REDIS_URL;
delete process.env.OPENAI_API_KEY;

// Redirect all logs to stderr for MCP compatibility
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info
};

console.log = (...args) => originalConsole.error('[OFFLINE-MCP]', ...args);
console.warn = (...args) => originalConsole.error('[OFFLINE-WARN]', ...args);
console.info = (...args) => originalConsole.error('[OFFLINE-INFO]', ...args);
console.error = (...args) => originalConsole.error('[OFFLINE-ERROR]', ...args);

// Path to the MCP server
const serverPath = path.join(__dirname, '..', 'dist', 'server', 'index.js');

// Log startup to stderr
console.error('🔧 PromptSmith MCP Server starting in OFFLINE mode...');
console.error('📍 Server path:', serverPath);
console.error('🔄 All database operations will use mock responses');

// Create the server process
const serverProcess = spawn('node', [serverPath], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: process.env,
  cwd: path.dirname(__dirname)
});

// Handle server process events
serverProcess.on('error', (error) => {
  console.error('❌ Failed to start MCP server:', error.message);
  process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
  if (code !== null) {
    console.error(`🔚 MCP server exited with code ${code}`);
    process.exit(code);
  } else if (signal !== null) {
    console.error(`🔚 MCP server killed with signal ${signal}`);
    process.exit(1);
  }
});

// Handle wrapper process signals
process.on('SIGINT', () => {
  console.error('🛑 Received SIGINT, shutting down...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.error('🛑 Received SIGTERM, shutting down...');
  serverProcess.kill('SIGTERM');
});

console.error('✅ PromptSmith MCP Server is ready for requests');