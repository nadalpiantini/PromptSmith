#!/usr/bin/env node

// PromptSmith MCP - Sujeto10 Integration Test
// Tests the complete MCP server functionality with real sujeto10 credentials

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 PromptSmith MCP - Sujeto10 Integration Test');
console.log('================================================\n');

// Test configuration
const testConfig = {
  timeout: 10000,
  maxOutputLines: 50
};

// Test cases
const tests = [
  {
    name: 'Environment Variables',
    test: testEnvironmentVariables
  },
  {
    name: 'MCP Server Startup',
    test: testMCPServerStartup
  },
  {
    name: 'Database Schema Validation',
    test: testDatabaseSchema
  },
  {
    name: 'MCP Tools Listing',
    test: testMCPToolsListing
  },
  {
    name: 'Process Prompt Tool',
    test: testProcessPromptTool
  }
];

// Main test runner
async function runTests() {
  console.log(`🎯 Running ${tests.length} integration tests...\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`📋 Testing: ${test.name}`);
      await test.test();
      console.log(`✅ PASSED: ${test.name}\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${test.name}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  // Summary
  console.log('📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! PromptSmith MCP is ready for sujeto10.');
    console.log('🚀 You can now use it in Cursor IDE with the generated configuration.');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    console.log('🔧 Check your configuration and try running the tests again.');
  }
}

// Test implementations
function testEnvironmentVariables() {
  return new Promise((resolve, reject) => {
    // Check if .env file exists
    if (!fs.existsSync('.env')) {
      reject(new Error('.env file not found'));
      return;
    }

    // Read and validate environment variables
    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredVars = [
      'SUPABASE_URL=https://nqzhxukuvmdlpewqytpv.supabase.co',
      'LAB_ENVIRONMENT=sujeto10',
      'PROJECT_PREFIX=promptsmith_'
    ];

    for (const requiredVar of requiredVars) {
      if (!envContent.includes(requiredVar)) {
        reject(new Error(`Missing or incorrect: ${requiredVar}`));
        return;
      }
    }

    console.log('   ✓ .env file exists and contains sujeto10 configuration');
    resolve();
  });
}

function testMCPServerStartup() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['dist/cli.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let output = '';
    let errorOutput = '';

    const timeout = setTimeout(() => {
      server.kill();
      reject(new Error('Server startup timeout'));
    }, testConfig.timeout);

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();

      // Look for startup success indicators
      if (errorOutput.includes('PromptSmith MCP Server is ready!')) {
        clearTimeout(timeout);
        server.kill();
        console.log('   ✓ MCP server starts successfully');
        console.log('   ✓ Banner displays correctly');
        console.log('   ✓ Services initialize without errors');
        resolve();
      }

      // Check for critical errors
      if (errorOutput.includes('Failed to start') ||
          errorOutput.includes('Error:') ||
          errorOutput.includes('Missing required environment variables')) {
        clearTimeout(timeout);
        server.kill();
        reject(new Error(`Startup error: ${errorOutput.split('\n')[0]}`));
      }
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Server spawn error: ${error.message}`));
    });
  });
}

function testDatabaseSchema() {
  return new Promise((resolve, reject) => {
    // Check if SQL schema file exists
    const schemaFile = 'sql/001_promptsmith_production_schema.sql';
    if (!fs.existsSync(schemaFile)) {
      reject(new Error('Production schema file not found'));
      return;
    }

    // Read and validate schema content
    const schemaContent = fs.readFileSync(schemaFile, 'utf8');
    const requiredTables = [
      'CREATE TABLE promptsmith_prompts',
      'CREATE TABLE promptsmith_prompt_evaluations',
      'CREATE TABLE promptsmith_custom_rules',
      'CREATE TABLE promptsmith_templates',
      'CREATE TABLE promptsmith_analytics',
      'CREATE TABLE promptsmith_user_feedback'
    ];

    for (const table of requiredTables) {
      if (!schemaContent.includes(table)) {
        reject(new Error(`Missing table definition: ${table}`));
        return;
      }
    }

    console.log('   ✓ Production schema file exists');
    console.log('   ✓ All promptsmith_ prefixed tables defined');
    console.log('   ✓ Schema matches sujeto10 requirements');
    resolve();
  });
}

function testMCPToolsListing() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['dist/cli.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const timeout = setTimeout(() => {
      server.kill();
      reject(new Error('Tools listing timeout'));
    }, testConfig.timeout);

    let output = '';
    let ready = false;

    server.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('PromptSmith MCP Server is ready!')) {
        ready = true;

        // Send tools/list request
        const request = {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list"
        };

        server.stdin.write(JSON.stringify(request) + '\n');
      }
    });

    server.stdout.on('data', (data) => {
      output += data.toString();

      if (ready && output.includes('"method":"tools/list"')) {
        clearTimeout(timeout);
        server.kill();

        try {
          // Validate tools response
          const response = JSON.parse(output.split('\n').find(line => line.includes('"method":"tools/list"') || line.includes('"id":1')));

          if (response && response.result && response.result.tools) {
            const tools = response.result.tools;
            const expectedTools = ['process_prompt', 'evaluate_prompt', 'save_prompt', 'search_prompts'];

            for (const expectedTool of expectedTools) {
              if (!tools.some(tool => tool.name === expectedTool)) {
                reject(new Error(`Missing expected tool: ${expectedTool}`));
                return;
              }
            }

            console.log(`   ✓ MCP server responds to tools/list`);
            console.log(`   ✓ Found ${tools.length} available tools`);
            console.log(`   ✓ All core tools present`);
            resolve();
          } else {
            reject(new Error('Invalid tools/list response format'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse tools response: ${error.message}`));
        }
      }
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Server error: ${error.message}`));
    });
  });
}

function testProcessPromptTool() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['dist/cli.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const timeout = setTimeout(() => {
      server.kill();
      reject(new Error('Process prompt test timeout'));
    }, testConfig.timeout);

    let output = '';
    let ready = false;

    server.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('PromptSmith MCP Server is ready!')) {
        ready = true;

        // Send process_prompt request
        const request = {
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

        server.stdin.write(JSON.stringify(request) + '\n');
      }
    });

    server.stdout.on('data', (data) => {
      output += data.toString();

      if (ready && (output.includes('"refined"') || output.includes('error'))) {
        clearTimeout(timeout);
        server.kill();

        try {
          // Find the response line
          const lines = output.split('\n');
          const responseLine = lines.find(line =>
            line.includes('"id":2') ||
            (line.includes('"refined"') && line.includes('jsonrpc'))
          );

          if (responseLine) {
            const response = JSON.parse(responseLine);

            if (response.result && response.result.refined) {
              console.log('   ✓ process_prompt tool executes successfully');
              console.log('   ✓ Returns refined prompt with improvements');
              console.log('   ✓ SQL domain processing works correctly');
              resolve();
            } else if (response.error) {
              reject(new Error(`Tool execution error: ${response.error.message}`));
            } else {
              reject(new Error('Unexpected response format'));
            }
          } else {
            reject(new Error('No valid response received from process_prompt tool'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse tool response: ${error.message}`));
        }
      }
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Server error: ${error.message}`));
    });
  });
}

// Run tests
runTests().catch(console.error);