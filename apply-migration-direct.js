#!/usr/bin/env node

/**
 * Direct Migration Application Script
 * Applies domain migration using SupabaseAdapter's runMigration method
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SupabaseAdapter } from './dist/adapters/supabase.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigrationDirect() {
  try {
    console.log('🚀 Applying domain migration directly using SupabaseAdapter...');
    
    // Initialize adapter
    const adapter = new SupabaseAdapter();
    await adapter.connect();
    console.log('✅ Connected to Supabase');
    
    // Read migration SQL
    const migrationPath = join(__dirname, 'fix-domain-enum.sql');
    const migrationSql = readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration SQL loaded');
    
    console.log('🔧 Executing migration via exec_sql RPC...');
    await adapter.runMigration(migrationSql);
    console.log('✅ Migration executed successfully!');
    
    console.log('🧪 Testing migration by attempting to use new domains...');
    
    // Test a few new domains
    const testDomains = ['mobile', 'frontend', 'ai'];
    const successfulDomains = [];
    const failedDomains = [];
    
    for (const domain of testDomains) {
      try {
        // Try saving a test prompt with the new domain
        const result = await adapter.savePrompt(
          'Test prompt refined',
          'Test prompt original',
          {
            name: `Test ${domain} Domain`,
            domain: domain,
            description: `Test prompt for ${domain} domain`,
            tags: ['test', 'migration'],
            isPublic: false
          },
          {
            overall: 0.8,
            clarity: 0.8,
            specificity: 0.8,
            structure: 0.8,
            completeness: 0.8
          }
        );
        
        console.log(`  ✅ ${domain} - SUCCESS (ID: ${result.id})`);
        successfulDomains.push(domain);
        
        // Clean up test data
        // Note: We don't have a delete method in the adapter, but that's okay for this test
        
      } catch (error) {
        console.log(`  ❌ ${domain} - FAILED: ${error.message}`);
        failedDomains.push({ domain, error: error.message });
      }
    }
    
    console.log('\n📊 MIGRATION RESULTS');
    console.log(`✅ Successfully tested domains: ${successfulDomains.join(', ')}`);
    
    if (failedDomains.length > 0) {
      console.log(`❌ Failed domains: ${failedDomains.map(f => f.domain).join(', ')}`);
      failedDomains.forEach(({ domain, error }) => {
        console.log(`   - ${domain}: ${error}`);
      });
    }
    
    if (successfulDomains.length === testDomains.length) {
      console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('All new domains are now working correctly.');
      
      // Run comprehensive test
      console.log('\n🔍 Running comprehensive domain test...');
      await runComprehensiveTest();
      
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS');
      console.log('Some domains may need manual intervention.');
    }
    
    await adapter.disconnect();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n🔧 Error details:', error);
    
    if (error.message.includes('permission denied') || error.message.includes('exec_sql')) {
      console.error('\n💡 The exec_sql RPC function may not be available.');
      console.error('   Try running the SQL manually in Supabase Dashboard.');
      console.error('   Or check if you have sufficient permissions.');
    }
    
    process.exit(1);
  }
}

async function runComprehensiveTest() {
  try {
    const adapter = new SupabaseAdapter();
    await adapter.connect();
    
    const allDomains = [
      'sql', 'branding', 'cine', 'saas', 'devops', 'general',
      'mobile', 'web', 'backend', 'frontend', 'ai', 'gaming', 
      'crypto', 'education', 'healthcare', 'finance', 'legal'
    ];
    
    console.log(`🧪 Testing all ${allDomains.length} domains...`);
    
    const results = [];
    for (const domain of allDomains) {
      try {
        const result = await adapter.savePrompt(
          `Test ${domain} prompt refined`,
          `Test ${domain} prompt original`,
          {
            name: `Test ${domain} Domain - Comprehensive`,
            domain: domain,
            description: `Comprehensive test for ${domain} domain`,
            tags: ['test', 'comprehensive'],
            isPublic: false
          },
          {
            overall: 0.9,
            clarity: 0.9,
            specificity: 0.9,
            structure: 0.9,
            completeness: 0.9
          }
        );
        
        results.push({ domain, status: 'SUCCESS', id: result.id });
        console.log(`  ✅ ${domain}`);
        
      } catch (error) {
        results.push({ domain, status: 'FAILED', error: error.message });
        console.log(`  ❌ ${domain} - ${error.message}`);
      }
    }
    
    const successful = results.filter(r => r.status === 'SUCCESS');
    const failed = results.filter(r => r.status === 'FAILED');
    
    console.log('\n📋 COMPREHENSIVE TEST RESULTS');
    console.log(`✅ Successful: ${successful.length}/${allDomains.length} domains`);
    console.log(`❌ Failed: ${failed.length}/${allDomains.length} domains`);
    
    if (successful.length === allDomains.length) {
      console.log('\n🎉 PERFECT! All domains are working correctly!');
    } else if (successful.length >= 6) {
      console.log('\n✨ Good! Core domains + some new domains are working.');
      console.log('   Failed domains:', failed.map(f => f.domain).join(', '));
    } else {
      console.log('\n⚠️  Issues detected. Manual intervention may be needed.');
    }
    
    await adapter.disconnect();
    
  } catch (error) {
    console.error('Comprehensive test failed:', error.message);
  }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  applyMigrationDirect();
}

export { applyMigrationDirect, runComprehensiveTest };