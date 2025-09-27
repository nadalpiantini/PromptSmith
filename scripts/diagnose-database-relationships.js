#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDatabaseRelationships() {
  console.log('🔍 Diagnosing Database Relationships...\n');

  // Test 1: Check if tables exist
  console.log('📋 Test 1: Checking table existence...');
  
  try {
    const { data: promptsData, error: promptsError } = await supabase
      .from('promptsmith_prompts')
      .select('id')
      .limit(1);
    
    console.log(`  promptsmith_prompts: ${promptsError ? '❌ ' + promptsError.message : '✅ EXISTS'}`);

    const { data: feedbackData, error: feedbackError } = await supabase
      .from('promptsmith_user_feedback')
      .select('id')
      .limit(1);
    
    console.log(`  promptsmith_user_feedback: ${feedbackError ? '❌ ' + feedbackError.message : '✅ EXISTS'}`);

  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
  }

  console.log();

  // Test 2: Check if we can insert test data and verify foreign key works
  console.log('📋 Test 2: Testing foreign key relationship...');
  
  try {
    // Insert a test prompt first
    const { data: prompt, error: promptError } = await supabase
      .from('promptsmith_prompts')
      .insert({
        raw_prompt: 'Test prompt for relationship testing',
        refined_prompt: 'Test prompt for relationship testing (refined)',
        domain: 'general'
      })
      .select('id')
      .single();

    if (promptError) {
      console.log(`  ❌ Failed to insert test prompt: ${promptError.message}`);
      return;
    }
    
    console.log(`  ✅ Test prompt inserted with ID: ${prompt.id}`);

    // Now try to insert feedback referencing this prompt
    const { data: feedback, error: feedbackError } = await supabase
      .from('promptsmith_user_feedback')
      .insert({
        prompt_id: prompt.id,
        rating: 5,
        feedback_text: 'Test feedback'
      })
      .select('id')
      .single();

    if (feedbackError) {
      console.log(`  ❌ Failed to insert test feedback: ${feedbackError.message}`);
    } else {
      console.log(`  ✅ Test feedback inserted with ID: ${feedback.id}`);
    }

    // Clean up test data
    await supabase.from('promptsmith_user_feedback').delete().eq('id', feedback?.id);
    await supabase.from('promptsmith_prompts').delete().eq('id', prompt.id);
    console.log('  🧹 Test data cleaned up');

  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
  }

  console.log();

  // Test 3: Try the problematic relationship query
  console.log('📋 Test 3: Testing the failing relationship query...');
  
  try {
    const { data, error } = await supabase
      .from('promptsmith_prompts')
      .select('*, promptsmith_user_feedback(rating)')
      .limit(1);

    if (error) {
      console.log(`  ❌ Relationship query failed: ${error.message}`);
      console.log(`  ❌ Error code: ${error.code}`);
      console.log(`  ❌ Error details:`, error.details);
      console.log(`  ❌ Error hint:`, error.hint);
    } else {
      console.log(`  ✅ Relationship query succeeded!`);
      console.log(`  📊 Sample data:`, JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
  }

  console.log();

  // Test 4: Try alternative relationship syntax
  console.log('📋 Test 4: Testing alternative relationship syntax...');
  
  const alternatives = [
    'promptsmith_user_feedback(*)',
    'promptsmith_user_feedback!inner(rating)',
    'promptsmith_user_feedback!left(rating)',
    'promptsmith_user_feedback!promptsmith_user_feedback_prompt_id_fkey(rating)'
  ];

  for (const alt of alternatives) {
    try {
      const { data, error } = await supabase
        .from('promptsmith_prompts')
        .select(`*, ${alt}`)
        .limit(1);

      console.log(`  ${alt}: ${error ? '❌ ' + error.message : '✅ SUCCESS'}`);
    } catch (error) {
      console.log(`  ${alt}: ❌ ${error.message}`);
    }
  }

  console.log();

  // Test 5: Check database schema information
  console.log('📋 Test 5: Checking actual database schema...');
  
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
          FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND (tc.table_name = 'promptsmith_user_feedback' OR tc.table_name = 'promptsmith_prompts')
          ORDER BY tc.table_name;
        `
      });

    if (error) {
      console.log(`  ❌ Schema query failed: ${error.message}`);
    } else {
      console.log('  ✅ Foreign key relationships found:');
      if (data && data.length > 0) {
        data.forEach(rel => {
          console.log(`    ${rel.table_name}.${rel.column_name} → ${rel.foreign_table_name}.${rel.foreign_column_name}`);
        });
      } else {
        console.log('    ⚠️  No foreign key relationships found');
      }
    }

  } catch (error) {
    console.log(`  ❌ Schema check failed: ${error.message}`);
  }

  console.log('\n🎯 Diagnosis Complete!');
}

// Run the diagnosis
diagnoseDatabaseRelationships().catch(console.error);