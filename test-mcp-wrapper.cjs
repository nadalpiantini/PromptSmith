#!/usr/bin/env node

// Test script for MCP wrapper communication
const PromptSmithWrapper = require('./promptsmith-wrapper.cjs');

async function testMCPWrapper() {
  console.log('🧪 Testing MCP Wrapper Communication...');
  console.log('=====================================');
  
  const wrapper = new PromptSmithWrapper();
  
  try {
    console.log('📡 Step 1: Starting MCP server...');
    await wrapper.ensureServerReady();
    console.log('✅ MCP server started successfully!\n');
    
    console.log('🎯 Step 2: Testing process_prompt...');
    const result = await wrapper.processPrompt(
      'create a simple login form', 
      'backend', 
      'professional'
    );
    
    console.log('📊 Result received:');
    console.log('- Original:', result.original);
    console.log('- Refined:', result.refined);
    console.log('- Score:', result.score?.overall || 'N/A');
    console.log('- Domain:', result.metadata?.domain || 'N/A');
    
    console.log('\n✅ MCP Wrapper test completed successfully!');
    
    // Clean shutdown
    if (wrapper.server) {
      wrapper.server.kill();
    }
    
  } catch (error) {
    console.error('❌ MCP Wrapper test failed:', error.message);
    console.error('Stack:', error.stack);
    
    if (wrapper.server) {
      wrapper.server.kill();
    }
    
    process.exit(1);
  }
}

testMCPWrapper();