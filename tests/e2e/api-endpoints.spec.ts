import { test, expect } from '@playwright/test';

test.describe('PromptSmith API Endpoints', () => {
  const baseURL = 'http://localhost:3000';

  test('should respond to health check', async ({ request }) => {
    const response = await request.get(`${baseURL}/health`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
    expect(data.version).toBeDefined();
  });

  test('should process prompts via API', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/process`, {
      data: {
        text: 'create a registration form',
        domain: 'general',
        tone: 'professional'
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.original).toBe('create a registration form');
    expect(data.data.refined).toBeDefined();
    expect(data.data.refined).not.toContain('No optimized result available');
    expect(data.data.score).toBeDefined();
    expect(data.data.metadata).toBeDefined();
  });

  test('should handle SQL domain optimization', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/process`, {
      data: {
        text: 'show me users from database',
        domain: 'sql'
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    // The refined prompt should include SQL context even if the original doesn't
    expect(data.data.metadata.domain).toBe('sql');
    // Should have improved from the original
    expect(data.data.refined.length).toBeGreaterThan(data.data.original.length);
  });

  test('should evaluate prompts', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/evaluate`, {
      data: {
        prompt: 'create a detailed user interface for product management'
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.result.score).toBeDefined();
    expect(data.result.score.overall).toBeGreaterThan(0);
    expect(data.result.analysis).toBeDefined();
    expect(data.result.suggestions).toBeDefined();
    expect(Array.isArray(data.result.suggestions)).toBe(true);
  });

  test('should save prompts', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/save`, {
      data: {
        original: 'test original prompt',
        optimized: 'test optimized prompt',
        metadata: {
          title: 'API Test Prompt',
          description: 'Testing save functionality',
          domain: 'general',
          tags: ['api', 'test']
        }
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.id).toBeDefined();
  });

  test('should search saved prompts', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/search?q=test&limit=10`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.total).toBeDefined();
    expect(typeof data.total).toBe('number');
  });

  test('should get system statistics', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/stats`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.uptime).toBeDefined();
    expect(data.data.version).toBeDefined();
    expect(data.data.totalPrompts).toBeDefined();
  });

  test('should compare prompts', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/compare`, {
      data: {
        promptA: 'build login system',
        promptB: 'create authentication module'
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.result.promptA).toBeDefined();
    expect(data.result.promptB).toBeDefined();
    expect(data.result.comparison).toBeDefined();
    expect(data.result.recommendation).toBeDefined();
  });

  test('should validate request parameters', async ({ request }) => {
    // Test missing required parameters
    const response = await request.post(`${baseURL}/api/process`, {
      data: {
        domain: 'general'
        // Missing 'raw' parameter
      }
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  test('should handle invalid domain', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/process`, {
      data: {
        raw: 'test prompt',
        domain: 'invalid_domain'
      }
    });

    // Should either accept with fallback or reject
    if (response.status() === 400) {
      const data = await response.json();
      expect(data.success).toBe(false);
    } else {
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      // Should fallback to general domain
      expect(data.result.metadata.domain).toBe('general');
    }
  });

  test('should handle rate limiting gracefully', async ({ request }) => {
    // Send multiple rapid requests
    const requests = Array.from({ length: 50 }, () =>
      request.post(`${baseURL}/api/process`, {
        data: { raw: 'test prompt', domain: 'general' }
      })
    );

    const responses = await Promise.all(requests);
    
    // Most should succeed, some might be rate limited
    const successfulResponses = responses.filter(r => r.status() === 200);
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    
    expect(successfulResponses.length).toBeGreaterThan(0);
    // Rate limiting might kick in for some requests
    if (rateLimitedResponses.length > 0) {
      expect(rateLimitedResponses[0].status()).toBe(429);
    }
  });

  test('should handle large prompts', async ({ request }) => {
    const largePrompt = 'Create a comprehensive user management system '.repeat(100);
    
    const response = await request.post(`${baseURL}/api/process`, {
      data: {
        raw: largePrompt,
        domain: 'general'
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.result.refined).toBeDefined();
  });

  test('should return appropriate CORS headers', async ({ request }) => {
    const response = await request.options(`${baseURL}/api/process`);
    
    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-origin']).toBeDefined();
    expect(response.headers()['access-control-allow-methods']).toBeDefined();
  });

  test('should handle content negotiation', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/process`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: {
        raw: 'test content negotiation',
        domain: 'general'
      }
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
  });
});