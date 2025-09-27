#!/usr/bin/env node

/**
 * Complete Domain Test Script
 * Tests every single domain with actual prompt creation and validation
 */

import { SupabaseAdapter } from './dist/adapters/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const allDomains = [
  'sql', 'branding', 'cine', 'saas', 'devops', 'general',
  'mobile', 'web', 'backend', 'frontend', 'ai', 'gaming', 
  'crypto', 'education', 'healthcare', 'finance', 'legal'
];

async function testAllDomains() {
  try {
    console.log('🧪 COMPREHENSIVE DOMAIN TEST');
    console.log('=' .repeat(50));
    console.log(`Testing all ${allDomains.length} domains with actual prompt creation\n`);
    
    const adapter = new SupabaseAdapter();
    await adapter.connect();
    console.log('✅ Connected to Supabase\n');
    
    const results = {
      successful: [],
      failed: [],
      rlsBlocked: []
    };
    
    for (const domain of allDomains) {
      try {
        console.log(`🔍 Testing domain: ${domain.toUpperCase()}`);
        
        const testPrompt = {
          name: `Test ${domain} Prompt`,
          domain: domain,
          description: `Test prompt for ${domain} domain validation`,
          tags: ['test', 'validation', domain],
          isPublic: false
        };
        
        const qualityScore = {
          overall: 0.85,
          clarity: 0.8,
          specificity: 0.9,
          structure: 0.85,
          completeness: 0.8
        };
        
        const result = await adapter.savePrompt(
          `This is a refined test prompt for the ${domain} domain. It demonstrates that the domain enum migration was successful and the system can now handle all ${allDomains.length} domain types correctly.`,
          `test prompt for ${domain} domain`,
          testPrompt,
          qualityScore,
          `You are an expert in ${domain} development. Please help with the following task.`
        );
        
        console.log(`  ✅ SUCCESS - Created prompt ID: ${result.id}`);
        console.log(`  📊 Score: ${result.score.overall}`);
        console.log(`  🏷️  Tags: ${result.tags.join(', ')}`);
        
        results.successful.push({
          domain,
          id: result.id,
          score: result.score.overall
        });
        
        // Test retrieval
        const retrieved = await adapter.getPrompt(result.id);
        if (retrieved && retrieved.domain === domain) {
          console.log(`  🔄 RETRIEVAL - Successfully retrieved with correct domain`);
        } else {
          console.log(`  ⚠️  RETRIEVAL - Domain mismatch or not found`);
        }
        
      } catch (error) {
        console.log(`  ❌ FAILED - ${error.message}`);
        
        if (error.message.includes('row-level security')) {
          console.log(`  ℹ️  Note: RLS policy prevents insert (domain enum is valid)`);
          results.rlsBlocked.push(domain);
        } else if (error.message.includes('invalid input value for enum')) {
          console.log(`  🚨 CRITICAL - Domain not in database enum`);
          results.failed.push({ domain, error: error.message });
        } else {
          console.log(`  💥 UNEXPECTED - ${error.message}`);
          results.failed.push({ domain, error: error.message });
        }
      }
      
      console.log(''); // Empty line for readability
    }
    
    await adapter.disconnect();
    
    // Print comprehensive results
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('=' .repeat(50));
    console.log(`✅ Successful inserts: ${results.successful.length}/${allDomains.length}`);
    console.log(`🔒 RLS blocked (domain valid): ${results.rlsBlocked.length}/${allDomains.length}`);
    console.log(`❌ Failed (domain invalid): ${results.failed.length}/${allDomains.length}`);
    
    const totalWorking = results.successful.length + results.rlsBlocked.length;
    console.log(`\n🎯 TOTAL DOMAINS WORKING: ${totalWorking}/${allDomains.length}`);
    
    if (results.successful.length > 0) {
      console.log('\n✅ Successfully created prompts:');
      results.successful.forEach(({ domain, id, score }) => {
        console.log(`   - ${domain}: ${id} (score: ${score})`);
      });
    }
    
    if (results.rlsBlocked.length > 0) {
      console.log('\n🔒 RLS blocked (but domain enum is valid):');
      results.rlsBlocked.forEach(domain => {
        console.log(`   - ${domain}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed domains (need migration):');
      results.failed.forEach(({ domain, error }) => {
        console.log(`   - ${domain}: ${error}`);
      });
    }
    
    if (totalWorking === allDomains.length) {
      console.log('\n🎉 MIGRATION COMPLETE!');
      console.log('All domains are now supported in PromptSmith!');
      
      // Test search functionality
      console.log('\n🔍 Testing search functionality...');
      await testSearchFunctionality(adapter);
      
    } else {
      console.log('\n⚠️  MIGRATION INCOMPLETE');
      console.log(`${allDomains.length - totalWorking} domains still need to be added.`);
      
      if (results.failed.length > 0) {
        console.log('\nRun this SQL in Supabase Dashboard:');
        results.failed.forEach(({ domain }) => {
          console.log(`ALTER TYPE promptsmith_domain ADD VALUE '${domain}';`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

async function testSearchFunctionality(adapter) {
  try {
    // Test searching by different domains
    const searchDomains = ['mobile', 'ai', 'frontend'];
    
    for (const domain of searchDomains) {
      try {
        const searchResults = await adapter.searchPrompts({
          domain: domain,
          limit: 5
        });
        
        console.log(`  🔍 Search for "${domain}": ${searchResults.results.length} results`);
        
      } catch (searchError) {
        console.log(`  ❌ Search failed for "${domain}": ${searchError.message}`);
      }
    }
    
  } catch (error) {
    console.log(`⚠️  Search test failed: ${error.message}`);
  }
}

// Run test
testAllDomains();