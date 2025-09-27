#!/usr/bin/env node

/**
 * Manual Database Setup Instructions
 * 
 * This script provides step-by-step instructions for setting up the PromptSmith database
 * when automatic migrations are not working due to missing database functions.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(`
🔧 PromptSmith Database Manual Setup
===================================

The automatic migration system is failing because some required database functions don't exist.
This happens when the database is not fully initialized or when using Supabase with limited permissions.

📋 SOLUTION: Manual Database Setup via Supabase Dashboard

Follow these steps to set up your database correctly:

🎯 Step 1: Access Supabase SQL Editor
----------------------------------------
1. Go to: https://supabase.com/dashboard/project/your-project-id
2. Navigate to: SQL Editor (in sidebar)
3. Click: "New Query"

🎯 Step 2: Create Required Functions
-----------------------------------
Copy and paste the following SQL into a new query and execute:

`);

// Required functions SQL
console.log(`-- Required Database Functions for PromptSmith
-- Execute this FIRST before running the main schema

-- Create the exec_sql function for migrations
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Create the update_prompt_usage function
CREATE OR REPLACE FUNCTION update_prompt_usage(
  prompt_uuid UUID,
  success BOOLEAN DEFAULT true,
  response_time INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE promptsmith_prompts
  SET 
    usage_count = usage_count + 1,
    success_rate = CASE 
      WHEN usage_count = 0 THEN 
        CASE WHEN success THEN 1.0 ELSE 0.0 END
      ELSE 
        (success_rate * usage_count + CASE WHEN success THEN 1.0 ELSE 0.0 END) / (usage_count + 1)
    END,
    avg_response_time = CASE 
      WHEN response_time IS NOT NULL THEN
        CASE 
          WHEN avg_response_time IS NULL THEN response_time
          ELSE (avg_response_time + response_time) / 2
        END
      ELSE avg_response_time
    END,
    last_used_at = NOW()
  WHERE id = prompt_uuid;
END;
$$;

-- Create calculate_quality_score function
CREATE OR REPLACE FUNCTION calculate_quality_score(
  clarity DECIMAL,
  specificity DECIMAL,
  structure DECIMAL,
  completeness DECIMAL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  overall_score DECIMAL;
BEGIN
  -- Calculate weighted overall score
  overall_score := (clarity * 0.25) + (specificity * 0.30) + (structure * 0.25) + (completeness * 0.20);
  
  RETURN jsonb_build_object(
    'clarity', clarity,
    'specificity', specificity,
    'structure', structure,
    'completeness', completeness,
    'overall', overall_score
  );
END;
$$;

-- Create set_config function for user context
CREATE OR REPLACE FUNCTION set_config(
  setting_name text,
  setting_value text,
  is_local boolean
)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_catalog.set_config(setting_name, setting_value, is_local);
  RETURN setting_value;
END;
$$;

`);

console.log(`
🎯 Step 3: Create Main Database Schema
--------------------------------------
After executing the functions above, create a NEW QUERY and paste the following:

`);

// Read the main schema file
try {
  const schemaPath = join(__dirname, '../sql/001_promptsmith_production_schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  
  // Print first part of schema
  console.log('-- Main PromptSmith Database Schema');
  console.log('-- Copy this entire content into Supabase SQL Editor:\n');
  console.log(schema);
  
} catch (error) {
  console.log(`❌ Could not read schema file: ${error.message}`);
  console.log('Please locate sql/001_promptsmith_production_schema.sql manually');
}

console.log(`

🎯 Step 4: Fix Domain Enum (Add Missing Domains)
------------------------------------------------
After the main schema is created, run this SQL to add missing domains:

`);

// Domain enum fix
try {
  const domainFixPath = join(__dirname, '../fix-domain-enum.sql');
  const domainFix = readFileSync(domainFixPath, 'utf-8');
  
  console.log(domainFix);
  
} catch (error) {
  console.log(`-- Manual domain enum fix (if fix-domain-enum.sql not found)
DO $$
BEGIN
    BEGIN ALTER TYPE promptsmith_domain ADD VALUE 'mobile';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN ALTER TYPE promptsmith_domain ADD VALUE 'web';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN ALTER TYPE promptsmith_domain ADD VALUE 'backend';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN ALTER TYPE promptsmith_domain ADD VALUE 'frontend';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN ALTER TYPE promptsmith_domain ADD VALUE 'ai';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN ALTER TYPE promptsmith_domain ADD VALUE 'gaming';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN ALTER TYPE promptsmith_domain ADD VALUE 'crypto';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN ALTER TYPE promptsmith_domain ADD VALUE 'education';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN ALTER TYPE promptsmith_domain ADD VALUE 'healthcare';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN ALTER TYPE promptsmith_domain ADD VALUE 'finance';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN ALTER TYPE promptsmith_domain ADD VALUE 'legal';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Verify all domains exist
SELECT unnest(enum_range(NULL::promptsmith_domain)) as available_domains ORDER BY available_domains;
`);
}

console.log(`

🎯 Step 5: Verify Database Setup
--------------------------------
Run this verification query to ensure everything is working:

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'promptsmith_%'
ORDER BY table_name;

-- Check relationships work
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'promptsmith_user_feedback';

-- Test relationship query
SELECT p.id, p.name, uf.rating
FROM promptsmith_prompts p
LEFT JOIN promptsmith_user_feedback uf ON p.id = uf.prompt_id
LIMIT 1;

🎯 Step 6: Test the Connection
-----------------------------
After completing the above steps, run:

  node scripts/test-connectivity.cjs

This should now work without errors!

✅ Expected Results:
- All 6 promptsmith_ tables should exist
- promptsmith_user_feedback should have foreign key to promptsmith_prompts
- Relationship queries should work without "schema cache" errors
- All required functions should be available

🚨 If you still get errors:
1. Check Supabase project permissions
2. Ensure you're using the correct project URL and keys
3. Verify RLS policies aren't blocking test queries
4. Try disabling RLS temporarily for testing

📞 Need Help?
If you continue having issues, the problem is likely:
- Insufficient database permissions
- RLS policies blocking queries  
- Wrong Supabase project configuration
- Network/connectivity issues

Run this script again to see these instructions anytime:
  node scripts/manual-database-setup.js

`);

console.log('\n🎯 Summary of Required Actions:');
console.log('1. ✅ Execute Required Functions SQL in Supabase Dashboard');
console.log('2. ✅ Execute Main Schema SQL in Supabase Dashboard'); 
console.log('3. ✅ Execute Domain Enum Fix SQL in Supabase Dashboard');
console.log('4. ✅ Run Verification Query to confirm setup');
console.log('5. ✅ Test with: node scripts/test-connectivity.cjs');
console.log('\n🚀 After completing these steps, all database relationship errors should be resolved!\n');