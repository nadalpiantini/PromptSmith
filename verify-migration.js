#!/usr/bin/env node

/**
 * Verification Script
 * Verifies that the domain migration worked correctly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

const allDomains = [
  'sql', 'branding', 'cine', 'saas', 'devops', 'general',
  'mobile', 'web', 'backend', 'frontend', 'ai', 'gaming', 
  'crypto', 'education', 'healthcare', 'finance', 'legal'
];

async function verifyMigration() {
  try {
    console.log('🔍 Verifying domain migration...\n');
    
    const results = {
      supported: [],
      unsupported: [],
      errors: []
    };
    
    for (const domain of allDomains) {
      try {
        console.log(`Testing domain: ${domain}...`);
        
        // Test by trying to use the domain in a query
        const { error } = await client
          .from('promptsmith_prompts')
          .select('id')
          .eq('domain', domain)
          .limit(1);
        
        if (error && error.message.includes('invalid input value for enum')) {
          console.log(`  ❌ ${domain} - NOT SUPPORTED`);
          results.unsupported.push(domain);
        } else if (error) {
          console.log(`  ⚠️  ${domain} - Other error: ${error.message}`);
          results.errors.push({ domain, error: error.message });
        } else {
          console.log(`  ✅ ${domain} - SUPPORTED`);
          results.supported.push(domain);
        }
        
      } catch (testError) {
        console.log(`  💥 ${domain} - Exception: ${testError.message}`);
        results.errors.push({ domain, error: testError.message });
      }
    }
    
    console.log('\n📊 VERIFICATION RESULTS\n');
    console.log(`✅ Supported domains: ${results.supported.length}/${allDomains.length}`);
    console.log('   ', results.supported.join(', '));
    
    if (results.unsupported.length > 0) {
      console.log(`\n❌ Unsupported domains: ${results.unsupported.length}`);
      console.log('   ', results.unsupported.join(', '));
    }
    
    if (results.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${results.errors.length}`);
      results.errors.forEach(({ domain, error }) => {
        console.log(`   - ${domain}: ${error}`);
      });
    }
    
    if (results.supported.length === allDomains.length) {
      console.log('\n🎉 MIGRATION SUCCESSFUL!');
      console.log('All domains are now supported in the database.');
      
      // Test actual insertion
      console.log('\n🧪 Testing actual prompt insertion...');
      await testPromptInsertion();
      
    } else {
      console.log('\n⚠️  MIGRATION INCOMPLETE');
      console.log('Some domains still need to be added to the database enum.');
      console.log('\nMissing SQL commands:');
      results.unsupported.forEach(domain => {
        console.log(`ALTER TYPE promptsmith_domain ADD VALUE '${domain}';`);
      });
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

async function testPromptInsertion() {
  const testDomains = ['mobile', 'ai', 'crypto']; // Sample of new domains
  
  console.log('Testing prompt insertion with new domains...\n');
  
  for (const domain of testDomains) {
    try {
      console.log(`Testing insertion for domain: ${domain}`);
      
      const testData = {
        name: `Test ${domain} Prompt`,
        domain: domain,
        raw_prompt: `Test prompt for ${domain} domain`,
        refined_prompt: `Refined test prompt for ${domain} domain`,
        template_type: 'basic',
        quality_score: {
          overall: 0.8,
          clarity: 0.8,
          specificity: 0.8, 
          structure: 0.8,
          completeness: 0.8
        },
        is_public: false
      };
      
      const { data, error } = await client
        .from('promptsmith_prompts')
        .insert(testData)
        .select('id, domain')
        .single();
      
      if (error) {
        console.log(`  ❌ Failed to insert ${domain}: ${error.message}`);
        
        if (error.message.includes('row-level security')) {
          console.log(`  ℹ️  Note: RLS policy prevents insertion (expected for anonymous users)`);
        }
      } else {
        console.log(`  ✅ Successfully inserted ${domain} (ID: ${data.id})`);
        
        // Clean up test data
        await client
          .from('promptsmith_prompts')
          .delete()
          .eq('id', data.id);
        console.log(`  🧹 Cleaned up test data`);
      }
      
    } catch (insertError) {
      console.log(`  💥 Exception inserting ${domain}: ${insertError.message}`);
    }
  }
}

// Run verification
verifyMigration();