#!/usr/bin/env node

// PromptSmith MCP - Direct JSON-RPC Test Interface
// Opción 1: Comunicación directa con el MCP server vía JSON-RPC

const { spawn } = require('child_process');
const readline = require('readline');

console.log('🚀 PromptSmith MCP - Direct JSON-RPC Interface');
console.log('===============================================\n');

class PromptSmithTester {
  constructor() {
    this.server = null;
    this.requestId = 1;
    this.pendingRequests = new Map();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🔧 Starting PromptSmith MCP Server...');

    this.server = spawn('node', ['dist/cli.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    this.server.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('PromptSmith MCP Server is ready!')) {
        console.log('✅ Server is ready!\n');
        this.showMenu();
      } else if (text.includes('❌') || text.includes('Error:')) {
        console.log('🚨 Server Error:', text);
      } else {
        console.log('📡 Server:', text.trim());
      }
    });

    this.server.stdout.on('data', (data) => {
      const text = data.toString().trim();
      if (text) {
        try {
          const response = JSON.parse(text);
          this.handleResponse(response);
        } catch (error) {
          console.log('📥 Server Output:', text);
        }
      }
    });

    this.server.on('error', (error) => {
      console.error('❌ Server Error:', error.message);
      this.cleanup();
    });

    this.server.on('close', (code) => {
      console.log(`\n📡 Server closed with code ${code}`);
      this.cleanup();
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      this.cleanup();
    });
  }

  handleResponse(response) {
    console.log('\n📥 Response received:');
    console.log('====================');

    if (response.error) {
      console.log('❌ Error:', response.error.message);
      if (response.error.data) {
        console.log('   Details:', JSON.stringify(response.error.data, null, 2));
      }
    } else if (response.result) {
      if (response.result.tools) {
        // Tools list response
        console.log(`✅ Available Tools (${response.result.tools.length}):`);
        response.result.tools.forEach((tool, i) => {
          console.log(`   ${i + 1}. ${tool.name} - ${tool.description}`);
        });
      } else if (response.result.refined) {
        // Process prompt response
        console.log('✅ Prompt Processing Result:');
        console.log('   Original:', response.result.original);
        console.log('   Refined:', response.result.refined);
        console.log('   Domain:', response.result.metadata?.domain);
        if (response.result.score) {
          console.log('   Quality Score:', JSON.stringify(response.result.score, null, 2));
        }
      } else if (response.result.score) {
        // Evaluate prompt response
        console.log('✅ Prompt Evaluation Result:');
        console.log('   Quality Score:', JSON.stringify(response.result.score, null, 2));
        console.log('   Suggestions:', response.result.suggestions || 'None');
      } else if (response.result.results) {
        // Search results
        console.log(`✅ Search Results (${response.result.results.length} found):`);
        response.result.results.forEach((result, i) => {
          console.log(`   ${i + 1}. ${result.name} (${result.domain})`);
          console.log(`      Score: ${result.score?.overall || 'N/A'}`);
        });
      } else {
        // Generic result
        console.log('✅ Result:', JSON.stringify(response.result, null, 2));
      }
    }

    console.log('\n' + '='.repeat(50));
    this.showMenu();
  }

  sendRequest(method, params = {}) {
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: method,
      params: params
    };

    console.log('\n📤 Sending request:');
    console.log('===================');
    console.log(JSON.stringify(request, null, 2));

    this.server.stdin.write(JSON.stringify(request) + '\n');
  }

  showMenu() {
    console.log('\n🎯 PromptSmith MCP Test Menu:');
    console.log('=============================');
    console.log('1. List available tools');
    console.log('2. Process a prompt (SQL domain)');
    console.log('3. Process a prompt (Branding domain)');
    console.log('4. Process a prompt (Custom domain)');
    console.log('5. Evaluate prompt quality');
    console.log('6. Save refined prompt');
    console.log('7. Search saved prompts');
    console.log('8. Compare two prompts');
    console.log('9. Get domain templates');
    console.log('10. Get usage statistics');
    console.log('0. Exit');
    console.log('');

    if (this.rl && !this.rl.closed) {
      this.rl.question('🎮 Choose an option (0-10): ', (answer) => {
        this.handleMenuChoice(answer.trim());
      });
    }
  }

  async handleMenuChoice(choice) {
    switch (choice) {
      case '1':
        this.sendRequest('tools/list');
        break;

      case '2':
        this.rl.question('Enter SQL prompt to optimize: ', (prompt) => {
          this.sendRequest('tools/call', {
            name: 'process_prompt',
            arguments: {
              raw: prompt || 'make me a sql query for users',
              domain: 'sql',
              tone: 'professional'
            }
          });
        });
        break;

      case '3':
        this.rl.question('Enter branding prompt to optimize: ', (prompt) => {
          this.sendRequest('tools/call', {
            name: 'process_prompt',
            arguments: {
              raw: prompt || 'create brand strategy',
              domain: 'branding',
              tone: 'creative'
            }
          });
        });
        break;

      case '4':
        this.rl.question('Enter prompt: ', (prompt) => {
          this.rl.question('Enter domain (sql/branding/cine/saas/devops/general): ', (domain) => {
            this.sendRequest('tools/call', {
              name: 'process_prompt',
              arguments: {
                raw: prompt || 'help me with this task',
                domain: domain || 'general',
                tone: 'professional'
              }
            });
          });
        });
        break;

      case '5':
        this.rl.question('Enter prompt to evaluate: ', (prompt) => {
          this.sendRequest('tools/call', {
            name: 'evaluate_prompt',
            arguments: {
              prompt: prompt || 'SELECT * FROM users WHERE active = true',
              domain: 'sql'
            }
          });
        });
        break;

      case '6':
        console.log('💾 Save Prompt - Enter details:');
        this.rl.question('Refined prompt: ', (refined) => {
          this.rl.question('Original prompt: ', (original) => {
            this.rl.question('Name: ', (name) => {
              this.rl.question('Domain: ', (domain) => {
                this.sendRequest('tools/call', {
                  name: 'save_prompt',
                  arguments: {
                    refined: refined || 'Optimized prompt text here',
                    original: original || 'Original prompt text',
                    metadata: {
                      name: name || 'Test Prompt',
                      domain: domain || 'general',
                      description: 'Test save from direct interface'
                    },
                    score: {
                      overall: 0.8,
                      clarity: 0.9,
                      specificity: 0.7,
                      structure: 0.8,
                      completeness: 0.8
                    }
                  }
                });
              });
            });
          });
        });
        break;

      case '7':
        this.rl.question('Search query (or press enter for all): ', (query) => {
          this.rl.question('Domain filter (or press enter for all): ', (domain) => {
            this.sendRequest('tools/call', {
              name: 'search_prompts',
              arguments: {
                query: query || '',
                domain: domain || undefined,
                limit: 10
              }
            });
          });
        });
        break;

      case '8':
        console.log('🔍 Compare Prompts:');
        this.rl.question('First prompt: ', (prompt1) => {
          this.rl.question('Second prompt: ', (prompt2) => {
            this.sendRequest('tools/call', {
              name: 'compare_prompts',
              arguments: {
                prompt1: prompt1 || 'make query',
                prompt2: prompt2 || 'SELECT * FROM users',
                domain: 'sql'
              }
            });
          });
        });
        break;

      case '9':
        this.rl.question('Domain for templates (sql/branding/cine/saas/devops/general): ', (domain) => {
          this.sendRequest('tools/call', {
            name: 'get_templates',
            arguments: {
              domain: domain || 'general'
            }
          });
        });
        break;

      case '10':
        this.sendRequest('tools/call', {
          name: 'get_stats',
          arguments: {}
        });
        break;

      case '0':
        console.log('👋 Goodbye!');
        this.cleanup();
        break;

      default:
        console.log('❌ Invalid option. Please choose 0-10.');
        this.showMenu();
        break;
    }
  }

  cleanup() {
    if (this.server) {
      this.server.kill();
      this.server = null;
    }
    if (this.rl) {
      this.rl.close();
    }
    process.exit(0);
  }
}

// Start the tester
const tester = new PromptSmithTester();
tester.start().catch(console.error);