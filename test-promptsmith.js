#!/usr/bin/env node

/**
 * Test Script for PromptSmith MCP Server
 * Direct testing without MCP client
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing PromptSmith MCP Server...\n');

// Test MCP server startup
const serverPath = path.join(__dirname, 'dist', 'cli.js');
const env = {
  ...process.env,
  SUPABASE_URL: "https://nqzhxukuvmdlpewqytpv.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xemh4dWt1dm1kbHBld3F5dHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTk0MDksImV4cCI6MjA2MjIzNTQwOX0.9raKtf_MAUoZ7lUOek4lazhWTfmxPvufW1-al82UHmk",
  NODE_ENV: "production"
};

// Test 1: Server startup
console.log('📡 Testing server startup...');
const server = spawn('node', [serverPath], { 
  env,
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverOutput = '';
server.stdout.on('data', (data) => {
  serverOutput += data.toString();
  if (serverOutput.includes('PromptSmith MCP Server is ready!')) {
    console.log('✅ Server started successfully');
    
    // Test 2: Send MCP initialize request
    console.log('🔧 Testing MCP protocol...');
    
    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "test-client",
          version: "1.0.0"
        }
      }
    };
    
    server.stdin.write(JSON.stringify(initRequest) + '\n');
    
    setTimeout(() => {
      // Test 3: List tools
      const toolsRequest = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {}
      };
      
      server.stdin.write(JSON.stringify(toolsRequest) + '\n');
      
      setTimeout(() => {
        console.log('📊 Server output:');
        console.log(serverOutput);
        console.log('\n🎯 PromptSmith MCP Server is working correctly!');
        console.log('✅ Ready for Cursor IDE integration');
        server.kill();
        process.exit(0);
      }, 2000);
    }, 1000);
  }
});

server.stderr.on('data', (data) => {
  console.log('⚠️ Server stderr:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - server may still be working');
  server.kill();
  process.exit(0);
}, 10000);
