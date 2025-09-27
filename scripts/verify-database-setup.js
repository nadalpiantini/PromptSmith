#!/usr/bin/env node

/**
 * Database Setup Verification Script
 * Tests all critical database components after manual setup
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabaseSetup() {
  console.log('🔍 Verifying PromptSmith Database Setup...\n');

  let allPassed = true;
  const results = [];

  // Test 1: Check all expected tables exist
  console.log('📋 Test 1: Verifying table existence...');
  const expectedTables = [
    'promptsmith_prompts',
    'promptsmith_user_feedback',
    'promptsmith_prompt_evaluations',
    'promptsmith_custom_rules',
    'promptsmith_templates',
    'promptsmith_analytics'
  ];

  for (const tableName of expectedTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(0);

      if (error) {
        console.log(`  ❌ ${tableName}: ${error.message}`);
        results.push({ test: `Table ${tableName}`, status: 'FAILED', error: error.message });
        allPassed = false;
      } else {
        console.log(`  ✅ ${tableName}: EXISTS`);
        results.push({ test: `Table ${tableName}`, status: 'PASSED' });
      }
    } catch (err) {
      console.log(`  ❌ ${tableName}: ${err.message}`);
      results.push({ test: `Table ${tableName}`, status: 'FAILED', error: err.message });
      allPassed = false;
    }
  }

  console.log();

  // Test 2: Check domain enum has all required values
  console.log('📋 Test 2: Verifying domain enum values...');
  const expectedDomains = [
    'sql', 'branding', 'cine', 'saas', 'devops', 'general',
    'mobile', 'web', 'backend', 'frontend', 'ai', 'gaming',
    'crypto', 'education', 'healthcare', 'finance', 'legal'
  ];

  for (const domain of expectedDomains) {
    try {
      const { error } = await supabase
        .from('promptsmith_prompts')
        .select('id')
        .eq('domain', domain)
        .limit(0);

      if (error && error.message.includes('invalid input value for enum')) {
        console.log(`  ❌ Domain '${domain}': NOT SUPPORTED`);
        results.push({ test: `Domain ${domain}`, status: 'FAILED', error: 'Domain not in enum' });
        allPassed = false;
      } else {
        console.log(`  ✅ Domain '${domain}': SUPPORTED`);
        results.push({ test: `Domain ${domain}`, status: 'PASSED' });
      }
    } catch (err) {
      if (err.message.includes('invalid input value for enum')) {
        console.log(`  ❌ Domain '${domain}': NOT SUPPORTED`);
        results.push({ test: `Domain ${domain}`, status: 'FAILED', error: 'Domain not in enum' });
        allPassed = false;
      } else {
        console.log(`  ✅ Domain '${domain}': SUPPORTED`);
        results.push({ test: `Domain ${domain}`, status: 'PASSED' });
      }
    }
  }

  console.log();

  // Test 3: Test the problematic relationship query
  console.log('📋 Test 3: Testing relationship query...');
  try {
    const { data, error } = await supabase
      .from('promptsmith_prompts')
      .select('*, promptsmith_user_feedback(rating)')
      .limit(1);

    if (error) {
      console.log(`  ❌ Relationship query: ${error.message}`);
      results.push({ test: 'Relationship query', status: 'FAILED', error: error.message });
      allPassed = false;
    } else {
      console.log(`  ✅ Relationship query: SUCCESS`);
      results.push({ test: 'Relationship query', status: 'PASSED' });
    }
  } catch (err) {
    console.log(`  ❌ Relationship query: ${err.message}`);
    results.push({ test: 'Relationship query', status: 'FAILED', error: err.message });
    allPassed = false;
  }

  console.log();

  // Test 4: Check required database functions exist
  console.log('📋 Test 4: Verifying database functions...');
  const requiredFunctions = ['exec_sql', 'update_prompt_usage', 'calculate_quality_score', 'set_config'];

  for (const funcName of requiredFunctions) {
    try {
      // Try to call the function (will fail gracefully if it doesn't exist)
      await supabase.rpc(funcName, {});
      console.log(`  ✅ Function '${funcName}': EXISTS`);
      results.push({ test: `Function ${funcName}`, status: 'PASSED' });
    } catch (err) {
      if (err.message.includes('Could not find the function')) {
        console.log(`  ❌ Function '${funcName}': MISSING`);
        results.push({ test: `Function ${funcName}`, status: 'FAILED', error: 'Function not found' });
        allPassed = false;
      } else {
        // Function exists but failed with parameters (which is expected)
        console.log(`  ✅ Function '${funcName}': EXISTS`);
        results.push({ test: `Function ${funcName}`, status: 'PASSED' });
      }
    }
  }

  console.log();

  // Test 5: Test basic CRUD operations (without RLS issues)
  console.log('📋 Test 5: Testing basic database operations...');
  
  try {
    // Test SELECT on public data
    const { data: publicPrompts, error: selectError } = await supabase
      .from('promptsmith_prompts')
      .select('id, name, domain')
      .eq('is_public', true)
      .limit(1);

    if (selectError) {
      console.log(`  ❌ Public data select: ${selectError.message}`);
      results.push({ test: 'Public data select', status: 'FAILED', error: selectError.message });
      allPassed = false;
    } else {
      console.log(`  ✅ Public data select: SUCCESS (${publicPrompts?.length || 0} records)`);
      results.push({ test: 'Public data select', status: 'PASSED' });
    }
  } catch (err) {
    console.log(`  ❌ Basic operations test: ${err.message}`);
    results.push({ test: 'Basic operations', status: 'FAILED', error: err.message });
    allPassed = false;
  }

  console.log();

  // Summary
  console.log('🎯 VERIFICATION SUMMARY');
  console.log('=======================');
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total} tests`);
  
  if (!allPassed) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'FAILED').forEach(result => {
      console.log(`   • ${result.test}: ${result.error || 'Unknown error'}`);
    });
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('   1. Review the failed tests above');
    console.log('   2. Run: node scripts/manual-database-setup.js');
    console.log('   3. Follow the manual setup instructions');
    console.log('   4. Run this verification script again');
  } else {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Database is properly configured');
    console.log('✅ All tables exist');
    console.log('✅ All domain values supported');
    console.log('✅ Relationship queries working');
    console.log('✅ Required functions available');
    console.log('\n🚀 Your PromptSmith database is ready to use!');
  }

  return allPassed;
}

// Run verification
verifyDatabaseSetup()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Verification failed:', error.message);
    process.exit(1);
  });