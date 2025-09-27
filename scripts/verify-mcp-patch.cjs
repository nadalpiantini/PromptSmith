#!/usr/bin/env node
/**
 * MCP Patch Verification Script
 * Verifies that all necessary patches for STDIO compatibility are in place
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

console.log('🔍 [Verify] Checking MCP STDIO compatibility...\n');

/**
 * Check if a file exists and is readable
 */
function checkFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ [Verify] Missing: ${description}`);
    console.log(`   Expected: ${path.relative(ROOT, filePath)}`);
    return false;
  }
  
  try {
    fs.readFileSync(filePath, 'utf8');
    console.log(`✅ [Verify] Found: ${description}`);
    return true;
  } catch (error) {
    console.log(`❌ [Verify] Unreadable: ${description}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Check if a file contains specific content
 */
function checkFileContent(filePath, description, searchString, shouldContain = true) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ [Verify] ${description}: File not found`);
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const contains = content.includes(searchString);
    
    if (shouldContain && contains) {
      console.log(`✅ [Verify] ${description}: Contains required content`);
      return true;
    } else if (!shouldContain && !contains) {
      console.log(`✅ [Verify] ${description}: Correctly excludes content`);
      return true;
    } else {
      console.log(`❌ [Verify] ${description}: Content check failed`);
      console.log(`   Looking for: "${searchString}"`);
      console.log(`   Should contain: ${shouldContain}`);
      console.log(`   Actually contains: ${contains}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ [Verify] ${description}: Read error - ${error.message}`);
    return false;
  }
}

/**
 * Test offline mode functionality
 */
function testOfflineMode() {
  console.log('\n🧪 [Verify] Testing offline mode...');
  
  const testEnv = {
    ...process.env,
    SUPABASE_URL: undefined,
    SUPABASE_ANON_KEY: undefined,
    MCP_TRANSPORT: 'stdio'
  };

  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
    const child = spawn('node', [path.join(DIST, 'mcp-server.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: testEnv,
      timeout: 5000
    });

    let stderr = '';
    let success = false;

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (stderr.includes('MCP_READY') || stderr.includes('Offline')) {
        console.log('✅ [Verify] Offline mode: Server starts successfully');
        success = true;
      } else {
        console.log('❌ [Verify] Offline mode: Server failed to start');
        console.log('   stderr:', stderr.substring(0, 200));
      }
      resolve(success);
    });

    child.on('error', (error) => {
      console.log('❌ [Verify] Offline mode: Error starting server');
      console.log('   Error:', error.message);
      resolve(false);
    });

    // Send a test message
    setTimeout(() => {
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      }) + '\n');
    }, 1000);

    // Kill after timeout
    setTimeout(() => {
      child.kill('SIGTERM');
    }, 4000);
  });
}

/**
 * Main verification process
 */
async function main() {
  let allPassed = true;
  
  // 1. Check critical files exist
  console.log('📁 [Verify] Checking file structure...');
  const criticalFiles = [
    [path.join(DIST, 'mcp-server.js'), 'MCP Server entry point'],
    [path.join(DIST, 'utils', 'logger.js'), 'Smart logger utility'],
    [path.join(ROOT, 'scripts', 'patch-and-run-promptsmith.cjs'), 'Legacy patch script'],
    [path.join(ROOT, 'scripts', 'post-build.cjs'), 'Post-build hook'],
  ];

  for (const [filePath, description] of criticalFiles) {
    if (!checkFile(filePath, description)) {
      allPassed = false;
    }
  }

  // 2. Check source code integration
  console.log('\n📝 [Verify] Checking source code integration...');
  const sourceChecks = [
    [path.join(DIST, 'mcp-server.js'), 'MCP Server offline mode', 'PROMPTSMITH_OFFLINE'],
    [path.join(DIST, 'utils', 'logger.js'), 'Logger STDIO detection', 'MCP_TRANSPORT'],
    [path.join(DIST, 'services', 'store.js'), 'Store service logger import', 'logger'],
    [path.join(DIST, 'services', 'cache.js'), 'Cache service logger import', 'logger'],
  ];

  for (const [filePath, description, searchString] of sourceChecks) {
    if (!checkFileContent(filePath, description, searchString, true)) {
      allPassed = false;
    }
  }

  // 3. Check that old patterns are removed
  console.log('\n🚫 [Verify] Checking removal of problematic patterns...');
  const antiPatterns = [
    [path.join(DIST, 'mcp-server.js'), 'Hard process.exit() removed', 'process.exit(1)'],
  ];

  for (const [filePath, description, searchString] of antiPatterns) {
    if (!checkFileContent(filePath, description, searchString, false)) {
      allPassed = false;
    }
  }

  // 4. Test offline mode
  if (fs.existsSync(path.join(DIST, 'mcp-server.js'))) {
    const offlineTest = await testOfflineMode();
    if (!offlineTest) {
      allPassed = false;
    }
  } else {
    console.log('⚠️  [Verify] Skipping offline test - mcp-server.js not found');
    allPassed = false;
  }

  // 5. Summary
  console.log('\n📊 [Verify] Summary:');
  if (allPassed) {
    console.log('🎉 [Verify] All checks passed! MCP server is ready for STDIO mode.');
    console.log('💡 [Verify] You can now use:');
    console.log('   - npm run mcp:stdio');
    console.log('   - promptsmith-mcp (global command)');
    console.log('   - Configure in Cursor with the provided config');
    process.exit(0);
  } else {
    console.log('❌ [Verify] Some checks failed. Run npm run build to fix issues.');
    console.log('💡 [Verify] If problems persist, check:');
    console.log('   - TypeScript compilation errors');
    console.log('   - Missing dependencies');
    console.log('   - File permissions');
    process.exit(1);
  }
}

// Run verification
main().catch(error => {
  console.error('❌ [Verify] Unexpected error:', error);
  process.exit(1);
});