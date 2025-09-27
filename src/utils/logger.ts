/**
 * Smart Logger for PromptSmith MCP
 * Automatically detects STDIO mode and redirects logs appropriately
 */

export interface Logger {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

/**
 * Detects if we're running in STDIO mode (MCP protocol)
 * Multiple detection methods for robustness
 */
function isSTDIOMode(): boolean {
  // Explicit environment variable
  if (process.env.MCP_TRANSPORT === 'stdio') {
    return true;
  }

  // Check if we're in MCP mode
  if (process.env.MCP_MODE === 'true') {
    return true;
  }

  // Check if stdout is not a TTY (piped/redirected)
  if (!process.stdout.isTTY) {
    return true;
  }

  // Check for MCP-related command line arguments
  if (process.argv.some(arg => arg.includes('mcp') || arg.includes('stdio'))) {
    return true;
  }

  return false;
}

/**
 * Creates a smart logger that:
 * - In STDIO mode: redirects log/info/debug to stderr, keeps error/warn on stderr
 * - In normal mode: uses standard console methods
 */
function createLogger(): Logger {
  const isSTDIO = isSTDIOMode();

  if (isSTDIO) {
    // STDIO mode: redirect output logs to stderr to avoid contaminating JSON-RPC
    return {
      log: (...args: any[]) => console.error('[LOG]', ...args),
      info: (...args: any[]) => console.error('[INFO]', ...args),
      debug: (...args: any[]) => console.error('[DEBUG]', ...args),
      error: (...args: any[]) => console.error('[ERROR]', ...args),
      warn: (...args: any[]) => console.error('[WARN]', ...args),
    };
  } else {
    // Normal mode: use standard console
    return {
      log: (...args: any[]) => console.log(...args),
      info: (...args: any[]) => console.info(...args),
      debug: (...args: any[]) => console.debug(...args),
      error: (...args: any[]) => console.error(...args),
      warn: (...args: any[]) => console.warn(...args),
    };
  }
}

// Export singleton logger instance
export const logger = createLogger();

// Export factory for testing
export { createLogger };

// Convenience re-exports for common patterns
export const log = logger.log;
export const error = logger.error;
export const warn = logger.warn;
export const info = logger.info;
export const debug = logger.debug;