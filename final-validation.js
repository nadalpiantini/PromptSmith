#!/usr/bin/env node

/**
 * Final Validation Script
 * Validates that the entire PromptSmith system works with all domains
 * This script simulates what should work after the SQL migration is executed
 */

import { createClient } from '@supabase/supabase-js';
import { PromptDomain } from './dist/types/prompt.js';
import { mapToValidDomain, isValidDatabaseDomain } from './dist/utils/domain-mapper.js';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const allDomains = [
  'sql', 'branding', 'cine', 'saas', 'devops', 'general',
  'mobile', 'web', 'backend', 'frontend', 'ai', 'gaming', 
  'crypto', 'education', 'healthcare', 'finance', 'legal'
];

async function finalValidation() {
  console.log('🎯 PROMPTSMITH FINAL VALIDATION');
  console.log('=' .repeat(50));
  console.log('Validating complete domain integration across the entire system\n');

  let validationScore = 0;
  const maxScore = 5;

  // Test 1: TypeScript Domain Enum (2 points)
  console.log('📋 TEST 1: TypeScript Domain Enum Validation');
  console.log('-'.repeat(30));

  const expectedDomains = Object.values(PromptDomain);
  console.log(`✅ TypeScript defines ${expectedDomains.length} domains`);
  console.log(`   Domains: ${expectedDomains.join(', ')}`);

  if (expectedDomains.length === 17) {
    validationScore += 2;
    console.log('✅ PASS: All 17 domains defined in TypeScript\n');
  } else {
    console.log(`❌ FAIL: Expected 17 domains, found ${expectedDomains.length}\n`);
  }

  // Test 2: Domain Mapper Configuration (1 point) 
  console.log('📋 TEST 2: Domain Mapper Configuration');
  console.log('-'.repeat(30));

  let mapperValid = true;
  for (const domain of allDomains) {
    const mapped = mapToValidDomain(domain);
    const isValid = isValidDatabaseDomain(mapped);
    
    if (mapped !== domain) {
      console.log(`⚠️  ${domain} maps to ${mapped} (should be direct)`);
      mapperValid = false;
    } else if (!isValid) {
      console.log(`❌ ${domain} not recognized as valid database domain`);
      mapperValid = false;
    } else {
      console.log(`✅ ${domain} → ${mapped} (direct mapping)`);
    }
  }

  if (mapperValid) {
    validationScore += 1;
    console.log('✅ PASS: Domain mapper uses direct mappings\n');
  } else {
    console.log('❌ FAIL: Domain mapper has issues\n');
  }

  // Test 3: Database Enum Test (2 points)
  console.log('📋 TEST 3: Database Enum Compatibility Test');
  console.log('-'.repeat(30));

  let enumTestPassed = 0;
  let rlsBlocked = 0;
  let enumBlocked = 0;

  for (const domain of allDomains) {
    try {
      const { error } = await client
        .from('promptsmith_prompts')
        .select('id')
        .eq('domain', domain)
        .limit(1);

      if (!error) {
        console.log(`✅ ${domain} - Database enum accepts domain`);
        enumTestPassed++;
      } else if (error.message.includes('row-level security')) {
        console.log(`🔒 ${domain} - RLS blocked (but enum valid)`);
        enumTestPassed++; // RLS block means enum is valid
        rlsBlocked++;
      } else if (error.message.includes('invalid input value for enum')) {
        console.log(`❌ ${domain} - ENUM ERROR: Not in database enum`);
        enumBlocked++;
      } else {
        console.log(`⚠️  ${domain} - Other error: ${error.message}`);
      }
    } catch (error) {
      console.log(`💥 ${domain} - Exception: ${error.message}`);
    }
  }

  const enumScore = enumTestPassed === 17 ? 2 : enumTestPassed >= 12 ? 1 : 0;
  validationScore += enumScore;

  console.log(`\n📊 Enum Test Results:`);
  console.log(`   ✅ Working: ${enumTestPassed}/17 domains`);
  console.log(`   🔒 RLS Blocked: ${rlsBlocked} (normal for anonymous access)`);
  console.log(`   ❌ Enum Blocked: ${enumBlocked} (NEED MIGRATION)`);

  if (enumScore === 2) {
    console.log('✅ PASS: All domains supported in database enum\n');
  } else if (enumScore === 1) {
    console.log('⚠️  PARTIAL: Most domains work, some may need migration\n');
  } else {
    console.log('❌ FAIL: Major enum issues - migration required\n');
  }

  // Final Score and Recommendations
  console.log('🏆 FINAL VALIDATION RESULTS');
  console.log('=' .repeat(40));
  console.log(`Score: ${validationScore}/${maxScore} points`);
  
  if (validationScore === maxScore) {
    console.log('🎉 EXCELLENT: PromptSmith migration is COMPLETE!');
    console.log('   All systems are fully functional with 17 domains');
    console.log('   Ready for production use!');
  } else if (validationScore >= 4) {
    console.log('✨ GOOD: PromptSmith is mostly ready');
    console.log('   Minor issues remain, but core functionality works');
    if (enumBlocked > 0) {
      console.log('   Execute the SQL migration to fix remaining enum issues');
    }
  } else if (validationScore >= 2) {
    console.log('⚠️  NEEDS WORK: Partial migration success');
    console.log('   Core types are correct but database needs updates');
    console.log('   Execute the SQL migration in Supabase Dashboard');
  } else {
    console.log('❌ MAJOR ISSUES: Migration incomplete');
    console.log('   Significant problems detected');
    console.log('   Review migration steps and try again');
  }

  // Next Steps
  console.log('\n🚀 NEXT STEPS');
  console.log('-'.repeat(20));

  if (enumBlocked > 0) {
    console.log('1. Execute this SQL in Supabase Dashboard:');
    console.log('   (Copy from MIGRATION-SQL.sql file)');
    console.log('   \n   ALTER TYPE promptsmith_domain ADD VALUE \'mobile\';');
    console.log('   ALTER TYPE promptsmith_domain ADD VALUE \'web\';');
    console.log('   ... (see full SQL in MIGRATION-SQL.sql)');
    console.log('\n2. Re-run this validation: node final-validation.js');
  }

  if (validationScore >= 4) {
    console.log('1. Test the MCP server: npm run test:server');
    console.log('2. Run comprehensive tests: npm test');
    console.log('3. Build for production: npm run build');
    console.log('4. Deploy PromptSmith with full domain support!');
  }

  console.log('\n📚 Documentation updated in MIGRATION_SUMMARY.md');
}

// Run validation
finalValidation().catch(error => {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
});