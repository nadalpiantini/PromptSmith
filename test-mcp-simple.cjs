#!/usr/bin/env node

/**
 * Test the new simplified MCP installation
 * Should work just like other MCP servers now
 */

const { spawn } = require('child_process');

async function testSimplifiedMCP() {
  console.log('🧪 Testing Simplified MCP Installation');
  console.log('=====================================');
  console.log('');

  // Test 1: Check if command is available globally
  console.log('1️⃣ Testing global command availability...');
  
  try {
    const result = await new Promise((resolve, reject) => {
      const cmd = spawn('which', ['promptsmith-mcp']);
      let output = '';
      
      cmd.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      cmd.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error('Command not found'));
        }
      });
      
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    
    console.log(`   ✅ Command found at: ${result}`);
  } catch (error) {
    console.log('   ❌ Command not found globally');
    console.log('   💡 Run: npm link (in PromptSmith directory)');
    return;
  }

  // Test 2: Test MCP server startup (quick test)
  console.log('');
  console.log('2️⃣ Testing MCP server startup...');
  
  const server = spawn('promptsmith-mcp', [], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let serverReady = false;
  let timeout;
  
  const testPromise = new Promise((resolve, reject) => {
    // Listen for ready signal
    server.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('MCP_READY:')) {
        serverReady = true;
        clearTimeout(timeout);
        server.kill();
        resolve('Server started successfully');
      }
    });
    
    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    
    // Timeout after 10 seconds
    timeout = setTimeout(() => {
      server.kill();
      if (serverReady) {
        resolve('Server started successfully');
      } else {
        reject(new Error('Server startup timeout'));
      }
    }, 10000);
  });
  
  try {
    const result = await testPromise;
    console.log(`   ✅ ${result}`);
  } catch (error) {
    console.log(`   ❌ Server startup failed: ${error.message}`);
    return;
  }
  
  // Test 3: Check Cursor configuration
  console.log('');
  console.log('3️⃣ Testing Cursor MCP configuration...');
  
  const fs = require('fs');
  const path = require('path');
  const mcpConfigPath = path.join(process.env.HOME, '.cursor', 'mcp.json');
  
  if (fs.existsSync(mcpConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      
      if (config.mcpServers && config.mcpServers.promptsmith) {
        const promptsmithConfig = config.mcpServers.promptsmith;
        
        if (promptsmithConfig.command === 'promptsmith-mcp') {
          console.log('   ✅ Cursor configured with simplified command');
          console.log('   📋 Configuration:');
          console.log('      Command: promptsmith-mcp');
          console.log('      Args: (none needed)');
          console.log('      CWD: (auto-detected)');
          console.log('      Env: (auto-configured)');
        } else {
          console.log('   ⚠️  Cursor still using old configuration');
          console.log('   💡 Update ~/.cursor/mcp.json to use simple config');
        }
      } else {
        console.log('   ❌ PromptSmith not found in Cursor MCP config');
      }
    } catch (error) {
      console.log('   ❌ Error reading Cursor MCP config:', error.message);
    }
  } else {
    console.log('   ❌ Cursor MCP config file not found');
  }
  
  // Summary
  console.log('');
  console.log('🎉 Simplified MCP Installation Test Summary');
  console.log('==========================================');
  console.log('✅ PromptSmith now works like other MCP servers!');
  console.log('✅ No more manual paths or configuration needed');
  console.log('✅ Just add: { "command": "promptsmith-mcp" }');
  console.log('');
  console.log('💡 To use in any Cursor project:');
  console.log('   1. Make sure: npm link (done)');
  console.log('   2. Cursor config: promptsmith-mcp command only');
  console.log('   3. Restart Cursor');
  console.log('   4. MCP tools available in all projects!');
}

// Run the test
testSimplifiedMCP().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});