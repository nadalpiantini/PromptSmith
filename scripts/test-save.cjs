#!/usr/bin/env node

// PromptSmith MCP - Save Prompt Test
// Tests saving prompts to sujeto10 database

const { spawn } = require('child_process');

const testRefined = process.argv[2] || 'Write a comprehensive SQL query to retrieve all active users with their profile information, including proper JOIN operations and performance-optimized WHERE conditions.';
const testOriginal = process.argv[3] || 'make me a sql query for users';

console.log('💾 PromptSmith MCP - Save Prompt Test');
console.log('====================================');
console.log(`💎 Refined: "${testRefined}"`);
console.log(`📝 Original: "${testOriginal}"\n`);

async function testSavePrompt() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting PromptSmith server...');

    const server = spawn('node', ['dist/cli.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: require('path').resolve(__dirname, '..')
    });

    const timeout = setTimeout(() => {
      server.kill();
      reject(new Error('Test timeout'));
    }, 20000);

    server.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('PromptSmith MCP Server is ready!')) {
        console.log('✅ Server ready, sending save request...');
        console.log('📡 Connecting to sujeto10 database...');

        // Send save_prompt request
        const request = {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "save_prompt",
            arguments: {
              refined: testRefined,
              original: testOriginal,
              metadata: {
                name: `Test Save ${new Date().toISOString()}`,
                domain: 'sql',
                description: 'Test prompt saved via CLI script',
                tags: ['test', 'cli', 'sql'],
                isPublic: false
              },
              score: {
                overall: 0.85,
                clarity: 0.90,
                specificity: 0.80,
                structure: 0.85,
                completeness: 0.85
              }
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
            reject(new Error(`Save error: ${response.error.message}`));
            return;
          }

          if (response.result && response.result.id) {
            clearTimeout(timeout);
            server.kill();

            console.log('\n🎉 Prompt save SUCCESS!');
            console.log('========================');
            console.log('💾 Saved to sujeto10 database:');
            console.log(`   📋 ID: ${response.result.id}`);
            console.log(`   📛 Name: ${response.result.name}`);
            console.log(`   🎨 Domain: ${response.result.domain}`);
            console.log(`   🏷️ Tags: ${response.result.tags?.join(', ') || 'None'}`);

            if (response.result.score) {
              console.log('\n📊 Quality Score Saved:');
              Object.entries(response.result.score).forEach(([key, value]) => {
                const percentage = Math.round(value * 100);
                console.log(`   ${key.padEnd(12)}: ${percentage}%`);
              });
            }

            console.log(`\n📅 Created: ${new Date(response.result.createdAt).toLocaleString()}`);
            console.log('\n🔗 Database: sujeto10.supabase.co');
            console.log('📋 Table: promptsmith_prompts');

            console.log('\n✅ Save prompt test PASSED!');
            console.log('💡 You can now search for this prompt or view it in Supabase dashboard');
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
testSavePrompt()
  .then(() => {
    console.log('\n🎊 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('   - Check your sujeto10 Supabase credentials in .env');
    console.error('   - Verify database schema is applied');
    console.error('   - Check network connectivity');
    console.error('\n💡 Usage: node test-save.cjs "refined prompt" "original prompt"');
    process.exit(1);
  });