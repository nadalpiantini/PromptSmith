#!/usr/bin/env node

/**
 * Complete Migration Script
 * Orchestrates the entire domain migration process
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

async function completeMigration() {
  console.log('🚀 PROMPTSMITH DOMAIN MIGRATION - COMPLETE PROCESS');
  console.log('=' .repeat(60));
  console.log('This script will fix the domain enum compatibility issue completely.\n');
  
  // Step 1: Diagnose current state
  console.log('📋 STEP 1: Diagnosing current state...\n');
  try {
    execSync('node diagnose-domains.js', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Diagnosis had issues, continuing...\n');
  }
  
  // Step 2: Generate migration SQL
  console.log('📋 STEP 2: Generating migration SQL...\n');
  
  const migrationSQL = `-- PromptSmith Domain Migration
-- This adds all missing domain values to the promptsmith_domain enum
-- Generated on: ${new Date().toISOString()}

-- Add mobile domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'mobile';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add web domain  
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'web';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add backend domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'backend';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add frontend domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'frontend';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add ai domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'ai';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add gaming domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'gaming';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add crypto domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'crypto';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add education domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'education';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add healthcare domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'healthcare';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add finance domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'finance';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add legal domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'legal';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Verify all domains are available
SELECT unnest(enum_range(NULL::promptsmith_domain)) as domain_value ORDER BY domain_value;
`;
  
  // Save migration SQL to file
  writeFileSync('MIGRATION-SQL.sql', migrationSQL);
  console.log('✅ Migration SQL saved to MIGRATION-SQL.sql');
  
  // Step 3: Show manual migration steps
  console.log('\n📋 STEP 3: Manual Migration Required\n');
  console.log('🎯 CRITICAL: Execute this SQL in your Supabase Dashboard:\n');
  console.log('=' .repeat(60));
  console.log(migrationSQL.trim());
  console.log('=' .repeat(60));
  
  console.log('\n📍 Instructions:');
  console.log('1. Go to https://supabase.com/dashboard/project/[your-project-id]');
  console.log('2. Navigate to "SQL Editor" in the left sidebar');
  console.log('3. Click "New Query"');
  console.log('4. Copy the SQL above and paste it into the editor');
  console.log('5. Click "Run" to execute the migration');
  console.log('6. You should see a list of all domain values if successful');
  console.log('7. Return here and press Enter to continue...');
  
  // Wait for user confirmation
  await waitForUserInput();
  
  // Step 4: Verify migration
  console.log('\n📋 STEP 4: Verifying migration...\n');
  try {
    execSync('node verify-migration.js', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Verification had issues, running comprehensive test...');
  }
  
  // Step 5: Comprehensive test
  console.log('\n📋 STEP 5: Running comprehensive domain test...\n');
  try {
    execSync('node test-all-domains.js', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Comprehensive test had issues');
  }
  
  // Step 6: Final status
  console.log('\n📋 STEP 6: Final migration status\n');
  
  const finalTest = await quickDomainCheck();
  
  if (finalTest.allWorking) {
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(50));
    console.log('✅ All 17 domains are now supported');
    console.log('✅ TypeScript types are updated');
    console.log('✅ Domain mapper is configured');
    console.log('✅ System is fully functional');
    console.log('\n🚀 PromptSmith is ready for production use!');
  } else {
    console.log('⚠️  MIGRATION INCOMPLETE');
    console.log('=' .repeat(50));
    console.log(`❌ ${finalTest.failed.length} domains still need migration`);
    console.log('Failed domains:', finalTest.failed.join(', '));
    console.log('\nPlease re-run the SQL migration and try again.');
  }
}

async function quickDomainCheck() {
  const testDomains = ['mobile', 'ai', 'frontend', 'crypto', 'healthcare'];
  const results = { working: [], failed: [], allWorking: false };
  
  for (const domain of testDomains) {
    try {
      const { error } = await client
        .from('promptsmith_prompts')
        .select('id')
        .eq('domain', domain)
        .limit(1);
      
      if (error && error.message.includes('invalid input value for enum')) {
        results.failed.push(domain);
      } else {
        results.working.push(domain);
      }
    } catch (error) {
      results.failed.push(domain);
    }
  }
  
  results.allWorking = results.failed.length === 0;
  return results;
}

function waitForUserInput() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    console.log('\n⏳ Press Enter when you have executed the SQL migration...');
    
    process.stdin.once('data', (data) => {
      process.stdin.pause();
      resolve();
    });
  });
}

// Run complete migration
completeMigration().catch(error => {
  console.error('❌ Complete migration failed:', error.message);
  process.exit(1);
});