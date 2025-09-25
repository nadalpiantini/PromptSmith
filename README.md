# PromptSmith MCP Server

> **Transform "vibecoding" into production-ready prompts with AI-powered optimization**

[![npm version](https://badge.fury.io/js/promptsmith-mcp.svg)](https://badge.fury.io/js/promptsmith-mcp)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## 🎯 Overview

PromptSmith is an intelligent **Model Context Protocol (MCP) server** that transforms raw, unstructured prompts ("vibecoding") into optimized, structured instructions with domain-specific intelligence. It acts as a sophisticated intermediary layer between developers and LLMs, ensuring consistent, high-quality prompt engineering.

### The Problem It Solves

- **Vibecoding inefficiency**: Raw prompts like "bonita tabla sql" produce inconsistent results
- **Domain expertise gap**: Generic prompts lack specialized knowledge for SQL, branding, cinema, etc.
- **Quality inconsistency**: No systematic way to measure and improve prompt effectiveness
- **Learning curve**: Manual prompt engineering requires extensive expertise

### The Solution

```
Developer Input → PromptSmith MCP → Optimized Output
"bonita tabla"  →                → "Generate a well-structured PostgreSQL schema..."
                                   + System prompt + Quality score + Suggestions
```

## ✨ Key Features

### 🧠 **Domain Intelligence**
- **5 Specialized Domains**: SQL, Branding, Cinema, SaaS, DevOps + General
- **Context-Aware Rules**: Domain-specific optimization and enhancement patterns
- **Professional Standards**: Industry best practices built into each domain

### 📊 **Multi-Dimensional Quality Scoring**
- **4 Core Metrics**: Clarity, Specificity, Structure, Completeness
- **Weighted Algorithms**: Domain-specific scoring optimization
- **Actionable Feedback**: Specific suggestions for improvement

### 🔄 **Learning & Optimization**
- **Template Generation**: Liquid-based templating system
- **Few-Shot Examples**: Contextual examples when beneficial
- **Caching**: Redis-powered sub-500ms response times
- **Usage Analytics**: Continuous improvement through telemetry

### 🛠️ **Production Ready**
- **8 MCP Tools**: Complete API for prompt lifecycle management
- **Enterprise Grade**: TypeScript, comprehensive testing, error handling
- **Extensible**: Plugin architecture for custom domains and rules

## 🚀 Quick Start (5 minutes)

### 1. Installation

```bash
npm install -g promptsmith-mcp
```

### 2. Environment Setup

Create `.env` file:
```bash
# Required
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-anon-key

# Optional (for caching)
REDIS_URL=redis://localhost:6379

# Optional (for external LLM calls)
OPENAI_API_KEY=your-openai-key
```

### 3. MCP Configuration

Add to `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "promptsmith": {
      "command": "promptsmith-mcp",
      "env": {
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_KEY": "your-supabase-key"
      }
    }
  }
}
```

### 4. First Use

In Cursor IDE:
```typescript
// Process a vibecoding prompt
process_prompt({
  raw: "necesito una tabla sql bonita para ventas",
  domain: "sql",
  tone: "technical"
})

// Result:
{
  "refined": "Create a well-structured PostgreSQL sales database schema including:\n- Products table with SKU, name, price, inventory tracking\n- Customers table with contact details and segmentation\n- Orders table linking customers to products with timestamps\n- Include appropriate indexes, foreign keys, and sample data",
  "system": "You are a senior database architect specializing in e-commerce systems...",
  "score": {
    "clarity": 0.92,
    "specificity": 0.89,
    "structure": 0.95,
    "completeness": 0.87,
    "overall": 0.91
  },
  "suggestions": [
    "Consider specifying expected data volume for index optimization",
    "Add data retention and archival requirements"
  ]
}
```

## 🛠️ MCP Tools Reference

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| **`process_prompt`** | Transform vibecoding into optimized prompts | Raw prompt + domain + preferences | Refined prompt + system prompt + quality metrics |
| **`evaluate_prompt`** | Analyze existing prompt quality | Prompt text + evaluation criteria | Quality breakdown + recommendations |
| **`compare_prompts`** | A/B test multiple prompt variants | Array of prompt variants | Winner selection + detailed comparison |
| **`save_prompt`** | Store refined prompts in knowledge base | Prompt + metadata + tags | Saved prompt with ID |
| **`search_prompts`** | Find existing prompts by query/tags | Search parameters + filters | Ranked results with relevance scores |
| **`get_prompt`** | Retrieve specific prompt by ID | Prompt ID | Full prompt details + metadata |
| **`get_stats`** | System performance and usage analytics | Time range (optional) | Comprehensive system statistics |
| **`validate_prompt`** | Check prompt for common issues | Prompt text + domain context | Validation results + suggestions |

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