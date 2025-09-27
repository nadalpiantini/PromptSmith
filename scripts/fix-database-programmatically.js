#!/usr/bin/env node

// Programmatic Database Fix for PromptSmith
// This script executes the required SQL fixes directly via Supabase client

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 PromptSmith Database Programmatic Fix');
console.log('========================================');
console.log('');

async function executeSQL(supabase, description, sql) {
  console.log(`📋 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    } else {
      console.log(`   ✅ Success`);
      return true;
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function fixDatabase() {
  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
    process.exit(1);
  }

  console.log(`🔗 Connecting to: ${supabaseUrl.substring(0, 30)}...`);
  const supabase = createClient(supabaseUrl, supabaseKey);

  let totalFixes = 0;
  let successfulFixes = 0;

  // Step 1: Create the missing user_feedback table
  const createUserFeedbackTable = `
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
  `;

  totalFixes++;
  if (await executeSQL(supabase, 'Creating promptsmith_user_feedback table', createUserFeedbackTable)) {
    successfulFixes++;
  }

  // Step 2: Create indexes for the feedback table
  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_prompt ON promptsmith_user_feedback(prompt_id);
    CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_user ON promptsmith_user_feedback(user_id);
    CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_created ON promptsmith_user_feedback(created_at DESC);
  `;

  totalFixes++;
  if (await executeSQL(supabase, 'Creating indexes for user_feedback table', createIndexes)) {
    successfulFixes++;
  }

  // Step 3: Enable RLS
  const enableRLS = `
    ALTER TABLE promptsmith_user_feedback ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Users can manage own feedback" ON promptsmith_user_feedback
      FOR ALL USING (auth.uid()::text = user_id);
  `;

  totalFixes++;
  if (await executeSQL(supabase, 'Enabling RLS for user_feedback table', enableRLS)) {
    successfulFixes++;
  }

  // Step 4-15: Add missing domain enum values
  const missingDomains = [
    'mobile', 'web', 'backend', 'frontend', 'ai', 
    'gaming', 'crypto', 'education', 'healthcare', 'finance', 'legal'
  ];

  for (const domain of missingDomains) {
    const addDomainSQL = `
      DO $$
      BEGIN
          BEGIN
              ALTER TYPE promptsmith_domain ADD VALUE '${domain}';
          EXCEPTION
              WHEN duplicate_object THEN
                  NULL;
          END;
      END $$;
    `;

    totalFixes++;
    if (await executeSQL(supabase, `Adding '${domain}' domain to enum`, addDomainSQL)) {
      successfulFixes++;
    }
  }

  console.log('');
  console.log('🎯 PROGRAMMATIC FIX SUMMARY');
  console.log('===========================');
  console.log(`✅ Successful fixes: ${successfulFixes}/${totalFixes}`);

  if (successfulFixes === totalFixes) {
    console.log('🎉 All database fixes applied successfully!');
    console.log('');
    console.log('🔍 Running verification...');
    
    // Test the relationship query
    try {
      const { data, error } = await supabase
        .from('promptsmith_prompts')
        .select('*, promptsmith_user_feedback(rating)')
        .limit(1);

      if (error) {
        console.log(`   ❌ Relationship test failed: ${error.message}`);
      } else {
        console.log('   ✅ Relationship query works correctly!');
        console.log('');
        console.log('🚀 Database is now ready for full functionality!');
      }
    } catch (err) {
      console.log(`   ❌ Relationship test exception: ${err.message}`);
    }
  } else {
    console.log('⚠️  Some fixes failed - manual intervention may be required');
    console.log('   Please check the Supabase Dashboard for more details');
  }

  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Run: node scripts/verify-database-setup.js');
  console.log('   2. Test: pimpprompt --search "test"');
  console.log('   3. Verify: pimpprompt --list');
}

// Execute the fix
fixDatabase().catch(console.error);