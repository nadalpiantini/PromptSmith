# Database Relationship Error Resolution

## Problem Diagnosed

**Current Error:** 
```
"Could not find a relationship between 'promptsmith_prompts' and 'promptsmith_user_feedback' in the schema cache"
```

**Root Cause:**
1. **Missing Table**: `promptsmith_user_feedback` table does NOT exist in the database
2. **Incomplete Domain Enum**: Missing 11 domain values (mobile, web, backend, frontend, ai, gaming, crypto, education, healthcare, finance, legal)
3. **Functions Missing**: Required database functions don't exist

## Current Database State (Verified)

✅ **Working:**
- 5 out of 6 tables exist (`promptsmith_prompts`, `promptsmith_prompt_evaluations`, `promptsmith_custom_rules`, `promptsmith_templates`, `promptsmith_analytics`)
- Basic CRUD operations work
- All required functions exist (`exec_sql`, `update_prompt_usage`, `calculate_quality_score`, `set_config`)

❌ **Broken:**
- `promptsmith_user_feedback` table is completely missing
- Domain enum only has 6 values instead of 17
- Relationship queries fail because target table doesn't exist

## Solution: Manual Database Setup

Since automated migrations fail due to permission/function issues, manual setup via Supabase Dashboard is required.

### Step 1: Execute SQL Fix

**File:** `EXECUTE-IN-SUPABASE-DASHBOARD.sql`

**Instructions:**
1. Go to your Supabase Dashboard
2. Navigate to: **SQL Editor**  
3. Create **New Query**
4. Copy and paste the entire content of `EXECUTE-IN-SUPABASE-DASHBOARD.sql`
5. Click **Run** to execute

This will:
- Create the missing `promptsmith_user_feedback` table with proper foreign keys
- Add all missing domain enum values
- Set up proper indexes and RLS policies
- Run verification queries

### Step 2: Verify Fix

Run the verification script:
```bash
node scripts/verify-database-setup.js
```

**Expected Result:** All 29 tests should pass.

### Step 3: Test Relationship Query

The problematic query should now work:
```javascript
const { data, error } = await supabase
  .from('promptsmith_prompts')
  .select('*, promptsmith_user_feedback(rating)')
  .limit(1);
```

## What the Fix Does

### Creates Missing Table
```sql
CREATE TABLE promptsmith_user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES promptsmith_prompts(id) ON DELETE CASCADE,  -- KEY RELATIONSHIP
  evaluation_id UUID REFERENCES promptsmith_prompt_evaluations(id) ON DELETE CASCADE,
  user_id TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  improvement_suggestions TEXT,
  feedback_type VARCHAR(50),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Adds Missing Domains
Adds all 11 missing domain enum values:
- mobile, web, backend, frontend, ai, gaming, crypto, education, healthcare, finance, legal

### Sets Up Proper Relationships
- Foreign key: `prompt_id → promptsmith_prompts.id`
- Foreign key: `evaluation_id → promptsmith_prompt_evaluations.id`
- Indexes for performance
- RLS policies for security

## Code Updates Made

### Domain Mapper Updated
**File:** `src/utils/domain-mapper.ts`

**Changes:**
- Updated `ValidDatabaseDomain` type to include all 17 domains
- Changed mappings to use direct domain matches instead of fallbacks
- All domains now map to themselves with 100% confidence

### Verification Scripts Created
1. **`scripts/verify-database-setup.js`** - Complete verification suite
2. **`scripts/manual-database-setup.js`** - Detailed setup instructions  
3. **`scripts/fix-missing-components.js`** - Automated fix (requires `exec_sql` function)

## Testing After Fix

### 1. Run Full Verification
```bash
node scripts/verify-database-setup.js
```

### 2. Test MCP Server
```bash
node scripts/test-connectivity.cjs
```

### 3. Test Relationship Query
```bash
# This should now work without errors
npm test -- --testNamePattern="relationship"
```

## Troubleshooting

If the fix doesn't work:

1. **Check SQL Execution Logs** in Supabase Dashboard for any errors
2. **Verify Permissions** - ensure you have admin access to the Supabase project
3. **Check RLS Policies** - may need to temporarily disable for testing
4. **Verify Project URL/Keys** - ensure environment variables are correct

## Expected Outcome

After executing the SQL fix:

- ✅ All 6 `promptsmith_*` tables exist
- ✅ All 17 domain enum values supported  
- ✅ Relationship queries work without errors
- ✅ Foreign key constraints properly enforced
- ✅ Full MCP server functionality restored

The error `"Could not find a relationship between 'promptsmith_prompts' and 'promptsmith_user_feedback' in the schema cache"` should be completely resolved.

## Files Involved

- **`EXECUTE-IN-SUPABASE-DASHBOARD.sql`** - Main fix SQL (execute in Supabase)
- **`src/utils/domain-mapper.ts`** - Updated domain mappings
- **`scripts/verify-database-setup.js`** - Verification script
- **`DATABASE-RELATIONSHIP-FIX.md`** - This documentation

Execute the SQL file in Supabase Dashboard, then run the verification script to confirm the fix.