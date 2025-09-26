#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

async function createSchema() {
  console.log('🚀 Creating PromptSmith schema in Supabase...');
  console.log(`📡 Connecting to: ${supabaseUrl}`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'sql', '001_promptsmith_production_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements (basic splitting)
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let executed = 0;
    for (const statement of statements) {
      if (statement.trim().length === 0) continue;
      
      try {
        console.log(`⏳ Executing statement ${executed + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`⚠️  Statement ${executed + 1} failed (might already exist): ${error.message}`);
        } else {
          console.log(`✅ Statement ${executed + 1} executed successfully`);
        }
        
        executed++;
      } catch (err) {
        console.log(`⚠️  Statement ${executed + 1} error: ${err.message}`);
      }
    }
    
    console.log('');
    console.log('🎉 Schema creation completed!');
    console.log(`📊 Executed ${executed} statements`);
    
    // Test the connection by checking if tables exist
    console.log('🔍 Verifying tables...');
    const { data, error } = await supabase
      .from('promptsmith_prompts')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('⚠️  Could not verify promptsmith_prompts table:', error.message);
    } else {
      console.log('✅ promptsmith_prompts table verified');
    }
    
  } catch (error) {
    console.error('❌ Schema creation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createSchema();
}

module.exports = { createSchema };