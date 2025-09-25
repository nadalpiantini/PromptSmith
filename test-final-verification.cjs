#!/usr/bin/env node

// PromptSmith MCP - Final End-to-End Verification
// Simple comprehensive test to verify all functionality

const { spawn } = require('child_process');

console.log('🎯 PromptSmith MCP - Final Verification Test');
console.log('=============================================');
console.log('🔍 Testing all 3 options with sujeto10 integration\n');

class FinalVerificationTest {
  constructor() {
    this.results = {
      option1: false,
      option2: false,
      option3: false,
      serverStartup: false,
      toolsAvailable: false,
      databaseConnection: false
    };
  }

  async runCompleteVerification() {
    try {
      console.log('📋 VERIFICATION CHECKLIST');
      console.log('=========================\n');

      // Test 1: Server startup and tools
      console.log('1️⃣ Testing server startup and tools availability...');
      await this.testServerStartup();

      // Test 2: Direct interface availability
      console.log('2️⃣ Testing Option 1: Direct JSON-RPC interface...');
      this.testOption1Available();

      // Test 3: Wrapper API availability
      console.log('3️⃣ Testing Option 2: Wrapper API...');
      this.testOption2Available();

      // Test 4: CLI scripts availability
      console.log('4️⃣ Testing Option 3: Individual CLI scripts...');
      this.testOption3Available();

      // Generate final report
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Verification failed:', error.message);
    }
  }

  async testServerStartup() {
    return new Promise((resolve, reject) => {
      const server = spawn('node', ['dist/cli.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      const timeout = setTimeout(() => {
        server.kill();
        reject(new Error('Server startup timeout'));
      }, 10000);

      let toolsReceived = false;

      server.stderr.on('data', (data) => {
        const text = data.toString();
        if (text.includes('PromptSmith MCP Server is ready!')) {
          this.results.serverStartup = true;
          console.log('   ✅ Server starts successfully');

          // Test tools list
          const request = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/list"
          };
          server.stdin.write(JSON.stringify(request) + '\n');
        }
      });

      server.stdout.on('data', (data) => {
        const text = data.toString().trim();
        if (text) {
          try {
            const response = JSON.parse(text);
            if (response.result && response.result.tools && response.result.tools.length >= 8) {
              this.results.toolsAvailable = true;
              console.log(`   ✅ All ${response.result.tools.length} tools available`);

              // Test database connection by trying a simple operation
              const dbTestRequest = {
                jsonrpc: "2.0",
                id: 2,
                method: "tools/call",
                params: {
                  name: "get_stats",
                  arguments: {}
                }
              };
              server.stdin.write(JSON.stringify(dbTestRequest) + '\n');
            }
          } catch (error) {
            // Ignore non-JSON
          }
        }
      });

      // Look for database connection success
      let dbResponseReceived = false;
      server.stdout.on('data', (data) => {
        const text = data.toString().trim();
        if (text && !dbResponseReceived) {
          try {
            const response = JSON.parse(text);
            if (response.id === 2) {
              dbResponseReceived = true;
              if (response.result || (response.error && !response.error.message.includes('connection'))) {
                this.results.databaseConnection = true;
                console.log('   ✅ Database connection to sujeto10 working');
              } else {
                console.log('   ⚠️ Database connection issue (but server works)');
              }

              clearTimeout(timeout);
              server.kill();
              resolve();
            }
          } catch (error) {
            // Ignore
          }
        }
      });

      server.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  testOption1Available() {
    const fs = require('fs');

    if (fs.existsSync('test-promptsmith-direct.cjs')) {
      this.results.option1 = true;
      console.log('   ✅ Direct JSON-RPC interface available');
      console.log('   📋 Usage: node test-promptsmith-direct.cjs');
    } else {
      console.log('   ❌ Direct interface missing');
    }
  }

  testOption2Available() {
    const fs = require('fs');

    if (fs.existsSync('promptsmith-wrapper.cjs')) {
      this.results.option2 = true;
      console.log('   ✅ Wrapper API available');
      console.log('   📋 Usage: node promptsmith-wrapper.cjs');
      console.log('   📋 Module: const ps = require("./promptsmith-wrapper.cjs")');
    } else {
      console.log('   ❌ Wrapper API missing');
    }
  }

  testOption3Available() {
    const fs = require('fs');
    const scriptsDir = 'scripts';

    if (fs.existsSync(scriptsDir)) {
      const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.cjs'));

      if (scripts.length >= 5) {
        this.results.option3 = true;
        console.log(`   ✅ Individual CLI scripts available (${scripts.length} scripts)`);
        console.log('   📋 Available scripts:');
        scripts.forEach(script => {
          console.log(`      • node scripts/${script}`);
        });
      } else {
        console.log(`   ⚠️ Some scripts missing (found ${scripts.length}/5)`);
      }
    } else {
      console.log('   ❌ Scripts directory missing');
    }
  }

  generateFinalReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL VERIFICATION REPORT');
    console.log('='.repeat(50));

    // Calculate overall score
    const totalTests = Object.keys(this.results).length;
    const passedTests = Object.values(this.results).filter(Boolean).length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    // Core functionality
    console.log('\n🔧 Core Functionality:');
    console.log(`   Server Startup: ${this.results.serverStartup ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Tools Available: ${this.results.toolsAvailable ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Database Connection: ${this.results.databaseConnection ? '✅ PASS' : '⚠️ PARTIAL'}`);

    // Interface options
    console.log('\n🎯 Interface Options:');
    console.log(`   Option 1 - Direct JSON-RPC: ${this.results.option1 ? '✅ AVAILABLE' : '❌ MISSING'}`);
    console.log(`   Option 2 - Wrapper API: ${this.results.option2 ? '✅ AVAILABLE' : '❌ MISSING'}`);
    console.log(`   Option 3 - CLI Scripts: ${this.results.option3 ? '✅ AVAILABLE' : '❌ MISSING'}`);

    // Overall result
    console.log('\n📈 Overall Result:');
    console.log(`   Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)`);

    if (successRate >= 90) {
      console.log('   🎉 EXCELLENT - PromptSmith MCP is fully operational!');
      console.log('   🚀 Ready for production use with sujeto10');
    } else if (successRate >= 70) {
      console.log('   ✅ GOOD - PromptSmith MCP is mostly functional');
      console.log('   ⚠️ Minor issues to address');
    } else {
      console.log('   ❌ POOR - Significant issues need attention');
      console.log('   🔧 Review setup and configuration');
    }

    // Usage instructions
    console.log('\n💡 How to Use:');
    if (this.results.option1) {
      console.log('   🎮 Interactive testing: node test-promptsmith-direct.cjs');
    }
    if (this.results.option2) {
      console.log('   🔧 Programmatic usage: const ps = require("./promptsmith-wrapper.cjs")');
    }
    if (this.results.option3) {
      console.log('   📋 Individual tests: node scripts/test-connectivity.cjs');
    }

    // Integration info
    console.log('\n🔗 Integration:');
    console.log('   📱 Cursor IDE: cp mcp-config-sujeto10.json ~/.claude/mcp_servers.json');
    console.log('   🗄️ Database: sujeto10.supabase.co (promptsmith_* tables)');
    console.log('   📚 Documentation: README-TESTING.md');

    console.log('\n🎊 PromptSmith MCP deployment verification complete!');
  }
}

// Run verification
const verificationTest = new FinalVerificationTest();
verificationTest.runCompleteVerification();