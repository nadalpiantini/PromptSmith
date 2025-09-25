#!/usr/bin/env node
// PromptSmith MCP - Simple Demo
const { spawn } = require('child_process');

console.log('🚀 PromptSmith MCP - Simple Demo');
console.log('=================================\n');

// Start the MCP server
const server = spawn('node', ['dist/cli.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env }
});

let serverOutput = '';
let serverStarted = false;

server.stderr.on('data', (data) => {
  const text = data.toString();
  console.log('📡 Server:', text.trim());
  
  if (text.includes('PromptSmith MCP Server is ready!')) {
    serverStarted = true;
    console.log('\n✅ Server is ready! Testing tools...\n');
    
    // Test 1: List tools
    console.log('🔧 Test 1: Listing available tools...');
    const listRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list"
    };
    server.stdin.write(JSON.stringify(listRequest) + '\n');
  }
});

server.stdout.on('data', (data) => {
  serverOutput += data.toString();
  
  // Parse the response
  try {
    const lines = serverOutput.split('\n');
    const responseLine = lines.find(line => line.includes('"id":1') && line.includes('"result"'));
    
    if (responseLine) {
      const response = JSON.parse(responseLine);
      if (response.result && response.result.tools) {
        console.log(`✅ Found ${response.result.tools.length} tools:`);
        response.result.tools.forEach(tool => {
          console.log(`   - ${tool.name}: ${tool.description.substring(0, 60)}...`);
        });
        
        // Test 2: Process a prompt
        console.log('\n🔧 Test 2: Processing a prompt...');
        const processRequest = {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "process_prompt",
            arguments: {
              raw: "make me a sql query for users",
              domain: "sql",
              tone: "professional"
            }
          }
        };
        server.stdin.write(JSON.stringify(processRequest) + '\n');
      }
    }
  } catch (e) {
    // Continue waiting for response
  }
});

// Handle the process_prompt response
server.stdout.on('data', (data) => {
  serverOutput += data.toString();
  
  try {
    const lines = serverOutput.split('\n');
    const responseLine = lines.find(line => line.includes('"id":2') && line.includes('"result"'));
    
    if (responseLine) {
      const response = JSON.parse(responseLine);
      if (response.result && response.result.content) {
        const content = JSON.parse(response.result.content[0].text);
        console.log('✅ Prompt processed successfully!');
        console.log(`📊 Quality Score: ${content.data.score.overall}/1.0`);
        console.log(`🎯 Domain: ${content.data.metadata.domain}`);
        console.log(`⏱️ Processing Time: ${content.data.metadata.processingTime}ms`);
        console.log('\n📝 Refined Prompt:');
        console.log(content.data.refined.substring(0, 200) + '...');
        
        console.log('\n🎉 PromptSmith MCP is working perfectly!');
        console.log('\n📋 How to use in Cursor IDE:');
        console.log('1. Copy config: cp mcp-config-sujeto10.json ~/.claude/mcp_servers.json');
        console.log('2. Restart Cursor IDE');
        console.log('3. Use PromptSmith tools from Claude interface');
        
        server.kill();
      }
    }
  } catch (e) {
    // Continue waiting for response
  }
});

server.on('error', (error) => {
  console.log('❌ Server error:', error.message);
});

// Cleanup after 10 seconds
setTimeout(() => {
  if (serverStarted) {
    console.log('\n⏰ Demo completed');
  } else {
    console.log('\n❌ Server did not start properly');
  }
  server.kill();
}, 10000);


