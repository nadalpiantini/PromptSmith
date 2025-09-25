#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { PromptOrchestrator } from '../core/orchestrator.js';
import { services } from '../services/index.js';
import {
  ProcessInput,
  PromptDomain,
  SaveMetadata,
  SearchParams,
  ValidationResult
} from '../types/prompt.js';

// Server information
const SERVER_NAME = 'promptsmith-mcp';
const SERVER_VERSION = '1.0.0';

class PromptSmithServer {
  private server: Server;
  private orchestrator: PromptOrchestrator;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.orchestrator = new PromptOrchestrator();
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'process_prompt',
            description: 'Transform and optimize a raw prompt into a structured, high-quality prompt with domain-specific enhancements',
            inputSchema: {
              type: 'object',
              properties: {
                raw: {
                  type: 'string',
                  description: 'The raw prompt text to be processed and optimized'
                },
                domain: {
                  type: 'string',
                  enum: ['general', 'sql', 'branding', 'cine', 'saas', 'devops'],
                  description: 'The domain context for specialized processing',
                  default: 'general'
                },
                tone: {
                  type: 'string',
                  enum: ['professional', 'casual', 'technical', 'creative', 'formal'],
                  description: 'Desired tone for the optimized prompt',
                  default: 'professional'
                },
                context: {
                  type: 'string',
                  description: 'Additional context to inform the processing'
                },
                variables: {
                  type: 'object',
                  description: 'Variables for template generation',
                  additionalProperties: true
                },
                targetModel: {
                  type: 'string',
                  description: 'Target language model (e.g., gpt-4, claude-3)',
                  default: 'general'
                }
              },
              required: ['raw']
            }
          },
          {
            name: 'evaluate_prompt',
            description: 'Analyze and score a prompt across multiple quality dimensions',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'The prompt text to evaluate'
                },
                criteria: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific evaluation criteria to focus on'
                },
                domain: {
                  type: 'string',
                  enum: ['general', 'sql', 'branding', 'cine', 'saas', 'devops'],
                  description: 'Domain context for evaluation'
                }
              },
              required: ['prompt']
            }
          },
          {
            name: 'compare_prompts',
            description: 'Compare multiple prompt variants and identify the best performer',
            inputSchema: {
              type: 'object',
              properties: {
                variants: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of prompt variants to compare',
                  minItems: 2
                },
                testInput: {
                  type: 'string',
                  description: 'Optional test input for comparison context'
                }
              },
              required: ['variants']
            }
          },
          {
            name: 'save_prompt',
            description: 'Save a refined prompt to the knowledge base for future use',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'The refined prompt to save'
                },
                metadata: {
                  type: 'object',
                  properties: {
                    domain: {
                      type: 'string',
                      enum: ['general', 'sql', 'branding', 'cine', 'saas', 'devops']
                    },
                    description: {
                      type: 'string',
                      description: 'Description of the prompt\'s purpose'
                    },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Tags for categorization'
                    },
                    isPublic: {
                      type: 'boolean',
                      description: 'Whether the prompt should be publicly searchable',
                      default: false
                    },
                    author: {
                      type: 'string',
                      description: 'Author of the prompt'
                    },
                    version: {
                      type: 'string',
                      description: 'Version identifier',
                      default: '1.0.0'
                    }
                  },
                  required: ['domain']
                }
              },
              required: ['prompt', 'metadata']
            }
          },
          {
            name: 'search_prompts',
            description: 'Search the prompt knowledge base for existing solutions',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query text'
                },
                domain: {
                  type: 'string',
                  enum: ['general', 'sql', 'branding', 'cine', 'saas', 'devops'],
                  description: 'Filter by domain'
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by tags'
                },
                minScore: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                  description: 'Minimum quality score filter'
                },
                sortBy: {
                  type: 'string',
                  enum: ['score', 'created', 'updated', 'relevance'],
                  description: 'Sort order',
                  default: 'relevance'
                },
                limit: {
                  type: 'number',
                  minimum: 1,
                  maximum: 100,
                  description: 'Maximum number of results',
                  default: 20
                },
                offset: {
                  type: 'number',
                  minimum: 0,
                  description: 'Offset for pagination',
                  default: 0
                },
                isPublic: {
                  type: 'boolean',
                  description: 'Filter by public/private status'
                }
              }
            }
          },
          {
            name: 'get_prompt',
            description: 'Retrieve a specific prompt by its ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'The unique identifier of the prompt'
                }
              },
              required: ['id']
            }
          },
          {
            name: 'get_stats',
            description: 'Get system statistics and performance metrics',
            inputSchema: {
              type: 'object',
              properties: {
                days: {
                  type: 'number',
                  minimum: 1,
                  maximum: 365,
                  description: 'Number of days for statistics',
                  default: 7
                }
              }
            }
          },
          {
            name: 'validate_prompt',
            description: 'Validate a prompt for common issues and best practices',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'The prompt text to validate'
                },
                domain: {
                  type: 'string',
                  enum: ['general', 'sql', 'branding', 'cine', 'saas', 'devops'],
                  description: 'Domain context for validation',
                  default: 'general'
                }
              },
              required: ['prompt']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'process_prompt':
            return await this.handleProcessPrompt(args);

          case 'evaluate_prompt':
            return await this.handleEvaluatePrompt(args);

          case 'compare_prompts':
            return await this.handleComparePrompts(args);

          case 'save_prompt':
            return await this.handleSavePrompt(args);

          case 'search_prompts':
            return await this.handleSearchPrompts(args);

          case 'get_prompt':
            return await this.handleGetPrompt(args);

          case 'get_stats':
            return await this.handleGetStats(args);

          case 'validate_prompt':
            return await this.handleValidatePrompt(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        await services.telemetry.error(`tool_${name}_error`, error, {
          tool: name,
          args: this.sanitizeArgs(args)
        });

        if (error instanceof McpError) {
          throw error;
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async handleProcessPrompt(args: any) {
    const {
      raw,
      domain = 'general',
      tone = 'professional',
      context,
      variables = {},
      targetModel = 'general'
    } = args;

    if (!raw || typeof raw !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'Raw prompt is required and must be a string');
    }

    const input: ProcessInput = {
      raw,
      domain: domain as PromptDomain,
      tone: tone as any,
      context,
      variables,
      targetModel
    };

    const result = await this.orchestrator.process(input);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              original: result.original,
              refined: result.refined,
              system: result.system,
              score: result.score,
              validation: result.validation,
              suggestions: result.suggestions,
              metadata: result.metadata,
              template: result.template,
              examples: result.examples
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleEvaluatePrompt(args: any) {
    const { prompt, criteria, domain } = args;

    if (!prompt || typeof prompt !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'Prompt is required and must be a string');
    }

    const result = await this.orchestrator.evaluate(prompt, criteria, domain);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: result
          }, null, 2)
        }
      ]
    };
  }

  private async handleComparePrompts(args: any) {
    const { variants, testInput } = args;

    if (!Array.isArray(variants) || variants.length < 2) {
      throw new McpError(ErrorCode.InvalidParams, 'At least 2 prompt variants are required');
    }

    const result = await this.orchestrator.compare(variants, testInput);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: result
          }, null, 2)
        }
      ]
    };
  }

  private async handleSavePrompt(args: any) {
    const { prompt, metadata } = args;

    if (!prompt || typeof prompt !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'Prompt is required and must be a string');
    }

    if (!metadata || typeof metadata !== 'object') {
      throw new McpError(ErrorCode.InvalidParams, 'Metadata is required and must be an object');
    }

    const saveMetadata: SaveMetadata = {
      name: metadata.name || 'Unnamed Prompt',
      domain: metadata.domain,
      description: metadata.description,
      tags: metadata.tags,
      isPublic: metadata.isPublic,
      authorId: metadata.author
    };

    const result = await this.orchestrator.save(prompt, saveMetadata);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: result
          }, null, 2)
        }
      ]
    };
  }

  private async handleSearchPrompts(args: any) {
    const searchParams: SearchParams = {
      query: args.query,
      domain: args.domain as PromptDomain,
      tags: args.tags,
      minScore: args.minScore,
      sortBy: args.sortBy || 'relevance',
      limit: args.limit || 20,
      offset: args.offset || 0,
      // isPublic: args.isPublic // This property doesn't exist in SearchParams interface
    };

    const results = await this.orchestrator.search(searchParams);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              results,
              total: results.length,
              params: searchParams
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetPrompt(args: any) {
    const { id } = args;

    if (!id || typeof id !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'Prompt ID is required and must be a string');
    }

    const prompt = await services.store.getById(id);

    if (!prompt) {
      throw new McpError(ErrorCode.InvalidParams, `Prompt with ID ${id} not found`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: prompt
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetStats(args: any) {
    const { days = 7 } = args;

    const [storeStats, telemetryStats, healthCheck] = await Promise.all([
      services.store.getStats(),
      services.telemetry.getStats(days),
      services.healthCheck()
    ]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              store: storeStats,
              telemetry: telemetryStats,
              health: healthCheck,
              system: {
                name: SERVER_NAME,
                version: SERVER_VERSION,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
              }
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleValidatePrompt(args: any) {
    const { prompt, domain = 'general' } = args;

    if (!prompt || typeof prompt !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'Prompt is required and must be a string');
    }

    // Use the orchestrator's internal validator
    const analyzer = new (await import('../core/analyzer.js')).PromptAnalyzer();
    const validator = new (await import('../core/validator.js')).PromptValidator();

    const analysis = await analyzer.analyze(prompt);
    const validation = await validator.validate(prompt, analysis);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              isValid: validation.isValid,
              errors: validation.errors,
              warnings: validation.warnings,
              suggestions: validation.suggestions,
              analysis: {
                complexity: analysis.complexity,
                readabilityScore: analysis.readabilityScore,
                ambiguityScore: analysis.ambiguityScore,
                technicalTerms: analysis.technicalTerms.length,
                domainHints: analysis.domainHints
              }
            }
          }, null, 2)
        }
      ]
    };
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      services.telemetry.error('server_error', error);
      console.error('[MCP Error]', error);
    };

    // Handle process events
    process.on('SIGINT', async () => {
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.shutdown();
      process.exit(0);
    });
  }

  private sanitizeArgs(args: any): any {
    // Remove sensitive information from args before logging
    const sanitized = { ...args };

    // Remove potentially sensitive fields
    if (sanitized.metadata?.author) {
      sanitized.metadata.author = '[REDACTED]';
    }

    return sanitized;
  }

  async start() {
    const transport = new StdioServerTransport();

    await services.telemetry.track('server_start', {
      name: SERVER_NAME,
      version: SERVER_VERSION
    });

    await this.server.connect(transport);
    console.error(`${SERVER_NAME} v${SERVER_VERSION} started`);
  }

  async shutdown() {
    await services.telemetry.track('server_shutdown', {
      name: SERVER_NAME,
      version: SERVER_VERSION
    });

    await services.shutdown();
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new PromptSmithServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { PromptSmithServer };