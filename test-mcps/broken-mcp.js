// Broken MCP server for testing auto-fix functionality
// This file contains common issues that the auto-fixer should resolve

import { Server  } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport  } from "@modelcontextprotocol/sdk/server/stdio.js";

// Syntax error: missing semicolon
const server = new Server({
  name: 'broken-test-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
})

// Missing proper MCP protocol setup
// // Wrong async/await usage
const transport = new StdioServerTransport()
(async () => {
  await server.connect(transport)
})()

// Missing export
export default server;;