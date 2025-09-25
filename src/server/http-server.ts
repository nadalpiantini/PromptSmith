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
    // Serve static web interface
    this.app.get('/', (req, res) => {
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
          mcp: '/mcp',
          docs: '/docs'
        },
        timestamp: new Date().toISOString()
      });
    });

    // MCP endpoint for HTTP-based MCP communication
    this.app.post('/mcp', async (req, res) => {
      try {
        // This would need to be implemented to handle MCP over HTTP
        // For now, return a helpful message
        res.json({
          message: 'MCP over HTTP not yet implemented',
          suggestion: 'Use the MCP protocol directly with stdio transport',
          documentation: 'https://modelcontextprotocol.io/'
        });
      } catch (error) {
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // API documentation endpoint
    this.app.get('/docs', (req, res) => {
      res.json({
        title: 'PromptSmith MCP Server API',
        version: '1.0.0',
        description: 'Model Context Protocol server for prompt engineering',
        endpoints: {
          'GET /': 'Server information',
          'GET /health': 'Health check',
          'GET /favicon.ico': 'Favicon (prevents 404)',
          'POST /mcp': 'MCP protocol endpoint (not implemented)',
          'GET /docs': 'This documentation'
        },
        mcp: {
          description: 'This server implements the Model Context Protocol',
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
    process.exit(1);
  });
}

export default PromptSmithHttpServer;
