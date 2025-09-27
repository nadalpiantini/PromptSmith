-- URGENT DATABASE FIX for PromptSmith
-- Execute this SQL in Supabase Dashboard -> SQL Editor
-- This will fix the "promptsmith_user_feedback" table relationship error

-- ===================================================================
-- STEP 1: Create Required Functions (if not already exists)
-- ===================================================================

-- Create the exec_sql function for migrations
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- ===================================================================
-- STEP 2: Create Missing promptsmith_user_feedback Table
-- ===================================================================

-- Create the missing user feedback table
CREATE TABLE IF NOT EXISTS promptsmith_user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References (THESE ARE THE CRITICAL FOREIGN KEYS)
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

-- Create indexes for the feedback table
CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_prompt ON promptsmith_user_feedback(prompt_id);
CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_user ON promptsmith_user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_created ON promptsmith_user_feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE promptsmith_user_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user feedback
CREATE POLICY IF NOT EXISTS "Users can manage own feedback" ON promptsmith_user_feedback
  FOR ALL USING (auth.uid()::text = user_id);

-- ===================================================================
-- STEP 3: Add Missing Domain Enum Values
-- ===================================================================

-- Add mobile domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'mobile';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Already exists
    END;
END $$;

-- Add web domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'web';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add backend domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'backend';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add frontend domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'frontend';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add ai domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'ai';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add gaming domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'gaming';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add crypto domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'crypto';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add education domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'education';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add healthcare domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'healthcare';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add finance domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'finance';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Add legal domain
DO $$
BEGIN
    BEGIN
        ALTER TYPE promptsmith_domain ADD VALUE 'legal';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- ===================================================================
-- STEP 4: Verification Queries
-- ===================================================================

-- Verify all tables exist
SELECT 'TABLE CHECK:' as status, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'promptsmith_%'
ORDER BY table_name;

-- Verify foreign key relationships exist
SELECT 
  'FOREIGN KEY CHECK:' as status,
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'promptsmith_user_feedback';

-- Verify all domain enum values exist
SELECT 'DOMAIN ENUM CHECK:' as status, unnest(enum_range(NULL::promptsmith_domain)) as available_domains 
ORDER BY available_domains;

-- Test the relationship query that was failing
SELECT 'RELATIONSHIP TEST:' as status, p.id, p.name, uf.rating
FROM promptsmith_prompts p
LEFT JOIN promptsmith_user_feedback uf ON p.id = uf.prompt_id
LIMIT 1;

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================
SELECT '🎉 DATABASE SETUP COMPLETE! 🎉' as message,
       'Run: node scripts/verify-database-setup.js to confirm all tests pass' as next_step;