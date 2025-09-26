-- Temporary RLS policy to allow anonymous inserts for testing
-- This enables the MCP server to insert prompts without authentication

-- Drop existing restrictive policies temporarily
DROP POLICY IF EXISTS "Users can manage own prompts" ON promptsmith_prompts;
DROP POLICY IF EXISTS "Public prompts are readable by all" ON promptsmith_prompts;

-- Create permissive policies for testing
CREATE POLICY "Allow anonymous inserts for testing" ON promptsmith_prompts
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous selects for testing" ON promptsmith_prompts
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous updates for testing" ON promptsmith_prompts
  FOR UPDATE TO anon USING (true);

-- Note: In production, you should implement proper user authentication
-- and restrict these policies based on authenticated users