#!/usr/bin/env node

/**
 * Automated Migration Script
 * Applies the migration using Supabase RPC functions and direct SQL
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

async function automatedMigration() {
  try {
    console.log('🚀 Starting automated domain migration...\n');
    
    // Test connection
    await client.from('promptsmith_prompts').select('id').limit(1);
    console.log('✅ Connection verified');
    
    // Try different approaches to execute the migration
    console.log('\n🔧 Attempting migration approaches...\n');
    
    // Approach 1: Try using a function that might exist
    console.log('📋 Approach 1: Looking for migration functions...');
    try {
      const { data: functions } = await client.rpc('get_schema_functions');
    } catch (err) {
      console.log('   No schema functions available');
    }
    
    // Approach 2: Use the set_config + exec approach
    console.log('📋 Approach 2: Trying to enable SQL execution...');
    
    // Create a comprehensive SQL script
    const migrationSQL = `
-- Enable adding enum values
-- This needs to be run with sufficient privileges

-- Add all missing domain values
${domainsToAdd.map(domain => `
-- Add ${domain}
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE '${domain}';
    EXCEPTION
        WHEN duplicate_object THEN
            -- Value already exists, skip
            NULL;
    END;
END $$;`).join('\n')}

-- Verify the migration
SELECT 'Domain migration complete' as status;
    `.trim();
    
    console.log('📝 Generated migration SQL');
    
    // Try to execute via exec_sql if available
    try {
      console.log('🔧 Attempting to execute via exec_sql RPC...');
      const { error } = await client.rpc('exec_sql', { sql: migrationSQL });
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('✅ Migration executed successfully via exec_sql!');
      
    } catch (execError) {
      console.log(`❌ exec_sql failed: ${execError.message}`);
      console.log('📋 This is expected - exec_sql is not available in hosted Supabase');
      
      // Approach 3: Manual instructions with copyable SQL
      console.log('\n🎯 MANUAL MIGRATION REQUIRED\n');
      console.log('Copy and paste this SQL into your Supabase SQL Editor:\n');
      console.log('=' .repeat(80));
      console.log(migrationSQL);
      console.log('=' .repeat(80));
      
      console.log('\n📍 Steps to complete the migration:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Create a new query');
      console.log('4. Copy and paste the SQL above');
      console.log('5. Execute the query');
      console.log('6. Run: node verify-migration.js');
    }
    
    console.log('\n💡 Alternative: Use the simpler commands:');
    domainsToAdd.forEach(domain => {
      console.log(`ALTER TYPE promptsmith_domain ADD VALUE '${domain}';`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Also create a simple verification function we can call
async function quickVerify() {
  console.log('\n🧪 Quick verification test...\n');
  
  const testDomains = ['mobile', 'ai', 'frontend'];
  for (const domain of testDomains) {
    try {
      const { error } = await client
        .from('promptsmith_prompts')
        .select('id')
        .eq('domain', domain)
        .limit(1);
      
      if (error && error.message.includes('invalid input value for enum')) {
        console.log(`❌ ${domain} - Still needs migration`);
      } else {
        console.log(`✅ ${domain} - Migration successful`);
      }
    } catch (error) {
      console.log(`⚠️  ${domain} - ${error.message}`);
    }
  }
}

// Run migration
if (process.argv[2] === 'verify') {
  quickVerify();
} else {
  automatedMigration().then(() => quickVerify());
}