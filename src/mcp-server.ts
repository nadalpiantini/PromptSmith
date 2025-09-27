// MCP Server Entry Point (without CLI banner)
// Used by the MCP wrapper for clean JSON-RPC communication

import dotenv from 'dotenv';
import { PromptSmithServer } from './server/index.js';
import { logger } from './utils/logger.js';

// Export the PromptSmithServer class from the server directory
export { PromptSmithServer } from './server/index.js';

// Load environment variables
dotenv.config();

// Enhanced offline mode detection and setup
function setupOfflineMode(): void {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => 
    !process.env[varName] || String(process.env[varName]).trim() === ''
  );

  if (missingEnvVars.length > 0) {
    // Enable offline mode instead of exiting
    process.env.PROMPTSMITH_OFFLINE = 'true';
    
    // Log to stderr for STDIO compatibility
    logger.warn('[PromptSmith][Offline] Missing environment variables:', missingEnvVars.join(', '));
    logger.warn('[PromptSmith][Offline] Running in offline mode with mock services');
    
    // Set safe dummy values to prevent library crashes
    process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'offline://no-supabase';
    process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'offline-anon-key';
  } else {
    logger.info('[PromptSmith][Online] Connected with Supabase backend');
  }
}

// Initialize offline mode setup
setupOfflineMode();

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
    const mode = process.env.PROMPTSMITH_OFFLINE === 'true' ? 'Offline' : 'Online';
    logger.info(`MCP_READY: PromptSmith MCP Server is ready! [${mode} Mode]`);
    
    await server.start();
    
    // The server will now handle MCP protocol via stdio
  } catch (error) {
    logger.error(`MCP_ERROR: Failed to start PromptSmith MCP Server: ${error instanceof Error ? error.message : String(error)}`);
    
    // In offline mode, try to continue with degraded functionality
    if (process.env.PROMPTSMITH_OFFLINE === 'true') {
      logger.warn('Attempting to continue in offline mode with limited functionality...');
      // Don't exit - let the server try to continue
    } else {
      logger.error('Startup failure in online mode - attempting to continue with degraded functionality');
      // Don't exit - let the server try to continue even in online mode
    }
  }
}

// Handle uncaught exceptions gracefully in offline mode
process.on('uncaughtException', (error) => {
  logger.error(`MCP_ERROR: Uncaught Exception: ${error}`);
  
  if (process.env.PROMPTSMITH_OFFLINE === 'true') {
    logger.warn('Uncaught exception in offline mode - attempting to continue...');
  } else {
    logger.error('Uncaught exception in online mode - attempting to continue with degraded functionality');
    // Don't exit - let the server try to continue
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`MCP_ERROR: Unhandled Rejection at: ${promise} reason: ${reason}`);
  
  if (process.env.PROMPTSMITH_OFFLINE === 'true') {
    logger.warn('Unhandled rejection in offline mode - attempting to continue...');
  } else {
    logger.error('Unhandled rejection in online mode - attempting to continue with degraded functionality');
    // Don't exit - let the server try to continue
  }
});

// Start the MCP server
startMCPServer();