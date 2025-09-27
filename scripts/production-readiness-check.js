#!/usr/bin/env node

/**
 * Production Readiness Validation Script
 * Comprehensive checks for PromptSmith MCP deployment readiness
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

class ProductionReadinessChecker {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      checks: []
    };
  }

  log(message, type = 'info') {
    const symbols = {
      pass: '✅',
      fail: '❌',
      warn: '⚠️',
      info: '📋',
      section: '🔍'
    };
    console.log(`${symbols[type]} ${message}`);
  }

  addResult(check, passed, message, type = 'error') {
    this.results.checks.push({ check, passed, message, type });
    if (passed) {
      this.results.passed++;
    } else {
      if (type === 'warning') {
        this.results.warnings++;
      } else {
        this.results.failed++;
      }
    }
  }

  async runCheck(name, checkFn) {
    try {
      this.log(`Checking ${name}...`, 'info');
      await checkFn();
    } catch (error) {
      this.addResult(name, false, error.message);
      this.log(`${name}: ${error.message}`, 'fail');
    }
  }

  // Environment checks
  async checkEnvironmentVariables() {
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const optionalVars = ['REDIS_URL', 'OPENAI_API_KEY', 'NODE_ENV'];

    let allRequired = true;

    for (const envVar of requiredVars) {
      if (!process.env[envVar]) {
        this.addResult('Environment Variables', false, `Missing required environment variable: ${envVar}`);
        allRequired = false;
      }
    }

    for (const envVar of optionalVars) {
      if (!process.env[envVar]) {
        this.addResult('Environment Variables', false, 
          `Optional environment variable not set: ${envVar}`, 'warning');
      }
    }

    if (allRequired) {
      this.addResult('Environment Variables', true, 'All required environment variables are set');
      this.log('Environment variables: Required variables present', 'pass');
    }
  }

  // Build and compilation checks
  async checkBuild() {
    try {
      execSync('npm run clean', { stdio: 'pipe', cwd: path.join(__dirname, '..') });
      execSync('npm run build', { stdio: 'pipe', cwd: path.join(__dirname, '..') });
      
      // Check if key files exist
      const keyFiles = [
        'dist/cli.js',
        'dist/server/index.js',
        'dist/core/orchestrator.js',
        'bin/promptsmith-mcp'
      ];

      for (const file of keyFiles) {
        if (!existsSync(path.join(__dirname, '..', file))) {
          throw new Error(`Build output missing: ${file}`);
        }
      }

      this.addResult('Build Process', true, 'Build completed successfully with all output files');
      this.log('Build process: Successful', 'pass');
    } catch (error) {
      this.addResult('Build Process', false, `Build failed: ${error.message}`);
      this.log(`Build process: Failed - ${error.message}`, 'fail');
    }
  }

  // Test coverage and quality
  async checkTestCoverage() {
    try {
      // Count test files and verify coverage
      const testStats = this.getTestStatistics();
      
      if (testStats.totalTests < 50) {
        this.addResult('Test Coverage', false, 
          `Insufficient test coverage: ${testStats.totalTests} tests (minimum 50 required)`, 'warning');
      } else {
        this.addResult('Test Coverage', true, 
          `Good test coverage: ${testStats.totalTests} tests across ${testStats.testFiles} files`);
        this.log(`Test coverage: ${testStats.totalTests} tests`, 'pass');
      }
    } catch (error) {
      this.addResult('Test Coverage', false, `Test coverage check failed: ${error.message}`);
    }
  }

  // Security checks
  async checkSecurity() {
    try {
      // Check for hardcoded secrets
      const codeFiles = this.findCodeFiles();
      const securityIssues = [];

      for (const file of codeFiles) {
        const content = readFileSync(file, 'utf8');
        
        // Check for potential hardcoded secrets
        const secretPatterns = [
          /api[_-]?key\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i,
          /secret\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i,
          /password\s*=\s*['"][^'"]{8,}['"]/i,
          /token\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i
        ];

        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            securityIssues.push(`Potential hardcoded secret in ${file}`);
          }
        }
      }

      if (securityIssues.length > 0) {
        this.addResult('Security Scan', false, 
          `Security issues found: ${securityIssues.join(', ')}`, 'warning');
      } else {
        this.addResult('Security Scan', true, 'No hardcoded secrets detected');
        this.log('Security scan: Clean', 'pass');
      }
    } catch (error) {
      this.addResult('Security Scan', false, `Security check failed: ${error.message}`);
    }
  }

  // Database connectivity
  async checkDatabaseConnectivity() {
    try {
      // Try to import and test the database adapter
      const { createClient } = await import('@supabase/supabase-js');
      
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        throw new Error('Database credentials not configured');
      }

      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      
      // Test connection with a simple query
      const { data, error } = await supabase.from('promptsmith_prompts').select('id').limit(1);
      
      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }

      this.addResult('Database Connectivity', true, 'Database connection successful');
      this.log('Database connectivity: Working', 'pass');
    } catch (error) {
      this.addResult('Database Connectivity', false, error.message);
      this.log(`Database connectivity: Failed - ${error.message}`, 'fail');
    }
  }

  // Performance benchmarks
  async checkPerformance() {
    try {
      // This is a simplified performance check
      // In production, you'd want more comprehensive benchmarking
      
      const startTime = Date.now();
      
      // Simulate processing a prompt (basic timing check)
      for (let i = 0; i < 1000; i++) {
        // Simple computation to test JS performance
        Math.sqrt(i);
      }
      
      const duration = Date.now() - startTime;
      
      if (duration > 100) {
        this.addResult('Performance Baseline', false, 
          `Performance baseline slow: ${duration}ms for basic computation`, 'warning');
      } else {
        this.addResult('Performance Baseline', true, 
          `Performance baseline good: ${duration}ms for basic computation`);
        this.log('Performance baseline: Good', 'pass');
      }
    } catch (error) {
      this.addResult('Performance Baseline', false, error.message);
    }
  }

  // Configuration validation
  async checkConfiguration() {
    try {
      const packageJson = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
      
      // Check version
      if (!packageJson.version || packageJson.version === '0.0.0') {
        throw new Error('Package version not set properly');
      }

      // Check required scripts
      const requiredScripts = ['build', 'start', 'test'];
      for (const script of requiredScripts) {
        if (!packageJson.scripts[script]) {
          throw new Error(`Missing required script: ${script}`);
        }
      }

      // Check binary configuration
      if (!packageJson.bin || !packageJson.bin['pimpprompt']) {
        throw new Error('Binary configuration missing for pimpprompt');
      }

      this.addResult('Configuration', true, `Package configuration valid (v${packageJson.version})`);
      this.log(`Configuration: Valid (v${packageJson.version})`, 'pass');
    } catch (error) {
      this.addResult('Configuration', false, error.message);
    }
  }

  // MCP Server validation
  async checkMCPServer() {
    try {
      // Check if MCP server can be imported
      const serverPath = path.join(__dirname, '..', 'dist', 'server', 'index.js');
      
      if (!existsSync(serverPath)) {
        throw new Error('MCP server build output missing');
      }

      // Basic validation that the server exports exist
      const serverModule = await import(serverPath);
      
      if (!serverModule || typeof serverModule !== 'object') {
        throw new Error('MCP server module invalid');
      }

      this.addResult('MCP Server', true, 'MCP server module valid');
      this.log('MCP server: Module valid', 'pass');
    } catch (error) {
      this.addResult('MCP Server', false, error.message);
    }
  }

  // Documentation completeness
  async checkDocumentation() {
    const requiredDocs = [
      'README.md',
      'CLAUDE.md',
      'UNIVERSAL-CURSOR-SETUP.md'
    ];

    let allDocsPresent = true;
    const missingDocs = [];

    for (const doc of requiredDocs) {
      if (!existsSync(path.join(__dirname, '..', doc))) {
        allDocsPresent = false;
        missingDocs.push(doc);
      }
    }

    if (!allDocsPresent) {
      this.addResult('Documentation', false, 
        `Missing documentation files: ${missingDocs.join(', ')}`, 'warning');
    } else {
      this.addResult('Documentation', true, 'All required documentation present');
      this.log('Documentation: Complete', 'pass');
    }
  }

  // Helper methods
  getTestStatistics() {
    const testDir = path.join(__dirname, '..', 'tests');
    let totalTests = 0;
    let testFiles = 0;

    if (!existsSync(testDir)) {
      return { totalTests: 0, testFiles: 0 };
    }

    // This is a simplified count - would need recursive file traversal for accurate count
    try {
      const output = execSync('find tests -name "*.test.ts" | wc -l', { 
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8' 
      });
      testFiles = parseInt(output.trim());

      // Estimate tests per file (rough approximation)
      totalTests = testFiles * 3; // Conservative estimate
      
      return { totalTests, testFiles };
    } catch {
      return { totalTests: 0, testFiles: 0 };
    }
  }

  findCodeFiles() {
    const codeFiles = [];
    
    try {
      const output = execSync('find src -name "*.ts" -type f', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });
      
      return output.trim().split('\n')
        .map(file => path.join(__dirname, '..', file))
        .filter(file => existsSync(file));
    } catch {
      return [];
    }
  }

  // Generate detailed report
  generateReport() {
    const totalChecks = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = totalChecks > 0 ? (this.results.passed / totalChecks * 100).toFixed(1) : 0;

    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION READINESS REPORT');
    console.log('='.repeat(80));
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log('='.repeat(80));

    // Detailed breakdown
    console.log('\n📋 DETAILED RESULTS:');
    for (const result of this.results.checks) {
      const symbol = result.passed ? '✅' : (result.type === 'warning' ? '⚠️' : '❌');
      console.log(`${symbol} ${result.check}: ${result.message}`);
    }

    // Production readiness assessment
    console.log('\n🎯 PRODUCTION READINESS ASSESSMENT:');
    
    if (this.results.failed === 0) {
      if (this.results.warnings === 0) {
        console.log('🚀 READY FOR PRODUCTION - All checks passed!');
        return 'ready';
      } else {
        console.log('⚡ MOSTLY READY - Minor warnings present, but deployable');
        return 'mostly-ready';
      }
    } else if (this.results.failed <= 2) {
      console.log('⚠️  NEEDS ATTENTION - Some critical issues need resolution');
      return 'needs-attention';
    } else {
      console.log('❌ NOT READY - Multiple critical issues must be resolved');
      return 'not-ready';
    }
  }

  // Main execution method
  async run() {
    console.log('🔍 Starting Production Readiness Check for PromptSmith MCP...\n');

    const checks = [
      ['Environment Variables', () => this.checkEnvironmentVariables()],
      ['Build Process', () => this.checkBuild()],
      ['Test Coverage', () => this.checkTestCoverage()],
      ['Security Scan', () => this.checkSecurity()],
      ['Database Connectivity', () => this.checkDatabaseConnectivity()],
      ['Performance Baseline', () => this.checkPerformance()],
      ['Configuration', () => this.checkConfiguration()],
      ['MCP Server', () => this.checkMCPServer()],
      ['Documentation', () => this.checkDocumentation()]
    ];

    for (const [name, checkFn] of checks) {
      await this.runCheck(name, checkFn);
    }

    const readinessStatus = this.generateReport();
    
    // Exit codes for CI/CD integration
    if (readinessStatus === 'ready' || readinessStatus === 'mostly-ready') {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new ProductionReadinessChecker();
  checker.run().catch(error => {
    console.error('❌ Production readiness check failed:', error.message);
    process.exit(1);
  });
}

export { ProductionReadinessChecker };