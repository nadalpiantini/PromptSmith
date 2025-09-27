#!/usr/bin/env node

/**
 * Domain Enum Migration Script
 * Applies the domain enum migration to extend supported domains
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

async function runDomainMigration() {
  try {
    console.log('🚀 Starting domain enum migration...');
    
    // The missing domains that need to be added
    const missingDomains = ['mobile', 'web', 'backend', 'frontend', 'ai', 'gaming', 'crypto', 'education', 'healthcare', 'finance', 'legal'];
    
    console.log('🔍 Testing if migration is needed...');
    
    // Test basic connection
    try {
      const { data: connectionTest } = await client.from('promptsmith_prompts').select('id').limit(1);
      console.log('✅ Connection to database verified');
    } catch (error) {
      console.log('⚠️  Database connection test failed, proceeding anyway...');
    }
    
    // Check each missing domain
    const stillMissing = [];
    
    console.log('\n🧪 Testing each domain...');
    for (const domain of missingDomains) {
      try {
        // Try a simple select with the domain to test if it's accepted
        const { error } = await client
          .from('promptsmith_prompts')
          .select('id')
          .eq('domain', domain)
          .limit(1);
        
        if (error && error.message.includes('invalid input value for enum')) {
          console.log(`  ❌ ${domain} - Not supported in database`);
          stillMissing.push(domain);
        } else {
          console.log(`  ✅ ${domain} - Already supported`);
        }
      } catch (testError) {
        if (testError.message.includes('invalid input value for enum')) {
          console.log(`  ❌ ${domain} - Not supported in database`);
          stillMissing.push(domain);
        } else {
          console.log(`  ✅ ${domain} - Already supported (or other error: ${testError.message})`);
        }
      }
    }
    
    if (stillMissing.length === 0) {
      console.log('\n🎉 All domains are already supported! No migration needed.');
      return;
    }
    
    console.log(`\n🔧 Attempting to add ${stillMissing.length} missing domains...`);
    console.log('Missing domains:', stillMissing.join(', '));
    
    // Try to apply the migration using direct SQL execution
    // Since we can't use exec_sql, we'll provide instructions for manual execution
    console.log('\n📋 MANUAL MIGRATION REQUIRED');
    console.log('The following SQL commands need to be executed in your Supabase SQL editor:');
    console.log('(Dashboard → SQL Editor → New Query → Paste and Run)\n');
    
    for (const domain of stillMissing) {
      console.log(`-- Add ${domain} domain`);
      console.log(`DO $$`);
      console.log(`BEGIN`);
      console.log(`    BEGIN`);
      console.log(`        ALTER TYPE promptsmith_domain ADD VALUE '${domain}';`);
      console.log(`    EXCEPTION`);
      console.log(`        WHEN duplicate_object THEN`);
      console.log(`            NULL;`);
      console.log(`    END;`);
      console.log(`END $$;\n`);
    }
    
    console.log('-- Verify all domains are available');
    console.log('SELECT unnest(enum_range(NULL::promptsmith_domain)) as available_domains ORDER BY available_domains;');
    
    console.log('\n🚨 IMPORTANT NEXT STEPS:');
    console.log('1. Copy the SQL commands above');
    console.log('2. Go to your Supabase Dashboard → SQL Editor');
    console.log('3. Create a new query and paste the SQL');
    console.log('4. Execute the query');
    console.log('5. Run this script again to verify the migration worked');
    
    console.log('\n💡 Alternatively, you can run the SQL file directly:');
    console.log('   Load fix-domain-enum.sql in the Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct');
    console.error('   2. Ensure you have sufficient permissions in Supabase');
    console.error('   3. Verify the database is accessible');
    console.error('   4. Try manual SQL execution in Supabase Dashboard');
    process.exit(1);
  }
}

// Execute migration if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDomainMigration();
}

export { runDomainMigration };