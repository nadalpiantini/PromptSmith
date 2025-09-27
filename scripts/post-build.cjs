#!/usr/bin/env node
/**
 * Post-Build Hook for PromptSmith MCP
 * Automatically applies STDIO compatibility patches after TypeScript compilation
 * 
 * Usage: Called automatically after `npm run build`
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

console.log('🔧 [Post-Build] Applying MCP STDIO compatibility patches...');

/**
 * Check if a file needs patching (avoids double-patching)
 */
function needsPatching(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf8');
  return !content.includes('/* MCP_PATCHED */');
}

/**
 * Apply remaining patches that the source code changes don't cover
 */
function applyRemainingPatches() {
  const servicesDir = path.join(DIST, 'services');
  let patchCount = 0;

  if (!fs.existsSync(servicesDir)) {
    console.log('⚠️  [Post-Build] No dist/services directory found - skipping service patches');
    return patchCount;
  }

  // Patch service files for any remaining console.log statements
  const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));
  
  for (const file of serviceFiles) {
    const filePath = path.join(servicesDir, file);
    
    if (needsPatching(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      // Add patch marker at the top
      content = `/* MCP_PATCHED */\n${content}`;

      // Replace any remaining console.log calls with STDIO-safe versions
      content = content.replace(
        /console\.log\s*\(/g,
        `(process.env.MCP_TRANSPORT==='stdio'?console.error:console.log)(`
      );

      // Only write if content changed
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ [Post-Build] Patched ${file}`);
        patchCount++;
      }
    }
  }

  return patchCount;
}

/**
 * Ensure all JavaScript files have proper permissions
 */
function fixPermissions() {
  const filesToMakeExecutable = [
    path.join(DIST, 'cli.js'),
    path.join(DIST, 'mcp-server.js'),
  ];

  for (const filePath of filesToMakeExecutable) {
    if (fs.existsSync(filePath)) {
      try {
        fs.chmodSync(filePath, 0o755);
        console.log(`✅ [Post-Build] Made ${path.basename(filePath)} executable`);
      } catch (error) {
        console.warn(`⚠️  [Post-Build] Could not make ${path.basename(filePath)} executable:`, error.message);
      }
    }
  }
}

/**
 * Verify the build output looks correct
 */
function verifyBuild() {
  const criticalFiles = [
    path.join(DIST, 'mcp-server.js'),
    path.join(DIST, 'cli.js'),
    path.join(DIST, 'server', 'index.js'),
    path.join(DIST, 'utils', 'logger.js'),
  ];

  const missing = criticalFiles.filter(file => !fs.existsSync(file));
  
  if (missing.length > 0) {
    console.error('❌ [Post-Build] Critical files missing from build:');
    missing.forEach(file => console.error(`   - ${path.relative(ROOT, file)}`));
    return false;
  }

  console.log('✅ [Post-Build] All critical files present');
  return true;
}

/**
 * Main post-build process
 */
function main() {
  try {
    // Verify build output
    if (!verifyBuild()) {
      process.exit(1);
    }

    // Apply any remaining patches
    const patchCount = applyRemainingPatches();
    
    // Fix file permissions
    fixPermissions();

    // Summary
    console.log(`🎉 [Post-Build] Complete! Applied ${patchCount} patches`);
    console.log('💡 [Post-Build] MCP server is ready for STDIO mode');
    
  } catch (error) {
    console.error('❌ [Post-Build] Failed:', error.message);
    process.exit(1);
  }
}

// Run only if called directly (not imported)
if (require.main === module) {
  main();
}