/**
 * Error Handling and Edge Case Tests
 * Comprehensive tests for error conditions and edge cases
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  MCPTestClient,
  withMCPClient,
  parseToolResponseData,
} from '../utils/mcp-test-client.js';
import {
  TEST_CONSTANTS,
  measurePerformance,
} from '../utils/test-helpers.js';
import { setupMockEnvironment } from '../utils/mock-services.js';

// Mock external services for error testing
setupMockEnvironment();

describe('Error Handling and Edge Cases', () => {
  describe('input validation edge cases', () => {
    it('should handle null and undefined inputs', async () => {
      await withMCPClient(async (testClient) => {
        const nullInputs = [
          { tool: 'process_prompt', args: { raw: null } },
          { tool: 'evaluate_prompt', args: { prompt: undefined } },
          { tool: 'get_prompt', args: { id: null } },
          { tool: 'save_prompt', args: { prompt: 'test', metadata: null } },
        ];

        for (const input of nullInputs) {
          await expect(
            testClient.callTool(input.tool, input.args)
          ).rejects.toThrow();
        }
      });
    });

    it('should handle empty string inputs', async () => {
      await withMCPClient(async (testClient) => {
        const emptyInputs = [
          { tool: 'process_prompt', args: { raw: '' } },
          { tool: 'evaluate_prompt', args: { prompt: '   ' } }, // Whitespace only
          { tool: 'get_prompt', args: { id: '' } },
          { tool: 'validate_prompt', args: { prompt: '\n\t  ' } },
        ];

        for (const input of emptyInputs) {
          await expect(
            testClient.callTool(input.tool, input.args)
          ).rejects.toThrow();
        }
      });
    });

    it('should handle extremely long inputs', async () => {
      await withMCPClient(async (testClient) => {
        const extremelyLongPrompt = 'A'.repeat(100000); // 100KB

        // Should either process successfully or fail gracefully
        try {
          const result = await testClient.callTool('validate_prompt', {
            prompt: extremelyLongPrompt,
          });

          const data = parseToolResponseData(result);
          expect(data.success).toBe(true);

          // If successful, should have warnings about length
          if (data.data.warnings) {
            const lengthWarning = data.data.warnings.find((w: any) =>
              w.code.includes('length') || w.message.includes('long')
            );
            expect(lengthWarning).toBeDefined();
          }
        } catch (error) {
          // If it fails, should be a graceful failure with meaningful message
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toMatch(/too long|length|size|limit/i);
        }
      });
    });

    it('should handle special characters and unicode', async () => {
      await withMCPClient(async (testClient) => {
        const specialCharPrompts = [
          '🚀 Create a космический database 表格 with émojis',
          'SELECT * FROM users WHERE name = \'\'; DROP TABLE users; --',
          'prompt\nwith\n\rmultiple\twhitespace   characters',
          '\\n\\r\\t\\\\escaped\\characters\\x00\\xFF',
          '𝒰𝓃𝒾𝒸𝑜𝒹𝑒 ℳ𝒶𝓉𝒽 𝒮𝓎𝓂𝒷𝑜𝓁𝓈',
        ];

        for (const prompt of specialCharPrompts) {
          try {
            const result = await testClient.callTool('validate_prompt', {
              prompt,
            });

            const data = parseToolResponseData(result);
            expect(data.success).toBe(true);
            expect(data.data.isValid).toBeDefined();
          } catch (error) {
            // Should not throw for special characters
            throw new Error(`Failed to handle special characters in: "${prompt}". Error: ${error}`);
          }
        }
      });
    });

    it('should handle invalid domain values', async () => {
      await withMCPClient(async (testClient) => {
        const invalidDomains = [
          'invalid_domain',
          'SQL', // Wrong case
          'javascript', // Not in enum
          123, // Wrong type
          null,
          undefined,
        ];

        for (const domain of invalidDomains) {
          try {
            // Should either use default domain or fail gracefully
            const result = await testClient.callTool('process_prompt', {
              raw: 'Test prompt',
              domain: domain as any,
            });

            const data = parseToolResponseData(result);
            expect(data.success).toBe(true);

            // Should have used default domain
            expect(['general', 'sql', 'branding', 'cine', 'saas', 'devops']).toContain(data.data.metadata.domain);
          } catch (error) {
            // If it throws, should be a validation error
            expect(error.message).toMatch(/invalid|domain|enum/i);
          }
        }
      });
    });
  });

  describe('data type edge cases', () => {
    it('should handle wrong parameter types', async () => {
      await withMCPClient(async (testClient) => {
        const wrongTypes = [
          { tool: 'process_prompt', args: { raw: 123 } }, // Should be string
          { tool: 'compare_prompts', args: { variants: 'not an array' } }, // Should be array
          { tool: 'search_prompts', args: { limit: '10' } }, // Should be number
          { tool: 'save_prompt', args: { metadata: 'not an object' } }, // Should be object
        ];

        for (const wrongType of wrongTypes) {
          await expect(
            testClient.callTool(wrongType.tool, wrongType.args)
          ).rejects.toThrow();
        }
      });
    });

    it('should handle arrays with mixed types', async () => {
      await withMCPClient(async (testClient) => {
        const mixedArray = ['valid string', 123, null, undefined, {}];

        await expect(
          testClient.callTool('compare_prompts', {
            variants: mixedArray,
          })
        ).rejects.toThrow();
      });
    });

    it('should handle deeply nested objects', async () => {
      await withMCPClient(async (testClient) => {
        const deeplyNested = {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: 'deep value',
                  array: [1, 2, { nested: 'in array' }],
                },
              },
            },
          },
        };

        // Metadata should handle reasonable nesting
        const result = await testClient.callTool('save_prompt', {
          prompt: 'Test with nested metadata',
          metadata: {
            domain: 'general',
            ...deeplyNested,
          },
        });

        const data = parseToolResponseData(result);
        expect(data.success).toBe(true);
      });
    });

    it('should handle circular references in objects', async () => {
      await withMCPClient(async (testClient) => {
        const circularObj: any = { name: 'circular' };
        circularObj.self = circularObj;

        await expect(
          testClient.callTool('save_prompt', {
            prompt: 'Test prompt',
            metadata: {
              domain: 'general',
              circular: circularObj,
            },
          })
        ).rejects.toThrow();
      });
    });
  });

  describe('boundary value testing', () => {
    it('should handle minimum and maximum array sizes', async () => {
      await withMCPClient(async (testClient) => {
        // Minimum array size (should fail)
        await expect(
          testClient.callTool('compare_prompts', {
            variants: ['only one'],
          })
        ).rejects.toThrow(/at least 2/i);

        // Maximum practical array size
        const largeArray = Array.from({ length: 20 }, (_, i) => `Prompt ${i}`);

        try {
          const result = await testClient.callTool('compare_prompts', {
            variants: largeArray,
          });

          const data = parseToolResponseData(result);
          expect(data.success).toBe(true);
          expect(data.data.variants).toHaveLength(20);
        } catch (error) {
          // If it fails due to size, should be a meaningful error
          expect(error.message).toMatch(/too many|limit|size/i);
        }
      });
    });

    it('should handle numeric boundary values', async () => {
      await withMCPClient(async (testClient) => {
        const boundaryTests = [
          { field: 'limit', values: [0, 1, 100, 101, -1] },
          { field: 'offset', values: [0, -1, Number.MAX_SAFE_INTEGER] },
          { field: 'minScore', values: [0, 1, -0.1, 1.1, Number.NaN, Number.POSITIVE_INFINITY] },
          { field: 'days', values: [1, 365, 0, 366, -1] },
        ];

        for (const test of boundaryTests) {
          for (const value of test.values) {
            try {
              const args: any = {};
              args[test.field] = value;

              if (test.field === 'days') {
                await testClient.callTool('get_stats', args);
              } else {
                await testClient.callTool('search_prompts', args);
              }

              // If successful, value should be normalized
              console.log(`✅ ${test.field}=${value} was handled successfully`);
            } catch (error) {
              // Should fail gracefully with validation errors for invalid values
              if (value < 0 || value > 1000 || !Number.isFinite(value)) {
                expect(error.message).toMatch(/invalid|range|limit/i);
              } else {
                throw error; // Unexpected error
              }
            }
          }
        }
      });
    });
  });

  describe('concurrent operation edge cases', () => {
    it('should handle rapid successive requests', async () => {
      await withMCPClient(async (testClient) => {
        const rapidRequests = Array.from({ length: 50 }, (_, i) =>
          testClient.callTool('validate_prompt', {
            prompt: `Rapid request ${i}`,
          })
        );

        const results = await Promise.allSettled(rapidRequests);

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`Rapid requests: ${successful} successful, ${failed} failed`);

        // Most requests should succeed
        expect(successful).toBeGreaterThan(rapidRequests.length * 0.8);

        // If some fail, they should fail gracefully
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            expect(result.reason).toBeInstanceOf(Error);
            console.warn(`Request ${index} failed: ${result.reason.message}`);
          }
        });
      });
    });

    it('should handle resource exhaustion scenarios', async () => {
      await withMCPClient(async (testClient) => {
        // Create many large, complex operations
        const heavyOperations = Array.from({ length: 10 }, (_, i) =>
          testClient.callTool('process_prompt', {
            raw: TEST_CONSTANTS.SAMPLE_PROMPTS.complex.repeat(5),
            domain: 'saas',
            context: 'Resource exhaustion test ' + i,
          })
        );

        const startTime = Date.now();
        const results = await Promise.allSettled(heavyOperations);
        const endTime = Date.now();

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const totalTime = endTime - startTime;

        console.log(`Heavy operations: ${successful}/10 successful in ${totalTime}ms`);

        // Should handle resource pressure gracefully
        expect(successful).toBeGreaterThan(5); // At least half should succeed
        expect(totalTime).toBeLessThan(60000); // Should not take more than 60 seconds
      });
    });
  });

  describe('malformed data handling', () => {
    it('should handle malformed JSON-like strings', async () => {
      await withMCPClient(async (testClient) => {
        const malformedInputs = [
          '{"incomplete": json',
          '[invalid, json, array}',
          'not json at all',
          '{"validJson": "but unexpected format"}',
          JSON.stringify({ prompt: 'json string instead of plain string' }),
        ];

        for (const input of malformedInputs) {
          // Should treat as regular string, not try to parse as JSON
          const result = await testClient.callTool('validate_prompt', {
            prompt: input,
          });

          const data = parseToolResponseData(result);
          expect(data.success).toBe(true);
          expect(data.data.isValid).toBeDefined();
        }
      });
    });

    it('should handle corrupted metadata structures', async () => {
      await withMCPClient(async (testClient) => {
        const corruptedMetadata = [
          { domain: 'sql', tags: 'should be array not string' },
          { domain: 'sql', isPublic: 'yes' }, // Should be boolean
          { domain: 'sql', version: 123 }, // Should be string
          { domain: 'sql', nested: { too: { deep: { structure: true } } } },
        ];

        for (const metadata of corruptedMetadata) {
          try {
            const result = await testClient.callTool('save_prompt', {
              prompt: 'Test with corrupted metadata',
              metadata: metadata as any,
            });

            // If successful, should have normalized the data
            const data = parseToolResponseData(result);
            expect(data.success).toBe(true);
          } catch (error) {
            // If it fails, should be a validation error
            expect(error.message).toMatch(/invalid|type|validation/i);
          }
        }
      });
    });
  });

  describe('network and timeout edge cases', () => {
    it('should handle timeout scenarios gracefully', async () => {
      await withMCPClient(async (testClient) => {
        const veryComplexOperation = {
          variants: Array.from({ length: 15 }, (_, i) =>
            TEST_CONSTANTS.SAMPLE_PROMPTS.complex.repeat(3) + ` Complex variant ${i}`
          ),
        };

        try {
          const { result, duration } = await measurePerformance(async () => {
            return await testClient.callTool('compare_prompts', veryComplexOperation);
          });

          const data = parseToolResponseData(result);
          expect(data.success).toBe(true);

          console.log(`Complex operation completed in ${duration}ms`);
        } catch (error) {
          // Should timeout gracefully
          expect(error.message).toMatch(/timeout|time.*out/i);
          console.log(`Operation timed out as expected: ${error.message}`);
        }
      });
    });

    it('should handle connection interruptions', async () => {
      let client: MCPTestClient | null = null;

      try {
        client = new MCPTestClient();
        await client.start();

        // Start a request
        const requestPromise = client.callTool('get_stats', {});

        // Immediately stop the client (simulating connection loss)
        await client.stop();
        client = null;

        // The request should fail gracefully
        await expect(requestPromise).rejects.toThrow(/stopped|connection|error/i);

      } catch (error) {
        console.log(`Connection interruption handled: ${error.message}`);
      } finally {
        if (client) {
          await client.stop();
        }
      }
    });
  });

  describe('memory and performance edge cases', () => {
    it('should handle memory-intensive operations', async () => {
      await withMCPClient(async (testClient) => {
        const initialMemory = process.memoryUsage();

        // Create many prompts with substantial content
        const memoryIntensiveOperations = Array.from({ length: 20 }, (_, i) =>
          testClient.callTool('save_prompt', {
            prompt: `Memory test prompt ${i}: ${TEST_CONSTANTS.SAMPLE_PROMPTS.complex.repeat(2)}`,
            metadata: {
              domain: 'general',
              description: `Memory intensive test ${i}`,
              tags: Array.from({ length: 10 }, (_, j) => `tag${j}`),
            },
          })
        );

        await Promise.all(memoryIntensiveOperations);

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

        console.log(`Memory increase after intensive operations: ${memoryIncreaseMB.toFixed(2)}MB`);

        // Memory increase should be reasonable
        expect(memoryIncreaseMB).toBeLessThan(200); // Less than 200MB increase
      });
    });

    it('should handle performance degradation gracefully', async () => {
      await withMCPClient(async (testClient) => {
        const performanceTests = [];
        const batchSize = 5;
        const numBatches = 8;

        // Run batches of operations to simulate sustained load
        for (let batch = 0; batch < numBatches; batch++) {
          const { duration } = await measurePerformance(async () => {
            const batchPromises = Array.from({ length: batchSize }, (_, i) =>
              testClient.callTool('validate_prompt', {
                prompt: `Performance test batch ${batch} item ${i}`,
              })
            );

            return await Promise.all(batchPromises);
          });

          performanceTests.push(duration / batchSize); // Average per request

          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Performance shouldn't degrade significantly
        const firstBatch = performanceTests[0];
        const lastBatch = performanceTests[performanceTests.length - 1];
        const degradation = (lastBatch - firstBatch) / firstBatch;

        console.log(`Performance degradation: ${(degradation * 100).toFixed(2)}%`);

        // Allow up to 100% degradation under sustained load
        expect(degradation).toBeLessThan(1.0);
      });
    });
  });

  describe('data consistency edge cases', () => {
    it('should handle race conditions in save operations', async () => {
      await withMCPClient(async (testClient) => {
        const racingPrompts = Array.from({ length: 10 }, (_, i) =>
          testClient.callTool('save_prompt', {
            prompt: `Racing prompt ${i}`,
            metadata: {
              domain: 'general',
              name: 'Duplicate Name', // Same name to test conflicts
              description: `Description ${i}`,
            },
          })
        );

        const results = await Promise.allSettled(racingPrompts);

        const successful = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');

        console.log(`Race condition test: ${successful.length} successful, ${failed.length} failed`);

        // All should either succeed with unique IDs or fail gracefully
        const successfulData = successful.map(r =>
          parseToolResponseData((r as PromiseFulfilledResult<any>).value)
        );

        const ids = successfulData.map(d => d.data.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(ids.length); // All IDs should be unique
      });
    });

    it('should handle concurrent read/write operations', async () => {
      await withMCPClient(async (testClient) => {
        // First, save a prompt
        const saveResult = await testClient.callTool('save_prompt', {
          prompt: 'Concurrent access test',
          metadata: {
            domain: 'general',
            description: 'Test prompt for concurrent access',
          },
        });

        const saveData = parseToolResponseData(saveResult);
        const promptId = saveData.data.id;

        // Now perform concurrent reads while potentially writing
        const concurrentOperations = [
          ...Array.from({ length: 5 }, () =>
            testClient.callTool('get_prompt', { id: promptId })
          ),
          ...Array.from({ length: 3 }, () =>
            testClient.callTool('search_prompts', { query: 'concurrent' })
          ),
        ];

        const results = await Promise.allSettled(concurrentOperations);
        const allSuccessful = results.every(r => r.status === 'fulfilled');

        expect(allSuccessful).toBe(true);

        // All read operations should return consistent data
        const getResults = results.slice(0, 5) as PromiseFulfilledResult<any>[];
        const promptData = getResults.map(r => parseToolResponseData(r.value).data);

        promptData.forEach(data => {
          expect(data.id).toBe(promptId);
          expect(data.prompt).toBe('Concurrent access test');
        });
      });
    });
  });
});