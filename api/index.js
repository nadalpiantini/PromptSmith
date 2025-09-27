import { PromptSmithServer } from '../dist/server/index.js';

// Create the MCP server instance once
let mcpServer = null;

// Simple HTML interface
const HTML_INTERFACE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptSmith MCP - sujeto10.com</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .status { background: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin-bottom: 20px; border: 1px solid #c3e6cb; }
        .endpoint { background: #e9ecef; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .endpoint h3 { margin: 0 0 10px 0; color: #495057; }
        .method { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
        .get { background: #28a745; color: white; }
        .post { background: #007bff; color: white; }
        code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: 'Monaco', 'Menlo', monospace; }
        .example { background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 10px; overflow-x: auto; }
        pre { margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 PromptSmith MCP Server</h1>
        
        <div class="status">
            ✅ <strong>Status:</strong> Online and running on sujeto10.com infrastructure
        </div>

        <h2>🌐 Available Endpoints</h2>
        
        <div class="endpoint">
            <h3><span class="method get">GET</span> /health</h3>
            <p>System health check</p>
            <div class="example">
                <pre>curl https://pimpprompt.sujeto10.com/health</pre>
            </div>
        </div>

        <div class="endpoint">
            <h3><span class="method get">GET</span> /docs</h3>
            <p>Complete API documentation</p>
            <div class="example">
                <pre>curl https://pimpprompt.sujeto10.com/docs</pre>
            </div>
        </div>

        <div class="endpoint">
            <h3><span class="method post">POST</span> /api/process</h3>
            <p>Transform and optimize prompts with domain intelligence</p>
            <div class="example">
                <pre>curl -X POST "https://pimpprompt.sujeto10.com/api/process" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"create a login form","domain":"web"}'</pre>
            </div>
        </div>

        <div class="endpoint">
            <h3><span class="method post">POST</span> /api/evaluate</h3>
            <p>Evaluate prompt quality with multi-dimensional scoring</p>
            <div class="example">
                <pre>curl -X POST "https://pimpprompt.sujeto10.com/api/evaluate" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"your prompt here"}'</pre>
            </div>
        </div>

        <div class="endpoint">
            <h3><span class="method get">GET</span> /api/search</h3>
            <p>Search the knowledge base of saved prompts</p>
            <div class="example">
                <pre>curl "https://pimpprompt.sujeto10.com/api/search?query=login&domain=web"</pre>
            </div>
        </div>

        <h2>🛠️ MCP Integration</h2>
        <p>This server implements the <strong>Model Context Protocol</strong> for integration with AI development tools like Cursor IDE.</p>
        
        <div class="endpoint">
            <h3>Available MCP Tools:</h3>
            <ul>
                <li><code>process_prompt</code> - Transform vibecoding into optimized prompts</li>
                <li><code>evaluate_prompt</code> - Quality analysis and scoring</li>
                <li><code>compare_prompts</code> - A/B testing for prompt variants</li>
                <li><code>save_prompt</code> - Store in knowledge base</li>
                <li><code>search_prompts</code> - Query saved prompts</li>
                <li><code>get_stats</code> - System performance metrics</li>
            </ul>
        </div>

        <h2>💾 Database</h2>
        <p><strong>Backend:</strong> Shared Supabase instance (sujeto10.com)</p>
        <p><strong>Prefix:</strong> <code>promptsmith_</code> tables</p>

        <h2>📊 System Info</h2>
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Environment:</strong> Production (sujeto10 lab)</p>
        <p><strong>Deployment:</strong> Vercel serverless functions</p>
    </div>
</body>
</html>
`;

// Export the handler for Vercel
export default async function handler(req, res) {
  try {
    const { method, url } = req;
    const urlPath = new URL(url, 'https://pimpprompt.sujeto10.com').pathname;

    // Initialize MCP server once
    if (!mcpServer) {
      mcpServer = new PromptSmithServer();
    }

    // Handle root path - serve HTML interface
    if (urlPath === '/' && method === 'GET') {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(HTML_INTERFACE);
    }

    // Handle health check
    if (urlPath === '/health' && method === 'GET') {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'production',
        version: '1.0.0'
      });
    }

    // Handle docs
    if (urlPath === '/docs' && method === 'GET') {
      return res.status(200).json({
        title: "PromptSmith MCP Server API",
        version: "1.0.0",
        description: "Model Context Protocol server for prompt engineering with REST API",
        webInterface: {
          url: "/",
          description: "Interactive web interface for prompt processing"
        },
        restAPI: {
          baseUrl: "/api",
          endpoints: {
            "POST /api/process": {
              description: "Process and optimize prompts",
              body: {
                text: "string (required)",
                domain: "string (optional)",
                options: {
                  includeMetrics: "boolean",
                  enableRefinement: "boolean"
                }
              }
            },
            "POST /api/evaluate": {
              description: "Evaluate prompt quality",
              body: { text: "string (required)" }
            },
            "POST /api/compare": {
              description: "Compare multiple prompts",
              body: { prompts: "array of strings (required)" }
            },
            "POST /api/save": {
              description: "Save prompt to knowledge base",
              body: {
                original: "string (required)",
                optimized: "string (required)",
                metadata: "object (optional)"
              }
            },
            "GET /api/search": {
              description: "Search saved prompts",
              params: {
                query: "string",
                domain: "string",
                tags: "comma-separated string",
                limit: "number (default: 10)",
                offset: "number (default: 0)",
                orderBy: "string (default: created_at)",
                orderDirection: "asc|desc (default: desc)"
              }
            },
            "GET /api/prompt/:id": { description: "Get specific prompt by ID" },
            "GET /api/stats": { description: "Get system statistics" },
            "POST /api/validate": {
              description: "Validate prompt structure",
              body: { text: "string (required)" }
            }
          }
        },
        mcp: {
          description: "This server also implements the Model Context Protocol",
          transport: "stdio",
          tools: [
            "process_prompt", "evaluate_prompt", "compare_prompts",
            "save_prompt", "search_prompts", "get_prompt", "get_stats", "validate_prompt"
          ]
        }
      });
    }

    // Handle API endpoints
    if (urlPath.startsWith('/api/')) {
      const apiPath = urlPath.replace('/api/', '');
      
      // Parse JSON body for POST requests
      if (method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const result = await handleApiRequest(apiPath, method, data);
            res.status(200).json({ success: true, data: result });
          } catch (error) {
            res.status(400).json({ 
              success: false, 
              error: error.message || 'Invalid request' 
            });
          }
        });
        return;
      }

      // Handle GET requests
      if (method === 'GET') {
        try {
          const result = await handleApiRequest(apiPath, method, {}, req.query);
          res.status(200).json({ success: true, data: result });
        } catch (error) {
          res.status(400).json({ 
            success: false, 
            error: error.message || 'Invalid request' 
          });
        }
        return;
      }
    }

    // Default 404
    res.status(404).json({ error: 'Not Found' });

  } catch (error) {
    console.error('API Handler Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}

// Handle API requests using MCP server
async function handleApiRequest(path, method, body, query = {}) {
  if (!mcpServer) {
    throw new Error('MCP Server not initialized');
  }

  // Map API paths to MCP server methods
  switch (path) {
    case 'process':
      if (!body.text) throw new Error('Missing required field: text');
      return await mcpServer.processPrompt({
        text: body.text,
        domain: body.domain || 'general',
        options: body.options || {}
      });

    case 'evaluate':
      if (!body.text) throw new Error('Missing required field: text');
      return await mcpServer.evaluatePrompt({
        text: body.text,
        criteria: body.criteria,
        domain: body.domain
      });

    case 'compare':
      if (!body.prompts || !Array.isArray(body.prompts)) {
        throw new Error('Missing required field: prompts (array)');
      }
      return await mcpServer.comparePrompts({
        prompts: body.prompts,
        testInput: body.testInput
      });

    case 'save':
      if (!body.original || !body.optimized) {
        throw new Error('Missing required fields: original, optimized');
      }
      return await mcpServer.savePrompt({
        original: body.original,
        optimized: body.optimized,
        metadata: body.metadata || {}
      });

    case 'search':
      return await mcpServer.searchPrompts({
        query: query.query || '',
        domain: query.domain,
        tags: query.tags,
        limit: parseInt(query.limit) || 10,
        offset: parseInt(query.offset) || 0,
        orderBy: query.orderBy || 'created_at',
        orderDirection: query.orderDirection || 'desc'
      });

    case 'stats':
      return await mcpServer.getStats();

    case 'validate':
      if (!body.text) throw new Error('Missing required field: text');
      return await mcpServer.validatePrompt({
        text: body.text,
        domain: body.domain || 'general'
      });

    default:
      throw new Error('Unknown API endpoint');
  }
}