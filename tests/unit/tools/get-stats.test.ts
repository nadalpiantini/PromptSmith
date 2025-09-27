/**
 * Unit Tests for get_stats tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  measurePerformance,
  expectWithinPerformanceThreshold,
  TEST_CONSTANTS,
  createMockServices
} from '../../utils/test-helpers';
import { setupMockEnvironment } from '../../utils/mock-services';

// Mock external services
setupMockEnvironment();

// Mock the services module BEFORE importing anything
const mockServices = createMockServices();
jest.mock('../../../src/services/index', () => ({
  services: mockServices,
}));

// Import server after mocking
import { PromptSmithServer } from '../../../src/server/index';

describe('get_stats tool', () => {
  let server: PromptSmithServer;

  beforeEach(async () => {
    jest.clearAllMocks();
    server = new PromptSmithServer();
  });

  describe('valid inputs', () => {
    it('should get stats with default parameters', async () => {
      const mockStoreStats = {
        totalPrompts: 150,
        totalDomains: 6,
        avgQualityScore: 0.78,
        topDomains: ['sql', 'general', 'saas'],
        topTags: ['database', 'table', 'user', 'authentication'],
        publicPrompts: 45,
        privatePrompts: 105,
        recentPrompts: 12, // Last 7 days
      };

      const mockTelemetryStats = {
        events: 2500,
        errors: 15,
        avgProcessingTime: 1250,
        successRate: 0.994,
        toolUsage: {
          process_prompt: 1200,
          evaluate_prompt: 500,
          compare_prompts: 200,
          save_prompt: 180,
          search_prompts: 300,
          get_prompt: 100,
          validate_prompt: 20,
        },
        peakHours: ['09:00', '14:00', '16:00'],
      };

      const mockHealthCheck = {
        status: 'healthy',
        uptime: 345600, // 4 days in seconds
        database: 'connected',
        cache: 'available',
        memory: {
          used: 128,
          total: 512,
          percentage: 25,
        },
        lastCheck: new Date('2024-01-15T10:30:00Z'),
      };

      mockServices.store.getStats.mockResolvedValueOnce(mockStoreStats);
      mockServices.telemetry.getStats.mockResolvedValueOnce(mockTelemetryStats);
      mockServices.healthCheck.mockResolvedValueOnce(mockHealthCheck);

      const result = await (server as any).handleGetStats({});

      expect(mockServices.store.getStats).toHaveBeenCalled();
      expect(mockServices.telemetry.getStats).toHaveBeenCalledWith(7); // Default 7 days
      expect(mockServices.healthCheck).toHaveBeenCalled();

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();

      // Validate stats structure
      expect(responseData.data).toHaveProperty('store');
      expect(responseData.data).toHaveProperty('telemetry');
      expect(responseData.data).toHaveProperty('health');
      expect(responseData.data).toHaveProperty('system');

      // Validate store stats
      expect(responseData.data.store.totalPrompts).toBe(150);
      expect(responseData.data.store.avgQualityScore).toBe(0.78);
      expect(responseData.data.store.topDomains).toEqual(['sql', 'general', 'saas']);

      // Validate telemetry stats
      expect(responseData.data.telemetry.events).toBe(2500);
      expect(responseData.data.telemetry.successRate).toBe(0.994);
      expect(responseData.data.telemetry.toolUsage.process_prompt).toBe(1200);

      // Validate health check
      expect(responseData.data.health.status).toBe('healthy');
      expect(responseData.data.health.database).toBe('connected');

      // Validate system info
      expect(responseData.data.system).toHaveProperty('name', 'promptsmith-mcp');
      expect(responseData.data.system).toHaveProperty('version', '1.0.0');
      expect(responseData.data.system).toHaveProperty('uptime');
      expect(responseData.data.system).toHaveProperty('memory');
      expect(responseData.data.system).toHaveProperty('timestamp');
    });

    it('should get stats for custom time periods', async () => {
      const testPeriods = [1, 7, 30, 90, 365];

      for (const days of testPeriods) {
        const mockTelemetryStats = {
          events: days * 10,
          errors: Math.floor(days * 0.1),
          avgProcessingTime: 1200 + (days * 2),
          successRate: 0.99 - (days * 0.001),
          period: days,
        };

        mockServices.store.getStats.mockResolvedValueOnce({
          totalPrompts: 100,
          recentPrompts: days === 1 ? 5 : days === 7 ? 15 : days * 2,
        });
        mockServices.telemetry.getStats.mockResolvedValueOnce(mockTelemetryStats);
        mockServices.healthCheck.mockResolvedValueOnce({
          status: 'healthy',
          uptime: 86400,
        });

        const result = await (server as any).handleGetStats({ days });

        expect(mockServices.telemetry.getStats).toHaveBeenCalledWith(days);

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
        expect(responseData.data.telemetry.events).toBe(days * 10);
      }
    });

    it('should include detailed system information', async () => {
      mockServices.store.getStats.mockResolvedValueOnce({ totalPrompts: 50 });
      mockServices.telemetry.getStats.mockResolvedValueOnce({ events: 100 });
      mockServices.healthCheck.mockResolvedValueOnce({ status: 'healthy' });

      // Mock process information
      const originalUptime = process.uptime;
      const originalMemoryUsage = process.memoryUsage;

      (process.uptime as any) = jest.fn().mockReturnValue(123456);
      (process.memoryUsage as any) = jest.fn().mockReturnValue({
        rss: 50 * 1024 * 1024,
        heapTotal: 30 * 1024 * 1024,
        heapUsed: 20 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        arrayBuffers: 2 * 1024 * 1024,
      });

      const result = await (server as any).handleGetStats({});

      const responseData = JSON.parse(result.content[0].text);
      const systemInfo = responseData.data.system;

      expect(systemInfo.name).toBe('promptsmith-mcp');
      expect(systemInfo.version).toBe('1.0.0');
      expect(systemInfo.uptime).toBe(123456);
      expect(systemInfo.memory).toHaveProperty('rss');
      expect(systemInfo.memory).toHaveProperty('heapTotal');
      expect(systemInfo.memory).toHaveProperty('heapUsed');
      expect(systemInfo.timestamp).toBeDefined();

      // Restore original functions
      process.uptime = originalUptime;
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('statistical aggregations', () => {
    it('should provide domain distribution statistics', async () => {
      const mockStoreStats = {
        totalPrompts: 200,
        domainDistribution: {
          sql: 80,
          general: 50,
          saas: 30,
          branding: 20,
          devops: 15,
          cine: 5,
        },
        topDomains: ['sql', 'general', 'saas'],
        avgQualityScore: 0.75,
      };

      mockServices.store.getStats.mockResolvedValueOnce(mockStoreStats);
      mockServices.telemetry.getStats.mockResolvedValueOnce({ events: 500 });
      mockServices.healthCheck.mockResolvedValueOnce({ status: 'healthy' });

      const result = await (server as any).handleGetStats({});

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.store.domainDistribution).toBeDefined();
      expect(responseData.data.store.domainDistribution.sql).toBe(80);
      expect(responseData.data.store.topDomains).toEqual(['sql', 'general', 'saas']);
    });

    it('should provide usage pattern analytics', async () => {
      const mockTelemetryStats = {
        events: 5000,
        errors: 25,
        avgProcessingTime: 1400,
        successRate: 0.995,
        toolUsage: {
          process_prompt: 2000,
          evaluate_prompt: 1000,
          compare_prompts: 500,
          save_prompt: 400,
          search_prompts: 800,
          get_prompt: 250,
          get_stats: 45,
          validate_prompt: 5,
        },
        hourlyDistribution: {
          '08': 180,
          '09': 320,
          '10': 280,
          '14': 350,
          '15': 290,
          '16': 310,
        },
        weeklyTrends: {
          monday: 800,
          tuesday: 750,
          wednesday: 900,
          thursday: 850,
          friday: 700,
        },
      };

      mockServices.store.getStats.mockResolvedValueOnce({ totalPrompts: 300 });
      mockServices.telemetry.getStats.mockResolvedValueOnce(mockTelemetryStats);
      mockServices.healthCheck.mockResolvedValueOnce({ status: 'healthy' });

      const result = await (server as any).handleGetStats({ days: 30 });

      const responseData = JSON.parse(result.content[0].text);
      const telemetry = responseData.data.telemetry;

      expect(telemetry.toolUsage).toBeDefined();
      expect(telemetry.toolUsage.process_prompt).toBe(2000);
      expect(telemetry.hourlyDistribution).toBeDefined();
      expect(telemetry.weeklyTrends).toBeDefined();
    });

    it('should calculate performance metrics correctly', async () => {
      const mockTelemetryStats = {
        events: 1000,
        errors: 10,
        successRate: 0.99,
        avgProcessingTime: 1200,
        p50ProcessingTime: 800,
        p95ProcessingTime: 2500,
        p99ProcessingTime: 4000,
        throughput: 150, // requests per minute
        errorRate: 0.01,
        timeouts: 2,
      };

      mockServices.store.getStats.mockResolvedValueOnce({ totalPrompts: 200 });
      mockServices.telemetry.getStats.mockResolvedValueOnce(mockTelemetryStats);
      mockServices.healthCheck.mockResolvedValueOnce({ status: 'healthy' });

      const result = await (server as any).handleGetStats({ days: 7 });

      const responseData = JSON.parse(result.content[0].text);
      const telemetry = responseData.data.telemetry;

      expect(telemetry.successRate).toBe(0.99);
      expect(telemetry.errorRate).toBe(0.01);
      expect(telemetry.avgProcessingTime).toBe(1200);
      expect(telemetry.p95ProcessingTime).toBe(2500);
      expect(telemetry.throughput).toBe(150);
    });
  });

  describe('health monitoring', () => {
    it('should report healthy system status', async () => {
      const mockHealthCheck = {
        status: 'healthy',
        uptime: 604800, // 1 week
        database: 'connected',
        cache: 'available',
        redis: 'connected',
        memory: {
          used: 256,
          total: 1024,
          percentage: 25,
        },
        disk: {
          used: 10240,
          total: 51200,
          percentage: 20,
        },
        connections: {
          active: 15,
          max: 100,
          percentage: 15,
        },
        lastCheck: new Date(),
      };

      mockServices.store.getStats.mockResolvedValueOnce({ totalPrompts: 100 });
      mockServices.telemetry.getStats.mockResolvedValueOnce({ events: 500 });
      mockServices.healthCheck.mockResolvedValueOnce(mockHealthCheck);

      const result = await (server as any).handleGetStats({});

      const responseData = JSON.parse(result.content[0].text);
      const health = responseData.data.health;

      expect(health.status).toBe('healthy');
      expect(health.uptime).toBe(604800);
      expect(health.database).toBe('connected');
      expect(health.cache).toBe('available');
      expect(health.memory.percentage).toBe(25);
      expect(health.disk.percentage).toBe(20);
      expect(health.connections.active).toBe(15);
    });

    it('should report degraded system status', async () => {
      const mockHealthCheck = {
        status: 'degraded',
        uptime: 86400,
        database: 'connected',
        cache: 'slow',
        redis: 'disconnected',
        memory: {
          used: 768,
          total: 1024,
          percentage: 75,
        },
        errors: ['Cache response time > 500ms', 'Redis connection lost'],
        warnings: ['High memory usage'],
      };

      mockServices.store.getStats.mockResolvedValueOnce({ totalPrompts: 100 });
      mockServices.telemetry.getStats.mockResolvedValueOnce({ events: 500, errors: 50 });
      mockServices.healthCheck.mockResolvedValueOnce(mockHealthCheck);

      const result = await (server as any).handleGetStats({});

      const responseData = JSON.parse(result.content[0].text);
      const health = responseData.data.health;

      expect(health.status).toBe('degraded');
      expect(health.cache).toBe('slow');
      expect(health.redis).toBe('disconnected');
      expect(health.memory.percentage).toBe(75);
      expect(health.errors).toEqual(['Cache response time > 500ms', 'Redis connection lost']);
      expect(health.warnings).toEqual(['High memory usage']);
    });

    it('should report unhealthy system status', async () => {
      const mockHealthCheck = {
        status: 'unhealthy',
        uptime: 3600,
        database: 'disconnected',
        cache: 'unavailable',
        memory: {
          used: 900,
          total: 1024,
          percentage: 88,
        },
        errors: [
          'Database connection failed',
          'Cache service unavailable',
          'Critical memory usage'
        ],
      };

      mockServices.store.getStats.mockRejectedValueOnce(new Error('Database unavailable'));
      mockServices.telemetry.getStats.mockResolvedValueOnce({ events: 100, errors: 25 });
      mockServices.healthCheck.mockResolvedValueOnce(mockHealthCheck);

      const result = await (server as any).handleGetStats({});

      const responseData = JSON.parse(result.content[0].text);
      const health = responseData.data.health;

      expect(health.status).toBe('unhealthy');
      expect(health.database).toBe('disconnected');
      expect(health.cache).toBe('unavailable');
      expect(health.memory.percentage).toBe(88);
      expect(health.errors).toContain('Database connection failed');
    });
  });

  describe('input validation', () => {
    it('should handle optional days parameter', async () => {
      mockServices.store.getStats.mockResolvedValue({ totalPrompts: 50 });
      mockServices.telemetry.getStats.mockResolvedValue({ events: 200 });
      mockServices.healthCheck.mockResolvedValue({ status: 'healthy' });

      // Test without days parameter
      await (server as any).handleGetStats({});
      expect(mockServices.telemetry.getStats).toHaveBeenCalledWith(7);

      // Test with days parameter
      await (server as any).handleGetStats({ days: 30 });
      expect(mockServices.telemetry.getStats).toHaveBeenCalledWith(30);
    });

    it('should validate days parameter boundaries', async () => {
      mockServices.store.getStats.mockResolvedValue({ totalPrompts: 50 });
      mockServices.telemetry.getStats.mockResolvedValue({ events: 200 });
      mockServices.healthCheck.mockResolvedValue({ status: 'healthy' });

      const validValues = [1, 7, 30, 90, 365];

      for (const days of validValues) {
        const result = await (server as any).handleGetStats({ days });
        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
      }
    });

    it('should handle invalid days parameter gracefully', async () => {
      mockServices.store.getStats.mockResolvedValue({ totalPrompts: 50 });
      mockServices.telemetry.getStats.mockResolvedValue({ events: 200 });
      mockServices.healthCheck.mockResolvedValue({ status: 'healthy' });

      // Test with boundary values (might be handled by orchestrator)
      const testCases = [0, -1, 366, 1000];

      for (const days of testCases) {
        const result = await (server as any).handleGetStats({ days });
        // Should either succeed with adjusted value or return valid stats
        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
      }
    });
  });

  describe('error handling', () => {
    it('should handle partial service failures gracefully', async () => {
      // Store service fails
      mockServices.store.getStats.mockRejectedValueOnce(new Error('Store service unavailable'));
      mockServices.telemetry.getStats.mockResolvedValueOnce({ events: 200 });
      mockServices.healthCheck.mockResolvedValueOnce({ status: 'degraded' });

      const result = await (server as any).handleGetStats({});

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);

      // Should still have telemetry and health data
      expect(responseData.data.telemetry).toBeDefined();
      expect(responseData.data.health).toBeDefined();
      expect(responseData.data.system).toBeDefined();

      // Store data might be null or have error info
      expect(responseData.data.store).toBeDefined();
    });

    it('should handle complete service failure', async () => {
      mockServices.store.getStats.mockRejectedValueOnce(new Error('Store failed'));
      mockServices.telemetry.getStats.mockRejectedValueOnce(new Error('Telemetry failed'));
      mockServices.healthCheck.mockRejectedValueOnce(new Error('Health check failed'));

      // This should throw since all services failed
      await expect((server as any).handleGetStats({})).rejects.toThrow();
    });

    it('should handle timeout scenarios', async () => {
      // Simulate slow service responses
      mockServices.store.getStats.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ totalPrompts: 100 }), 6000))
      );
      mockServices.telemetry.getStats.mockResolvedValueOnce({ events: 200 });
      mockServices.healthCheck.mockResolvedValueOnce({ status: 'healthy' });

      // Should either timeout or succeed depending on implementation
      const promise = (server as any).handleGetStats({});

      // Add reasonable timeout for test
      await expect(Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 5000))
      ])).rejects.toThrow();
    });
  });

  describe('performance', () => {
    it('should complete stats collection within performance threshold', async () => {
      mockServices.store.getStats.mockResolvedValue({ totalPrompts: 150 });
      mockServices.telemetry.getStats.mockResolvedValue({ events: 500 });
      mockServices.healthCheck.mockResolvedValue({ status: 'healthy' });

      const { duration } = await measurePerformance(async () => {
        return await (server as any).handleGetStats({});
      });

      expectWithinPerformanceThreshold(
        duration,
        TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.get_stats,
        'get_stats'
      );
    });

    it('should handle concurrent stats requests', async () => {
      mockServices.store.getStats.mockResolvedValue({ totalPrompts: 150 });
      mockServices.telemetry.getStats.mockResolvedValue({ events: 500 });
      mockServices.healthCheck.mockResolvedValue({ status: 'healthy' });

      const promises = Array.from({ length: 3 }, () =>
        (server as any).handleGetStats({})
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);

      results.forEach((result) => {
        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
      });
    });
  });

  describe('response format validation', () => {
    it('should return properly formatted MCP tool response', async () => {
      mockServices.store.getStats.mockResolvedValue({ totalPrompts: 100 });
      mockServices.telemetry.getStats.mockResolvedValue({ events: 300 });
      mockServices.healthCheck.mockResolvedValue({ status: 'healthy', uptime: 86400 });

      const result = await (server as any).handleGetStats({});

      // Validate MCP response structure
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');

      // Validate JSON structure
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData).toHaveProperty('success', true);
      expect(responseData).toHaveProperty('data');

      // Validate stats structure
      const requiredSections = ['store', 'telemetry', 'health', 'system'];
      requiredSections.forEach(section => {
        expect(responseData.data).toHaveProperty(section);
      });

      // Validate system section always includes basic info
      expect(responseData.data.system).toHaveProperty('name');
      expect(responseData.data.system).toHaveProperty('version');
      expect(responseData.data.system).toHaveProperty('uptime');
      expect(responseData.data.system).toHaveProperty('memory');
      expect(responseData.data.system).toHaveProperty('timestamp');
    });

    it('should format timestamps consistently', async () => {
      const now = new Date();

      mockServices.store.getStats.mockResolvedValue({
        totalPrompts: 100,
        lastUpdated: now,
      });
      mockServices.telemetry.getStats.mockResolvedValue({
        events: 300,
        periodStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        periodEnd: now,
      });
      mockServices.healthCheck.mockResolvedValue({
        status: 'healthy',
        lastCheck: now,
      });

      const result = await (server as any).handleGetStats({});

      const responseData = JSON.parse(result.content[0].text);

      // All timestamps should be ISO strings
      expect(typeof responseData.data.system.timestamp).toBe('string');
      expect(responseData.data.system.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });
});