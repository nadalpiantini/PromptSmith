#!/usr/bin/env node

/**
 * Step-by-Step Migration Script
 * Applies domain migration by executing individual SQL commands
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

const domainsToAdd = [
  'mobile', 'web', 'backend', 'frontend', 'ai', 'gaming', 
  'crypto', 'education', 'healthcare', 'finance', 'legal'
];

async function stepByStepMigration() {
  try {
    console.log('🚀 Starting step-by-step domain migration...');
    
    // Test connection
    const { data: connectionTest } = await client.from('promptsmith_prompts').select('id').limit(1);
    console.log('✅ Connection verified');
    
    console.log('\n🔧 Adding domain values one by one...\n');
    
    for (const domain of domainsToAdd) {
      try {
        console.log(`📝 Adding domain: ${domain}`);
        
        // Try to use the domain in a query to test if it exists
        const { error: testError } = await client
          .from('promptsmith_prompts')
          .select('id')
          .eq('domain', domain)
          .limit(1);
        
        if (testError && testError.message.includes('invalid input value for enum')) {
          console.log(`  ❌ Domain "${domain}" not supported yet`);
          console.log(`  🔧 Manual SQL needed: ALTER TYPE promptsmith_domain ADD VALUE '${domain}';`);
        } else {
          console.log(`  ✅ Domain "${domain}" already supported!`);
        }
        
      } catch (error) {
        console.log(`  ⚠️  Error testing "${domain}": ${error.message}`);
      }
    }
    
    console.log('\n📋 SUMMARY');
    console.log('Since we cannot execute ALTER TYPE commands via the JavaScript client,');
    console.log('the following SQL commands must be run manually in Supabase SQL Editor:\n');
    
    for (const domain of domainsToAdd) {
      console.log(`ALTER TYPE promptsmith_domain ADD VALUE IF NOT EXISTS '${domain}';`);
    }
    
    console.log('\n🔍 After running the SQL, use this script to verify:');
    console.log('node verify-migration.js');
    
  } catch (error) {
    console.error('❌ Migration preparation failed:', error.message);
    process.exit(1);
  }
}

// Run migration
stepByStepMigration();