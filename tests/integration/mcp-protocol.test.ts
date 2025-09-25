/**
 * Integration Tests for MCP Protocol Communication
 * Tests the complete MCP server communication protocol
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  MCPTestClient,
  withMCPClient,
  validateMCPResponse,
  validateToolResponse,
  parseToolResponseData,
} from '../utils/mcp-test-client.js';
import {
  expectValidProcessResult,
  expectValidQualityScore,
  measurePerformance,
  expectWithinPerformanceThreshold,
  TEST_CONSTANTS,
} from '../utils/test-helpers.js';
import { setupMockEnvironment } from '../utils/mock-services.js';

// Mock external services for integration tests
setupMockEnvironment();

describe('MCP Protocol Integration', () => {
  let client: MCPTestClient;

  beforeEach(async () => {
    // Set up clean environment for each test
    process.env.NODE_ENV = 'test';
    process.env.TELEMETRY_ENABLED = 'false';
  });

  afterEach(async () => {
    if (client) {
      await client.stop();
    }
  });

  describe('server startup and connection', () => {
    it('should start MCP server and establish connection', async () => {
      await withMCPClient(async (testClient) => {
        client = testClient;

        // Server should be responsive
        const tools = await client.listTools();
        expect(tools).toBeDefined();
        expect(Array.isArray(tools)).toBe(true);
        expect(tools.length).toBeGreaterThan(0);
      });
    }, 'dist/cli.js');

    it('should handle server startup timeout gracefully', async () => {
      // Test with non-existent server path
      const client = new MCPTestClient('nonexistent/path');

      await expect(client.start()).rejects.toThrow();
    });

    it('should list all expected tools', async () => {
      await withMCPClient(async (testClient) => {
        const tools = await testClient.listTools();

        const expectedToolNames = [
          'process_prompt',
          'evaluate_prompt',
          'compare_prompts',
          'save_prompt',
          'search_prompts',
          'get_prompt',
          'get_stats',
          'validate_prompt',
        ];

        expectedToolNames.forEach(toolName => {
          const tool = tools.find((t: any) => t.name === toolName);
          expect(tool).toBeDefined();
          expect(tool.description).toBeDefined();
          expect(tool.inputSchema).toBeDefined();
        });

        expect(tools).toHaveLength(expectedToolNames.length);
      });
    });
  });

  describe('tool schema validation', () => {
    it('should validate tool input schemas', async () => {
      await withMCPClient(async (testClient) => {
        const tools = await testClient.listTools();

        tools.forEach((tool: any) => {
          expect(tool).toHaveProperty('name');
          expect(tool).toHaveProperty('description');
          expect(tool).toHaveProperty('inputSchema');

          // Validate schema structure
          expect(tool.inputSchema).toHaveProperty('type', 'object');
          expect(tool.inputSchema).toHaveProperty('properties');

          if (tool.inputSchema.required) {
            expect(Array.isArray(tool.inputSchema.required)).toBe(true);
          }
        });
      });
    });

    it('should validate process_prompt schema specifics', async () => {
      await withMCPClient(async (testClient) => {
        const tools = await testClient.listTools();
        const processPromptTool = tools.find((t: any) => t.name === 'process_prompt');

        expect(processPromptTool).toBeDefined();

        const schema = processPromptTool.inputSchema;
        expect(schema.properties).toHaveProperty('raw');
        expect(schema.properties.raw.type).toBe('string');
        expect(schema.properties).toHaveProperty('domain');
        expect(schema.properties.domain.enum).toContain('general');
        expect(schema.properties.domain.enum).toContain('sql');

        expect(schema.required).toEqual(['raw']);
      });
    });
  });

  describe('end-to-end tool execution', () => {
    it('should execute process_prompt tool successfully', async () => {
      await withMCPClient(async (testClient) => {
        const { duration, result } = await measurePerformance(async () => {
          return await testClient.callTool('process_prompt', {
            raw: TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
            domain: 'sql',
            tone: 'technical',
          });
        });

        expectWithinPerformanceThreshold(
          duration,
          TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.process_prompt,
          'process_prompt_integration'
        );

        validateToolResponse(result);
        const data = parseToolResponseData(result);

        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expectValidProcessResult(data.data);
      });
    });

    it('should execute evaluate_prompt tool successfully', async () => {
      await withMCPClient(async (testClient) => {
        const result = await testClient.callTool('evaluate_prompt', {
          prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
          criteria: ['clarity', 'specificity'],
          domain: 'devops',
        });

        validateToolResponse(result);
        const data = parseToolResponseData(result);

        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('score');
        expect(data.data).toHaveProperty('breakdown');
        expect(data.data).toHaveProperty('recommendations');

        expectValidQualityScore(data.data.score);
      });
    });

    it('should execute compare_prompts tool successfully', async () => {
      await withMCPClient(async (testClient) => {
        const variants = [
          TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
          TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
          'Create a basic table structure',
        ];

        const result = await testClient.callTool('compare_prompts', {
          variants,
          testInput: 'database design',
        });

        validateToolResponse(result);
        const data = parseToolResponseData(result);

        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('variants');
        expect(data.data).toHaveProperty('winner');
        expect(data.data).toHaveProperty('metrics');
        expect(data.data).toHaveProperty('summary');

        expect(data.data.variants).toHaveLength(3);
        expect(data.data.winner).toBeDefined();

        data.data.variants.forEach((variant: any) => {
          expectValidQualityScore(variant.score);
        });
      });
    });

    it('should execute save_prompt tool successfully', async () => {
      await withMCPClient(async (testClient) => {
        const result = await testClient.callTool('save_prompt', {
          prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
          metadata: {
            domain: 'devops',
            description: 'OAuth 2.0 implementation guide',
            tags: ['oauth', 'security', 'authentication'],
            isPublic: false,
            author: 'test-integration-user',
            version: '1.0.0',
          },
        });

        validateToolResponse(result);
        const data = parseToolResponseData(result);

        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('id');
        expect(data.data).toHaveProperty('name');
        expect(data.data).toHaveProperty('domain', 'devops');
        expect(data.data).toHaveProperty('tags');
        expect(data.data.tags).toContain('oauth');
        expect(data.data.tags).toContain('security');
      });
    });

    it('should execute search_prompts tool successfully', async () => {
      await withMCPClient(async (testClient) => {
        const result = await testClient.callTool('search_prompts', {
          query: 'database table',
          domain: 'sql',
          tags: ['database'],
          limit: 10,
        });

        validateToolResponse(result);
        const data = parseToolResponseData(result);

        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('results');
        expect(data.data).toHaveProperty('total');
        expect(data.data).toHaveProperty('params');

        expect(Array.isArray(data.data.results)).toBe(true);
        expect(data.data.params.query).toBe('database table');
        expect(data.data.params.domain).toBe('sql');
      });
    });

    it('should execute get_prompt tool successfully', async () => {
      await withMCPClient(async (testClient) => {
        // First save a prompt to retrieve
        const saveResult = await testClient.callTool('save_prompt', {
          prompt: 'Test prompt for retrieval',
          metadata: {
            domain: 'general',
            description: 'Test prompt',
          },
        });

        const saveData = parseToolResponseData(saveResult);
        const promptId = saveData.data.id;

        // Now retrieve it
        const getResult = await testClient.callTool('get_prompt', {
          id: promptId,
        });

        validateToolResponse(getResult);
        const getData = parseToolResponseData(getResult);

        expect(getData.success).toBe(true);
        expect(getData.data).toHaveProperty('id', promptId);
        expect(getData.data).toHaveProperty('prompt', 'Test prompt for retrieval');
        expect(getData.data).toHaveProperty('domain', 'general');
      });
    });

    it('should execute get_stats tool successfully', async () => {
      await withMCPClient(async (testClient) => {
        const result = await testClient.callTool('get_stats', {
          days: 7,
        });

        validateToolResponse(result);
        const data = parseToolResponseData(result);

        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('store');
        expect(data.data).toHaveProperty('telemetry');
        expect(data.data).toHaveProperty('health');
        expect(data.data).toHaveProperty('system');

        expect(data.data.system).toHaveProperty('name', 'promptsmith-mcp');
        expect(data.data.system).toHaveProperty('version', '1.0.0');
        expect(data.data.system).toHaveProperty('uptime');
        expect(data.data.system).toHaveProperty('memory');
      });
    });

    it('should execute validate_prompt tool successfully', async () => {
      await withMCPClient(async (testClient) => {
        const result = await testClient.callTool('validate_prompt', {
          prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.ambiguous,
          domain: 'general',
        });

        validateToolResponse(result);
        const data = parseToolResponseData(result);

        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('isValid');
        expect(data.data).toHaveProperty('errors');
        expect(data.data).toHaveProperty('warnings');
        expect(data.data).toHaveProperty('suggestions');
        expect(data.data).toHaveProperty('analysis');

        expect(Array.isArray(data.data.errors)).toBe(true);
        expect(Array.isArray(data.data.warnings)).toBe(true);
        expect(Array.isArray(data.data.suggestions)).toBe(true);
      });
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle invalid tool names', async () => {
      await withMCPClient(async (testClient) => {
        await expect(
          testClient.callTool('nonexistent_tool', {})
        ).rejects.toThrow(/Unknown tool/);
      });
    });

    it('should handle malformed requests', async () => {
      await withMCPClient(async (testClient) => {
        // Invalid JSON-RPC request
        const invalidRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'process_prompt',
            // Missing required arguments
          },
        };

        await expect(
          testClient.sendRequest('tools/call', invalidRequest.params)
        ).rejects.toThrow();
      });
    });

    it('should handle missing required parameters', async () => {
      await withMCPClient(async (testClient) => {
        await expect(
          testClient.callTool('process_prompt', {
            // Missing required 'raw' parameter
            domain: 'sql',
          })
        ).rejects.toThrow(/Raw prompt is required/);
      });
    });

    it('should handle invalid parameter types', async () => {
      await withMCPClient(async (testClient) => {
        await expect(
          testClient.callTool('process_prompt', {
            raw: 123, // Should be string
            domain: 'sql',
          })
        ).rejects.toThrow(/must be a string/);
      });
    });

    it('should handle empty parameter values', async () => {
      await withMCPClient(async (testClient) => {
        await expect(
          testClient.callTool('process_prompt', {
            raw: '', // Empty string
            domain: 'sql',
          })
        ).rejects.toThrow(/Raw prompt is required/);
      });
    });
  });

  describe('concurrent request handling', () => {
    it('should handle multiple concurrent requests', async () => {
      await withMCPClient(async (testClient) => {
        const promises = Array.from({ length: 5 }, (_, i) =>
          testClient.callTool('validate_prompt', {
            prompt: `Test prompt ${i}`,
            domain: 'general',
          })
        );

        const results = await Promise.all(promises);
        expect(results).toHaveLength(5);

        results.forEach((result, index) => {
          validateToolResponse(result);
          const data = parseToolResponseData(result);
          expect(data.success).toBe(true);
        });
      });
    });

    it('should maintain request isolation', async () => {
      await withMCPClient(async (testClient) => {
        // Send multiple different requests concurrently
        const [processResult, evaluateResult, validateResult] = await Promise.all([
          testClient.callTool('process_prompt', {
            raw: 'Create a user table',
            domain: 'sql',
          }),
          testClient.callTool('evaluate_prompt', {
            prompt: 'Design a website',
            domain: 'general',
          }),
          testClient.callTool('validate_prompt', {
            prompt: 'Build an API',
            domain: 'devops',
          }),
        ]);

        // Each should return its own specific results
        const processData = parseToolResponseData(processResult);
        const evaluateData = parseToolResponseData(evaluateResult);
        const validateData = parseToolResponseData(validateResult);

        expect(processData.data.original).toBe('Create a user table');
        expect(evaluateData.data.score).toBeDefined();
        expect(validateData.data.isValid).toBeDefined();
      });
    });

    it('should handle request timeouts appropriately', async () => {
      await withMCPClient(async (testClient) => {
        // Create a very complex request that might timeout
        const complexVariants = Array.from({ length: 10 }, (_, i) =>
          TEST_CONSTANTS.SAMPLE_PROMPTS.complex.repeat(i + 1)
        );

        const startTime = Date.now();

        try {
          const result = await testClient.callTool('compare_prompts', {
            variants: complexVariants,
          });

          const duration = Date.now() - startTime;

          // Should either complete successfully or timeout gracefully
          if (result) {
            validateToolResponse(result);
            const data = parseToolResponseData(result);
            expect(data.success).toBe(true);
          }

          // Even if successful, shouldn't take too long
          expect(duration).toBeLessThan(10000); // 10 second max
        } catch (error) {
          // Timeout errors are acceptable for very complex requests
          expect(error).toBeInstanceOf(Error);
        }
      });
    });
  });

  describe('protocol compliance', () => {
    it('should follow JSON-RPC 2.0 specification', async () => {
      await withMCPClient(async (testClient) => {
        const response = await testClient.sendRequest('tools/list');

        validateMCPResponse(response);
        expect(response.jsonrpc).toBe('2.0');
        expect(response.id).toBeDefined();
        expect(response.result).toBeDefined();
        expect(response.error).toBeUndefined();
      });
    });

    it('should return proper error responses', async () => {
      await withMCPClient(async (testClient) => {
        try {
          await testClient.callTool('process_prompt', {
            raw: null, // Invalid parameter
          });
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('MCP Error');
        }
      });
    });

    it('should maintain session state correctly', async () => {
      await withMCPClient(async (testClient) => {
        // Multiple requests in same session should work
        const tools1 = await testClient.listTools();
        const tools2 = await testClient.listTools();

        expect(tools1).toEqual(tools2);
        expect(tools1.length).toBeGreaterThan(0);

        // Tool calls should also work consistently
        const result1 = await testClient.callTool('get_stats', {});
        const result2 = await testClient.callTool('get_stats', {});

        validateToolResponse(result1);
        validateToolResponse(result2);

        const data1 = parseToolResponseData(result1);
        const data2 = parseToolResponseData(result2);

        expect(data1.success).toBe(true);
        expect(data2.success).toBe(true);
      });
    });
  });

  describe('performance benchmarks', () => {
    it('should meet performance requirements for simple operations', async () => {
      await withMCPClient(async (testClient) => {
        const simpleOperations = [
          { tool: 'validate_prompt', args: { prompt: 'Simple test' } },
          { tool: 'get_stats', args: {} },
        ];

        for (const operation of simpleOperations) {
          const { duration } = await measurePerformance(async () => {
            return await testClient.callTool(operation.tool, operation.args);
          });

          const threshold = TEST_CONSTANTS.PERFORMANCE_THRESHOLDS[operation.tool as keyof typeof TEST_CONSTANTS.PERFORMANCE_THRESHOLDS];
          expectWithinPerformanceThreshold(duration, threshold, `${operation.tool}_integration`);
        }
      });
    });

    it('should handle moderate load efficiently', async () => {
      await withMCPClient(async (testClient) => {
        const { duration } = await measurePerformance(async () => {
          const promises = Array.from({ length: 10 }, () =>
            testClient.callTool('validate_prompt', {
              prompt: 'Load test prompt',
            })
          );

          return await Promise.all(promises);
        });

        // 10 concurrent requests should complete within reasonable time
        expect(duration).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.validate_prompt * 5);
      });
    });
  });

  describe('data consistency', () => {
    it('should maintain data consistency across operations', async () => {
      await withMCPClient(async (testClient) => {
        // Save a prompt
        const saveResult = await testClient.callTool('save_prompt', {
          prompt: 'Consistency test prompt',
          metadata: {
            domain: 'general',
            description: 'Testing data consistency',
            tags: ['test', 'consistency'],
          },
        });

        const saveData = parseToolResponseData(saveResult);
        const promptId = saveData.data.id;

        // Retrieve the same prompt
        const getResult = await testClient.callTool('get_prompt', {
          id: promptId,
        });

        const getData = parseToolResponseData(getResult);

        // Data should be consistent
        expect(getData.data.id).toBe(promptId);
        expect(getData.data.prompt).toBe('Consistency test prompt');
        expect(getData.data.domain).toBe('general');
        expect(getData.data.tags).toEqual(['test', 'consistency']);

        // Search should also find it
        const searchResult = await testClient.callTool('search_prompts', {
          query: 'consistency test',
          limit: 10,
        });

        const searchData = parseToolResponseData(searchResult);
        const foundPrompt = searchData.data.results.find((p: any) => p.id === promptId);

        expect(foundPrompt).toBeDefined();
        expect(foundPrompt.prompt).toBe('Consistency test prompt');
      });
    });

    it('should handle transaction-like operations correctly', async () => {
      await withMCPClient(async (testClient) => {
        // Process a prompt (which may involve analysis, optimization, etc.)
        const processResult = await testClient.callTool('process_prompt', {
          raw: 'Transaction test prompt',
          domain: 'general',
        });

        const processData = parseToolResponseData(processResult);

        // All parts of the result should be consistent
        expect(processData.data.original).toBe('Transaction test prompt');
        expect(processData.data.refined).toBeDefined();
        expect(processData.data.score).toBeDefined();
        expect(processData.data.metadata).toBeDefined();
        expect(processData.data.metadata.domain).toBe('general');

        // The refined prompt should be different from original (improvement)
        expect(processData.data.refined).not.toBe(processData.data.original);
        expect(processData.data.refined.length).toBeGreaterThan(processData.data.original.length);
      });
    });
  });
});