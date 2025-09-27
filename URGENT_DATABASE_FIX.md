# 🚨 URGENT DATABASE FIX REQUIRED

## Status: CRITICAL - Production Blocker
**Issue**: Missing `promptsmith_user_feedback` table and 11 domain enum values

## Quick Fix (5 minutes)

### Step 1: Copy this SQL
```sql
-- Create missing user feedback table
CREATE TABLE IF NOT EXISTS promptsmith_user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES promptsmith_prompts(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES promptsmith_prompt_evaluations(id) ON DELETE CASCADE,
  user_id TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  improvement_suggestions TEXT,
  feedback_type VARCHAR(50),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_prompt ON promptsmith_user_feedback(prompt_id);
CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_user ON promptsmith_user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_promptsmith_feedback_created ON promptsmith_user_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE promptsmith_user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own feedback" ON promptsmith_user_feedback
  FOR ALL USING (auth.uid()::text = user_id);

-- Add missing domains
ALTER TYPE promptsmith_domain ADD VALUE 'mobile';
ALTER TYPE promptsmith_domain ADD VALUE 'web';
ALTER TYPE promptsmith_domain ADD VALUE 'backend';
ALTER TYPE promptsmith_domain ADD VALUE 'frontend';
ALTER TYPE promptsmith_domain ADD VALUE 'ai';
ALTER TYPE promptsmith_domain ADD VALUE 'gaming';
ALTER TYPE promptsmith_domain ADD VALUE 'crypto';
ALTER TYPE promptsmith_domain ADD VALUE 'education';
ALTER TYPE promptsmith_domain ADD VALUE 'healthcare';
ALTER TYPE promptsmith_domain ADD VALUE 'finance';
ALTER TYPE promptsmith_domain ADD VALUE 'legal';
```

### Step 2: Execute in Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** 
4. Paste the SQL above
5. Click **Run**

### Step 3: Verify Success
After running the SQL, you should see:
- ✅ Table created successfully
- ✅ 11 new domain values added
- ✅ All indexes created

## Verification Command
```bash
node scripts/verify-database-setup.js
```

**Expected Result**: All 29 tests should pass

---
*This fixes the core production blocker. The automated fixes will continue after this manual step.*