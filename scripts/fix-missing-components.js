#!/usr/bin/env node

/**
 * Targeted Fix Script
 * Creates missing database components identified by verification
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMissingComponents() {
  console.log('🔧 Fixing Missing Database Components...\n');

  try {
    // Step 1: Create the missing promptsmith_user_feedback table
    console.log('📋 Step 1: Creating missing promptsmith_user_feedback table...');
    
    const createTableSQL = `
      -- Create the missing user feedback table
      CREATE TABLE IF NOT EXISTS promptsmith_user_feedback (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

        -- References
        prompt_id UUID REFERENCES promptsmith_prompts(id) ON DELETE CASCADE,
        evaluation_id UUID REFERENCES promptsmith_prompt_evaluations(id) ON DELETE CASCADE,
        user_id TEXT,

        -- Feedback content
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        feedback_text TEXT,
        improvement_suggestions TEXT,
        feedback_type VARCHAR(50),

        -- Metadata
        metadata JSONB DEFAULT '{}'::JSONB,

        -- Timestamp
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes for the feedback table
      CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_prompt ON promptsmith_user_feedback(prompt_id);
      CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_user ON promptsmith_user_feedback(user_id);
      CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_created ON promptsmith_user_feedback(created_at DESC);

      -- Enable Row Level Security
      ALTER TABLE promptsmith_user_feedback ENABLE ROW LEVEL SECURITY;

      -- Create RLS policy for user feedback
      CREATE POLICY IF NOT EXISTS "Users can manage own feedback" ON promptsmith_user_feedback
        FOR ALL USING (auth.uid()::text = user_id);
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (tableError) {
      console.log(`❌ Failed to create table: ${tableError.message}`);
    } else {
      console.log('✅ promptsmith_user_feedback table created successfully');
    }

    // Step 2: Add missing domain enum values
    console.log('\n📋 Step 2: Adding missing domain enum values...');
    
    const missingDomains = ['mobile', 'web', 'backend', 'frontend', 'ai', 'gaming', 'crypto', 'education', 'healthcare', 'finance', 'legal'];
    
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

      const { error: domainError } = await supabase.rpc('exec_sql', { sql: addDomainSQL });
      
      if (domainError) {
        console.log(`  ❌ ${domain}: ${domainError.message}`);
      } else {
        console.log(`  ✅ ${domain}: Added successfully`);
      }
    }

    // Step 3: Verify the fixes worked
    console.log('\n📋 Step 3: Verifying fixes...');
    
    // Test table exists
    const { error: tableTestError } = await supabase
      .from('promptsmith_user_feedback')
      .select('id')
      .limit(0);
    
    console.log(`Table creation: ${tableTestError ? '❌ ' + tableTestError.message : '✅ SUCCESS'}`);

    // Test relationship query
    const { error: relationError } = await supabase
      .from('promptsmith_prompts')
      .select('*, promptsmith_user_feedback(rating)')
      .limit(1);
    
    console.log(`Relationship query: ${relationError ? '❌ ' + relationError.message : '✅ SUCCESS'}`);

    // Test a few domain values
    const testDomains = ['mobile', 'ai', 'finance'];
    for (const domain of testDomains) {
      const { error: domainTestError } = await supabase
        .from('promptsmith_prompts')
        .select('id')
        .eq('domain', domain)
        .limit(0);
      
      const isSupported = !domainTestError || !domainTestError.message.includes('invalid input value for enum');
      console.log(`Domain '${domain}': ${isSupported ? '✅ SUPPORTED' : '❌ NOT SUPPORTED'}`);
    }

    console.log('\n🎉 FIXES COMPLETED!');
    console.log('Run verification script to confirm all issues are resolved:');
    console.log('  node scripts/verify-database-setup.js');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

fixMissingComponents().catch(console.error);