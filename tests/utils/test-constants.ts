/**
 * Test Constants - Separated to avoid compilation issues
 */

// Test constants - Using string literals to avoid enum import issues
export const TEST_CONSTANTS = {
  DEFAULT_TIMEOUT: 5000,
  PERFORMANCE_THRESHOLD: 1000,
  MAX_RETRIES: 3,
  MOCK_USER_ID: 'test_user_123',
  MOCK_PROMPT_ID: 'test_prompt_456',
  MOCK_DOMAIN: 'general' as const,
  MOCK_TONE: 'technical' as const,
  TEST_DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
  TEST_REDIS_URL: 'redis://localhost:6379/1',
  TEST_SUPABASE_URL: 'https://test.supabase.co',
  TEST_SUPABASE_KEY: 'test-anon-key-123',
  
  // Sample prompts for testing
  SAMPLE_PROMPTS: {
    simple: 'Create a user table',
    complex: 'Design a comprehensive database schema for an e-commerce platform with user management, product catalog, order processing, inventory tracking, and payment integration',
    technical: 'Implement a RESTful API with JWT authentication, rate limiting, input validation, error handling, and comprehensive logging',
    ambiguous: 'Make it better',
    creative: 'Write a compelling marketing campaign for a sustainable fashion brand targeting millennials'
  },
  
  // Performance thresholds for different operations
  PERFORMANCE_THRESHOLDS: {
    process_prompt: 2000,
    evaluate_prompt: 1500,
    compare_prompts: 3000,
    save_prompt: 1000,
    search_prompts: 800,
    get_prompt: 500,
    get_stats: 300,
    validate_prompt: 1000
  },
  
  // Test domains - using string literals
  DOMAINS: ['sql', 'branding', 'cine', 'saas', 'devops', 'general'],
  
  // Test tones - using string literals
  TONES: ['formal', 'casual', 'technical', 'creative']
} as const;