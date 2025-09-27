#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActualTables() {
  console.log('🔍 Checking actual database tables...\n');

  try {
    // List all tables in the public schema
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_name LIKE 'promptsmith_%'
          ORDER BY table_name;
        `
      });

    if (error) {
      console.log(`❌ Failed to query tables: ${error.message}`);
      return;
    }

    console.log('📋 Tables found in database:');
    if (data && data.length > 0) {
      data.forEach(table => {
        console.log(`  ✅ ${table.table_name}`);
      });
    } else {
      console.log('  ❌ No promptsmith_ tables found!');
    }

    console.log('\n🔍 Checking if specific tables exist...');
    
    const expectedTables = [
      'promptsmith_prompts',
      'promptsmith_user_feedback',
      'promptsmith_prompt_evaluations',
      'promptsmith_custom_rules',
      'promptsmith_templates',
      'promptsmith_analytics'
    ];

    for (const tableName of expectedTables) {
      try {
        const { error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(0); // Just check if table exists, don't return data

        console.log(`  ${tableName}: ${tableError ? '❌ ' + tableError.message : '✅ EXISTS'}`);
      } catch (err) {
        console.log(`  ${tableName}: ❌ ${err.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

checkActualTables().catch(console.error);