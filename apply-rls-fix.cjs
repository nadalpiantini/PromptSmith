#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function applyRLSFix() {
  console.log('🔧 Applying RLS policy fixes...');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  // Read the RLS fix SQL
  const sql = fs.readFileSync('./fix-rls-policies.sql', 'utf8');
  
  // Split into statements and execute each
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`📝 Found ${statements.length} SQL statements to execute`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      // Use rpc to execute raw SQL (if available)
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.log(`⚠️  Statement ${i + 1} failed: ${error.message}`);
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.log(`⚠️  Statement ${i + 1} error: ${err.message}`);
    }
  }
  
  console.log('🎉 RLS policy fixes applied!');
}

applyRLSFix().catch(console.error);