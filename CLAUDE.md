# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptSmith is an intelligent Model Context Protocol (MCP) server that transforms raw, unstructured prompts ("vibecoding") into optimized, structured instructions with domain-specific intelligence. It's a TypeScript-based MCP server designed to run as a CLI tool or HTTP server.

## Development Commands

### Core Development
- `npm run dev` - Start development server with hot reload (uses tsx watch)
- `npm run build` - Build TypeScript to JavaScript (dist/)
- `npm run start` - Run production server from dist/
- `npm run dev:http` - Development HTTP server mode
- `npm run start:http` - Production HTTP server mode
- `npm run mcp:stdio` - Run MCP server with STDIO-compatible patches

### Testing
- `npm test` - Run all tests with Jest
- `npm test:watch` - Run tests in watch mode
- `npm test:coverage` - Run tests with coverage report (required thresholds: 85% general, 90% for server/)
- `npm run test:server` - Test MCP server connectivity
- Individual test scripts in `scripts/`:
  - `node scripts/test-connectivity.cjs` - Test database connectivity
  - `node scripts/test-process-prompt.cjs` - Test prompt processing
  - `node scripts/test-evaluate.cjs` - Test evaluation tool
  - `node scripts/test-full-workflow.cjs` - Full integration test

### MCP & Build Verification
- `npm run verify:mcp` - Verify MCP STDIO compatibility patches
- `npm run post-build` - Apply STDIO patches after TypeScript compilation
- `node scripts/verify-mcp-patch.cjs` - Comprehensive MCP readiness check

### Code Quality
- `npm run lint` - Run ESLint on src/**/*.ts
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run verify` - Run verification script (./scripts/verify-installation.sh)

### Database & Setup
- `npm run migrate` - Run database migrations (tsx scripts/migrate.ts)
- `npm run seed` - Seed database with sample data
- `npm run setup` - Initial setup script (./scripts/setup.sh)

### Documentation & Deployment
- `npm run docs` - Generate TypeDoc documentation
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container

## Architecture

### Processing Pipeline
The core processing flow follows this pattern:
```
Input → Cache Check → Analyzer → Optimizer → Validator → Scorer → Cache Store → Output
```

1. **Orchestrator** (`src/core/orchestrator.ts`) - Coordinates the entire processing pipeline
2. **Analyzer** (`src/core/analyzer.ts`) - Analyzes raw prompt structure and intent
3. **Optimizer** (`src/core/optimizer.ts`) - Applies domain-specific optimizations
4. **Validator** (`src/core/validator.ts`) - Validates prompt quality and structure
5. **Scorer** (`src/scoring/scorer.ts`) - Multi-dimensional quality scoring

### Domain Rules Engine
Located in `src/rules/`, provides specialized processing for:
- **SQL** (`sql.ts`) - Database schema, query optimization
- **Branding** (`branding.ts`) - Marketing copy, brand voice
- **Cinema** (`cine.ts`) - Screenplay formatting, storytelling
- **SaaS** (`saas.ts`) - Product management, user stories
- **DevOps** (`devops.ts`) - Infrastructure, deployment

### Services Layer
- **Store** (`services/store.ts`) - Supabase database operations
- **Cache** (`services/cache.ts`) - Redis caching layer
- **Telemetry** (`services/telemetry.ts`) - Usage analytics
- **Template** (`services/template.ts`) - Liquid template engine
- **Refine** (`services/refine.ts`) - LLM-based refinement (optional)

### MCP Server Implementation
The MCP server (`src/server/index.ts`) exposes 8 tools:
1. `process_prompt` - Transform vibecoding into optimized prompts
2. `evaluate_prompt` - Analyze prompt quality
3. `compare_prompts` - A/B test prompt variants
4. `save_prompt` - Store prompts in knowledge base
5. `search_prompts` - Query the knowledge base
6. `get_prompt` - Retrieve specific prompt by ID
7. `get_stats` - System performance metrics
8. `validate_prompt` - Check for common issues

## Environment Configuration

Required environment variables (in `.env`):
```bash
# Required
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional
REDIS_URL=redis://localhost:6379  # For caching
OPENAI_API_KEY=your-key           # For LLM refinement
APP_VERSION=1.0.0
NODE_ENV=development|production
TELEMETRY_ENABLED=true|false
```

## Quality Scoring System

The scoring system evaluates prompts across four weighted dimensions:
- **Clarity** (25%) - Language precision, ambiguity reduction
- **Specificity** (30%) - Technical detail, requirement completeness
- **Structure** (25%) - Logical organization, readability
- **Completeness** (20%) - Coverage of requirements

Domain-specific weights are applied for specialized contexts.

## Testing Strategy

Tests are organized by type:
- `tests/unit/` - Unit tests for individual components
- `tests/integration/` - Integration tests for service interactions
- `tests/performance/` - Performance benchmarks
- `tests/error-handling/` - Error recovery scenarios

Test configuration uses Jest with:
- TypeScript support via ts-jest
- ESM modules configuration
- Coverage thresholds enforced (85% general, 90% for critical paths)
- Separate test projects for unit/integration/performance

## Type System

Key type definitions in `src/types/`:
- `prompt.ts` - Core prompt processing types (ProcessInput, ProcessResult, etc.)
- `domain.ts` - Domain-specific rule types
- `database.ts` - Database schema types
- `mcp.ts` - MCP protocol types
- `supabase.ts` - Supabase-specific types

## MCP Integration

The server runs as a stdio-based MCP server by default:
- Communicates via JSON-RPC over stdin/stdout
- Compatible with Cursor IDE and other MCP clients
- Can also run as HTTP server for REST API access

### STDIO Compatibility & Offline Mode

The project includes a sophisticated patching system for STDIO compatibility with MCP clients:

**Built-in Smart Logger**: `src/utils/logger.ts`
- Automatically detects STDIO mode via environment variables or TTY detection
- Redirects all logs to `stderr` when in MCP mode to preserve JSON-RPC protocol
- No manual configuration required - works automatically

**Build Process**: `scripts/post-build.cjs`
- Automatically applies STDIO patches during `npm run build`
- Enables graceful offline mode when Supabase credentials are unavailable
- Ensures MCP protocol compliance for Cursor/Claude integration

**Legacy Script**: `scripts/patch-and-run-promptsmith.cjs`
- Maintained for backward compatibility with older configurations
- Use built-in system instead for new setups

**Usage**:
```bash
# Direct execution
npm run mcp:stdio

# Via global command (uses patched version automatically)
promptsmith-mcp
```

Configure in MCP client (e.g., `~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "promptsmith": {
      "command": "node",
      "args": ["scripts/patch-and-run-promptsmith.cjs"],
      "cwd": "/path/to/PromptSmith",
      "env": {
        "NODE_ENV": "production",
        "TELEMETRY_ENABLED": "false"
      }
    },
    "promptsmith-global": {
      "command": "promptsmith-mcp",
      "args": [],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Offline Mode Features**:
- Automatically activates when SUPABASE_URL/SUPABASE_ANON_KEY are missing
- Uses in-memory storage for prompts and cache
- Provides mock responses for all MCP tools
- Logs offline status to stderr without breaking STDIO
- Graceful degradation of functionality

## Performance Considerations

- Redis caching reduces response time to <500ms for cached prompts
- Quality-dependent TTL for cache entries
- Telemetry tracks performance metrics
- Rate limiting configurable per-user
- Parallel processing where possible in the pipeline

## Development Workflow

1. **First Time Setup**: Check for and apply database fixes from `URGENT_DATABASE_FIX.md`
2. Make changes to TypeScript source in `src/`
3. Run `npm run dev` for hot reload development
4. Write tests for new functionality
5. Run `npm test` to ensure tests pass
6. Run `npm run lint:fix` to fix style issues
7. Build with `npm run build` (automatically applies MCP patches)
8. Verify MCP compatibility with `npm run verify:mcp`
9. Test integration with scripts in `scripts/test-*.cjs`

## Troubleshooting

Common issues and solutions:
- **Database schema errors**: Apply fixes from `URGENT_DATABASE_FIX.md` first
- **Missing environment variables**: Check `.env` file exists with required vars
- **Database connection**: Verify Supabase URL and key are correct
- **Redis connection**: Ensure Redis is running if caching is enabled
- **TypeScript errors**: Run `npm run build` to see compilation errors
- **Test failures**: Check coverage reports in `coverage/` directory
- **MCP integration issues**: Run `npm run verify:mcp` to check STDIO compatibility
- **Cursor IDE not detecting tools**: Restart Cursor completely after MCP configuration changes

## Important Development Notes

### Project State & Architecture Updates
- **Current Version**: 1.0.0 - Production ready with full MCP integration
- **Hybrid Architecture**: Supports both CLI (`pimpprompt`) and MCP server (`promptsmith-mcp`) modes
- **Global CLI Access**: Install with `npm link` to create global `pimpprompt` command
- **Production Database**: Uses real Supabase backend at sujeto10.com with fallback system

### Critical Database Issues & Fixes
⚠️ **URGENT**: There is a known production database issue that requires manual intervention:
- Missing `promptsmith_user_feedback` table
- Missing 11 domain enum values (mobile, web, backend, frontend, ai, gaming, crypto, education, healthcare, finance, legal)
- **Fix Required**: Execute SQL from `URGENT_DATABASE_FIX.md` in Supabase dashboard before development
- **Verification**: Run `node scripts/verify-database-setup.js` after applying fixes
- **Impact**: Database operations will fail without these fixes

### CLI vs MCP Modes
The project uniquely supports dual operation modes:
- **CLI Mode**: `pimpprompt "create login form"` - Visual output with learning feedback
- **MCP Mode**: JSON-RPC over stdio for IDE integration (Cursor, etc.)
- **Auto-detection**: Entry point (`src/cli.ts`) automatically detects mode based on environment

### Binary Commands Configuration
- `pimpprompt` - Global CLI command created via npm link
- `promptsmith-mcp` - MCP server binary (in `bin/` directory)
- Both use the same codebase but different execution modes

### Domain-Specific Optimizations
The `src/rules/` directory contains specialized processors:
- Each domain (sql, branding, cine, saas, devops) has specific transformation rules
- Rules are applied via the Optimizer in the processing pipeline
- Domain detection happens automatically in the Analyzer phase

### Template System Integration
- Uses Liquid templating engine (`src/templates/`)
- Templates are stored in Supabase and cached locally
- Variables can be extracted and reused across prompts
- Templates support cross-project sharing

### Quality Scoring Implementation
Located in `src/scoring/scorer.ts`:
- 4-dimensional scoring: Clarity (25%), Specificity (30%), Structure (25%), Completeness (20%)
- Domain-specific weight adjustments
- Real-time feedback for learning and improvement
- Scores influence cache TTL and recommendation priority

### Testing Infrastructure
- Jest configuration supports ESM modules and TypeScript with complex module resolution
- Separate test projects for unit, integration, and performance testing
- Global setup/teardown scripts in `tests/` directory
- Coverage thresholds: 85% general, 90% for critical server paths
- **Test Command**: Must use `NODE_OPTIONS='--experimental-vm-modules' jest` for ESM support
- **Module Mapping**: Complex path mappings required for proper ESM/TypeScript integration

### Environment Dependencies
- **Required**: SUPABASE_URL, SUPABASE_ANON_KEY
- **Optional**: REDIS_URL (caching), OPENAI_API_KEY (LLM refinement)
- **Fallback**: System works without Redis or OpenAI (degrades gracefully)

### Database Schema
- Uses Supabase with custom schema in `sql/` directory
- Tables: prompts, templates, analytics, user_sessions
- Row Level Security (RLS) enabled for multi-tenant support
- Migration scripts available via `npm run migrate`