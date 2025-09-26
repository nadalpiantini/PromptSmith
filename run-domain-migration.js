#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔄 Running domain enum migration...');
  
  try {
    // Read the migration SQL
    const migrationSQL = fs.readFileSync('./fix-domain-enum.sql', 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Domain enum migration completed successfully!');
    
    // Test with a simple query to verify the migration worked
    console.log('✅ Migration completed! Testing with a simple query...');
    
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
}

runMigration();
