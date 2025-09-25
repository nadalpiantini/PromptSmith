/**
 * Performance Benchmark Tests
 * Tests response times and throughput for all MCP tools
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  MCPTestClient,
  withMCPClient,
  parseToolResponseData,
} from '../utils/mcp-test-client.js';
import {
  measurePerformance,
  TEST_CONSTANTS,
} from '../utils/test-helpers.js';
import { setupMockEnvironment } from '../utils/mock-services.js';

// Mock external services for performance tests
setupMockEnvironment();

interface BenchmarkResult {
  tool: string;
  operation: string;
  minTime: number;
  maxTime: number;
  avgTime: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number;
  successRate: number;
  totalRequests: number;
}

describe('Performance Benchmarks', () => {
  const results: BenchmarkResult[] = [];

  afterEach(() => {
    // Optionally save results to file for analysis
    if (results.length > 0) {
      console.log(`\n📊 Performance Summary:`);
      results.forEach(result => {
        console.log(`${result.tool} (${result.operation}): avg=${result.avgTime}ms, p95=${result.p95}ms, throughput=${result.throughput}/min`);
      });
    }
  });

  describe('individual tool performance', () => {
    it('should benchmark process_prompt performance', async () => {
      await withMCPClient(async (testClient) => {
        const testCases = [
          { name: 'simple', prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.simple },
          { name: 'complex', prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.complex },
          { name: 'technical', prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.technical },
          { name: 'ambiguous', prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.ambiguous },
        ];

        for (const testCase of testCases) {
          const times: number[] = [];
          let successCount = 0;

          // Run multiple iterations
          for (let i = 0; i < 20; i++) {
            try {
              const { duration } = await measurePerformance(async () => {
                return await testClient.callTool('process_prompt', {
                  raw: testCase.prompt,
                  domain: 'general',
                });
              });

              times.push(duration);
              successCount++;
            } catch (error) {
              // Track failures
              console.warn(`process_prompt failed on iteration ${i}: ${error}`);
            }
          }

          const benchmarkResult = calculateBenchmarkStats('process_prompt', testCase.name, times, successCount);
          results.push(benchmarkResult);

          // Validate performance against thresholds
          expect(benchmarkResult.avgTime).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.process_prompt);
          expect(benchmarkResult.p95).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.process_prompt * 1.5);
          expect(benchmarkResult.successRate).toBeGreaterThan(0.95);
        }
      });
    });

    it('should benchmark evaluate_prompt performance', async () => {
      await withMCPClient(async (testClient) => {
        const times: number[] = [];
        let successCount = 0;

        for (let i = 0; i < 15; i++) {
          try {
            const { duration } = await measurePerformance(async () => {
              return await testClient.callTool('evaluate_prompt', {
                prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
                criteria: ['clarity', 'specificity', 'completeness'],
                domain: 'devops',
              });
            });

            times.push(duration);
            successCount++;
          } catch (error) {
            console.warn(`evaluate_prompt failed on iteration ${i}: ${error}`);
          }
        }

        const benchmarkResult = calculateBenchmarkStats('evaluate_prompt', 'standard', times, successCount);
        results.push(benchmarkResult);

        expect(benchmarkResult.avgTime).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.evaluate_prompt);
        expect(benchmarkResult.p95).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.evaluate_prompt * 1.5);
        expect(benchmarkResult.successRate).toBeGreaterThan(0.95);
      });
    });

    it('should benchmark compare_prompts performance', async () => {
      await withMCPClient(async (testClient) => {
        const testCases = [
          {
            name: 'two_prompts',
            variants: [TEST_CONSTANTS.SAMPLE_PROMPTS.simple, TEST_CONSTANTS.SAMPLE_PROMPTS.technical],
          },
          {
            name: 'five_prompts',
            variants: [
              TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
              TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
              TEST_CONSTANTS.SAMPLE_PROMPTS.complex,
              'Create basic functionality',
              'Implement advanced features with optimization',
            ],
          },
        ];

        for (const testCase of testCases) {
          const times: number[] = [];
          let successCount = 0;

          for (let i = 0; i < 10; i++) {
            try {
              const { duration } = await measurePerformance(async () => {
                return await testClient.callTool('compare_prompts', {
                  variants: testCase.variants,
                });
              });

              times.push(duration);
              successCount++;
            } catch (error) {
              console.warn(`compare_prompts failed on iteration ${i}: ${error}`);
            }
          }

          const benchmarkResult = calculateBenchmarkStats('compare_prompts', testCase.name, times, successCount);
          results.push(benchmarkResult);

          expect(benchmarkResult.avgTime).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.compare_prompts);
          expect(benchmarkResult.successRate).toBeGreaterThan(0.9);
        }
      });
    });

    it('should benchmark save_prompt performance', async () => {
      await withMCPClient(async (testClient) => {
        const times: number[] = [];
        let successCount = 0;

        for (let i = 0; i < 25; i++) {
          try {
            const { duration } = await measurePerformance(async () => {
              return await testClient.callTool('save_prompt', {
                prompt: `Performance test prompt ${i}`,
                metadata: {
                  domain: 'general',
                  description: `Benchmark test ${i}`,
                  tags: ['benchmark', 'performance'],
                  isPublic: false,
                  version: '1.0.0',
                },
              });
            });

            times.push(duration);
            successCount++;
          } catch (error) {
            console.warn(`save_prompt failed on iteration ${i}: ${error}`);
          }
        }

        const benchmarkResult = calculateBenchmarkStats('save_prompt', 'standard', times, successCount);
        results.push(benchmarkResult);

        expect(benchmarkResult.avgTime).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.save_prompt);
        expect(benchmarkResult.successRate).toBeGreaterThan(0.95);
      });
    });

    it('should benchmark search_prompts performance', async () => {
      await withMCPClient(async (testClient) => {
        const searchQueries = [
          { query: 'database', limit: 10 },
          { query: 'user authentication', domain: 'devops', limit: 20 },
          { tags: ['sql', 'table'], limit: 15 },
          { query: 'api design', minScore: 0.7, limit: 25 },
        ];

        for (const searchQuery of searchQueries) {
          const times: number[] = [];
          let successCount = 0;

          for (let i = 0; i < 30; i++) {
            try {
              const { duration } = await measurePerformance(async () => {
                return await testClient.callTool('search_prompts', searchQuery);
              });

              times.push(duration);
              successCount++;
            } catch (error) {
              console.warn(`search_prompts failed on iteration ${i}: ${error}`);
            }
          }

          const benchmarkResult = calculateBenchmarkStats(
            'search_prompts',
            `query_${searchQuery.query || 'tags'}_limit_${searchQuery.limit}`,
            times,
            successCount
          );
          results.push(benchmarkResult);

          expect(benchmarkResult.avgTime).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.search_prompts);
          expect(benchmarkResult.successRate).toBeGreaterThan(0.98);
        }
      });
    });

    it('should benchmark get_prompt performance', async () => {
      await withMCPClient(async (testClient) => {
        // First, create some prompts to retrieve
        const promptIds: string[] = [];

        for (let i = 0; i < 10; i++) {
          const saveResult = await testClient.callTool('save_prompt', {
            prompt: `Retrievable test prompt ${i}`,
            metadata: {
              domain: 'general',
              description: `Test prompt for retrieval ${i}`,
            },
          });

          const saveData = parseToolResponseData(saveResult);
          promptIds.push(saveData.data.id);
        }

        // Now benchmark retrieval
        const times: number[] = [];
        let successCount = 0;

        for (let i = 0; i < 50; i++) {
          const randomId = promptIds[i % promptIds.length];

          try {
            const { duration } = await measurePerformance(async () => {
              return await testClient.callTool('get_prompt', {
                id: randomId,
              });
            });

            times.push(duration);
            successCount++;
          } catch (error) {
            console.warn(`get_prompt failed on iteration ${i}: ${error}`);
          }
        }

        const benchmarkResult = calculateBenchmarkStats('get_prompt', 'standard', times, successCount);
        results.push(benchmarkResult);

        expect(benchmarkResult.avgTime).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.get_prompt);
        expect(benchmarkResult.successRate).toBeGreaterThan(0.99);
      });
    });

    it('should benchmark get_stats performance', async () => {
      await withMCPClient(async (testClient) => {
        const times: number[] = [];
        let successCount = 0;

        for (let i = 0; i < 20; i++) {
          try {
            const { duration } = await measurePerformance(async () => {
              return await testClient.callTool('get_stats', {
                days: 7,
              });
            });

            times.push(duration);
            successCount++;
          } catch (error) {
            console.warn(`get_stats failed on iteration ${i}: ${error}`);
          }
        }

        const benchmarkResult = calculateBenchmarkStats('get_stats', 'standard', times, successCount);
        results.push(benchmarkResult);

        expect(benchmarkResult.avgTime).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.get_stats);
        expect(benchmarkResult.successRate).toBeGreaterThan(0.95);
      });
    });

    it('should benchmark validate_prompt performance', async () => {
      await withMCPClient(async (testClient) => {
        const testPrompts = [
          TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
          TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
          TEST_CONSTANTS.SAMPLE_PROMPTS.ambiguous,
          'Quick validation test',
          'A more complex prompt that requires thorough validation and analysis',
        ];

        for (const prompt of testPrompts) {
          const times: number[] = [];
          let successCount = 0;

          for (let i = 0; i < 25; i++) {
            try {
              const { duration } = await measurePerformance(async () => {
                return await testClient.callTool('validate_prompt', {
                  prompt,
                  domain: 'general',
                });
              });

              times.push(duration);
              successCount++;
            } catch (error) {
              console.warn(`validate_prompt failed on iteration ${i}: ${error}`);
            }
          }

          const benchmarkResult = calculateBenchmarkStats(
            'validate_prompt',
            `length_${prompt.length}`,
            times,
            successCount
          );
          results.push(benchmarkResult);

          expect(benchmarkResult.avgTime).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.validate_prompt);
          expect(benchmarkResult.successRate).toBeGreaterThan(0.98);
        }
      });
    });
  });

  describe('load testing', () => {
    it('should handle concurrent requests efficiently', async () => {
      await withMCPClient(async (testClient) => {
        const concurrencyLevels = [5, 10, 20];

        for (const concurrency of concurrencyLevels) {
          const { duration } = await measurePerformance(async () => {
            const promises = Array.from({ length: concurrency }, (_, i) =>
              testClient.callTool('validate_prompt', {
                prompt: `Concurrent test ${i}`,
              })
            );

            return await Promise.all(promises);
          });

          const avgTimePerRequest = duration / concurrency;
          const throughput = (concurrency * 60000) / duration; // requests per minute

          console.log(`Concurrency ${concurrency}: ${avgTimePerRequest.toFixed(2)}ms avg, ${throughput.toFixed(2)} req/min`);

          // Performance should not degrade linearly with concurrency
          expect(avgTimePerRequest).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.validate_prompt * 2);
          expect(throughput).toBeGreaterThan(concurrency * 10); // At least 10 req/min per concurrent request
        }
      });
    });

    it('should maintain performance under sustained load', async () => {
      await withMCPClient(async (testClient) => {
        const times: number[] = [];
        const batchSize = 10;
        const numBatches = 5;

        for (let batch = 0; batch < numBatches; batch++) {
          const { duration } = await measurePerformance(async () => {
            const promises = Array.from({ length: batchSize }, (_, i) =>
              testClient.callTool('get_stats', {})
            );

            return await Promise.all(promises);
          });

          times.push(duration / batchSize); // Average time per request in batch

          // Small delay between batches to simulate sustained load
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Performance should remain consistent across batches
        const firstBatchAvg = times[0];
        const lastBatchAvg = times[times.length - 1];
        const degradation = (lastBatchAvg - firstBatchAvg) / firstBatchAvg;

        expect(degradation).toBeLessThan(0.5); // Less than 50% degradation
        expect(lastBatchAvg).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.get_stats * 2);
      });
    });

    it('should handle memory usage efficiently', async () => {
      await withMCPClient(async (testClient) => {
        const initialMemory = process.memoryUsage();

        // Perform many operations that could cause memory leaks
        for (let i = 0; i < 100; i++) {
          await testClient.callTool('process_prompt', {
            raw: `Memory test ${i}: ${TEST_CONSTANTS.SAMPLE_PROMPTS.complex}`,
            domain: 'general',
          });
        }

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

        console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);

        // Memory increase should be reasonable (less than 100MB for 100 operations)
        expect(memoryIncreaseMB).toBeLessThan(100);
      });
    });
  });

  describe('stress testing', () => {
    it('should handle large prompt processing', async () => {
      await withMCPClient(async (testClient) => {
        const largeSizes = [1000, 5000, 10000]; // characters

        for (const size of largeSizes) {
          const largePrompt = 'A'.repeat(size);

          const { duration, result } = await measurePerformance(async () => {
            return await testClient.callTool('validate_prompt', {
              prompt: largePrompt,
            });
          });

          const data = parseToolResponseData(result);
          expect(data.success).toBe(true);

          console.log(`Large prompt (${size} chars): ${duration}ms`);

          // Should complete within reasonable time even for large prompts
          expect(duration).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.validate_prompt * 5);
        }
      });
    });

    it('should handle complex comparison operations', async () => {
      await withMCPClient(async (testClient) => {
        const maxVariants = [3, 5, 8];

        for (const numVariants of maxVariants) {
          const variants = Array.from({ length: numVariants }, (_, i) =>
            `${TEST_CONSTANTS.SAMPLE_PROMPTS.complex} - Variant ${i + 1}`
          );

          const { duration, result } = await measurePerformance(async () => {
            return await testClient.callTool('compare_prompts', {
              variants,
            });
          });

          const data = parseToolResponseData(result);
          expect(data.success).toBe(true);
          expect(data.data.variants).toHaveLength(numVariants);

          console.log(`Compare ${numVariants} variants: ${duration}ms`);

          // Complexity should scale reasonably
          const expectedMaxTime = TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.compare_prompts * (numVariants / 2);
          expect(duration).toBeLessThan(expectedMaxTime);
        }
      });
    });
  });
});

function calculateBenchmarkStats(
  tool: string,
  operation: string,
  times: number[],
  successCount: number
): BenchmarkResult {
  if (times.length === 0) {
    return {
      tool,
      operation,
      minTime: 0,
      maxTime: 0,
      avgTime: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      throughput: 0,
      successRate: 0,
      totalRequests: successCount,
    };
  }

  const sortedTimes = [...times].sort((a, b) => a - b);
  const sum = times.reduce((acc, time) => acc + time, 0);

  const p50Index = Math.floor(sortedTimes.length * 0.5);
  const p95Index = Math.floor(sortedTimes.length * 0.95);
  const p99Index = Math.floor(sortedTimes.length * 0.99);

  const avgTime = sum / times.length;
  const throughput = (times.length * 60000) / sum; // requests per minute

  return {
    tool,
    operation,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    avgTime,
    p50: sortedTimes[p50Index],
    p95: sortedTimes[p95Index],
    p99: sortedTimes[p99Index],
    throughput,
    successRate: successCount / (times.length || 1),
    totalRequests: times.length,
  };
}