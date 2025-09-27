import MCPAutoFixer from './auto-fix-mcp.js'
import path from 'path'
import { existsSync } from 'fs'

async function testAutoFixer() {
  console.log('🧪 Testing MCP Auto-Fix Agent')
  console.log('================================')
  
  const testMCPPath = path.resolve('./test-mcps/broken-mcp.js')
  
  // Check if test file exists
  if (!existsSync(testMCPPath)) {
    console.log('❌ Test MCP file not found:', testMCPPath)
    return false
  }
  
  console.log(`📁 Test file: ${testMCPPath}`)
  
  // Create and run the auto-fixer
  const fixer = new MCPAutoFixer()
  const success = await fixer.fixUntilWorks(testMCPPath)
  
  if (success) {
    console.log('\n🎉 Auto-Fix Test PASSED!')
    console.log('✅ The broken MCP server was automatically fixed')
  } else {
    console.log('\n❌ Auto-Fix Test FAILED!')
    console.log('⚠️ The auto-fixer could not resolve all issues')
  }
  
  return success
}

// Run the test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAutoFixer().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(err => {
    console.error('Test failed with error:', err)
    process.exit(1)
  })
}

export default testAutoFixer