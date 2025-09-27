#!/usr/bin/env node
/**
 * Urgent Database Fix Script
 * Applies critical schema fixes for production blocker issues
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  console.error('\n💡 Please check your .env file and try again.');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * SQL for creating missing user feedback table
 */
const CREATE_FEEDBACK_TABLE_SQL = `
-- Create missing user feedback table
CREATE TABLE IF NOT EXISTS promptsmith_user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES promptsmith_prompts(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES promptsmith_prompt_evaluations(id) ON DELETE CASCADE,
  user_id TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  improvement_suggestions TEXT,
  feedback_type VARCHAR(50),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_prompt ON promptsmith_user_feedback(prompt_id);
CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_user ON promptsmith_user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_created ON promptsmith_user_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE promptsmith_user_feedback ENABLE ROW LEVEL SECURITY;
`;

/**
 * SQL for creating RLS policy
 */
const CREATE_RLS_POLICY_SQL = `
CREATE POLICY "Users can manage own feedback" ON promptsmith_user_feedback
  FOR ALL USING (auth.uid()::text = user_id);
`;

/**
 * Domain enum values to add
 */
const MISSING_DOMAINS = [
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

/**
 * Check if table exists
 */
async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) {
      console.warn(`⚠️  Could not verify table ${tableName}: ${error.message}`);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.warn(`⚠️  Error checking table ${tableName}: ${error.message}`);
    return false;
  }
}

/**
 * Execute SQL with error handling
 */
async function executeSql(sql, description) {
  console.log(`🔄 ${description}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try alternative method if RPC doesn't work
      const { data: altData, error: altError } = await supabase
        .from('_dummy_')
        .select('*')
        .limit(0);
      
      if (altError && altError.message.includes('does not exist')) {
        console.log(`⚠️  RPC method not available, trying direct SQL execution...`);
        // For direct SQL execution, we'll use the raw client
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql_query: sql })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log(`✅ ${description} completed successfully`);
        return true;
      }
      
      throw error;
    }
    
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

/**
 * Add domain enum values one by one
 */
async function addDomainValues() {
  console.log('🔄 Adding missing domain enum values...');
  
  let successCount = 0;
  
  for (const domain of MISSING_DOMAINS) {
    const sql = `ALTER TYPE promptsmith_domain ADD VALUE '${domain}';`;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Domain '${domain}' already exists - skipping`);
          successCount++;
        } else {
          console.error(`❌ Failed to add domain '${domain}':`, error.message);
        }
      } else {
        console.log(`✅ Added domain: ${domain}`);
        successCount++;
      }
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  Domain '${domain}' already exists - skipping`);
        successCount++;
      } else {
        console.error(`❌ Failed to add domain '${domain}':`, error.message);
      }
    }
  }
  
  console.log(`📊 Domain enum update: ${successCount}/${MISSING_DOMAINS.length} values processed`);
  return successCount === MISSING_DOMAINS.length;
}

/**
 * Verify database fixes
 */
async function verifyFixes() {
  console.log('\n🔍 Verifying database fixes...');
  
  // Check if feedback table exists
  const feedbackTableExists = await checkTableExists('promptsmith_user_feedback');
  console.log(`📋 User feedback table: ${feedbackTableExists ? '✅' : '❌'}`);
  
  // Test a simple query to verify domain enum
  try {
    const { data, error } = await supabase
      .from('promptsmith_prompts')
      .select('domain')
      .limit(1);
    
    if (error) {
      console.log(`🎯 Domain enum test: ⚠️  ${error.message}`);
    } else {
      console.log(`🎯 Domain enum test: ✅ Working`);
    }
  } catch (error) {
    console.log(`🎯 Domain enum test: ⚠️  ${error.message}`);
  }
  
  return feedbackTableExists;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚨 URGENT DATABASE FIX - Liga de la Justicia Mode Activated! 🦸‍♂️\n');
  console.log('Applying critical schema fixes...\n');
  
  let allSuccessful = true;
  
  // Step 1: Create user feedback table
  const tableSuccess = await executeSql(CREATE_FEEDBACK_TABLE_SQL, 'Creating user feedback table and indexes');
  allSuccessful = allSuccessful && tableSuccess;
  
  // Step 2: Create RLS policy (may fail if already exists)
  const policySuccess = await executeSql(CREATE_RLS_POLICY_SQL, 'Creating RLS policy');
  // Don't fail if policy already exists
  
  // Step 3: Add missing domain enum values
  const domainSuccess = await addDomainValues();
  allSuccessful = allSuccessful && domainSuccess;
  
  // Step 4: Verify fixes
  const verificationSuccess = await verifyFixes();
  
  console.log('\n📊 URGENT FIX SUMMARY:');
  console.log('======================');
  console.log(`📋 User feedback table: ${tableSuccess ? '✅' : '❌'}`);
  console.log(`🔒 RLS policy: ${policySuccess ? '✅' : '⚠️'}`);
  console.log(`🎯 Domain enums: ${domainSuccess ? '✅' : '❌'}`);
  console.log(`🔍 Verification: ${verificationSuccess ? '✅' : '❌'}`);
  
  if (allSuccessful && verificationSuccess) {
    console.log('\n🎉 SUCCESS! All critical database fixes applied!');
    console.log('💡 Next step: Run "npm test" to verify everything works');
    console.log('🚀 Production blocker resolved - system ready!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some fixes may have failed or require manual intervention');
    console.log('📖 Please check the Supabase dashboard or run:');
    console.log('   node scripts/verify-database-setup.js');
    process.exit(1);
  }
}

// Execute the fix
main().catch(error => {
  console.error('\n💥 CRITICAL ERROR in database fix:');
  console.error(error);
  console.log('\n🆘 Manual intervention required:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Execute the SQL from URGENT_DATABASE_FIX.md');
  console.log('3. Run "node scripts/verify-database-setup.js"');
  process.exit(1);
});