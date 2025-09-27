/**
 * Unit Tests for save_prompt tool
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PromptSmithServer } from '../../../src/server/index';
import {
  createMockSavedPrompt,
  createMockOrchestrator,
  measurePerformance,
  expectWithinPerformanceThreshold,
  TEST_CONSTANTS,
} from '../../utils/test-helpers';
import { setupMockEnvironment } from '../../utils/mock-services';

// Mock the orchestrator
const mockOrchestrator = createMockOrchestrator();
jest.mock('../../../src/core/orchestrator', () => ({
  PromptOrchestrator: jest.fn().mockImplementation(() => mockOrchestrator),
}));

// Mock external services
setupMockEnvironment();

describe('save_prompt tool', () => {
  let server: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const serverModule = await import('../../../src/server/index');
    server = new serverModule.PromptSmithServer();
  });

  describe('valid inputs', () => {
    it('should save a prompt with basic metadata successfully', async () => {
      const prompt = TEST_CONSTANTS.SAMPLE_PROMPTS.technical;
      const metadata = {
        domain: 'devops',
        description: 'OAuth implementation guide',
        tags: ['oauth', 'security', 'authentication'],
        isPublic: false,
        author: 'test-user',
        version: '1.0.0',
      };

      const mockSaved = createMockSavedPrompt({
        id: 'prompt_456',
        name: 'OAuth Implementation',
        prompt,
        metadata: {
          ...metadata,
          name: 'OAuth Implementation',
        },
      });
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const result = await server.handleSavePrompt({
        prompt,
        metadata,
      });

      expect(mockOrchestrator.save).toHaveBeenCalledWith(prompt, metadata);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();

      // Validate saved prompt structure
      expect(responseData.data).toHaveProperty('id');
      expect(responseData.data).toHaveProperty('name');
      expect(responseData.data).toHaveProperty('domain');
      expect(responseData.data).toHaveProperty('tags');
      expect(responseData.data).toHaveProperty('prompt');
      expect(responseData.data).toHaveProperty('score');
      expect(responseData.data).toHaveProperty('createdAt');
      expect(responseData.data).toHaveProperty('updatedAt');

      expect(responseData.data.domain).toBe('devops');
      expect(responseData.data.tags).toEqual(['oauth', 'security', 'authentication']);
    });

    it('should save prompts for different domains', async () => {
      for (const domain of TEST_CONSTANTS.DOMAINS) {
        const prompt = `Create a ${domain} solution`;
        const metadata = {
          domain,
          description: `${domain} prompt example`,
          tags: [domain, 'test'],
        };

        const mockSaved = createMockSavedPrompt({
          domain: domain as any,
          prompt,
          metadata: { ...metadata, name: `${domain} solution` },
        });
        mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

        const result = await server.handleSavePrompt({
          prompt,
          metadata,
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
        expect(responseData.data.domain).toBe(domain);
      }
    });

    it('should save public prompts', async () => {
      const prompt = TEST_CONSTANTS.SAMPLE_PROMPTS.simple;
      const metadata = {
        domain: 'sql',
        description: 'Basic table creation template',
        tags: ['sql', 'table', 'basic'],
        isPublic: true,
        author: 'community-user',
      };

      const mockSaved = createMockSavedPrompt({
        metadata: {
          ...metadata,
          name: 'Public Table Template',
          isPublic: true,
        },
      });
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const result = await server.handleSavePrompt({
        prompt,
        metadata,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.metadata.isPublic).toBe(true);
    });

    it('should save prompts with comprehensive metadata', async () => {
      const prompt = TEST_CONSTANTS.SAMPLE_PROMPTS.complex;
      const metadata = {
        domain: 'saas',
        description: 'Comprehensive e-commerce platform design prompt with detailed requirements',
        tags: ['ecommerce', 'database', 'architecture', 'scalability', 'security'],
        isPublic: true,
        author: 'expert-architect',
        version: '2.1.0',
      };

      const mockSaved = createMockSavedPrompt({
        name: 'E-commerce Platform Design',
        prompt,
        metadata: {
          ...metadata,
          name: 'E-commerce Platform Design',
        },
        tags: metadata.tags,
        description: metadata.description,
      });
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const result = await server.handleSavePrompt({
        prompt,
        metadata,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.tags).toHaveLength(5);
      expect(responseData.data.description).toBe(metadata.description);
      expect(responseData.data.metadata.version).toBe('2.1.0');
    });

    it('should handle prompts with special characters and formatting', async () => {
      const prompt = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
          created_at TIMESTAMP DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'::jsonb
        );

        -- Add indexes
        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_users_created_at ON users(created_at);
      `;

      const metadata = {
        domain: 'sql',
        description: 'Advanced user table with constraints and indexes',
        tags: ['postgresql', 'constraints', 'indexes', 'advanced'],
      };

      const mockSaved = createMockSavedPrompt({
        prompt,
        metadata: {
          ...metadata,
          name: 'Advanced User Table',
        },
      });
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const result = await server.handleSavePrompt({
        prompt,
        metadata,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.prompt).toContain('CHECK (email');
      expect(responseData.data.prompt).toContain('CREATE INDEX');
    });
  });

  describe('input validation', () => {
    it('should reject missing prompt', async () => {
      const metadata = { domain: 'general' };

      await expect(server.handleSavePrompt({
        metadata,
      })).rejects.toThrow('Prompt is required and must be a string');
    });

    it('should reject empty prompt', async () => {
      const metadata = { domain: 'general' };

      await expect(server.handleSavePrompt({
        prompt: '',
        metadata,
      })).rejects.toThrow('Prompt is required and must be a string');
    });

    it('should reject non-string prompt', async () => {
      const metadata = { domain: 'general' };

      await expect(server.handleSavePrompt({
        prompt: 123,
        metadata,
      })).rejects.toThrow('Prompt is required and must be a string');
    });

    it('should reject missing metadata', async () => {
      await expect(server.handleSavePrompt({
        prompt: 'Test prompt',
      })).rejects.toThrow('Metadata is required and must be an object');
    });

    it('should reject non-object metadata', async () => {
      await expect(server.handleSavePrompt({
        prompt: 'Test prompt',
        metadata: 'not an object',
      })).rejects.toThrow('Metadata is required and must be an object');
    });

    it('should require domain in metadata', async () => {
      const mockSaved = createMockSavedPrompt();
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      // Should not throw with valid domain
      const result = await server.handleSavePrompt({
        prompt: 'Test prompt',
        metadata: { domain: 'general' },
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
    });

    it('should handle optional metadata fields', async () => {
      const prompt = 'Test prompt';
      const metadata = {
        domain: 'general',
        // No description, tags, author, version, or isPublic
      };

      const mockSaved = createMockSavedPrompt({
        metadata: {
          ...metadata,
          name: 'Test Prompt',
          isPublic: false, // Default value
        },
      });
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const result = await server.handleSavePrompt({
        prompt,
        metadata,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.metadata.isPublic).toBe(false);
      expect(responseData.data.metadata.version).toBeDefined();
    });
  });

  describe('metadata validation', () => {
    it('should validate domain values', async () => {
      const validDomains = ['general', 'sql', 'branding', 'cine', 'saas', 'devops'];

      for (const domain of validDomains) {
        const mockSaved = createMockSavedPrompt({ domain: domain as any });
        mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

        const result = await server.handleSavePrompt({
          prompt: 'Test prompt',
          metadata: { domain },
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
      }
    });

    it('should handle tags as array', async () => {
      const tags = ['tag1', 'tag2', 'tag3'];
      const mockSaved = createMockSavedPrompt({ tags });
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const result = await server.handleSavePrompt({
        prompt: 'Test prompt',
        metadata: { domain: 'general', tags },
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.tags).toEqual(tags);
    });

    it('should handle boolean isPublic flag', async () => {
      const testCases = [true, false];

      for (const isPublic of testCases) {
        const mockSaved = createMockSavedPrompt({
          metadata: { name: 'Test', domain: 'general', isPublic }
        });
        mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

        const result = await server.handleSavePrompt({
          prompt: 'Test prompt',
          metadata: { domain: 'general', isPublic },
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
        expect(responseData.data.metadata.isPublic).toBe(isPublic);
      }
    });

    it('should handle version strings', async () => {
      const versions = ['1.0.0', '2.1.3', '0.0.1-beta', '1.0.0-rc1'];

      for (const version of versions) {
        const mockSaved = createMockSavedPrompt({
          metadata: { name: 'Test', domain: 'general' }
        });
        mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

        const result = await server.handleSavePrompt({
          prompt: 'Test prompt',
          metadata: { domain: 'general', version },
        });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
        expect(responseData.data.metadata.version).toBe(version);
      }
    });
  });

  describe('quality scoring integration', () => {
    it('should include quality scores in saved prompt', async () => {
      const mockSaved = createMockSavedPrompt({
        score: {
          clarity: 0.85,
          specificity: 0.9,
          structure: 0.8,
          completeness: 0.75,
          overall: 0.825,
        },
      });
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const result = await server.handleSavePrompt({
        prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
        metadata: { domain: 'devops' },
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.score).toBeDefined();
      expect(responseData.data.score.overall).toBeGreaterThan(0.8);
    });

    it('should save high-quality prompts successfully', async () => {
      const mockSaved = createMockSavedPrompt({
        score: {
          clarity: 0.95,
          specificity: 0.92,
          structure: 0.9,
          completeness: 0.88,
          overall: 0.9125,
        },
      });
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const result = await server.handleSavePrompt({
        prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.technical,
        metadata: {
          domain: 'devops',
          description: 'High-quality OAuth implementation prompt',
          tags: ['oauth', 'security', 'best-practices'],
        },
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.score.overall).toBeGreaterThan(0.9);
    });
  });

  describe('error handling', () => {
    it('should handle orchestrator save errors', async () => {
      const error = new Error('Save failed');
      mockOrchestrator.save.mockRejectedValueOnce(error);

      await expect(server.handleSavePrompt({
        prompt: 'Test prompt',
        metadata: { domain: 'general' },
      })).rejects.toThrow('Tool execution failed: Save failed');
    });

    it('should handle database connection errors', async () => {
      const error = new Error('Database connection failed');
      mockOrchestrator.save.mockRejectedValueOnce(error);

      await expect(server.handleSavePrompt({
        prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
        metadata: { domain: 'sql' },
      })).rejects.toThrow('Tool execution failed: Database connection failed');
    });

    it('should handle duplicate name conflicts', async () => {
      const error = new Error('Prompt with this name already exists');
      mockOrchestrator.save.mockRejectedValueOnce(error);

      await expect(server.handleSavePrompt({
        prompt: 'Duplicate prompt',
        metadata: {
          domain: 'general',
          name: 'Existing Name',
        },
      })).rejects.toThrow('Tool execution failed: Prompt with this name already exists');
    });
  });

  describe('performance', () => {
    it('should complete save operation within performance threshold', async () => {
      const mockSaved = createMockSavedPrompt();
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const { duration } = await measurePerformance(async () => {
        return await server.handleSavePrompt({
          prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
          metadata: { domain: 'sql' },
        });
      });

      expectWithinPerformanceThreshold(
        duration,
        TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.save_prompt,
        'save_prompt'
      );
    });

    it('should handle concurrent save operations', async () => {
      const mockSaved = createMockSavedPrompt();
      mockOrchestrator.save.mockResolvedValue(mockSaved);

      const promises = Array.from({ length: 3 }, (_, i) =>
        server.handleSavePrompt({
          prompt: `Test prompt ${i}`,
          metadata: { domain: 'general' },
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);

      results.forEach((result) => {
        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.success).toBe(true);
      });
    });

    it('should handle large prompts efficiently', async () => {
      const largePrompt = TEST_CONSTANTS.SAMPLE_PROMPTS.complex.repeat(10);
      const mockSaved = createMockSavedPrompt({ prompt: largePrompt });
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const { result, duration } = await measurePerformance(async () => {
        return await server.handleSavePrompt({
          prompt: largePrompt,
          metadata: {
            domain: 'saas',
            description: 'Large complex prompt',
            tags: ['large', 'complex'],
          },
        });
      });

      expect(duration).toBeLessThan(TEST_CONSTANTS.PERFORMANCE_THRESHOLDS.save_prompt * 2);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
    });
  });

  describe('response format validation', () => {
    it('should return properly formatted MCP tool response', async () => {
      const mockSaved = createMockSavedPrompt();
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const result = await server.handleSavePrompt({
        prompt: 'Test prompt',
        metadata: { domain: 'general' },
      });

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

      // Validate saved prompt fields
      const requiredFields = [
        'id', 'name', 'domain', 'tags', 'prompt', 'score',
        'metadata', 'createdAt', 'updatedAt'
      ];
      requiredFields.forEach(field => {
        expect(responseData.data).toHaveProperty(field);
      });
    });

    it('should include system prompt when generated', async () => {
      const mockSaved = createMockSavedPrompt({
        systemPrompt: 'You are an expert database architect focusing on PostgreSQL.',
      });
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const result = await server.handleSavePrompt({
        prompt: TEST_CONSTANTS.SAMPLE_PROMPTS.simple,
        metadata: { domain: 'sql' },
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.systemPrompt).toBeDefined();
      expect(responseData.data.systemPrompt).toContain('database architect');
    });

    it('should preserve all metadata in response', async () => {
      const metadata = {
        domain: 'branding',
        description: 'Brand identity creation prompt',
        tags: ['branding', 'identity', 'creative'],
        isPublic: true,
        author: 'brand-expert',
        version: '1.2.0',
      };

      const mockSaved = createMockSavedPrompt({
        metadata: { ...metadata, name: 'Brand Identity Creation' },
      });
      mockOrchestrator.save.mockResolvedValueOnce(mockSaved);

      const result = await server.handleSavePrompt({
        prompt: 'Create a comprehensive brand identity...',
        metadata,
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data.metadata.domain).toBe('branding');
      expect(responseData.data.metadata.description).toBe('Brand identity creation prompt');
      expect(responseData.data.metadata.isPublic).toBe(true);
      expect(responseData.data.metadata.author).toBe('brand-expert');
      expect(responseData.data.metadata.version).toBe('1.2.0');
    });
  });
});