#!/usr/bin/env node

// PromptSmith MCP - Connectivity Test
// Tests basic server startup and tool availability

const { spawn } = require('child_process');

console.log('🔧 PromptSmith MCP - Connectivity Test');
console.log('======================================\n');

async function testConnectivity() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting PromptSmith server...');

    const server = spawn('node', ['dist/cli.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: require('path').resolve(__dirname, '..')
    });

    const timeout = setTimeout(() => {
      server.kill();
      reject(new Error('⏱️ Server startup timeout (10s)'));
    }, 10000);

    let serverReady = false;
    let toolsReceived = false;

    server.stderr.on('data', (data) => {
      const text = data.toString();
      console.log('📡 Server output:', text.trim());

      if (text.includes('PromptSmith MCP Server is ready!')) {
        serverReady = true;
        console.log('✅ Server started successfully!');
        console.log('📋 Requesting tools list...');

        // Send tools/list request
        const request = {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list"
        };

        server.stdin.write(JSON.stringify(request) + '\n');
      }

      if (text.includes('❌') || text.includes('Failed')) {
        clearTimeout(timeout);
        server.kill();
        reject(new Error(`Server error: ${text}`));
      }
    });

    server.stdout.on('data', (data) => {
      const text = data.toString().trim();
      if (text) {
        try {
          const response = JSON.parse(text);
          if (response.result && response.result.tools) {
            toolsReceived = true;
            clearTimeout(timeout);
            server.kill();

            console.log('✅ Tools list received successfully!');
            console.log(`📊 Available tools: ${response.result.tools.length}`);

            response.result.tools.forEach((tool, i) => {
              console.log(`   ${i + 1}. ${tool.name}`);
            });

            console.log('\n🎉 Connectivity test PASSED!');
            console.log('🔗 PromptSmith MCP server is working correctly.');
            resolve();
          }
        } catch (error) {
          // Ignore non-JSON output
        }
      }
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Server spawn error: ${error.message}`));
    });

    server.on('close', (code) => {
      if (!toolsReceived && !serverReady) {
        reject(new Error(`Server closed unexpectedly with code ${code}`));
      }
    });
  });
}

// Run the test
testConnectivity()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });