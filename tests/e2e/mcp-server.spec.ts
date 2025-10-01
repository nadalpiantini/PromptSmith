import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

test.describe('PromptSmith MCP Server', () => {
  let mcpServer: ChildProcess;
  let responses: string[] = [];

  test.beforeAll(async () => {
    // Start the MCP server
    const serverPath = path.resolve(process.cwd(), 'dist/cli.js');
    mcpServer = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    // Collect server output
    mcpServer.stdout?.on('data', (data) => {
      responses.push(data.toString());
    });

    mcpServer.stderr?.on('data', (data) => {
      console.error('MCP Server stderr:', data.toString());
    });

    // Wait for server to be ready
    await new Promise((resolve) => {
      mcpServer.stderr?.on('data', (data) => {
        if (data.toString().includes('PromptSmith MCP Server is ready!')) {
          resolve(void 0);
        }
      });
    });
  });

  test.afterAll(async () => {
    // Clean up
    if (mcpServer) {
      mcpServer.kill();
    }
  });

  async function sendMCPRequest(method: string, params: any): Promise<any> {
    const request = {
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      const onData = (data: Buffer) => {
        const response = data.toString().trim();
        if (response) {
          try {
            const parsed = JSON.parse(response);
            clearTimeout(timeout);
            mcpServer.stdout?.off('data', onData);
            resolve(parsed);
          } catch (error) {
            // Ignore non-JSON output
          }
        }
      };

      mcpServer.stdout?.on('data', onData);
      mcpServer.stdin?.write(JSON.stringify(request) + '\n');
    });
  }

  test('should respond to initialization', async () => {
    const response = await sendMCPRequest('initialize', {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    });

    expect(response.result).toBeDefined();
    expect(response.result.protocolVersion).toBe("2024-11-05");
    expect(response.result.capabilities).toBeDefined();
    expect(response.result.serverInfo).toBeDefined();
    expect(response.result.serverInfo.name).toBe("promptsmith-mcp");
  });

  test('should list available tools', async () => {
    const response = await sendMCPRequest('tools/list', {});

    expect(response.result).toBeDefined();
    expect(response.result.tools).toBeDefined();
    expect(Array.isArray(response.result.tools)).toBe(true);
    
    // Should have the 8 expected tools
    const toolNames = response.result.tools.map((tool: any) => tool.name);
    expect(toolNames).toContain('process_prompt');
    expect(toolNames).toContain('evaluate_prompt');
    expect(toolNames).toContain('compare_prompts');
    expect(toolNames).toContain('save_prompt');
    expect(toolNames).toContain('search_prompts');
    expect(toolNames).toContain('get_prompt');
    expect(toolNames).toContain('get_stats');
    expect(toolNames).toContain('validate_prompt');
  });

  test('should process a simple prompt', async () => {
    const response = await sendMCPRequest('tools/call', {
      name: 'process_prompt',
      arguments: {
        raw: 'create a login form',
        domain: 'general'
      }
    });

    expect(response.result).toBeDefined();
    expect(response.result.isError).toBeFalsy();
    
    const content = response.result.content;
    expect(content).toBeDefined();
    expect(Array.isArray(content)).toBe(true);
    expect(content.length).toBeGreaterThan(0);
    
    const textContent = content.find((c: any) => c.type === 'text');
    expect(textContent).toBeDefined();
    
    // Parse the result
    const result = JSON.parse(textContent.text);
    expect(result.original).toBe('create a login form');
    expect(result.refined).toBeDefined();
    expect(result.refined).not.toBe('No optimized result available');
    expect(result.score).toBeDefined();
    expect(result.metadata).toBeDefined();
  });

  test('should process SQL domain prompt', async () => {
    const response = await sendMCPRequest('tools/call', {
      name: 'process_prompt',
      arguments: {
        raw: 'show me all users',
        domain: 'sql'
      }
    });

    expect(response.result).toBeDefined();
    expect(response.result.isError).toBeFalsy();
    
    const content = response.result.content;
    const textContent = content.find((c: any) => c.type === 'text');
    const result = JSON.parse(textContent.text);
    
    expect(result.refined).toBeDefined();
    expect(result.refined.toLowerCase()).toMatch(/(sql|query|select|database)/);
    expect(result.metadata.domain).toBe('sql');
  });

  test('should evaluate prompt quality', async () => {
    const response = await sendMCPRequest('tools/call', {
      name: 'evaluate_prompt',
      arguments: {
        prompt: 'create a simple login form with email and password fields'
      }
    });

    expect(response.result).toBeDefined();
    expect(response.result.isError).toBeFalsy();
    
    const content = response.result.content;
    const textContent = content.find((c: any) => c.type === 'text');
    const result = JSON.parse(textContent.text);
    
    expect(result.score).toBeDefined();
    expect(result.score.overall).toBeGreaterThan(0);
    expect(result.score.overall).toBeLessThanOrEqual(1);
    expect(result.analysis).toBeDefined();
    expect(result.suggestions).toBeDefined();
  });

  test('should validate prompts', async () => {
    const response = await sendMCPRequest('tools/call', {
      name: 'validate_prompt',
      arguments: {
        prompt: 'test prompt'
      }
    });

    expect(response.result).toBeDefined();
    expect(response.result.isError).toBeFalsy();
    
    const content = response.result.content;
    const textContent = content.find((c: any) => c.type === 'text');
    const result = JSON.parse(textContent.text);
    
    expect(result.isValid).toBeDefined();
    expect(typeof result.isValid).toBe('boolean');
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.suggestions).toBeDefined();
  });

  test('should get system stats', async () => {
    const response = await sendMCPRequest('tools/call', {
      name: 'get_stats',
      arguments: {}
    });

    expect(response.result).toBeDefined();
    expect(response.result.isError).toBeFalsy();
    
    const content = response.result.content;
    const textContent = content.find((c: any) => c.type === 'text');
    const result = JSON.parse(textContent.text);
    
    expect(result.uptime).toBeDefined();
    expect(result.totalPrompts).toBeDefined();
    expect(result.version).toBeDefined();
  });

  test('should save prompts', async () => {
    const response = await sendMCPRequest('tools/call', {
      name: 'save_prompt',
      arguments: {
        original: 'test original prompt',
        refined: 'test refined prompt',
        metadata: {
          title: 'Test Prompt',
          description: 'A test prompt for E2E testing',
          domain: 'general',
          tags: ['test', 'e2e']
        }
      }
    });

    expect(response.result).toBeDefined();
    expect(response.result.isError).toBeFalsy();
    
    const content = response.result.content;
    const textContent = content.find((c: any) => c.type === 'text');
    const result = JSON.parse(textContent.text);
    
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  test('should search prompts', async () => {
    const response = await sendMCPRequest('tools/call', {
      name: 'search_prompts',
      arguments: {
        query: 'test',
        limit: 5
      }
    });

    expect(response.result).toBeDefined();
    expect(response.result.isError).toBeFalsy();
    
    const content = response.result.content;
    const textContent = content.find((c: any) => c.type === 'text');
    const result = JSON.parse(textContent.text);
    
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.total).toBeDefined();
    expect(typeof result.total).toBe('number');
  });

  test('should compare prompts', async () => {
    const response = await sendMCPRequest('tools/call', {
      name: 'compare_prompts',
      arguments: {
        promptA: 'create login form',
        promptB: 'make a user authentication interface'
      }
    });

    expect(response.result).toBeDefined();
    expect(response.result.isError).toBeFalsy();
    
    const content = response.result.content;
    const textContent = content.find((c: any) => c.type === 'text');
    const result = JSON.parse(textContent.text);
    
    expect(result.promptA).toBeDefined();
    expect(result.promptB).toBeDefined();
    expect(result.comparison).toBeDefined();
    expect(result.recommendation).toBeDefined();
  });

  test('should handle invalid tool calls', async () => {
    const response = await sendMCPRequest('tools/call', {
      name: 'nonexistent_tool',
      arguments: {}
    });

    expect(response.error).toBeDefined();
    expect(response.error.code).toBe(-32601); // Method not found
  });

  test('should handle malformed requests', async () => {
    const response = await sendMCPRequest('tools/call', {
      name: 'process_prompt',
      arguments: {
        // Missing required 'raw' parameter
        domain: 'general'
      }
    });

    expect(response.error).toBeDefined();
    expect(response.error.code).toBe(-32602); // Invalid params
  });
});