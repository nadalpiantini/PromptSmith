# PromptSmith MCP Server v1.0.0

> **Transform "vibecoding" into production-ready prompts with AI-powered optimization**

[![GitHub Release](https://img.shields.io/github/v/release/nadalpiantini/PromptSmith)](https://github.com/nadalpiantini/PromptSmith/releases)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## 🎯 Overview

PromptSmith is an intelligent **Model Context Protocol (MCP) server** that transforms raw, unstructured prompts ("vibecoding") into optimized, structured instructions with domain-specific intelligence. It features a **hybrid architecture** with both CLI and MCP server modes, providing universal access to advanced prompt engineering capabilities.

### The Problem It Solves

- **Vibecoding inefficiency**: Raw prompts like "create login form" produce inconsistent results
- **Domain expertise gap**: Generic prompts lack specialized knowledge for 16+ domains
- **Quality inconsistency**: No systematic way to measure and improve prompt effectiveness
- **Learning curve**: Manual prompt engineering requires extensive expertise
- **Template reuse**: No easy way to save and reuse optimized prompts across projects

### The Solution

```bash
# CLI Mode - Global command available anywhere
pimpprompt "create login form"              # Auto-detect domain
pimpprompt "SELECT users" --domain sql      # Force SQL domain  
pimpprompt --list-templates                 # Browse saved templates
pimpprompt --search "auth"                  # Find auth templates

# Result: Visual display of improved prompt + save to templates
```

```typescript
// MCP Mode - Integrated in Cursor IDE
process_prompt({
  raw: "create login form",
  domain: "frontend" 
})
// Result: Complete optimized prompt with quality scores
```

## ✨ Key Features

### 🧠 **Domain Intelligence (16 Specialized Domains)**
- **Frontend**: React, Vue, Angular, responsive design patterns
- **Backend**: APIs, databases, microservices, authentication
- **Mobile**: iOS, Android, React Native, cross-platform
- **AI/ML**: Model training, inference, data pipelines
- **DevOps**: Infrastructure, deployment, monitoring, CI/CD
- **SQL**: Database design, query optimization, migrations
- **And 10 more**: SaaS, Branding, Cinema, Game Dev, Crypto, etc.

### 📊 **Multi-Dimensional Quality Scoring**
- **4 Core Metrics**: Clarity, Specificity, Structure, Completeness
- **Visual Feedback**: See exactly what was improved and why
- **Learning System**: Templates improve over time with usage analytics

### 🔄 **Template System**
- **Global Templates**: Save optimized prompts for reuse across projects
- **Smart Search**: Find relevant templates by keywords and domain
- **Version Control**: Track template evolution and effectiveness
- **Cross-Project**: Use templates in any Cursor window or CLI session

### 🛠️ **Hybrid Architecture**
- **CLI Mode**: `pimpprompt` command available globally on your system
- **MCP Server**: Deep integration with Cursor IDE and other MCP clients
- **Production Database**: Real Supabase persistence at sujeto10.com
- **Fallback System**: Works even when network/database unavailable

## 🚀 Installation & Setup (2 minutes)

### 1. Clone and Install

```bash
# Clone the repository  
git clone https://github.com/nadalpiantini/PromptSmith.git
cd PromptSmith

# Install dependencies and build
npm install
npm run build

# Install globally (creates 'pimpprompt' command)
npm link

# Verify installation
pimpprompt --help
```

### 2. First Use - CLI Mode

```bash
# Process any prompt - domain auto-detected
pimpprompt "create login form"

# Force specific domain
pimpprompt "SELECT users" --domain sql

# Browse available templates
pimpprompt --list-templates

# Search for specific templates
pimpprompt --search "authentication"
```

**Result**: You'll see the improved prompt visually displayed for learning, plus it gets saved as a reusable template.

### 3. MCP Integration for Cursor IDE

#### Option A: Use Pre-configured File
```bash
# Copy the ready-to-use configuration
cp cursor-mcp-config.json ~/.cursor/mcp-settings.json
```

#### Option B: Manual Configuration
Add to your Cursor settings (`Cmd+Shift+P` → "Preferences: Open User Settings (JSON)"):

```json
{
  "mcpServers": {
    "promptsmith": {
      "command": "node",
      "args": ["dist/mcp-server.js"],
      "cwd": "/path/to/your/PromptSmith",
      "env": {
        "SUPABASE_URL": "https://nqzhxukuvmdlpewqytpv.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xemh4dWt1dm1kbHBld3F5dHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3ODYwNzMsImV4cCI6MjA0MjM2MjA3M30.xLSRRy7FNMHJd9F39R85dU7qOzHLQxnMO0zQfqRZ1Ho",
        "NODE_ENV": "production",
        "TELEMETRY_ENABLED": "false"
      }
    }
  }
}
```

**Important**: Replace `/path/to/your/PromptSmith` with the actual path where you cloned PromptSmith.

### 4. Restart Cursor

Close Cursor completely and reopen it. The MCP tools will now be available.

### 5. Test Integration

In Cursor's chat, try:
```
Use the process_prompt tool to optimize this prompt: "create a user table"
```

You should see PromptSmith transform it into a professional, detailed prompt with quality scores.

## 🔧 Usage Examples

### CLI Examples

```bash
# Auto-detect domain (frontend detected)
pimpprompt "responsive login form"

# Result:
# 📱 Domain detected: FRONTEND
# ✨ Improved Prompt:
# Create a responsive login form component with the following specifications:
# - Mobile-first design with proper touch targets
# - Form validation with real-time feedback
# - Accessibility features (ARIA labels, keyboard navigation)
# - Clean, modern UI with loading states
# [Saved as template: "responsive-login-form-001"]

# Force specific domain
pimpprompt "user authentication" --domain backend

# Browse templates
pimpprompt --list-templates
# Result: Shows all saved templates with domains and quality scores

# Search templates
pimpprompt --search "auth"
# Result: Shows auth-related templates ranked by relevance
```

### MCP Examples (in Cursor)

```typescript
// Basic prompt processing
process_prompt({
  raw: "need api for users",
  domain: "backend"
})

// Advanced with custom tone
process_prompt({
  raw: "movie script scene", 
  domain: "cine",
  tone: "dramatic"
})

// Search existing templates
search_prompts({
  query: "authentication",
  domain: "backend",
  limit: 5
})

// Get usage statistics
get_stats()
```

## 🛠️ MCP Tools Reference

| Tool | Purpose | Example |
|------|---------|---------|
| **`process_prompt`** | Transform raw prompts into optimized versions | `process_prompt({ raw: "login form", domain: "frontend" })` |
| **`evaluate_prompt`** | Analyze prompt quality with detailed scoring | `evaluate_prompt({ prompt: "Create a React component" })` |
| **`compare_prompts`** | A/B test multiple prompt variants | `compare_prompts({ variants: ["prompt1", "prompt2"] })` |
| **`save_prompt`** | Store prompts as reusable templates | `save_prompt({ prompt: "...", metadata: {...} })` |
| **`search_prompts`** | Find templates by keywords and domain | `search_prompts({ query: "auth", domain: "backend" })` |
| **`get_prompt`** | Retrieve specific template by ID | `get_prompt({ id: "template-123" })` |
| **`get_stats`** | System usage and performance metrics | `get_stats()` |
| **`validate_prompt`** | Check for common prompt issues | `validate_prompt({ prompt: "..." })` |

## 🎨 Domain Specializations

### 🗄️ SQL Domain
**Transforms**: `"bonita tabla"` → `"well-structured PostgreSQL schema"`

**Enhancements**:
- Database-specific terminology and best practices
- Index optimization suggestions
- Foreign key relationships
- Sample data generation
- Performance considerations

### 🎬 Cinema Domain
**Transforms**: `"escena dramática"` → `"professional screenplay scene"`

**Enhancements**:
- Industry-standard formatting (Final Draft compatible)
- Genre-appropriate tone and pacing
- Character development techniques
- Visual storytelling elements

### 💼 SaaS Domain
**Transforms**: `"feature para users"` → `"user story with acceptance criteria"`

**Enhancements**:
- Product management terminology
- User experience considerations
- Technical implementation notes
- Business value justification

### 🚀 DevOps Domain
**Transforms**: `"deploy script"` → `"production deployment pipeline"`

**Enhancements**:
- Infrastructure as code patterns
- Security best practices
- Monitoring and alerting
- Rollback strategies

### 🎯 Branding Domain
**Transforms**: `"marketing copy"` → `"brand-aligned messaging"`

**Enhancements**:
- Brand voice consistency
- Target audience specification
- Emotional resonance techniques
- Call-to-action optimization

## 📊 Quality Scoring System

PromptSmith evaluates prompts across four weighted dimensions:

### Clarity (Weight: 25%)
- **Measures**: Language precision, ambiguity reduction
- **Good**: "Generate a PostgreSQL table for customer orders"
- **Poor**: "Make something for data stuff"

### Specificity (Weight: 30%)
- **Measures**: Technical detail, requirement completeness
- **Good**: "Include columns: id, customer_id, order_date, total_amount"
- **Poor**: "Add some columns"

### Structure (Weight: 25%)
- **Measures**: Logical organization, readability
- **Good**: Numbered steps, clear sections, proper formatting
- **Poor**: Wall of text, no organization

### Completeness (Weight: 20%)
- **Measures**: Coverage of requirements, missing elements
- **Good**: Includes inputs, outputs, constraints, examples
- **Poor**: Incomplete requirements, unclear success criteria

**Overall Score**: Weighted average with domain-specific adjustments

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PromptSmith MCP Server                       │
├─────────────────────────────────────────────────────────────────┤
│  MCP Tools Layer (8 tools)                                     │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐    │
│  │ process     │ evaluate    │ compare     │ save        │    │
│  │ validate    │ search      │ get_prompt  │ get_stats   │    │
│  └─────────────┴─────────────┴─────────────┴─────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  Core Processing Pipeline                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Analyzer → Optimizer → Validator → Scorer              │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  Domain Rules Engine                                            │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐          │
│  │   SQL   │ Branding│ Cinema  │  SaaS   │ DevOps  │          │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘          │
├─────────────────────────────────────────────────────────────────┤
│  Services Layer                                                 │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐    │
│  │ Store       │ Cache       │ Telemetry   │ Templates   │    │
│  │ (Supabase)  │ (Redis)     │ (Analytics) │ (Liquid)    │    │
│  └─────────────┴─────────────┴─────────────┴─────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 📈 Performance & Caching

- **Response Time**: < 500ms (cached), < 2s (fresh processing)
- **Caching Strategy**: Redis-based with quality-dependent TTL
- **Rate Limiting**: Configurable per-user limits
- **Telemetry**: Real-time performance monitoring

## 🔧 Advanced Usage

### Custom Domain Rules
```typescript
// Extend with custom domain
const customRules = {
  domain: 'legal',
  patterns: [
    { trigger: /contract/, enhancement: 'Add legal disclaimers' },
    { trigger: /terms/, enhancement: 'Include jurisdiction clauses' }
  ]
};
```

### Template Generation
```typescript
// Generate reusable templates
process_prompt({
  raw: "Create user authentication system",
  domain: "saas",
  variables: {
    auth_method: "{{auth_type}}",
    user_model: "{{user_schema}}"
  }
})
```

### A/B Testing Workflows
```typescript
// Compare prompt variants
compare_prompts({
  variants: [
    "Generate a SQL table for users",
    "Create a PostgreSQL user authentication schema",
    "Design a scalable user database with security considerations"
  ]
})
```

## 📚 Documentation

- **[API Reference](./docs/API.md)** - Complete MCP tools documentation
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System design and components
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production setup and scaling
- **[Development Guide](./docs/DEVELOPMENT.md)** - Contributing and extending

## 🚀 Deployment Options

### Docker (Recommended)
```bash
docker run -d \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_KEY=your-key \
  -p 3000:3000 \
  promptsmith/promptsmith-mcp
```

### Node.js
```bash
npm install -g promptsmith-mcp
promptsmith-mcp --port 3000
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: promptsmith-mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: promptsmith-mcp
  template:
    spec:
      containers:
      - name: promptsmith-mcp
        image: promptsmith/promptsmith-mcp:latest
        env:
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: promptsmith-secrets
              key: supabase-url
```

## 🤝 Contributing

We welcome contributions! Please see [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for guidelines.

### Quick Start for Contributors
```bash
git clone https://github.com/promptsmith/promptsmith-mcp.git
cd promptsmith-mcp
npm install
npm run test
npm run dev
```

### Areas for Contribution
- **New Domains**: Add specialized rule sets for new industries
- **Quality Metrics**: Enhance scoring algorithms
- **Templates**: Contribute Liquid templates for common patterns
- **Integrations**: MCP client libraries for other IDEs

## 📊 Roadmap

- **✅ Phase 1**: Core MCP server with 8 tools (Complete)
- **✅ Phase 2**: Domain-specific rules and quality scoring (Complete)
- **🔄 Phase 3**: Learning system and A/B testing (In Progress)
- **⏳ Phase 4**: Public API and community templates (Planned)
- **⏳ Phase 5**: Multi-language support and advanced analytics (Planned)

## 🔍 Comparison

| Feature | PromptSmith MCP | Raw Prompting | Other Tools |
|---------|-----------------|---------------|-------------|
| Domain Intelligence | ✅ 5 specialized domains | ❌ Generic only | ⚠️ Limited domains |
| Quality Scoring | ✅ 4-dimension scoring | ❌ No scoring | ⚠️ Basic scoring |
| MCP Integration | ✅ Native MCP server | ❌ No integration | ❌ Not MCP |
| Template System | ✅ Liquid templates | ❌ Manual templates | ⚠️ Limited templating |
| Learning System | ✅ Usage analytics | ❌ No learning | ⚠️ Basic analytics |
| Production Ready | ✅ Enterprise grade | ❌ Manual process | ⚠️ Varies |

## 📞 Support & Community

- **🐛 Issues**: [GitHub Issues](https://github.com/promptsmith/promptsmith-mcp/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/promptsmith/promptsmith-mcp/discussions)
- **📧 Email**: support@promptsmith.dev
- **📖 Docs**: [docs.promptsmith.dev](https://docs.promptsmith.dev)
- **🔗 Community**: [Discord Server](https://discord.gg/promptsmith)

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- **[Anthropic](https://anthropic.com)** for Claude and AI research
- **[Model Context Protocol](https://modelcontextprotocol.io/)** for the foundation
- **[Cursor](https://cursor.sh/)** for IDE integration leadership
- **[Supabase](https://supabase.io/)** for database infrastructure
- **The Vibecoding Community** for inspiration and feedback

---

> **"From chaos to clarity, one prompt at a time"** ✨

**Ready to transform your prompts?** [Get started now](#-quick-start-5-minutes) or explore our [comprehensive documentation](./docs/).