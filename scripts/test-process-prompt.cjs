#!/usr/bin/env node

// PromptSmith MCP - Process Prompt Test
// Tests prompt processing with different domains

const { spawn } = require('child_process');

const testPrompt = process.argv[2] || 'make me a sql query for users';
const testDomain = process.argv[3] || 'sql';

console.log('🎯 PromptSmith MCP - Process Prompt Test');
console.log('=======================================');
console.log(`📝 Test Prompt: "${testPrompt}"`);
console.log(`🎨 Domain: ${testDomain}\n`);

async function testProcessPrompt() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting PromptSmith server...');

    const server = spawn('node', ['dist/cli.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: require('path').resolve(__dirname, '..')
    });

    const timeout = setTimeout(() => {
      server.kill();
      reject(new Error('Test timeout'));
    }, 15000);

    let serverReady = false;

    server.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('PromptSmith MCP Server is ready!')) {
        serverReady = true;
        console.log('✅ Server ready, sending process request...');

        // Send process_prompt request
        const request = {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "process_prompt",
            arguments: {
              raw: testPrompt,
              domain: testDomain,
              tone: "professional"
            }
          }
        };

        server.stdin.write(JSON.stringify(request) + '\n');
      }
    });

    server.stdout.on('data', (data) => {
      const text = data.toString().trim();
      if (text) {
        try {
          const response = JSON.parse(text);

          if (response.error) {
            clearTimeout(timeout);
            server.kill();
            reject(new Error(`Process error: ${response.error.message}`));
            return;
          }

          if (response.result && response.result.refined) {
            clearTimeout(timeout);
            server.kill();

            console.log('\n🎉 Prompt processing SUCCESS!');
            console.log('================================');
            console.log('📝 Original Prompt:');
            console.log(`   "${response.result.original}"`);
            console.log('\n✨ Refined Prompt:');
            console.log(`   "${response.result.refined}"`);

            if (response.result.metadata) {
              console.log('\n📊 Metadata:');
              console.log(`   Domain: ${response.result.metadata.domain}`);
              console.log(`   Template: ${response.result.metadata.templateUsed || 'None'}`);
            }

            if (response.result.score) {
              console.log('\n📈 Quality Score:');
              Object.entries(response.result.score).forEach(([key, value]) => {
                const percentage = Math.round(value * 100);
                const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
                console.log(`   ${key.padEnd(12)}: ${bar} ${percentage}%`);
              });
            }

            console.log('\n✅ Process prompt test PASSED!');
            resolve();
          }
        } catch (error) {
          // Ignore non-JSON output
        }
      }
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Server error: ${error.message}`));
    });
  });
}

// Run the test
testProcessPrompt()
  .then(() => {
    console.log('\n🎊 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n💡 Usage: node test-process-prompt.cjs "your prompt" "domain"');
    console.error('   Domains: sql, branding, cine, saas, devops, general');
    process.exit(1);
  });