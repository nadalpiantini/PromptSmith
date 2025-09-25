# PromptSmith MCP - Sujeto10 Integration Guide

## 🎉 Deployment Complete!

Your PromptSmith MCP server is now successfully deployed and configured for the sujeto10 laboratory environment.

## 📋 Configuration Summary

- **Environment**: sujeto10.supabase.co
- **Database**: All tables with `promptsmith_` prefix
- **Domain**: prompsmith.sujeto10.com
- **Project ID**: nqzhxukuvmdlpewqytpv

## 🔧 Cursor IDE Integration

### Step 1: Install Configuration
Copy the MCP configuration to Cursor:

```bash
cp mcp-config-sujeto10.json ~/.claude/mcp_servers.json
```

### Step 2: Restart Cursor IDE
Close and restart Cursor IDE to load the new MCP server configuration.

### Step 3: Verify Connection
In Cursor, the PromptSmith MCP tools should now be available. You can verify by looking for these tools:
- `process_prompt` - Transform raw prompts into optimized versions
- `evaluate_prompt` - Quality assessment and scoring
- `save_prompt` - Save refined prompts to sujeto10 database
- `search_prompts` - Find and retrieve saved prompts
- `get_prompt` - Retrieve specific prompts by ID
- `compare_prompts` - Side-by-side prompt comparison
- `get_templates` - Access domain-specific templates
- `get_stats` - Analytics and usage statistics

## 🚀 Usage Examples

### Transform a Vibecoding Prompt
```
Use the process_prompt tool with:
- prompt: "make me a sql query for users"
- domain: "sql"
- options: { useTemplate: true }
```

### Evaluate Prompt Quality
```
Use the evaluate_prompt tool with:
- prompt: "SELECT * FROM users WHERE active = true"
- domain: "sql"
```

### Save Refined Prompts
```
Use the save_prompt tool with:
- refined: "Write a SQL query to retrieve all active users..."
- original: "make me a sql query for users"
- metadata: { name: "Active Users Query", domain: "sql" }
```

## 📊 Database Monitoring

Monitor your PromptSmith usage in Supabase:

1. **Go to**: https://supabase.com/dashboard/project/nqzhxukuvmdlpewqytpv
2. **Check Tables**:
   - `promptsmith_prompts` - Saved and refined prompts
   - `promptsmith_prompt_evaluations` - Quality scores and metrics
   - `promptsmith_analytics` - Usage analytics
   - `promptsmith_user_feedback` - User ratings and feedback

## 🎯 Domain-Specific Features

### SQL Domain
- Query optimization and formatting
- Best practices enforcement
- Performance hints and indexing suggestions

### Branding Domain
- Tone and voice consistency
- Brand guideline compliance
- Marketing message optimization

### Cinema Domain
- Screenplay format compliance
- Character development prompts
- Scene description enhancement

### SaaS Domain
- User story optimization
- Feature specification clarity
- Product documentation improvement

### DevOps Domain
- Infrastructure as code best practices
- Deployment script optimization
- Monitoring and alerting setup

## 🔍 Quality Scoring

PromptSmith evaluates prompts across multiple dimensions:
- **Clarity** (0-1): How clear and understandable the prompt is
- **Specificity** (0-1): How specific and detailed the requirements are
- **Structure** (0-1): How well-organized and structured the prompt is
- **Completeness** (0-1): How complete the prompt is for its intended purpose
- **Overall** (0-1): Weighted average of all dimensions

## 🎨 Template System

Access pre-built templates for different use cases:
- **Basic**: Simple prompt structure
- **Chain-of-Thought**: Step-by-step reasoning prompts
- **Few-Shot**: Examples-based prompts
- **Role-Based**: Persona-driven prompts
- **Step-by-Step**: Detailed procedural prompts

## 📈 Analytics and Insights

Track your prompt engineering improvements:
- Usage frequency by domain
- Quality score improvements over time
- Template effectiveness metrics
- User feedback and ratings

## 🛠️ Troubleshooting

### Common Issues

1. **MCP Server Not Found**
   - Verify `mcp-config-sujeto10.json` is in `~/.claude/`
   - Restart Cursor IDE completely
   - Check console logs for connection errors

2. **Database Connection Errors**
   - Verify Supabase credentials are correct
   - Check network connectivity
   - Ensure RLS policies allow access

3. **Tool Execution Errors**
   - Check prompt format and required parameters
   - Verify domain-specific requirements
   - Review error messages in Cursor console

### Getting Help

For technical support with your sujeto10 deployment:
1. Check the main project documentation
2. Review Supabase logs for database issues
3. Monitor the MCP server logs for connection problems

## 🎊 Success!

Your PromptSmith MCP server is now ready for professional prompt engineering in the sujeto10 laboratory environment. Happy optimizing! 🚀

---

*Generated for sujeto10.supabase.co deployment*
*Database: promptsmith_* prefixed tables*
*Environment: Production-ready configuration*