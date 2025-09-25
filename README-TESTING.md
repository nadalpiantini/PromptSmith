# 🧪 PromptSmith MCP - Complete Testing Guide

## 🚀 3 Ways to Invoke PromptSmith from Claude Code

Your PromptSmith MCP server can be invoked in **3 different ways** directly from Claude Code, giving you maximum flexibility for testing and usage.

---

## 📋 Quick Start

### Prerequisites
- PromptSmith MCP built successfully (`npm run build`)
- Sujeto10 Supabase credentials configured in `.env`
- All test scripts are executable (`chmod +x` already applied)

### Environment Check
```bash
# Verify your setup
node -e "console.log('Node.js:', process.version)"
ls -la dist/cli.js  # Should show executable PromptSmith server
cat .env | grep SUPABASE_URL  # Should show sujeto10 URL
```

---

## 🎯 Option 1: Direct JSON-RPC Interface

**File**: `test-promptsmith-direct.cjs`
**Best for**: Interactive testing, exploring all features, learning MCP protocol

### Usage
```bash
node test-promptsmith-direct.cjs
```

### Features
- **Interactive menu** with all 8 MCP tools
- **Real-time JSON-RPC** communication display
- **Step-by-step guidance** for each tool
- **Error handling** and debugging information

### Example Session
```
🎯 PromptSmith MCP Test Menu:
=============================
1. List available tools
2. Process a prompt (SQL domain)
3. Process a prompt (Branding domain)
...
🎮 Choose an option (0-10): 2

Enter SQL prompt to optimize: make me a query for users
📤 Sending request: {"jsonrpc":"2.0","id":1,"method":"tools/call"...}
📥 Response received: {"result":{"refined":"Write a comprehensive SQL query..."}}
```

---

## 🔧 Option 2: Wrapper API

**File**: `promptsmith-wrapper.cjs`
**Best for**: Programmatic access, integration with other scripts, clean API

### Usage

#### As a Module
```javascript
const PromptSmithWrapper = require('./promptsmith-wrapper.cjs');

const ps = new PromptSmithWrapper();

// Simple usage
const result = await ps.processPrompt('make sql query', 'sql');
console.log(result.refined);

// Full workflow
const workflow = await ps.processAndSave(
  'create auth system',
  'saas',
  { name: 'Auth System' }
);

await ps.close();
```

#### CLI Demo Mode
```bash
node promptsmith-wrapper.cjs
```

### Available Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `processPrompt(raw, domain, tone)` | Transform prompts | `await ps.processPrompt('make query', 'sql')` |
| `evaluatePrompt(prompt, domain)` | Quality assessment | `await ps.evaluatePrompt('SELECT * FROM users', 'sql')` |
| `savePrompt(refined, original, metadata, score)` | Save to database | `await ps.savePrompt(refined, original, meta, score)` |
| `searchPrompts(query, domain, limit)` | Search database | `await ps.searchPrompts('auth', 'saas', 10)` |
| `optimizeSQL(prompt)` | Quick SQL optimization | `await ps.optimizeSQL('make query')` |
| `optimizeBranding(prompt)` | Quick branding optimization | `await ps.optimizeBranding('create brand')` |
| `processAndSave(raw, domain, metadata)` | Complete workflow | `await ps.processAndSave('prompt', 'domain', {name: 'Test'})` |

---

## 🎮 Option 3: Individual CLI Scripts

**Directory**: `scripts/`
**Best for**: Specific testing, debugging individual features, automation

### Available Scripts

#### 1. 🔧 Connectivity Test
```bash
node scripts/test-connectivity.cjs
```
- Tests server startup and tools availability
- Quick health check for PromptSmith MCP

#### 2. 🎯 Process Prompt Test
```bash
node scripts/test-process-prompt.cjs "make sql query" "sql"
node scripts/test-process-prompt.cjs "create brand strategy" "branding"
node scripts/test-process-prompt.cjs "write user story" "saas"
```
- Tests prompt processing with visual quality scores
- Supports all domains: `sql`, `branding`, `cine`, `saas`, `devops`, `general`

#### 3. 📊 Evaluate Prompt Test
```bash
node scripts/test-evaluate.cjs "SELECT * FROM users WHERE active = true" "sql"
node scripts/test-evaluate.cjs "Our brand represents innovation" "branding"
```
- Quality assessment with detailed scoring
- Visual quality bars and improvement suggestions

#### 4. 💾 Save Prompt Test
```bash
node scripts/test-save.cjs "Optimized prompt text" "Original prompt"
```
- Tests saving to sujeto10 Supabase database
- Verifies database connectivity and schema

#### 5. 🔍 Search Prompt Test
```bash
node scripts/test-search.cjs "sql" "sql"
node scripts/test-search.cjs "auth"
node scripts/test-search.cjs "" "branding"  # All branding prompts
```
- Search saved prompts in database
- Filter by query and/or domain

#### 6. 🔄 Full Workflow Test
```bash
node scripts/test-full-workflow.cjs "create authentication system" "saas"
node scripts/test-full-workflow.cjs "optimize database query" "sql"
```
- Complete end-to-end workflow: Process → Evaluate → Save → Search
- Comprehensive integration test

---

## 🎨 Domain-Specific Examples

### SQL Domain
```bash
# Process SQL prompts
node scripts/test-process-prompt.cjs "get user data" "sql"
node scripts/test-process-prompt.cjs "optimize slow query" "sql"
node scripts/test-process-prompt.cjs "create user table" "sql"
```

### Branding Domain
```bash
# Process branding prompts
node scripts/test-process-prompt.cjs "create brand voice" "branding"
node scripts/test-process-prompt.cjs "define brand values" "branding"
node scripts/test-process-prompt.cjs "write brand story" "branding"
```

### SaaS Domain
```bash
# Process SaaS prompts
node scripts/test-process-prompt.cjs "write user story" "saas"
node scripts/test-process-prompt.cjs "define product requirements" "saas"
node scripts/test-process-prompt.cjs "create feature spec" "saas"
```

### Cinema Domain
```bash
# Process cinema prompts
node scripts/test-process-prompt.cjs "write dialogue scene" "cine"
node scripts/test-process-prompt.cjs "describe action sequence" "cine"
node scripts/test-process-prompt.cjs "develop character arc" "cine"
```

### DevOps Domain
```bash
# Process DevOps prompts
node scripts/test-process-prompt.cjs "create deployment script" "devops"
node scripts/test-process-prompt.cjs "setup monitoring" "devops"
node scripts/test-process-prompt.cjs "configure CI/CD" "devops"
```

---

## 🧪 Testing Strategy

### 1. **Development Testing**
```bash
# Basic functionality
node scripts/test-connectivity.cjs
node scripts/test-process-prompt.cjs "test prompt" "general"
```

### 2. **Feature Testing**
```bash
# Test each major feature
node scripts/test-process-prompt.cjs "your prompt" "domain"
node scripts/test-evaluate.cjs "your prompt" "domain"
node scripts/test-save.cjs "refined" "original"
node scripts/test-search.cjs "search term"
```

### 3. **Integration Testing**
```bash
# End-to-end workflow
node scripts/test-full-workflow.cjs "complex prompt" "domain"
```

### 4. **Interactive Testing**
```bash
# Explore all features
node test-promptsmith-direct.cjs
```

### 5. **API Testing**
```bash
# Test programmatic access
node promptsmith-wrapper.cjs
```

---

## 🐛 Troubleshooting

### Common Issues

#### ❌ "Server startup timeout"
```bash
# Check if server starts manually
node dist/cli.js
# Should show: "PromptSmith MCP Server is ready!"
```

#### ❌ "Database connection failed"
```bash
# Verify sujeto10 credentials
cat .env | grep SUPABASE_URL
# Should show: https://nqzhxukuvmdlpewqytpv.supabase.co
```

#### ❌ "No prompts found"
```bash
# Save a test prompt first
node scripts/test-save.cjs "Test prompt" "Original"
# Then search
node scripts/test-search.cjs "test"
```

#### ❌ "Permission denied"
```bash
# Fix permissions
chmod +x test-promptsmith-direct.cjs
chmod +x promptsmith-wrapper.cjs
chmod +x scripts/*.cjs
```

### Debug Mode
For detailed debugging, check server stderr output in any test script.

---

## 📊 Quality Scoring

PromptSmith evaluates prompts across 5 dimensions:

| Dimension | Description | Weight |
|-----------|-------------|--------|
| **Clarity** | How clear and understandable | 20% |
| **Specificity** | Level of detail and precision | 25% |
| **Structure** | Organization and format | 20% |
| **Completeness** | Coverage of requirements | 25% |
| **Overall** | Weighted composite score | 10% |

### Score Interpretation
- **90-100%**: 🌟 Excellent - Ready to use
- **70-89%**: ✅ Good - Minor improvements possible
- **50-69%**: ⚠️ Fair - Significant improvements needed
- **0-49%**: ❌ Poor - Major revision required

---

## 🎉 Success Verification

### All tests should show:
- ✅ Server starts successfully
- ✅ JSON-RPC communication works
- ✅ All 8 MCP tools respond correctly
- ✅ Database connectivity to sujeto10
- ✅ Quality scoring calculations
- ✅ Search and retrieval functions

### Expected Output Pattern:
```
🚀 Starting PromptSmith server...
✅ Server ready!
📤 Sending request...
📥 Response received:
✅ [Feature] test PASSED!
🎊 Test completed successfully!
```

---

## 🚀 Next Steps

1. **Try all 3 options** to find your preferred workflow
2. **Test with your real prompts** across different domains
3. **Build integrations** using the wrapper API
4. **Monitor your database** at sujeto10.supabase.co
5. **Use in Cursor IDE** with the provided configuration

Your PromptSmith MCP is now fully functional and ready for professional prompt engineering! 🎯