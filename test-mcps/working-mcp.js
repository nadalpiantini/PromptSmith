import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'working-test-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// Add a simple tool for testing
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [{
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }]
  }
});

server.setRequestHandler('tools/call', async (request) => {
  return {
    content: [
      {
        type: 'text',
        text: 'Test tool executed successfully!'
      }
    ]
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);