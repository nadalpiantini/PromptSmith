#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { PromptSmithServer } from './index.js';
import { services } from '../services/index.js';

export class PromptSmithHttpServer {
  private app: express.Application;
  private mcpServer: PromptSmithServer;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.mcpServer = new PromptSmithServer();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware() {
    // CORS for web clients
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    // Serve static web interface - main app
    this.app.get('/', (req, res) => {
      res.sendFile('app.html', { root: './src/web' });
    });

    // Serve static assets
    this.app.use('/app.css', (req, res) => {
      res.sendFile('app.css', { root: './src/web' });
    });

    this.app.use('/app.js', (req, res) => {
      res.sendFile('app.js', { root: './src/web' });
    });

    // Legacy index.html for compatibility
    this.app.get('/legacy', (req, res) => {
      res.sendFile('index.html', { root: './src/web' });
    });

    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        // Simple health check without complex services
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          environment: process.env.NODE_ENV || 'development',
          version: '1.0.0'
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // ===================
    // REST API ENDPOINTS
    // ===================

    // Process prompt - main functionality
    this.app.post('/api/process', async (req, res) => {
      try {
        const { text, domain, options = {} } = req.body;
        
        if (!text || typeof text !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Missing or invalid text parameter'
          });
        }

        // Call MCP server's process_prompt tool
        const result = await this.mcpServer.processPrompt({
          text: text.trim(),
          domain: domain || undefined,
          options: {
            includeAnalysis: true,
            includeMetrics: options.includeMetrics || false,
            enableRefinement: options.enableRefinement || false
          }
        });

        return res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Process prompt error:', error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // Evaluate prompt quality
    this.app.post('/api/evaluate', async (req, res) => {
      try {
        const { text } = req.body;
        
        if (!text || typeof text !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Missing or invalid text parameter'
          });
        }

        const result = await this.mcpServer.evaluatePrompt({
          text: text.trim()
        });

        return res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Evaluate prompt error:', error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // Compare prompts
    this.app.post('/api/compare', async (req, res) => {
      try {
        const { prompts } = req.body;
        
        if (!Array.isArray(prompts) || prompts.length < 2) {
          return res.status(400).json({
            success: false,
            error: 'Need at least 2 prompts to compare'
          });
        }

        const result = await this.mcpServer.comparePrompts({
          prompts: prompts.map(p => p.trim())
        });

        return res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Compare prompts error:', error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // Save prompt
    this.app.post('/api/save', async (req, res) => {
      try {
        const { original, optimized, metadata = {} } = req.body;
        
        if (!original || !optimized) {
          return res.status(400).json({
            success: false,
            error: 'Missing original or optimized text'
          });
        }

        const result = await this.mcpServer.savePrompt({
          original: original.trim(),
          optimized: optimized.trim(),
          metadata: {
            title: metadata.title || 'Untitled',
            description: metadata.description || '',
            tags: metadata.tags || [],
            domain: metadata.domain || 'general',
            ...metadata
          }
        });

        return res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Save prompt error:', error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // Search prompts
    this.app.get('/api/search', async (req, res) => {
      try {
        const {
          query,
          domain,
          tags,
          limit = '10',
          offset = '0',
          orderBy = 'created_at',
          orderDirection = 'desc'
        } = req.query;

        const result = await this.mcpServer.searchPrompts({
          query: query as string || '',
          domain: domain as string || undefined,
          tags: tags ? (tags as string).split(',').map(t => t.trim()) : undefined,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
          sortBy: (orderBy as string) === 'created_at' ? 'created' : orderBy as 'score' | 'created' | 'updated' | 'usage' || 'created',
          sortOrder: orderDirection as 'asc' | 'desc' || 'desc'
        });

        return res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Search prompts error:', error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // Get specific prompt
    this.app.get('/api/prompt/:id', async (req, res) => {
      try {
        const { id } = req.params;
        
        const result = await this.mcpServer.getPrompt({
          id
        });

        return res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Get prompt error:', error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // Get system statistics
    this.app.get('/api/stats', async (req, res) => {
      try {
        const result = await this.mcpServer.getStats();

        return res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Get stats error:', error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // Validate prompt
    this.app.post('/api/validate', async (req, res) => {
      try {
        const { text } = req.body;
        
        if (!text || typeof text !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Missing or invalid text parameter'
          });
        }

        const result = await this.mcpServer.validatePrompt({
          text: text.trim()
        });

        return res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Validate prompt error:', error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // Favicon endpoint to prevent 404 errors
    this.app.get('/favicon.ico', (req, res) => {
      // Return a simple 1x1 transparent PNG
      const favicon = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', favicon.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(favicon);
    });

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'PromptSmith MCP Server',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          web: '/',
          legacy: '/legacy',
          api: {
            process: 'POST /api/process',
            evaluate: 'POST /api/evaluate',
            compare: 'POST /api/compare',
            save: 'POST /api/save',
            search: 'GET /api/search',
            getPrompt: 'GET /api/prompt/:id',
            stats: 'GET /api/stats',
            validate: 'POST /api/validate'
          },
          docs: '/docs'
        },
        timestamp: new Date().toISOString()
      });
    });

    // API documentation endpoint
    this.app.get('/docs', (req, res) => {
      res.json({
        title: 'PromptSmith MCP Server API',
        version: '1.0.0',
        description: 'Model Context Protocol server for prompt engineering with REST API',
        webInterface: {
          url: '/',
          description: 'Interactive web interface for prompt processing'
        },
        restAPI: {
          baseUrl: '/api',
          endpoints: {
            'POST /api/process': {
              description: 'Process and optimize prompts',
              body: {
                text: 'string (required)',
                domain: 'string (optional)',
                options: {
                  includeMetrics: 'boolean',
                  enableRefinement: 'boolean'
                }
              }
            },
            'POST /api/evaluate': {
              description: 'Evaluate prompt quality',
              body: { text: 'string (required)' }
            },
            'POST /api/compare': {
              description: 'Compare multiple prompts',
              body: { prompts: 'array of strings (required)' }
            },
            'POST /api/save': {
              description: 'Save prompt to knowledge base',
              body: {
                original: 'string (required)',
                optimized: 'string (required)',
                metadata: 'object (optional)'
              }
            },
            'GET /api/search': {
              description: 'Search saved prompts',
              params: {
                query: 'string',
                domain: 'string',
                tags: 'comma-separated string',
                limit: 'number (default: 10)',
                offset: 'number (default: 0)',
                orderBy: 'string (default: created_at)',
                orderDirection: 'asc|desc (default: desc)'
              }
            },
            'GET /api/prompt/:id': {
              description: 'Get specific prompt by ID'
            },
            'GET /api/stats': {
              description: 'Get system statistics'
            },
            'POST /api/validate': {
              description: 'Validate prompt structure',
              body: { text: 'string (required)' }
            }
          }
        },
        mcp: {
          description: 'This server also implements the Model Context Protocol',
          transport: 'stdio',
          tools: [
            'process_prompt',
            'evaluate_prompt', 
            'compare_prompts',
            'save_prompt',
            'search_prompts',
            'get_prompt',
            'get_stats',
            'validate_prompt'
          ]
        }
      });
    });

    // Catch-all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableRoutes: [
          'GET /',
          'GET /health', 
          'GET /favicon.ico',
          'POST /mcp',
          'GET /docs'
        ]
      });
    });
  }

  private setupErrorHandling() {
    // Global error handler
    this.app.use(async (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('HTTP Server Error:', error);
      
      await services.telemetry.error('http_server_error', error, {
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent')
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  async start() {
    return new Promise<void>((resolve, reject) => {
      const server = this.app.listen(this.port, () => {
        console.log(`🚀 PromptSmith HTTP Server running on port ${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`📚 Documentation: http://localhost:${this.port}/docs`);
        resolve();
      });

      server.on('error', (error) => {
        console.error('Failed to start HTTP server:', error);
        reject(error);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down HTTP server gracefully');
        server.close(() => {
          console.log('HTTP server closed');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down HTTP server gracefully');
        server.close(() => {
          console.log('HTTP server closed');
          process.exit(0);
        });
      });
    });
  }

  async shutdown() {
    console.log('Shutting down HTTP server...');
    // The server will be closed by the signal handlers
  }
}

// Start HTTP server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '3000', 10);
  const httpServer = new PromptSmithHttpServer(port);
  
  httpServer.start().catch((error) => {
    console.error('Failed to start HTTP server:', error);
    // In STDIO mode, don't exit as it breaks MCP protocol
    if (process.env.MCP_TRANSPORT === 'stdio' || !process.stdout.isTTY) {
      console.error('HTTP server will continue in degraded mode...');
    } else {
      process.exit(1);
    }
  });
}

export default PromptSmithHttpServer;
