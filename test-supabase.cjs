#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabase() {
  console.log('🔍 Testing Supabase connection and schema...');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  try {
    // Test 1: Basic connection
    console.log('📡 Testing connection...');
    const { data, error } = await supabase.from('promptsmith_prompts').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Table promptsmith_prompts does not exist:', error.message);
      console.log('');
      console.log('📋 Please create the tables manually in Supabase dashboard:');
      console.log('1. Go to https://supabase.com/dashboard/project/nqzhxukuvmdlpewqytpv');
      console.log('2. Open SQL Editor');
      console.log('3. Copy and paste the content from sql/001_promptsmith_production_schema.sql');
      console.log('4. Execute the SQL to create all tables');
      return false;
    } else {
      console.log('✅ promptsmith_prompts table exists');
    }
    
    // Test 2: Try to insert and read a test prompt
    console.log('🧪 Testing insert/read operations...');
    const testPrompt = {
      name: 'Test Prompt',
      domain: 'general',
      raw_prompt: 'test prompt',
      refined_prompt: 'This is a test prompt for validation',
      description: 'Test insertion',
      tags: ['test'],
      is_public: false,
      quality_score: {
        overall: 0.8,
        clarity: 0.8,
        specificity: 0.7,
        structure: 0.8,
        completeness: 0.8
      }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('promptsmith_prompts')
      .insert(testPrompt)
      .select()
      .single();
    
    if (insertError) {
      console.log('⚠️  Insert test failed:', insertError.message);
    } else {
      console.log('✅ Insert test successful, ID:', insertData.id);
      
      // Clean up test data
      await supabase
        .from('promptsmith_prompts')
        .delete()
        .eq('id', insertData.id);
      
      console.log('🧹 Test data cleaned up');
    }
    
    console.log('');
    console.log('🎉 Supabase connection and schema validated!');
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  testSupabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testSupabase };