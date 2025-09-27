#!/usr/bin/env node

import { PromptSmithServer } from './server/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Utility function to check if we're in STDIO mode (MCP protocol)
function isSTDIOMode(): boolean {
  return process.env.MCP_TRANSPORT === 'stdio' || !process.stdout.isTTY;
}

// Graceful exit helper that respects STDIO mode
function gracefulExit(code: number, message?: string): void {
  if (message) {
    console.error(message);
  }
  
  if (isSTDIOMode()) {
    console.error('Running in STDIO mode - continuing with degraded functionality...');
    return; // Don't exit in STDIO mode
  }
  
  process.exit(code);
}

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  const errorMessage = `❌ Missing required environment variables:\n${missingEnvVars.map(v => `   - ${v}`).join('\n')}\n\n💡 Please check your .env file or environment configuration`;
  gracefulExit(1, errorMessage);
}

// Optional environment variables with defaults
process.env.APP_VERSION = process.env.APP_VERSION || '1.0.0';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.TELEMETRY_ENABLED = process.env.TELEMETRY_ENABLED || 'true';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Banner
const banner = `
╔═══════════════════════════════════════════════════════════════════╗
║                       PromptSmith MCP Server                     ║
║                   Intelligent Prompt Optimization                ║
║                                                                   ║
║  🚀 Transform vibecoding prompts into structured instructions     ║
║  🎯 Domain-specific optimization (SQL, Branding, Cinema, etc.)    ║
║  📊 Quality scoring and validation                                ║
║  🔄 Template generation and reuse                                 ║
║                                                                   ║
║  Version: ${process.env.APP_VERSION?.padEnd(8)} Environment: ${process.env.NODE_ENV?.padEnd(11)} ║
╚═══════════════════════════════════════════════════════════════════╝
`;

async function main() {
  try {
    console.error(banner);
    console.error('🔧 Initializing services...');

    // Create and start the server
    const server = new PromptSmithServer();

    console.error('✅ Services initialized');
    console.error('🎯 Starting MCP server...');

    await server.start();

    // The server will now handle MCP protocol via stdio
    console.error('🚀 PromptSmith MCP Server is ready!');
    console.error('📡 Listening for MCP protocol messages on stdio');
    console.error('🔍 Use with your MCP-compatible client (e.g., Cursor IDE)');

  } catch (error) {
    console.error('❌ Failed to start PromptSmith MCP Server:');
    console.error(error instanceof Error ? error.message : String(error));
    const troubleshootingMessage = `\n🔧 Troubleshooting:\n   1. Check your environment variables\n   2. Ensure database is accessible\n   3. Verify Redis connection (if using cache)\n   4. Check network connectivity`;
    gracefulExit(1, troubleshootingMessage);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  gracefulExit(1, `❌ Uncaught Exception: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  gracefulExit(1, `❌ Unhandled Rejection: ${reason}`);
});

// Start the application
main();