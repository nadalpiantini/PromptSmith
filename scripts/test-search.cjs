#!/usr/bin/env node

// PromptSmith MCP - Search Prompts Test
// Tests searching saved prompts in sujeto10 database

const { spawn } = require('child_process');

const searchQuery = process.argv[2] || '';
const searchDomain = process.argv[3] || '';

console.log('🔍 PromptSmith MCP - Search Prompts Test');
console.log('=======================================');
console.log(`🔎 Query: "${searchQuery || 'ALL'}"}`);
console.log(`🎨 Domain: ${searchDomain || 'ALL'}\n`);

async function testSearchPrompts() {
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

    server.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('PromptSmith MCP Server is ready!')) {
        console.log('✅ Server ready, searching sujeto10 database...');

        // Send search_prompts request
        const request = {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "search_prompts",
            arguments: {
              query: searchQuery,
              domain: searchDomain || undefined,
              limit: 10,
              sortBy: 'created',
              sortOrder: 'desc'
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
            reject(new Error(`Search error: ${response.error.message}`));
            return;
          }

          if (response.result && response.result.results !== undefined) {
            clearTimeout(timeout);
            server.kill();

            const results = response.result.results;
            const total = response.result.total || results.length;

            console.log('\n🎉 Search completed successfully!');
            console.log('==================================');
            console.log(`📊 Found ${results.length} results (total: ${total})`);

            if (results.length === 0) {
              console.log('\n📭 No prompts found matching your criteria');
              console.log('💡 Try:');
              console.log('   - Broader search terms');
              console.log('   - Different domain filter');
              console.log('   - Saving some prompts first with test-save.cjs');
            } else {
              console.log('\n📋 Search Results:');
              console.log('==================');

              results.forEach((result, i) => {
                console.log(`\n${i + 1}. 📄 ${result.name || 'Unnamed'}`);
                console.log(`   🆔 ID: ${result.id}`);
                console.log(`   🎨 Domain: ${result.domain}`);
                console.log(`   📊 Score: ${Math.round((result.score?.overall || 0) * 100)}%`);

                if (result.description) {
                  console.log(`   📝 Description: ${result.description}`);
                }

                if (result.tags && result.tags.length > 0) {
                  console.log(`   🏷️ Tags: ${result.tags.join(', ')}`);
                }

                console.log(`   📅 Created: ${new Date(result.createdAt).toLocaleDateString()}`);

                if (result.prompt) {
                  const preview = result.prompt.length > 100
                    ? result.prompt.substring(0, 97) + '...'
                    : result.prompt;
                  console.log(`   💬 Preview: "${preview}"`);
                }

                if (result.usage) {
                  console.log(`   🔄 Used: ${result.usage.count || 0} times`);
                }
              });

              console.log('\n📈 Search Statistics:');
              const domains = [...new Set(results.map(r => r.domain))];
              console.log(`   🎨 Domains found: ${domains.join(', ')}`);

              const avgScore = results.reduce((sum, r) => sum + (r.score?.overall || 0), 0) / results.length;
              console.log(`   📊 Average quality: ${Math.round(avgScore * 100)}%`);

              const totalUsage = results.reduce((sum, r) => sum + (r.usage?.count || 0), 0);
              console.log(`   🔄 Total usage: ${totalUsage} times`);
            }

            console.log('\n✅ Search prompts test PASSED!');
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
testSearchPrompts()
  .then(() => {
    console.log('\n🎊 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('   - No prompts saved in database yet');
    console.error('   - Database connection issues');
    console.error('   - Check sujeto10 Supabase credentials');
    console.error('\n💡 Usage: node test-search.cjs "search term" "domain"');
    console.error('   Domains: sql, branding, cine, saas, devops, general');
    console.error('   Examples:');
    console.error('     node test-search.cjs "sql" "sql"');
    console.error('     node test-search.cjs "auth"');
    console.error('     node test-search.cjs "" "branding"');
    process.exit(1);
  });