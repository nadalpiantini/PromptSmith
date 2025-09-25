-- PromptSmith MCP Production Schema for sujeto10.supabase.co
-- All tables prefixed with "promptsmith_" for organization
-- Deploy at: prompsmith.sujeto10.com

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Domain enum type
CREATE TYPE promptsmith_domain AS ENUM ('sql', 'branding', 'cine', 'saas', 'devops', 'general');

-- Tone enum type
CREATE TYPE promptsmith_tone AS ENUM ('formal', 'casual', 'technical', 'creative');

-- Template type enum
CREATE TYPE promptsmith_template_type AS ENUM ('basic', 'chain-of-thought', 'few-shot', 'role-based', 'step-by-step');

-- Rule category enum
CREATE TYPE promptsmith_rule_category AS ENUM ('vague_terms', 'structure', 'enhancement', 'terminology', 'formatting', 'context');

-- Main prompts table
CREATE TABLE promptsmith_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Metadata
  name VARCHAR(100),
  domain promptsmith_domain NOT NULL DEFAULT 'general',
  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  description TEXT,

  -- Content
  raw_prompt TEXT NOT NULL,
  refined_prompt TEXT NOT NULL,
  system_prompt TEXT,

  -- Quality scoring (stored as JSONB for flexibility)
  quality_score JSONB DEFAULT '{
    "clarity": 0,
    "specificity": 0,
    "structure": 0,
    "completeness": 0,
    "overall": 0
  }'::JSONB,

  -- Template information
  template_type promptsmith_template_type DEFAULT 'basic',
  template_variables JSONB DEFAULT '{}'::JSONB,

  -- Versioning
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES promptsmith_prompts(id),

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

-- Prompt evaluations table (for detailed analysis history)
CREATE TABLE promptsmith_prompt_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES promptsmith_prompts(id) ON DELETE CASCADE,

  -- Model and configuration
  model VARCHAR(50) NOT NULL DEFAULT 'promptsmith-v1.0',
  temperature DECIMAL(3,2),
  max_tokens INTEGER,

  -- Response quality metrics (stored as JSONB)
  response_quality JSONB DEFAULT '{
    "overall": 0,
    "clarity": 0,
    "specificity": 0,
    "structure": 0,
    "completeness": 0
  }'::JSONB,

  -- Evaluation context
  evaluation_context JSONB DEFAULT '{
    "timestamp": "",
    "model_version": "1.0.0",
    "evaluation_criteria": ["clarity", "specificity", "structure", "completeness"]
  }'::JSONB,

  -- Processing metrics
  processing_time_ms INTEGER,
  token_usage JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom rules table (for domain-specific rules)
CREATE TABLE promptsmith_custom_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(100) NOT NULL,
  domain promptsmith_domain NOT NULL,

  -- Rule definition
  name VARCHAR(100) NOT NULL,
  pattern TEXT NOT NULL,
  replacement TEXT NOT NULL,
  priority INTEGER DEFAULT 5,
  active BOOLEAN DEFAULT true,

  -- Rule metadata
  description TEXT,
  category promptsmith_rule_category NOT NULL,
  examples JSONB DEFAULT '[]'::JSONB,

  -- Usage statistics
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 0.0000,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates table (for reusable prompt templates)
CREATE TABLE promptsmith_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template metadata
  name VARCHAR(100) NOT NULL,
  domain promptsmith_domain NOT NULL,
  template_type promptsmith_template_type NOT NULL,

  -- Template content
  template_content TEXT NOT NULL,
  system_prompt TEXT,
  variables JSONB DEFAULT '{}'::JSONB,

  -- Template metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Usage and sharing
  is_public BOOLEAN DEFAULT false,
  author_id VARCHAR(100),
  usage_count INTEGER DEFAULT 0,

  -- Quality metrics
  average_score DECIMAL(3,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics and telemetry table
CREATE TABLE promptsmith_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Event information
  event_type VARCHAR(50) NOT NULL,
  user_id VARCHAR(100),
  session_id VARCHAR(100),

  -- Context
  domain promptsmith_domain,
  prompt_id UUID REFERENCES promptsmith_prompts(id),

  -- Metrics
  processing_time INTEGER,
  input_length INTEGER,
  output_length INTEGER,
  quality_improvement DECIMAL(3,2),

  -- Event data
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User feedback table
CREATE TABLE promptsmith_user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  prompt_id UUID REFERENCES promptsmith_prompts(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES promptsmith_prompt_evaluations(id) ON DELETE CASCADE,
  user_id TEXT,

  -- Feedback content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  improvement_suggestions TEXT,
  feedback_type VARCHAR(50),

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_promptsmith_prompts_domain ON promptsmith_prompts(domain);
CREATE INDEX idx_promptsmith_prompts_author ON promptsmith_prompts(author_id);
CREATE INDEX idx_promptsmith_prompts_public ON promptsmith_prompts(is_public) WHERE is_public = true;
CREATE INDEX idx_promptsmith_prompts_created ON promptsmith_prompts(created_at DESC);
CREATE INDEX idx_promptsmith_prompts_tags ON promptsmith_prompts USING gin(tags);
CREATE INDEX idx_promptsmith_prompts_search ON promptsmith_prompts USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || raw_prompt || ' ' || refined_prompt));

CREATE INDEX idx_promptsmith_evaluations_prompt ON promptsmith_prompt_evaluations(prompt_id);
CREATE INDEX idx_promptsmith_evaluations_model ON promptsmith_prompt_evaluations(model);
CREATE INDEX idx_promptsmith_evaluations_created ON promptsmith_prompt_evaluations(created_at DESC);

CREATE INDEX idx_promptsmith_rules_user ON promptsmith_custom_rules(user_id);
CREATE INDEX idx_promptsmith_rules_domain ON promptsmith_custom_rules(domain);
CREATE INDEX idx_promptsmith_rules_active ON promptsmith_custom_rules(active) WHERE active = true;

CREATE INDEX idx_promptsmith_templates_domain ON promptsmith_templates(domain);
CREATE INDEX idx_promptsmith_templates_public ON promptsmith_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_promptsmith_templates_tags ON promptsmith_templates USING gin(tags);

CREATE INDEX idx_promptsmith_analytics_event ON promptsmith_analytics(event_type);
CREATE INDEX idx_promptsmith_analytics_user ON promptsmith_analytics(user_id);
CREATE INDEX idx_promptsmith_analytics_created ON promptsmith_analytics(created_at DESC);

CREATE INDEX idx_promptsmith_feedback_prompt ON promptsmith_user_feedback(prompt_id);
CREATE INDEX idx_promptsmith_feedback_user ON promptsmith_user_feedback(user_id);
CREATE INDEX idx_promptsmith_feedback_created ON promptsmith_user_feedback(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE promptsmith_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptsmith_prompt_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptsmith_custom_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptsmith_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE promptsmith_user_feedback ENABLE ROW LEVEL SECURITY;

-- Public access for public prompts and templates
CREATE POLICY "Public prompts are readable by all" ON promptsmith_prompts
  FOR SELECT USING (is_public = true);

CREATE POLICY "Public templates are readable by all" ON promptsmith_templates
  FOR SELECT USING (is_public = true);

-- Users can manage their own data
CREATE POLICY "Users can manage own prompts" ON promptsmith_prompts
  FOR ALL USING (auth.uid()::text = author_id);

CREATE POLICY "Users can manage own rules" ON promptsmith_custom_rules
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own templates" ON promptsmith_templates
  FOR ALL USING (auth.uid()::text = author_id);

-- Analytics is insert-only for users
CREATE POLICY "Users can insert analytics" ON promptsmith_analytics
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can manage their own feedback
CREATE POLICY "Users can manage own feedback" ON promptsmith_user_feedback
  FOR ALL USING (auth.uid()::text = user_id);

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION promptsmith_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER promptsmith_prompts_updated_at BEFORE UPDATE ON promptsmith_prompts
  FOR EACH ROW EXECUTE FUNCTION promptsmith_update_updated_at_column();

CREATE TRIGGER promptsmith_rules_updated_at BEFORE UPDATE ON promptsmith_custom_rules
  FOR EACH ROW EXECUTE FUNCTION promptsmith_update_updated_at_column();

CREATE TRIGGER promptsmith_templates_updated_at BEFORE UPDATE ON promptsmith_templates
  FOR EACH ROW EXECUTE FUNCTION promptsmith_update_updated_at_column();

-- Sample data for testing (optional - can be run separately)
INSERT INTO promptsmith_prompts (
  name,
  domain,
  raw_prompt,
  refined_prompt,
  system_prompt,
  description,
  tags,
  is_public,
  quality_score
) VALUES
(
  'SQL Query Optimization',
  'sql',
  'make query fast',
  'Optimize the following SQL query for performance by analyzing the execution plan, adding appropriate indexes, and restructuring joins where necessary. Consider query complexity, data volume, and expected response time requirements.',
  'You are an expert SQL database administrator focused on query optimization and performance tuning.',
  'Template for SQL query optimization requests',
  ARRAY['sql', 'performance', 'optimization'],
  true,
  '{"overall": 0.85, "clarity": 0.9, "specificity": 0.8, "structure": 0.85, "completeness": 0.85}'::JSONB
),
(
  'Brand Strategy Development',
  'branding',
  'create brand strategy',
  'Develop a comprehensive brand strategy that includes: brand positioning statement, target audience analysis, competitive differentiation, brand voice and tone guidelines, visual identity direction, and key messaging framework. Consider market trends, cultural context, and long-term brand evolution.',
  'You are a strategic brand consultant with expertise in brand positioning, identity development, and market analysis.',
  'Framework for developing comprehensive brand strategies',
  ARRAY['branding', 'strategy', 'positioning'],
  true,
  '{"overall": 0.88, "clarity": 0.85, "specificity": 0.9, "structure": 0.9, "completeness": 0.87}'::JSONB
);

-- Analytics functions for reporting
CREATE OR REPLACE FUNCTION promptsmith_get_usage_stats(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_prompts BIGINT,
  total_evaluations BIGINT,
  avg_quality_score DECIMAL,
  top_domains TEXT[],
  active_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT p.id)::BIGINT as total_prompts,
    COUNT(e.id)::BIGINT as total_evaluations,
    AVG(CAST(p.quality_score->>'overall' AS DECIMAL)) as avg_quality_score,
    ARRAY_AGG(DISTINCT p.domain::TEXT) as top_domains,
    COUNT(DISTINCT p.author_id)::BIGINT as active_users
  FROM promptsmith_prompts p
  LEFT JOIN promptsmith_prompt_evaluations e ON p.id = e.prompt_id
  WHERE p.created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE promptsmith_prompts IS 'Core prompt storage with versioning and quality metrics';
COMMENT ON TABLE promptsmith_prompt_evaluations IS 'Detailed evaluation history and quality analysis';
COMMENT ON TABLE promptsmith_custom_rules IS 'User-defined domain-specific prompt enhancement rules';
COMMENT ON TABLE promptsmith_templates IS 'Reusable prompt templates and frameworks';
COMMENT ON TABLE promptsmith_analytics IS 'Usage analytics and telemetry data';