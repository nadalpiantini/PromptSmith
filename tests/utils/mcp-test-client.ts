/**
 * MCP Test Client - Utilities for testing MCP protocol communication
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';

export interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPToolCall {
  name: string;
  arguments: any;
}

export class MCPTestClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string | number, {
    resolve: (response: MCPResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private responseBuffer = '';

  constructor(private serverPath: string = 'dist/cli.js') {
    super();
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Start the MCP server process
      this.process = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.resolve(process.cwd()),
      });

      let startupComplete = false;

      // Handle process errors
      this.process.on('error', (error) => {
        if (!startupComplete) {
          reject(new Error(`Failed to start MCP server: ${error.message}`));
        } else {
          this.emit('error', error);
        }
      });

      // Handle process exit
      this.process.on('exit', (code, signal) => {
        if (!startupComplete) {
          reject(new Error(`MCP server exited during startup: code=${code}, signal=${signal}`));
        } else {
          this.emit('exit', code, signal);
        }
      });

      // Handle stdout (MCP responses)
      this.process.stdout?.on('data', (data) => {
        this.handleResponse(data.toString());
      });

      // Handle stderr (server logs)
      this.process.stderr?.on('data', (data) => {
        const message = data.toString();
        this.emit('log', message);

        // Check for startup completion
        if (message.includes('PromptSmith MCP Server is ready')) {
          startupComplete = true;
          resolve();
        }
      });

      // Timeout if server doesn't start within reasonable time
      setTimeout(() => {
        if (!startupComplete) {
          reject(new Error('MCP server startup timeout'));
        }
      }, 10000);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      // Clear pending requests
      for (const [id, request] of this.pendingRequests) {
        clearTimeout(request.timeout);
        request.reject(new Error('Server stopped'));
      }
      this.pendingRequests.clear();

      // Kill the process
      this.process.kill('SIGTERM');

      // Wait for process to exit
      this.process.on('exit', () => {
        this.process = null;
        resolve();
      });

      // Force kill after timeout
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill('SIGKILL');
          this.process = null;
          resolve();
        }
      }, 5000);
    });
  }

  async listTools(): Promise<any[]> {
    const response = await this.sendRequest('tools/list', {});
    return response.result?.tools || [];
  }

  async callTool(name: string, args: any): Promise<any> {
    const response = await this.sendRequest('tools/call', {
      name,
      arguments: args
    });
    return response.result;
  }

  async sendRequest(method: string, params?: any): Promise<MCPResponse> {
    if (!this.process) {
      throw new Error('MCP server not started');
    }

    const id = ++this.requestId;
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, 5000);

      // Store the request for when response arrives
      this.pendingRequests.set(id, {
        resolve,
        reject,
        timeout
      });

      // Send the request
      const requestString = JSON.stringify(request) + '\n';
      this.process!.stdin?.write(requestString);
    });
  }

  private handleResponse(data: string): void {
    this.responseBuffer += data;

    // Split by newlines to handle multiple responses
    const lines = this.responseBuffer.split('\n');
    this.responseBuffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response: MCPResponse = JSON.parse(line.trim());
          this.handleParsedResponse(response);
        } catch (error) {
          this.emit('error', new Error(`Failed to parse MCP response: ${line}`));
        }
      }
    }
  }

  private handleParsedResponse(response: MCPResponse): void {
    const request = this.pendingRequests.get(response.id);
    if (request) {
      clearTimeout(request.timeout);
      this.pendingRequests.delete(response.id);

      if (response.error) {
        request.reject(new Error(`MCP Error ${response.error.code}: ${response.error.message}`));
      } else {
        request.resolve(response);
      }
    } else {
      this.emit('unhandledResponse', response);
    }
  }
}

// Test utility functions for MCP testing

export async function withMCPClient<T>(
  testFn: (client: MCPTestClient) => Promise<T>,
  serverPath?: string
): Promise<T> {
  const client = new MCPTestClient(serverPath);

  try {
    await client.start();
    return await testFn(client);
  } finally {
    await client.stop();
  }
}

export function createMockMCPResponse(id: string | number, result?: any, error?: any): MCPResponse {
  return {
    jsonrpc: '2.0',
    id,
    result,
    error
  };
}

export function createToolCallRequest(name: string, args: any): MCPToolCall {
  return {
    name,
    arguments: args
  };
}

// Validation helpers
export function validateMCPResponse(response: MCPResponse): void {
  expect(response).toHaveProperty('jsonrpc', '2.0');
  expect(response).toHaveProperty('id');

  if (response.error) {
    expect(response.error).toHaveProperty('code');
    expect(response.error).toHaveProperty('message');
  } else {
    expect(response).toHaveProperty('result');
  }
}

export function validateToolResponse(response: any): void {
  expect(response).toHaveProperty('content');
  expect(Array.isArray(response.content)).toBe(true);

  if (response.content.length > 0) {
    expect(response.content[0]).toHaveProperty('type');
    expect(response.content[0]).toHaveProperty('text');
  }
}

export function parseToolResponseData(response: any): any {
  if (!response.content || response.content.length === 0) {
    return null;
  }

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error(`Expected text content, got: ${content.type}`);
  }

  try {
    return JSON.parse(content.text);
  } catch (error) {
    throw new Error(`Failed to parse tool response as JSON: ${content.text}`);
  }
}