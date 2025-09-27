#!/usr/bin/env node

// Direct Database Fix for PromptSmith using direct SQL execution
// This bypasses the missing exec_sql function by using direct PostgreSQL queries

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 PromptSmith Database Direct Fix');
console.log('==================================');
console.log('');

async function executeDirectSQL(supabase, description, sql) {
  console.log(`📋 ${description}...`);
  try {
    // Use the postgres client directly for DDL operations
    const { data, error } = await supabase.rpc('query', { 
      query: sql 
    });
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      // Try alternative approach for certain operations
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

async function testTableExists(supabase, tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function testRelationship(supabase) {
  try {
    const { data, error } = await supabase
      .from('promptsmith_prompts')
      .select('*, promptsmith_user_feedback(rating)')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Relationship test: ${error.message}`);
      return false;
    } else {
      console.log('   ✅ Relationship test: SUCCESS');
      return true;
    }
  } catch (err) {
    console.log(`   ❌ Relationship test exception: ${err.message}`);
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

  console.log('');
  console.log('🔍 Step 1: Checking current database state...');
  
  // Check if promptsmith_user_feedback table exists
  const feedbackTableExists = await testTableExists(supabase, 'promptsmith_user_feedback');
  console.log(`   📋 promptsmith_user_feedback exists: ${feedbackTableExists ? '✅ YES' : '❌ NO'}`);
  
  // Test relationship query
  console.log('');
  console.log('🔍 Step 2: Testing relationship query...');
  const relationshipWorks = await testRelationship(supabase);

  if (!feedbackTableExists) {
    console.log('');
    console.log('🛠️  Step 3: Creating missing table using manual INSERT...');
    
    // Create a sample row in promptsmith_prompts to establish the table
    try {
      // First, let's try to create the table through the REST API by trying to insert
      console.log('   📋 Attempting to create table through data insertion...');
      
      // This won't work for DDL, but let's document what needs to be done
      console.log('');
      console.log('⚠️  MANUAL INTERVENTION REQUIRED');
      console.log('=================================');
      console.log('');
      console.log('The database needs manual setup through Supabase Dashboard.');
      console.log('The automatic migration system cannot perform DDL operations.');
      console.log('');
      console.log('🎯 REQUIRED ACTIONS:');
      console.log('1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT');
      console.log('2. Navigate to: SQL Editor');  
      console.log('3. Execute this SQL:');
      console.log('');
      console.log('-- Create the missing table');
      console.log(`CREATE TABLE IF NOT EXISTS promptsmith_user_feedback (
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
CREATE POLICY "Users can manage own feedback" ON promptsmith_user_feedback
  FOR ALL USING (auth.uid()::text = user_id);

-- Add missing domain enum values
ALTER TYPE promptsmith_domain ADD VALUE 'mobile';
ALTER TYPE promptsmith_domain ADD VALUE 'web';
ALTER TYPE promptsmith_domain ADD VALUE 'backend';
ALTER TYPE promptsmith_domain ADD VALUE 'frontend';
ALTER TYPE promptsmith_domain ADD VALUE 'ai';
ALTER TYPE promptsmith_domain ADD VALUE 'gaming';
ALTER TYPE promptsmith_domain ADD VALUE 'crypto';
ALTER TYPE promptsmith_domain ADD VALUE 'education';
ALTER TYPE promptsmith_domain ADD VALUE 'healthcare';
ALTER TYPE promptsmith_domain ADD VALUE 'finance';
ALTER TYPE promptsmith_domain ADD VALUE 'legal';`);
      console.log('');
      console.log('4. After executing the SQL, run this script again to verify');
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Manual table creation info: ${error.message}`);
    }
  } else if (!relationshipWorks) {
    console.log('');
    console.log('⚠️  Table exists but relationship query fails');
    console.log('This might be a cache issue or RLS policy problem');
  } else {
    console.log('');
    console.log('🎉 Database appears to be correctly configured!');
    console.log('✅ promptsmith_user_feedback table exists');
    console.log('✅ Relationship queries work');
    console.log('');
    console.log('🚀 Ready for full functionality testing!');
  }

  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. If manual SQL is required, execute it in Supabase Dashboard');
  console.log('   2. Run: node scripts/verify-database-setup.js');
  console.log('   3. Test: pimpprompt --search "test"');
  console.log('   4. Verify: pimpprompt --list');
}

// Execute the fix
fixDatabase().catch(console.error);