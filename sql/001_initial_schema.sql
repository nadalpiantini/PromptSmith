-- PromptSmith MCP Database Schema
-- Initial migration: Create core tables for prompt management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for better text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Domain enum type
CREATE TYPE prompt_domain AS ENUM ('sql', 'branding', 'cine', 'saas', 'devops', 'general');

-- Tone enum type
CREATE TYPE prompt_tone AS ENUM ('formal', 'casual', 'technical', 'creative');

-- Template type enum
CREATE TYPE template_type AS ENUM ('basic', 'chain-of-thought', 'few-shot', 'role-based', 'step-by-step');

-- Rule category enum
CREATE TYPE rule_category AS ENUM ('vague_terms', 'structure', 'enhancement', 'terminology', 'formatting', 'context');

-- Main prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Metadata
  name VARCHAR(100),
  domain prompt_domain NOT NULL DEFAULT 'general',
  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  description TEXT,

  -- Content
  raw_prompt TEXT NOT NULL,
  refined_prompt TEXT NOT NULL,
  system_prompt TEXT,

  -- Quality scoring
  quality_score JSONB DEFAULT '{
    "clarity": 0,
    "specificity": 0,
    "structure": 0,
    "completeness": 0,
    "overall": 0
  }'::JSONB,

  -- Template information
  template_type template_type DEFAULT 'basic',
  template_variables JSONB DEFAULT '{}'::JSONB,

  -- Versioning
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES prompts(id),

  -- Analytics
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 0.0000,
  avg_response_time INTEGER, -- milliseconds
  last_used_at TIMESTAMPTZ,

  -- User and access control
  author_id VARCHAR(100),
  is_public BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt evaluations table
CREATE TABLE prompt_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,

  -- Model and configuration
  model VARCHAR(50) NOT NULL,
  temperature DECIMAL(3,2),
  max_tokens INTEGER,

  -- Performance metrics
  input_tokens INTEGER,
  output_tokens INTEGER,
  response_time INTEGER, -- milliseconds

  -- Quality assessment
  response_quality JSONB DEFAULT '{}'::JSONB,
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  feedback TEXT,

  -- Test case information
  test_input TEXT,
  expected_output TEXT,
  actual_output TEXT,
  success BOOLEAN,

  -- Metadata
  evaluation_context JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom rules table
CREATE TABLE custom_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Rule identification
  name VARCHAR(100) NOT NULL,
  domain prompt_domain,
  category rule_category NOT NULL,

  -- Rule logic
  pattern TEXT NOT NULL, -- regex or keyword pattern
  replacement TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,

  -- Rule metadata
  description TEXT,
  examples JSONB DEFAULT '[]'::JSONB, -- array of before/after examples

  -- Usage statistics
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 0.0000,
  avg_improvement DECIMAL(5,4) DEFAULT 0.0000,

  -- User and versioning
  author_id VARCHAR(100),
  version INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template library table
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template identification
  name VARCHAR(100) NOT NULL,
  domain prompt_domain NOT NULL,
  template_type template_type NOT NULL,

  -- Template content
  template_content TEXT NOT NULL, -- Liquid template
  system_prompt TEXT,
  variables JSONB DEFAULT '{}'::JSONB, -- available variables

  -- Metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(50),

  -- Usage statistics
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,

  -- Access control
  author_id VARCHAR(100),
  is_public BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Examples table for few-shot learning
CREATE TABLE prompt_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Association
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  template_id UUID REFERENCES prompt_templates(id) ON DELETE CASCADE,
  domain prompt_domain NOT NULL,

  -- Example content
  input_example TEXT NOT NULL,
  output_example TEXT NOT NULL,
  explanation TEXT,

  -- Metadata
  context JSONB DEFAULT '{}'::JSONB,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions table for learning
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User identification
  user_id VARCHAR(100) NOT NULL,
  session_id VARCHAR(100) NOT NULL,

  -- Session metadata
  client_info JSONB DEFAULT '{}'::JSONB,
  preferences JSONB DEFAULT '{}'::JSONB,

  -- Activity tracking
  prompts_refined INTEGER DEFAULT 0,
  total_improvement DECIMAL(5,4) DEFAULT 0.0000,
  domains_used TEXT[] DEFAULT '{}',

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Analytics table for usage tracking
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Event information
  event_type VARCHAR(50) NOT NULL, -- 'refine', 'evaluate', 'save', etc.
  user_id VARCHAR(100),
  session_id VARCHAR(100),

  -- Context
  domain prompt_domain,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,

  -- Metrics
  processing_time INTEGER, -- milliseconds
  input_length INTEGER,
  output_length INTEGER,
  quality_improvement DECIMAL(5,4),

  -- Additional data
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback table for continuous learning
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Association
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  evaluation_id UUID REFERENCES prompt_evaluations(id) ON DELETE SET NULL,
  user_id VARCHAR(100),

  -- Feedback content
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  improvement_suggestions TEXT,

  -- Feedback type
  feedback_type VARCHAR(50), -- 'quality', 'usefulness', 'accuracy', etc.

  -- Context
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance

-- Prompts table indexes
CREATE INDEX idx_prompts_domain ON prompts(domain);
CREATE INDEX idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX idx_prompts_updated_at ON prompts(updated_at DESC);
CREATE INDEX idx_prompts_usage_count ON prompts(usage_count DESC);
CREATE INDEX idx_prompts_quality_overall ON prompts(((quality_score->>'overall')::DECIMAL) DESC);
CREATE INDEX idx_prompts_tags_gin ON prompts USING GIN(tags);
CREATE INDEX idx_prompts_is_public ON prompts(is_public) WHERE is_public = true;
CREATE INDEX idx_prompts_author_id ON prompts(author_id);
CREATE INDEX idx_prompts_text_search ON prompts USING GIN(to_tsvector('english', raw_prompt || ' ' || COALESCE(refined_prompt, '')));

-- Evaluations table indexes
CREATE INDEX idx_evaluations_prompt_id ON prompt_evaluations(prompt_id);
CREATE INDEX idx_evaluations_model ON prompt_evaluations(model);
CREATE INDEX idx_evaluations_created_at ON prompt_evaluations(created_at DESC);
CREATE INDEX idx_evaluations_response_time ON prompt_evaluations(response_time);
CREATE INDEX idx_evaluations_success ON prompt_evaluations(success);

-- Custom rules indexes
CREATE INDEX idx_custom_rules_domain ON custom_rules(domain);
CREATE INDEX idx_custom_rules_category ON custom_rules(category);
CREATE INDEX idx_custom_rules_active ON custom_rules(active) WHERE active = true;
CREATE INDEX idx_custom_rules_priority ON custom_rules(priority DESC);
CREATE INDEX idx_custom_rules_author_id ON custom_rules(author_id);

-- Templates indexes
CREATE INDEX idx_templates_domain ON prompt_templates(domain);
CREATE INDEX idx_templates_type ON prompt_templates(template_type);
CREATE INDEX idx_templates_public ON prompt_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_templates_rating ON prompt_templates(rating DESC);
CREATE INDEX idx_templates_usage ON prompt_templates(usage_count DESC);

-- Analytics indexes
CREATE INDEX idx_analytics_event_type ON usage_analytics(event_type);
CREATE INDEX idx_analytics_domain ON usage_analytics(domain);
CREATE INDEX idx_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX idx_analytics_created_at ON usage_analytics(created_at DESC);

-- Create views for common queries

-- View for public prompts with statistics
CREATE VIEW public_prompts AS
SELECT
  p.id,
  p.name,
  p.domain,
  p.category,
  p.tags,
  p.description,
  p.refined_prompt,
  p.quality_score,
  p.usage_count,
  p.success_rate,
  p.created_at,
  p.updated_at,
  COALESCE(AVG(f.rating), 0) as avg_rating,
  COUNT(f.rating) as rating_count
FROM prompts p
LEFT JOIN user_feedback f ON p.id = f.prompt_id
WHERE p.is_public = true
GROUP BY p.id, p.name, p.domain, p.category, p.tags, p.description,
         p.refined_prompt, p.quality_score, p.usage_count, p.success_rate,
         p.created_at, p.updated_at;

-- View for domain statistics
CREATE VIEW domain_statistics AS
SELECT
  domain,
  COUNT(*) as total_prompts,
  AVG((quality_score->>'overall')::DECIMAL) as avg_quality,
  SUM(usage_count) as total_usage,
  AVG(success_rate) as avg_success_rate,
  MAX(created_at) as latest_prompt
FROM prompts
WHERE is_public = true
GROUP BY domain;

-- Functions for common operations

-- Function to update prompt usage statistics
CREATE OR REPLACE FUNCTION update_prompt_usage(
  prompt_uuid UUID,
  success BOOLEAN DEFAULT true,
  response_time INTEGER DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_success_rate DECIMAL(5,4);
  current_usage INTEGER;
BEGIN
  -- Get current stats
  SELECT usage_count, success_rate
  INTO current_usage, current_success_rate
  FROM prompts
  WHERE id = prompt_uuid;

  -- Update usage count and success rate
  UPDATE prompts
  SET
    usage_count = current_usage + 1,
    success_rate = CASE
      WHEN current_usage = 0 THEN
        CASE WHEN success THEN 1.0 ELSE 0.0 END
      ELSE
        (current_success_rate * current_usage + CASE WHEN success THEN 1 ELSE 0 END) / (current_usage + 1)
    END,
    avg_response_time = CASE
      WHEN response_time IS NOT NULL THEN
        CASE
          WHEN avg_response_time IS NULL THEN response_time
          ELSE (avg_response_time * current_usage + response_time) / (current_usage + 1)
        END
      ELSE avg_response_time
    END,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = prompt_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate quality score
CREATE OR REPLACE FUNCTION calculate_quality_score(
  clarity DECIMAL(3,2),
  specificity DECIMAL(3,2),
  structure DECIMAL(3,2),
  completeness DECIMAL(3,2)
)
RETURNS JSONB AS $$
DECLARE
  overall_score DECIMAL(3,2);
BEGIN
  -- Calculate weighted overall score
  overall_score := (clarity * 0.25 + specificity * 0.25 + structure * 0.25 + completeness * 0.25);

  RETURN jsonb_build_object(
    'clarity', clarity,
    'specificity', specificity,
    'structure', structure,
    'completeness', completeness,
    'overall', overall_score
  );
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_rules_updated_at
  BEFORE UPDATE ON custom_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Public prompts are visible to everyone
CREATE POLICY "Public prompts are viewable by everyone" ON prompts
  FOR SELECT USING (is_public = true);

-- Users can view their own prompts
CREATE POLICY "Users can view own prompts" ON prompts
  FOR ALL USING (author_id = current_setting('app.user_id', true));

-- Users can insert their own prompts
CREATE POLICY "Users can insert own prompts" ON prompts
  FOR INSERT WITH CHECK (author_id = current_setting('app.user_id', true));

-- Similar policies for other tables
CREATE POLICY "Users can view own evaluations" ON prompt_evaluations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM prompts
      WHERE prompts.id = prompt_evaluations.prompt_id
      AND prompts.author_id = current_setting('app.user_id', true)
    )
  );

CREATE POLICY "Users can manage own rules" ON custom_rules
  FOR ALL USING (author_id = current_setting('app.user_id', true));

CREATE POLICY "Users can manage own templates" ON prompt_templates
  FOR ALL USING (author_id = current_setting('app.user_id', true));

CREATE POLICY "Public templates are viewable" ON prompt_templates
  FOR SELECT USING (is_public = true);

-- Comments for documentation
COMMENT ON TABLE prompts IS 'Main table storing prompt refinements and metadata';
COMMENT ON TABLE prompt_evaluations IS 'Performance evaluations and test results for prompts';
COMMENT ON TABLE custom_rules IS 'User-defined rules for prompt refinement';
COMMENT ON TABLE prompt_templates IS 'Template library for different prompt patterns';
COMMENT ON TABLE prompt_examples IS 'Few-shot examples for learning and improvement';
COMMENT ON TABLE usage_analytics IS 'Analytics and usage tracking data';
COMMENT ON TABLE user_feedback IS 'User feedback for continuous improvement';

-- Initial data seeding will be handled by separate seed script