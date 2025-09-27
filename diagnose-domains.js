#!/usr/bin/env node

/**
 * Domain Diagnosis Script
 * Checks exactly which domains are supported in the database vs code
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

// TypeScript domains from enum
const typeScriptDomains = [
  'sql',
  'branding',
  'cine',
  'saas',
  'devops',
  'general',
  'mobile',
  'web',
  'backend',
  'frontend',
  'ai',
  'gaming',
  'crypto',
  'education',
  'healthcare',
  'finance',
  'legal'
];

async function diagnoseDomainsStatus() {
  console.log('🔍 DOMAIN DIAGNOSIS - PromptSmith\n');
  
  console.log('📝 Domains defined in TypeScript (17 total):');
  typeScriptDomains.forEach((domain, i) => {
    console.log(`  ${i + 1}. ${domain}`);
  });
  
  console.log('\n🗄️  Testing database domain support...\n');

  // Test each domain by attempting insert
  const supportedDomains = [];
  const unsupportedDomains = [];
  
  for (const domain of typeScriptDomains) {
    try {
      console.log(`Testing domain: ${domain}...`);
      
      const testData = {
        name: `Test ${domain}`,
        domain: domain,
        raw_prompt: 'Test prompt',
        refined_prompt: 'Test prompt refined',
        template_type: 'basic',
        quality_score: { overall: 0.8, clarity: 0.8, specificity: 0.8, structure: 0.8, completeness: 0.8 }
      };
      
      const { data, error } = await client
        .from('promptsmith_prompts')
        .insert(testData)
        .select('id')
        .single();
      
      if (error) {
        console.log(`  ❌ ${domain} - FAILED: ${error.message}`);
        unsupportedDomains.push({ domain, error: error.message });
      } else {
        console.log(`  ✅ ${domain} - SUCCESS`);
        supportedDomains.push(domain);
        
        // Clean up test data
        await client
          .from('promptsmith_prompts')
          .delete()
          .eq('id', data.id);
      }
      
    } catch (error) {
      console.log(`  ❌ ${domain} - ERROR: ${error.message}`);
      unsupportedDomains.push({ domain, error: error.message });
    }
  }
  
  console.log('\n📊 DIAGNOSIS RESULTS\n');
  console.log(`✅ Supported domains (${supportedDomains.length}/${typeScriptDomains.length}):`);
  supportedDomains.forEach(domain => console.log(`   - ${domain}`));
  
  if (unsupportedDomains.length > 0) {
    console.log(`\n❌ Unsupported domains (${unsupportedDomains.length}/${typeScriptDomains.length}):`);
    unsupportedDomains.forEach(({ domain, error }) => {
      console.log(`   - ${domain}: ${error}`);
    });
  }
  
  // Check database enum values directly
  console.log('\n🔍 Querying database enum values...');
  try {
    const { data, error } = await client.rpc('get_enum_values', { enum_name: 'domain_type' });
    if (data) {
      console.log('📋 Current database enum values:');
      data.forEach(value => console.log(`   - ${value}`));
    } else if (error) {
      console.log('⚠️  Cannot query enum values directly, trying alternate method...');
      
      // Try to get schema information
      const schemaQuery = `
        SELECT unnest(enum_range(NULL::domain_type)) as domain_value;
      `;
      
      try {
        const { data: enumData, error: enumError } = await client.rpc('exec_query', { query: schemaQuery });
        if (enumData) {
          console.log('📋 Database enum values (from enum_range):');
          enumData.forEach(row => console.log(`   - ${row.domain_value}`));
        }
      } catch (altError) {
        console.log('⚠️  Cannot access enum values - insufficient permissions');
      }
    }
  } catch (enumError) {
    console.log('⚠️  Cannot access enum information');
  }
  
  console.log('\n🎯 RECOMMENDATIONS');
  if (unsupportedDomains.length === 0) {
    console.log('✨ All domains are supported! Migration is complete.');
  } else {
    console.log('🔧 Migration is needed. Run the domain migration to fix this.');
    console.log('   Command: node run-domain-migration.js');
    
    // Show the fix-domain-enum.sql
    console.log('\n📋 The following SQL needs to be executed:');
    console.log('   (Content of fix-domain-enum.sql)');
  }
  
  console.log('\n✅ Diagnosis complete!');
}

// Run diagnosis
diagnoseDomainsStatus().catch(error => {
  console.error('❌ Diagnosis failed:', error.message);
  process.exit(1);
});