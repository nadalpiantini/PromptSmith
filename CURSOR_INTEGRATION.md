# 🎮 Cursor IDE Integration Guide

Complete guide for integrating PromptSmith MCP with Cursor IDE for enhanced prompt engineering workflows.

## 📋 Prerequisites

✅ PromptSmith MCP Server built and configured
✅ Supabase database setup complete
✅ Environment variables configured in `.env`
✅ Cursor IDE installed ([Download](https://cursor.sh))

## 🚀 Quick Integration (2 minutes)

### Step 1: Install PromptSmith globally
```bash
# From your project directory
npm install -g .

# Or using npx (recommended)
npm run build
```

### Step 2: Configure MCP in Cursor
```bash
# Create Cursor MCP config directory
mkdir -p ~/.claude

# Copy and customize configuration
cp mcp-config.json ~/.claude/mcp_servers.json
```

### Step 3: Update configuration with your credentials
```bash
# Edit the MCP config file
nano ~/.claude/mcp_servers.json

# Update with your actual values:
{
  "mcpServers": {
    "promptsmith": {
      "command": "npx",
      "args": ["promptsmith-mcp"],
      "env": {
        "SUPABASE_URL": "https://YOUR-PROJECT.supabase.co",
        "SUPABASE_ANON_KEY": "YOUR-ANON-KEY-HERE",
        "REDIS_URL": "redis://localhost:6379",
        "TELEMETRY_ENABLED": "true"
      }
    }
  }
}
```

### Step 4: Restart Cursor IDE
1. Close Cursor completely
2. Reopen Cursor
3. Check MCP status in settings

## ✨ Using PromptSmith in Cursor

### 🎯 Process and Optimize Prompts

**Basic Prompt Enhancement:**
```
Use the process_prompt tool to optimize this prompt:

Raw prompt: "make a sql query to get users"
Domain: sql
Tone: professional
```

**Expected output:** Structured SQL prompt with best practices, specific requirements, and examples.

### 📊 Evaluate Prompt Quality

**Quality Assessment:**
```
Use evaluate_prompt to analyze:

Prompt: "Create a React component that shows user data in a table with sorting and filtering capabilities"
Domain: saas
```

**Returns:** Multi-dimensional quality scores (clarity, specificity, structure, completeness) with improvement suggestions.

### 🔍 Compare Prompt Variants

**A/B Testing Prompts:**
```
Use compare_prompts with these variants:

Variants:
1. "Build a user dashboard"
2. "Create a comprehensive user management dashboard with authentication, role management, and activity tracking"
3. "Design and implement a responsive user dashboard featuring real-time data visualization, advanced filtering, and export capabilities"
```

**Returns:** Winner selection with detailed comparison metrics.

### 💾 Save and Reuse Prompts

**Save Optimized Prompts:**
```
Use save_prompt to store:

Prompt: "Design a microservices architecture for an e-commerce platform with focus on scalability, fault tolerance, and observability"
Metadata:
  domain: saas
  description: "E-commerce microservices architecture prompt"
  tags: ["microservices", "architecture", "e-commerce"]
  isPublic: false
```

### 🔎 Search Prompt Library

**Find Existing Solutions:**
```
Use search_prompts to find:

Query: "database optimization"
Domain: sql
Tags: ["performance", "optimization"]
MinScore: 0.8
```

### 🎨 Domain-Specific Workflows

#### SQL Development
```
1. Use process_prompt with domain: sql
   - Raw: "get user orders from last month"
   - Get: Optimized SQL prompt with proper joins, indexing hints, and performance considerations

2. Use validate_prompt for SQL review
   - Check for common SQL antipatterns
   - Get specific recommendations for query optimization
```

#### Brand Development
```
1. Use process_prompt with domain: branding
   - Raw: "create brand guidelines"
   - Get: Structured brand development prompt with strategy, voice, visual identity requirements

2. Use evaluate_prompt for brand consistency
   - Assess brand messaging clarity and alignment
   - Get actionable feedback for brand communication
```

#### Screenplay Writing
```
1. Use process_prompt with domain: cine
   - Raw: "write character introduction scene"
   - Get: Professional screenplay format with character development framework

2. Use search_prompts for screenplay patterns
   - Find proven scene structures and character archetypes
```

#### SaaS Product Development
```
1. Use process_prompt with domain: saas
   - Raw: "build user onboarding flow"
   - Get: UX-optimized prompt with user journey mapping and success metrics

2. Use compare_prompts for feature variations
   - Test different feature specification approaches
   - Get data-driven feature prioritization insights
```

#### DevOps Automation
```
1. Use process_prompt with domain: devops
   - Raw: "setup ci/cd pipeline"
   - Get: Infrastructure-as-code prompt with security and reliability best practices

2. Use get_stats for deployment insights
   - Monitor optimization success rates
   - Track infrastructure automation patterns
```

## 🔧 Advanced Configuration

### Environment Customization
```bash
# In your project .env or Cursor config
APP_VERSION=1.0.0
NODE_ENV=production
TELEMETRY_ENABLED=true
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info

# Performance tuning
CACHE_TTL_DEFAULT=3600
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Custom Domain Rules
Add your own domain-specific enhancement rules by extending the rule engines in `src/rules/`.

### Template Customization
Create custom Liquid templates for your specific use cases in the template system.

## 📈 Workflow Examples

### 1. **Feature Development Workflow**
```
Step 1: Use process_prompt to create detailed feature specification
Step 2: Use evaluate_prompt to assess specification quality
Step 3: Use save_prompt to store refined specification
Step 4: Use search_prompts to find similar patterns for implementation guidance
```

### 2. **Code Review Enhancement**
```
Step 1: Use process_prompt to create comprehensive code review checklist
Step 2: Use compare_prompts to test different review approaches
Step 3: Use validate_prompt to ensure review completeness
```

### 3. **Documentation Creation**
```
Step 1: Use process_prompt with domain-specific context
Step 2: Use evaluate_prompt for clarity and completeness assessment
Step 3: Use save_prompt to build documentation template library
```

## 🚨 Troubleshooting

### MCP Server Not Appearing in Cursor
1. **Check configuration path:** `~/.claude/mcp_servers.json`
2. **Verify JSON format:** Use JSON validator
3. **Check environment variables:** Ensure SUPABASE credentials are correct
4. **Restart Cursor:** Complete restart required after config changes

### "Connection Failed" Errors
1. **Test server directly:**
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx promptsmith-mcp
   ```
2. **Check Supabase connection:** Verify URL and API key
3. **Check Redis (optional):** Ensure Redis is running if configured

### Tools Not Working
1. **Check server logs:** Look for error messages in Cursor's output panel
2. **Verify database schema:** Ensure SQL schema is properly executed in Supabase
3. **Test individual tools:** Use MCP protocol directly for debugging

### Performance Issues
1. **Enable Redis caching:** Configure REDIS_URL for faster responses
2. **Optimize database queries:** Check Supabase performance monitoring
3. **Adjust timeouts:** Increase timeout values for complex prompts

## 🎯 Pro Tips

### 🚀 **Productivity Boosts**
- **Save frequently used prompts** with descriptive tags for quick retrieval
- **Use domain-specific processing** for specialized accuracy
- **Compare variations** before finalizing important prompts
- **Build prompt libraries** for team collaboration

### 📊 **Quality Optimization**
- **Always evaluate** before saving important prompts
- **Target >0.8 quality scores** for production prompts
- **Use validation** to catch common prompt antipatterns
- **Review suggestions** for continuous improvement

### 🔄 **Workflow Integration**
- **Combine with Cursor's AI features** for enhanced development
- **Use in code reviews** for better prompt engineering
- **Integrate with project documentation** for consistency
- **Export metrics** for team performance tracking

## 📞 Support & Community

- **Documentation:** See `/docs` directory for detailed guides
- **Issues:** Report bugs and feature requests on GitHub
- **Updates:** Follow semantic versioning for compatibility

---

**🎉 You're now ready to supercharge your prompt engineering with PromptSmith MCP in Cursor IDE!**

Transform your vibecoding into structured, optimized prompts with domain-specific intelligence and quality scoring. Happy coding! 🚀