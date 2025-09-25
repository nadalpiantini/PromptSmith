#!/usr/bin/env node

import { PromptSmithServer } from './server/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Please check your .env file or environment configuration');
  process.exit(1);
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
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check your environment variables');
    console.error('   2. Ensure database is accessible');
    console.error('   3. Verify Redis connection (if using cache)');
    console.error('   4. Check network connectivity');
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main();