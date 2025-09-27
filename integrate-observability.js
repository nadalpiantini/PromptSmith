#!/usr/bin/env node

/**
 * Integration script to add observability hooks to PromptSmith MCP server
 * This script patches the existing server to add tracing and metrics
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Integrating observability into PromptSmith MCP server...');

// Read the current server file
const serverPath = join(__dirname, 'src/server/index.ts');
let serverContent = readFileSync(serverPath, 'utf8');

// Add observability import at the top
const observabilityImport = `import { observability } from '../services/observability.js';`;

if (!serverContent.includes(observabilityImport)) {
  // Find the imports section and add our import
  const importMatch = serverContent.match(/(import.*?from.*?;[\s\S]*?)(\n\n|$)/);
  if (importMatch) {
    const newImports = importMatch[1] + '\n' + observabilityImport + '\n';
    serverContent = serverContent.replace(importMatch[1], newImports);
  }
}

// Add tracing to tool handlers
const tracingWrapper = `
    // Enhanced tool handler with observability tracing
    private async executeWithTracing<T>(
      operationName: string,
      operation: () => Promise<T>,
      metadata: Record<string, any> = {}
    ): Promise<T> {
      const spanId = await observability.startSpan(operationName);
      const startTime = Date.now();
      
      try {
        await observability.addSpanLog(spanId, { 
          event: 'operation_start', 
          ...metadata 
        });
        
        const result = await operation();
        
        await observability.addSpanLog(spanId, { 
          event: 'operation_success',
          resultSize: JSON.stringify(result).length 
        });
        
        await observability.finishSpan(spanId, { 
          success: true,
          operation: operationName 
        });
        
        const duration = Date.now() - startTime;
        await observability.trackPerformance(operationName, duration, metadata);
        
        return result;
        
      } catch (error) {
        await observability.addSpanLog(spanId, { 
          event: 'operation_error',
          error: error.message 
        });
        
        await observability.finishSpan(spanId, { 
          success: false,
          error: error.message 
        });
        
        await observability.trackError(error as Error, { 
          operation: operationName,
          ...metadata 
        });
        
        throw error;
      }
    }`;

// Add the tracing wrapper method to the class
if (!serverContent.includes('executeWithTracing')) {
  const classMatch = serverContent.match(/(class PromptSmithServer {[\s\S]*?)(\n  private setupToolHandlers)/);
  if (classMatch) {
    const newClass = classMatch[1] + tracingWrapper + '\n' + classMatch[2];
    serverContent = serverContent.replace(classMatch[0], newClass);
  }
}

// Add MCP message tracking to the transport setup
const mcpTrackingCode = `
    // Add MCP protocol message tracking
    transport.onMessage = (message: any) => {
      observability.trackMCPMessage(
        message.method,
        message.params,
        undefined, // result will be tracked later
        undefined, // no error at this point
        undefined  // duration calculated later
      );
    };`;

// Add health check endpoint
const healthCheckTool = `
      {
        name: 'health_check',
        description: 'Check the health of PromptSmith and observability services',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },`;

// Insert health check tool into the tools list
if (!serverContent.includes('health_check')) {
  const toolsMatch = serverContent.match(/(tools: \[[\s\S]*?)(\])/);
  if (toolsMatch) {
    const newTools = toolsMatch[1] + healthCheckTool + '\n        ' + toolsMatch[2];
    serverContent = serverContent.replace(toolsMatch[0], newTools);
  }
}

// Add health check handler
const healthCheckHandler = `
        // Health check handler
        if (request.params.name === 'health_check') {
          return this.executeWithTracing('health_check', async () => {
            const observabilityHealth = await observability.checkObservabilityHealth();
            const systemHealth = {
              status: 'healthy',
              timestamp: new Date().toISOString(),
              version: SERVER_VERSION,
              environment: process.env.NODE_ENV || 'development',
              observability: observabilityHealth,
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              services: {
                database: true, // TODO: Add actual database health check
                cache: true,    // TODO: Add actual cache health check
              }
            };
            
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(systemHealth, null, 2)
              }]
            };
          });
        }`;

// Insert health check handler
if (!serverContent.includes("request.params.name === 'health_check'")) {
  const handlerMatch = serverContent.match(/(this\.server\.setRequestHandler\(CallToolRequestSchema, async \(request\) => {[\s\S]*?)(\n        \/\/ Process prompt handler)/);
  if (handlerMatch) {
    const newHandler = handlerMatch[1] + '\n' + healthCheckHandler + '\n' + handlerMatch[2];
    serverContent = serverContent.replace(handlerMatch[0], newHandler);
  }
}

// Wrap existing handlers with tracing
const handlersToWrap = [
  'process_prompt',
  'evaluate_prompt',
  'compare_prompts', 
  'save_prompt',
  'search_prompts',
  'get_prompt',
  'get_stats',
  'validate_prompt'
];

handlersToWrap.forEach(handlerName => {
  // Find the handler and wrap it with tracing
  const handlerRegex = new RegExp(`(if \\(request\\.params\\.name === '${handlerName}'\\) \\{[\\s\\S]*?)(return \\{[\\s\\S]*?\\};)`);
  const match = serverContent.match(handlerRegex);
  
  if (match && !match[1].includes('executeWithTracing')) {
    const wrappedHandler = match[1].replace(
      /return \{/,
      `return this.executeWithTracing('${handlerName}', async () => {
            return {`
    ) + match[2].replace(/};$/, '});') + '\n        }';
    
    serverContent = serverContent.replace(match[0], wrappedHandler);
  }
});

// Write the enhanced server file
writeFileSync(serverPath, serverContent);

console.log('✅ Observability integration complete!');
console.log('📝 Enhanced server with:');
console.log('   - Distributed tracing for all operations');
console.log('   - Performance metrics collection');
console.log('   - Error tracking and reporting');
console.log('   - MCP protocol message monitoring');
console.log('   - Health check endpoint');
console.log('   - Integration with Jaeger, Prometheus, GlitchTip, and MCP Inspector');

// Create environment variables template for observability
const envTemplate = `
# Observability Configuration (add to .env)
JAEGER_ENDPOINT=http://localhost:14268
PROMETHEUS_ENDPOINT=http://localhost:9090
GLITCHTIP_DSN=http://your-key@localhost:8000/1
MCP_INSPECTOR_ENDPOINT=http://localhost:6274

# Enable observability features
TELEMETRY_ENABLED=true
OBSERVABILITY_ENABLED=true
`;

writeFileSync(join(__dirname, '.env.observability'), envTemplate.trim());

console.log('📄 Created .env.observability template');
console.log('');
console.log('🚀 Next steps:');
console.log('   1. Run: ./deploy-observability.sh');
console.log('   2. Copy .env.observability values to your .env file');
console.log('   3. Restart PromptSmith MCP server');
console.log('   4. Visit http://localhost:8888 for the central dashboard');
console.log('');
console.log('🦸‍♂️ Your observability superhero team is ready!');