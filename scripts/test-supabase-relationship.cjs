#!/usr/bin/env node

/**
 * Supabase Relationship Cache Investigation Script
 * Tests multiple query approaches to fix relationship cache issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, ...args) {
  console.log(color + args.join(' ') + COLORS.reset);
}

async function testSupabaseRelationships() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log(COLORS.red, '❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  log(COLORS.cyan, '🔍 Supabase Relationship Investigation');
  log(COLORS.cyan, '=====================================\n');

  // Test 1: Verify table existence
  log(COLORS.blue, '1. Testing table existence...');
  try {
    const { data: prompts, error: promptsError } = await supabase
      .from('promptsmith_prompts')
      .select('count')
      .limit(1);

    const { data: feedback, error: feedbackError } = await supabase
      .from('promptsmith_user_feedback')
      .select('count')
      .limit(1);

    if (promptsError) {
      log(COLORS.red, '❌ promptsmith_prompts table:', promptsError.message);
    } else {
      log(COLORS.green, '✅ promptsmith_prompts table exists');
    }

    if (feedbackError) {
      log(COLORS.red, '❌ promptsmith_user_feedback table:', feedbackError.message);
    } else {
      log(COLORS.green, '✅ promptsmith_user_feedback table exists');
    }
  } catch (error) {
    log(COLORS.red, '❌ Table existence check failed:', error.message);
  }

  // Test 2: Check foreign key constraint existence
  log(COLORS.blue, '\n2. Checking foreign key relationships...');
  try {
    const { data, error } = await supabase
      .from('promptsmith_user_feedback')
      .select('*')
      .limit(1);

    if (error) {
      log(COLORS.red, '❌ Foreign key check failed:', error.message);
    } else {
      log(COLORS.green, '✅ Foreign key structure accessible');
      if (data && data.length > 0) {
        log(COLORS.cyan, '   Sample record structure:', Object.keys(data[0]));
      }
    }
  } catch (error) {
    log(COLORS.red, '❌ Foreign key check error:', error.message);
  }

  // Test 3: Original relationship query (the problematic one)
  log(COLORS.blue, '\n3. Testing original relationship query...');
  try {
    const { data, error } = await supabase
      .from('promptsmith_prompts')
      .select('*, promptsmith_user_feedback(rating)')
      .limit(5);

    if (error) {
      log(COLORS.red, '❌ Original relationship query failed:', error.message);
      log(COLORS.yellow, '   Error code:', error.code || 'N/A');
      log(COLORS.yellow, '   Error details:', error.details || 'N/A');
    } else {
      log(COLORS.green, '✅ Original relationship query works!');
      log(COLORS.cyan, '   Results count:', data?.length || 0);
    }
  } catch (error) {
    log(COLORS.red, '❌ Original relationship query error:', error.message);
  }

  // Test 4: Alternative PostgREST relationship syntax
  log(COLORS.blue, '\n4. Testing alternative relationship syntaxes...');
  
  const relationshipSyntaxes = [
    'promptsmith_user_feedback(*)',
    'promptsmith_user_feedback(id,rating)',
    'promptsmith_user_feedback!inner(*)',
    'promptsmith_user_feedback!left(*)'
  ];

  for (const syntax of relationshipSyntaxes) {
    try {
      const { data, error } = await supabase
        .from('promptsmith_prompts')
        .select(`id, name, ${syntax}`)
        .limit(3);

      if (error) {
        log(COLORS.red, `❌ Syntax "${syntax}":`, error.message);
      } else {
        log(COLORS.green, `✅ Syntax "${syntax}" works!`);
      }
    } catch (error) {
      log(COLORS.red, `❌ Syntax "${syntax}" error:`, error.message);
    }
  }

  // Test 5: Manual JOIN approach
  log(COLORS.blue, '\n5. Testing manual JOIN approach...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          p.id,
          p.name,
          p.domain,
          p.description,
          p.tags,
          p.refined_prompt,
          p.quality_score,
          p.created_at,
          p.updated_at,
          COALESCE(
            json_agg(
              json_build_object(
                'id', f.id,
                'rating', f.rating,
                'feedback_text', f.feedback_text
              )
            ) FILTER (WHERE f.id IS NOT NULL),
            '[]'::json
          ) as user_feedback
        FROM promptsmith_prompts p
        LEFT JOIN promptsmith_user_feedback f ON p.id = f.prompt_id
        GROUP BY p.id, p.name, p.domain, p.description, p.tags, p.refined_prompt, p.quality_score, p.created_at, p.updated_at
        LIMIT 5;
      `
    });

    if (error) {
      log(COLORS.red, '❌ Manual JOIN failed:', error.message);
    } else {
      log(COLORS.green, '✅ Manual JOIN works!');
      log(COLORS.cyan, '   Results count:', data?.length || 0);
    }
  } catch (error) {
    log(COLORS.red, '❌ Manual JOIN error:', error.message);
  }

  // Test 6: Two separate queries approach
  log(COLORS.blue, '\n6. Testing separate queries approach...');
  try {
    // Get prompts first
    const { data: promptsData, error: promptsErr } = await supabase
      .from('promptsmith_prompts')
      .select(`
        id,
        name,
        domain,
        description,
        tags,
        refined_prompt,
        quality_score,
        created_at,
        updated_at
      `)
      .limit(5);

    if (promptsErr) {
      log(COLORS.red, '❌ Prompts query failed:', promptsErr.message);
    } else {
      log(COLORS.green, '✅ Prompts query works!');
      
      if (promptsData && promptsData.length > 0) {
        const promptIds = promptsData.map(p => p.id);
        
        // Get feedback for these prompts
        const { data: feedbackData, error: feedbackErr } = await supabase
          .from('promptsmith_user_feedback')
          .select('id, prompt_id, rating, feedback_text')
          .in('prompt_id', promptIds);

        if (feedbackErr) {
          log(COLORS.red, '❌ Feedback query failed:', feedbackErr.message);
        } else {
          log(COLORS.green, '✅ Feedback query works!');
          log(COLORS.cyan, '   Feedback count:', feedbackData?.length || 0);
          
          // Show combined result structure
          const combinedResults = promptsData.map(prompt => ({
            ...prompt,
            user_feedback: feedbackData?.filter(f => f.prompt_id === prompt.id) || []
          }));
          
          log(COLORS.green, '✅ Combined results created successfully');
          log(COLORS.cyan, '   Sample structure:', Object.keys(combinedResults[0]));
        }
      }
    }
  } catch (error) {
    log(COLORS.red, '❌ Separate queries error:', error.message);
  }

  // Test 7: Schema introspection
  log(COLORS.blue, '\n7. Testing schema introspection...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name = 'promptsmith_user_feedback' OR ccu.table_name = 'promptsmith_prompts');
      `
    });

    if (error) {
      log(COLORS.red, '❌ Schema introspection failed:', error.message);
    } else {
      log(COLORS.green, '✅ Schema introspection works!');
      log(COLORS.cyan, '   Foreign key relationships found:', data?.length || 0);
      if (data && data.length > 0) {
        data.forEach(rel => {
          log(COLORS.cyan, `   ${rel.table_name}.${rel.column_name} -> ${rel.foreign_table_name}.${rel.foreign_column_name}`);
        });
      }
    }
  } catch (error) {
    log(COLORS.red, '❌ Schema introspection error:', error.message);
  }

  // Test 8: Test with service role (if available)
  log(COLORS.blue, '\n8. Testing with service role key (if available)...');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    try {
      const serviceClient = createClient(supabaseUrl, serviceRoleKey);
      const { data, error } = await serviceClient
        .from('promptsmith_prompts')
        .select('*, promptsmith_user_feedback(rating)')
        .limit(3);

      if (error) {
        log(COLORS.red, '❌ Service role relationship query failed:', error.message);
      } else {
        log(COLORS.green, '✅ Service role relationship query works!');
        log(COLORS.cyan, '   Results count:', data?.length || 0);
      }
    } catch (error) {
      log(COLORS.red, '❌ Service role error:', error.message);
    }
  } else {
    log(COLORS.yellow, '⚠️  No SUPABASE_SERVICE_ROLE_KEY found, skipping service role test');
  }

  log(COLORS.cyan, '\n📊 Investigation Summary');
  log(COLORS.cyan, '======================');
  log(COLORS.yellow, 'Based on the tests above, we can determine:');
  log(COLORS.yellow, '1. Which query approach works for relationships');
  log(COLORS.yellow, '2. Whether it\'s a permissions issue (anon vs service role)');
  log(COLORS.yellow, '3. If manual JOINs are needed as a workaround');
  log(COLORS.yellow, '4. The exact schema structure and foreign keys');
}

// Run the tests
testSupabaseRelationships()
  .then(() => {
    log(COLORS.green, '\n✅ Investigation completed!');
  })
  .catch(error => {
    log(COLORS.red, '\n❌ Investigation failed:', error.message);
    process.exit(1);
  });