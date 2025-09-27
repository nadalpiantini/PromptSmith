import { spawn, ChildProcess } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

interface TestResult {
  success: boolean
  error?: string
  output?: string
  errorType?: 'syntax' | 'runtime' | 'dependency' | 'mcp-protocol' | 'unknown'
}

interface FixStrategy {
  type: string
  description: string
  apply: (mcpPath: string, error: string) => Promise<boolean>
}

class MCPAutoFixer {
  private maxAttempts = 10
  private currentAttempt = 0
  private supabase: any
  private fixStrategies: FixStrategy[]
  
  constructor() {
    // Initialize Supabase for logging (using existing PromptSmith config)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      )
    }
    
    this.fixStrategies = [
      {
        type: 'import-fix',
        description: 'Fix ES modules and import issues',
        apply: this.fixImportIssues.bind(this)
      },
      {
        type: 'dependency-fix',
        description: 'Fix missing dependencies',
        apply: this.fixDependencyIssues.bind(this)
      },
      {
        type: 'mcp-protocol-fix',
        description: 'Fix MCP protocol implementation',
        apply: this.fixMCPProtocolIssues.bind(this)
      },
      {
        type: 'syntax-fix',
        description: 'Fix TypeScript/JavaScript syntax errors',
        apply: this.fixSyntaxIssues.bind(this)
      },
      {
        type: 'permission-fix',
        description: 'Fix file permissions',
        apply: this.fixPermissionIssues.bind(this)
      }
    ]
  }

  async fixUntilWorks(mcpPath: string): Promise<boolean> {
    console.log('🤖 Starting MCP Auto-Fix Agent...')
    console.log(`📁 Target: ${mcpPath}`)
    
    // Verify file exists
    if (!existsSync(mcpPath)) {
      console.log(`❌ File not found: ${mcpPath}`)
      return false
    }
    
    while (this.currentAttempt < this.maxAttempts) {
      this.currentAttempt++
      console.log(`\n📍 Attempt ${this.currentAttempt}/${this.maxAttempts}`)
      
      // 1. Test the MCP
      const testResult = await this.testMCP(mcpPath)
      
      if (testResult.success) {
        console.log('✅ MCP IS WORKING!')
        await this.logSuccess(mcpPath)
        return true
      }
      
      // 2. Classify and analyze the error
      const errorType = this.classifyError(testResult.error!)
      console.log(`❌ Error type: ${errorType}`)
      console.log(`🔍 Error: ${testResult.error?.substring(0, 200)}...`)
      
      // 3. Apply appropriate fix strategy
      const fixApplied = await this.applyBestFix(mcpPath, testResult.error!, errorType)
      
      if (!fixApplied) {
        console.log('⚠️ Could not apply fix, trying next strategy...')
      } else {
        console.log('🔧 Fix applied, retesting...')
      }
      
      // 4. Log attempt
      await this.logAttempt(mcpPath, testResult, errorType, fixApplied)
      
      // Wait before retry
      await this.sleep(1000)
    }
    
    console.log('❌ Max attempts reached. Manual intervention needed.')
    await this.logFailure(mcpPath)
    return false
  }
  
  private async testMCP(mcpPath: string): Promise<TestResult> {
    return new Promise((resolve) => {
      // First try to run with node directly
      const test = spawn('node', [mcpPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      })
      
      let output = ''
      let error = ''
      
      // Send a simple MCP handshake to test protocol
      const mcpHandshake = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'mcp-auto-fixer', version: '1.0.0' }
        }
      }) + '\n'
      
      test.stdin.write(mcpHandshake)
      test.stdin.end()
      
      test.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      test.stderr.on('data', (data) => {
        error += data.toString()
      })
      
      // Set timeout for unresponsive processes
      const timeout = setTimeout(() => {
        test.kill()
        resolve({
          success: false,
          error: 'Process timeout - MCP server not responding',
          errorType: 'runtime'
        })
      }, 5000)
      
      test.on('close', (code) => {
        clearTimeout(timeout)
        
        // Check if we got a valid MCP response
        const isValidMCPResponse = output.includes('jsonrpc') && output.includes('result')
        
        resolve({
          success: code === 0 && isValidMCPResponse,
          output,
          error: error || (code !== 0 ? `Process exited with code ${code}` : ''),
          errorType: this.classifyError(error || output)
        })
      })
      
      test.on('error', (err) => {
        clearTimeout(timeout)
        resolve({
          success: false,
          error: err.message,
          errorType: 'runtime'
        })
      })
    })
  }
  
  private classifyError(error: string): TestResult['errorType'] {
    if (!error) return 'unknown'
    
    const errorLower = error.toLowerCase()
    
    if (errorLower.includes('import') || errorLower.includes('module') || errorLower.includes('require')) {
      return 'dependency'
    }
    if (errorLower.includes('syntax') || errorLower.includes('unexpected token')) {
      return 'syntax'
    }
    if (errorLower.includes('permission') || errorLower.includes('eacces')) {
      return 'syntax' // Return syntax for permission issues too
    }
    if (errorLower.includes('jsonrpc') || errorLower.includes('mcp') || errorLower.includes('protocol')) {
      return 'mcp-protocol'
    }
    if (errorLower.includes('cannot find') || errorLower.includes('not found')) {
      return 'dependency'
    }
    
    return 'runtime'
  }
  
  private async applyBestFix(mcpPath: string, error: string, errorType: TestResult['errorType']): Promise<boolean> {
    // Try fixes in order of likelihood based on error type
    const relevantStrategies = this.fixStrategies.filter(strategy => 
      this.isStrategyRelevant(strategy.type, errorType)
    )
    
    for (const strategy of relevantStrategies) {
      console.log(`🔧 Trying: ${strategy.description}`)
      try {
        const success = await strategy.apply(mcpPath, error)
        if (success) {
          console.log(`✅ ${strategy.description} applied successfully`)
          return true
        }
      } catch (err) {
        console.log(`❌ ${strategy.description} failed: ${err}`)
      }
    }
    
    return false
  }
  
  private isStrategyRelevant(strategyType: string, errorType: TestResult['errorType']): boolean {
    const relevanceMap: Record<string, TestResult['errorType'][]> = {
      'import-fix': ['dependency', 'syntax'],
      'dependency-fix': ['dependency', 'runtime'],
      'mcp-protocol-fix': ['mcp-protocol', 'runtime'],
      'syntax-fix': ['syntax'],
      'permission-fix': ['syntax', 'runtime']
    }
    
    return relevanceMap[strategyType]?.includes(errorType!) || false
  }
  
  // Fix Strategy Implementations
  private async fixImportIssues(mcpPath: string, error: string): Promise<boolean> {
    try {
      const content = readFileSync(mcpPath, 'utf-8')
      let fixed = content
      
      // Fix CommonJS to ES modules
      fixed = fixed.replace(/const\s+{\s*([^}]+)\s*}\s*=\s*require\(['"]([^'"]+)['"]\);?/g, 
        'import { $1 } from "$2";')
      fixed = fixed.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g, 
        'import $1 from "$2";')
      
      // Fix broken import syntax (from previous attempts)
      fixed = fixed.replace(/const\s+{\s*([^}]+)\s*}\s*=\s*import\s+([^;]+);?/g, 
        'import { $1 } from $2;')
      
      // Fix exports
      fixed = fixed.replace(/module\.exports\s*=\s*(.+);?/g, 'export default $1;')
      fixed = fixed.replace(/exports\.(\w+)\s*=\s*(.+);?/g, 'export const $1 = $2;')
      
      // Ensure proper async/await for MCP setup
      if (fixed.includes('server.connect(transport)') && !fixed.includes('await server.connect(transport)')) {
        fixed = fixed.replace('server.connect(transport)', 'await server.connect(transport)')
        
        // Wrap in async function if not already
        if (!fixed.includes('async function') && !fixed.includes('async ()')) {
          fixed = fixed.replace('await server.connect(transport)', 
            `(async () => {
  await server.connect(transport)
})()`)
        }
      }
      
      // Remove console.logs that interfere with MCP protocol
      fixed = fixed.replace(/console\.log\([^)]*\);?\s*/g, '// ')
      
      if (fixed !== content) {
        writeFileSync(mcpPath, fixed)
        return true
      }
    } catch (err) {
      console.error('Import fix error:', err)
    }
    return false
  }
  
  private async fixDependencyIssues(mcpPath: string, error: string): Promise<boolean> {
    // Try to install missing dependencies
    if (error.includes('Cannot find module')) {
      const moduleMatch = error.match(/Cannot find module ['"]([^'"]+)['"]/)
      if (moduleMatch) {
        const moduleName = moduleMatch[1]
        console.log(`📦 Installing missing module: ${moduleName}`)
        
        return new Promise((resolve) => {
          const install = spawn('npm', ['install', moduleName], {
            cwd: path.dirname(mcpPath)
          })
          
          install.on('close', (code) => {
            resolve(code === 0)
          })
        })
      }
    }
    return false
  }
  
  private async fixMCPProtocolIssues(mcpPath: string, error: string): Promise<boolean> {
    try {
      const content = readFileSync(mcpPath, 'utf-8')
      let fixed = content
      
      // Ensure proper MCP server setup
      if (!content.includes('Server') && !content.includes('server')) {
        fixed = `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'auto-fixed-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

${fixed}`
      }
      
      if (fixed !== content) {
        writeFileSync(mcpPath, fixed)
        return true
      }
    } catch (err) {
      console.error('MCP protocol fix error:', err)
    }
    return false
  }
  
  private async fixSyntaxIssues(mcpPath: string, error: string): Promise<boolean> {
    try {
      const content = readFileSync(mcpPath, 'utf-8')
      let fixed = content
      
      // Fix common syntax issues
      fixed = fixed.replace(/console\.log\(/g, '// console.log(') // Comment out console.logs that might break MCP
      fixed = fixed.replace(/process\.exit\(/g, '// process.exit(') // Remove exits
      
      if (fixed !== content) {
        writeFileSync(mcpPath, fixed)
        return true
      }
    } catch (err) {
      console.error('Syntax fix error:', err)
    }
    return false
  }
  
  private async fixPermissionIssues(mcpPath: string, error: string): Promise<boolean> {
    return new Promise((resolve) => {
      const chmod = spawn('chmod', ['+x', mcpPath])
      chmod.on('close', (code) => {
        resolve(code === 0)
      })
    })
  }
  
  // Logging methods
  private async logAttempt(mcpPath: string, result: TestResult, errorType: string, fixApplied: boolean) {
    if (this.supabase) {
      try {
        await this.supabase.from('mcp_auto_fix_logs').insert({
          file_path: mcpPath,
          attempt: this.currentAttempt,
          success: result.success,
          error_type: errorType,
          error_message: result.error?.substring(0, 1000),
          fix_applied: fixApplied,
          created_at: new Date().toISOString()
        })
      } catch (err) {
        // Silent fail for logging
      }
    }
  }
  
  private async logSuccess(mcpPath: string) {
    console.log('📧 MCP Auto-Fix successful!')
    if (this.supabase) {
      try {
        await this.supabase.from('mcp_auto_fix_logs').insert({
          file_path: mcpPath,
          attempt: this.currentAttempt,
          success: true,
          message: 'Auto-fix completed successfully',
          created_at: new Date().toISOString()
        })
      } catch (err) {
        // Silent fail
      }
    }
  }
  
  private async logFailure(mcpPath: string) {
    console.log('📧 MCP Auto-Fix failed after max attempts')
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const mcpPath = process.argv[2]
  
  if (!mcpPath) {
    console.log('Usage: npx tsx tools/auto-fix-mcp.ts <path-to-mcp-server>')
    process.exit(1)
  }
  
  const fixer = new MCPAutoFixer()
  const success = await fixer.fixUntilWorks(mcpPath)
  
  process.exit(success ? 0 : 1)
}

export default MCPAutoFixer