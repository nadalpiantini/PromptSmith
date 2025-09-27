/**
 * Global Jest Teardown
 */

export default async function globalTeardown() {
  console.log("🧹 Cleaning up test environment...");
  
  // Clean up all event listeners to prevent memory leaks
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');
  
  // Reset max listeners to default
  process.setMaxListeners(10);
  
  console.log("✅ Event listeners cleaned up");
}
