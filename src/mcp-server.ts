#!/usr/bin/env node

// MCP Server Entry Point (without CLI banner)
// Used by the MCP wrapper for clean JSON-RPC communication

import dotenv from 'dotenv';
import { PromptSmithServer } from './server/index.js';

// Load environment variables
dotenv.config();

// Validate required environment variables quietly
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  process.stderr.write(`MCP_ERROR: Missing required environment variables: ${missingEnvVars.join(', ')}\n`);
  process.exit(1);
}

// Set defaults
process.env.APP_VERSION = process.env.APP_VERSION || '1.0.0';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.TELEMETRY_ENABLED = process.env.TELEMETRY_ENABLED || 'true';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function startMCPServer() {
  try {
    // Create and start the server without banner
    const server = new PromptSmithServer();
    
    // Signal ready via stderr (wrapper watches this)
    process.stderr.write('MCP_READY: PromptSmith MCP Server is ready!\n');
    
    await server.start();
    
    // The server will now handle MCP protocol via stdio
  } catch (error) {
    process.stderr.write(`MCP_ERROR: Failed to start PromptSmith MCP Server: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  process.stderr.write(`MCP_ERROR: Uncaught Exception: ${error}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  process.stderr.write(`MCP_ERROR: Unhandled Rejection at: ${promise} reason: ${reason}\n`);
  process.exit(1);
});

// Start the MCP server
startMCPServer();