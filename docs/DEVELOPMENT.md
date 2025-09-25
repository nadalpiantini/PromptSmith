# PromptSmith MCP Development Guide

Complete guide for contributing to PromptSmith MCP Server, including setup, development workflows, coding standards, and best practices.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Adding New Domains](#adding-new-domains)
- [Contributing Features](#contributing-features)
- [Code Review Process](#code-review-process)
- [Release Process](#release-process)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js 18+** (LTS recommended)
- **npm 8+** or **yarn 1.22+**
- **TypeScript 5+** (installed globally or via npx)
- **PostgreSQL 14+** (or Supabase account)
- **Redis 6+** (optional, for caching development)
- **Git 2.30+**

### Quick Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/promptsmith-mcp.git
cd promptsmith-mcp

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp .env.example .env.development

# 4. Set up development database
npm run db:setup

# 5. Run database migrations
npm run migrate

# 6. Seed development data
npm run seed:dev

# 7. Start development server
npm run dev

# 8. Run tests to ensure everything works
npm test
```

### Development Environment Variables

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000

# Database (use local PostgreSQL or Supabase)
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_KEY=your-dev-anon-key
DATABASE_URL=postgresql://postgres:password@localhost:5432/promptsmith_dev

# Caching (optional for development)
REDIS_URL=redis://localhost:6379

# Testing (optional)
OPENAI_API_KEY=sk-test-key-for-integration-tests
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/promptsmith_test

# Development flags
ENABLE_DEBUG_LOGS=true
DISABLE_RATE_LIMITING=true
MOCK_EXTERNAL_APIS=true
```

---

## Development Environment

### VS Code Setup

Recommended VS Code extensions:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.test-adapter-converter",
    "orta.vscode-jest"
  ]
}
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.env": true
  },
  "search.exclude": {
    "dist/**": true,
    "node_modules/**": true,
    "coverage/**": true
  },
  "jest.autoRun": "watch",
  "typescript.suggest.autoImports": true
}
```

### Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug PromptSmith MCP",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/cli.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeArgs": ["-r", "tsx/cjs"],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      },
      "console": "integratedTerminal",
      "sourceMaps": true,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache", "--no-coverage"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "env": {
        "NODE_ENV": "test"
      }
    }
  ]
}
```

---

## Project Structure

### Directory Layout

```
promptsmith-mcp/
├── src/                          # Source code
│   ├── server/                   # MCP server implementation
│   │   └── index.ts             # Main server entry point
│   ├── core/                    # Core processing components
│   │   ├── analyzer.ts          # Prompt analysis engine
│   │   ├── optimizer.ts         # Prompt optimization
│   │   ├── validator.ts         # Validation logic
│   │   └── orchestrator.ts      # Main orchestration
│   ├── rules/                   # Domain-specific rules
│   │   ├── index.ts             # Rules registry
│   │   ├── sql.ts               # SQL domain rules
│   │   ├── branding.ts          # Branding domain rules
│   │   ├── cine.ts              # Cinema domain rules
│   │   ├── saas.ts              # SaaS domain rules
│   │   └── devops.ts            # DevOps domain rules
│   ├── services/                # Business logic services
│   │   ├── index.ts             # Services registry
│   │   ├── store.ts             # Database operations
│   │   ├── cache.ts             # Redis caching
│   │   ├── telemetry.ts         # Analytics and tracking
│   │   ├── refine.ts            # Refinement service
│   │   └── score.ts             # Quality scoring
│   ├── templates/               # Template processing
│   │   ├── engine.ts            # Liquid template engine
│   │   ├── generators.ts        # Template generators
│   │   └── library.ts           # Template library
│   ├── scoring/                 # Quality assessment
│   │   ├── scorer.ts            # Main scoring engine
│   │   ├── algorithms/          # Scoring algorithms
│   │   └── metrics.ts           # Quality metrics
│   ├── adapters/                # External service adapters
│   │   ├── supabase.ts          # Supabase adapter
│   │   ├── redis.ts             # Redis adapter
│   │   └── openai.ts            # OpenAI adapter
│   ├── types/                   # TypeScript definitions
│   │   ├── prompt.ts            # Prompt-related types
│   │   ├── domain.ts            # Domain types
│   │   ├── database.ts          # Database types
│   │   └── mcp.ts               # MCP protocol types
│   ├── utils/                   # Utility functions
│   │   ├── logger.ts            # Logging utilities
│   │   ├── validators.ts        # Input validation
│   │   └── type-converters.ts   # Type conversion helpers
│   └── cli.ts                   # CLI entry point
├── tests/                       # Test suites
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── e2e/                     # End-to-end tests
│   ├── fixtures/                # Test data fixtures
│   └── helpers/                 # Test helper functions
├── scripts/                     # Development and build scripts
│   ├── setup.sh               # Development setup
│   ├── migrate.ts             # Database migrations
│   ├── seed.ts                # Development data seeding
│   └── benchmark.ts           # Performance benchmarks
├── sql/                        # Database schema and migrations
│   ├── 001_initial_schema.sql # Initial database schema
│   └── migrations/            # Schema migrations
├── docs/                      # Documentation
│   ├── API.md                 # API reference
│   ├── ARCHITECTURE.md        # System architecture
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── DEVELOPMENT.md         # This file
├── docker/                    # Docker configurations
│   ├── Dockerfile             # Production Dockerfile
│   ├── Dockerfile.dev         # Development Dockerfile
│   └── docker-compose.dev.yml # Development compose
└── config/                    # Configuration files
    ├── jest.config.js         # Jest test configuration
    ├── tsconfig.json          # TypeScript configuration
    ├── .eslintrc.js          # ESLint configuration
    └── .prettierrc           # Prettier configuration
```

### Key Files and Their Purpose

| File | Purpose | When to Modify |
|------|---------|----------------|
| `src/server/index.ts` | MCP server implementation | Adding new MCP tools |
| `src/core/orchestrator.ts` | Main processing pipeline | Changing core workflow |
| `src/rules/[domain].ts` | Domain-specific rules | Adding/modifying domain logic |
| `src/types/prompt.ts` | Core type definitions | Adding new data structures |
| `src/services/store.ts` | Database operations | Adding database functionality |
| `tests/unit/` | Unit tests | Testing individual components |
| `scripts/migrate.ts` | Database migrations | Schema changes |

---

## Development Workflow

### Branch Strategy

We use **Git Flow** with the following branch types:

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/[name]`**: New feature development
- **`bugfix/[name]`**: Bug fixes
- **`hotfix/[name]`**: Critical production fixes
- **`release/[version]`**: Release preparation

### Feature Development Workflow

```bash
# 1. Start from develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/add-legal-domain

# 3. Implement feature with tests
# ... make changes ...

# 4. Run quality checks
npm run lint
npm run type-check
npm test
npm run test:coverage

# 5. Commit with conventional commits
git add .
git commit -m "feat(domains): add legal domain with contract optimization"

# 6. Push and create pull request
git push origin feature/add-legal-domain
# Create PR via GitHub interface
```

### Daily Development Tasks

```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Check code quality
npm run lint:fix
npm run format

# Type checking
npm run type-check

# Build for testing
npm run build

# Database operations
npm run migrate        # Run migrations
npm run seed:dev      # Seed development data
npm run db:reset      # Reset database
```

### Debugging

```bash
# Debug with verbose logging
DEBUG=promptsmith:* npm run dev

# Debug specific module
DEBUG=promptsmith:orchestrator npm run dev

# Profile memory usage
node --prof dist/cli.js

# Inspect heap snapshot
node --inspect dist/cli.js
```

---

## Coding Standards

### TypeScript Guidelines

#### Type Safety

```typescript
// ✅ Good: Explicit typing
interface ProcessInput {
  raw: string;
  domain: PromptDomain;
  tone?: PromptTone;
}

async function processPrompt(input: ProcessInput): Promise<ProcessResult> {
  // Implementation
}

// ❌ Bad: Using any
function processPrompt(input: any): any {
  // Implementation
}
```

#### Error Handling

```typescript
// ✅ Good: Structured error handling
class PromptProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'PromptProcessingError';
  }
}

async function processPrompt(input: ProcessInput): Promise<ProcessResult> {
  try {
    return await this.orchestrator.process(input);
  } catch (error) {
    throw new PromptProcessingError(
      'Failed to process prompt',
      'PROCESSING_ERROR',
      { input: this.sanitizeInput(input), originalError: error }
    );
  }
}

// ❌ Bad: Generic error handling
async function processPrompt(input: any) {
  try {
    return await this.orchestrator.process(input);
  } catch (error) {
    throw new Error('Something went wrong');
  }
}
```

#### Async/Await Patterns

```typescript
// ✅ Good: Proper async handling with Promise.all
async function processMultiplePrompts(inputs: ProcessInput[]): Promise<ProcessResult[]> {
  const results = await Promise.allSettled(
    inputs.map(input => this.processPrompt(input))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      this.logger.error('Prompt processing failed', {
        index,
        input: inputs[index],
        error: result.reason
      });
      throw result.reason;
    }
  });
}

// ❌ Bad: Sequential processing
async function processMultiplePrompts(inputs: ProcessInput[]): Promise<ProcessResult[]> {
  const results = [];
  for (const input of inputs) {
    results.push(await this.processPrompt(input));
  }
  return results;
}
```

### Code Organization

#### Service Layer Pattern

```typescript
// ✅ Good: Well-defined service interface
export interface StoreService {
  save(prompt: string, metadata: SaveMetadata): Promise<SavedPrompt>;
  search(params: SearchParams): Promise<SearchResult[]>;
  getById(id: string): Promise<SavedPrompt | null>;
  getStats(): Promise<StoreStats>;
}

export class SupabaseStoreService implements StoreService {
  constructor(
    private readonly client: SupabaseClient,
    private readonly logger: Logger
  ) {}

  async save(prompt: string, metadata: SaveMetadata): Promise<SavedPrompt> {
    this.logger.debug('Saving prompt', { metadata });

    const { data, error } = await this.client
      .from('prompts')
      .insert([{ prompt, ...metadata }])
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to save prompt', error);
    }

    return this.mapToSavedPrompt(data);
  }

  private mapToSavedPrompt(data: any): SavedPrompt {
    return {
      id: data.id,
      name: data.name,
      domain: data.domain,
      // ... other mappings
    };
  }
}
```

#### Domain Rules Structure

```typescript
// ✅ Good: Consistent domain rule structure
export class DomainRules {
  constructor(
    private readonly domain: PromptDomain,
    private readonly rules: DomainRule[]
  ) {}

  apply(prompt: string, analysis: AnalysisResult): RefinementResult {
    const applicableRules = this.getApplicableRules(prompt, analysis);
    const sortedRules = this.sortByPriority(applicableRules);

    return this.processRules(prompt, sortedRules);
  }

  private getApplicableRules(prompt: string, analysis: AnalysisResult): DomainRule[] {
    return this.rules.filter(rule =>
      rule.active &&
      this.matchesPattern(rule.pattern, prompt) &&
      this.meetsCondition(rule.condition, analysis)
    );
  }

  private sortByPriority(rules: DomainRule[]): DomainRule[] {
    return rules.sort((a, b) => b.priority - a.priority);
  }

  private processRules(prompt: string, rules: DomainRule[]): RefinementResult {
    let refined = prompt;
    const applied: string[] = [];
    const improvements: string[] = [];

    for (const rule of rules) {
      const result = this.applyRule(refined, rule);
      if (result.changed) {
        refined = result.refined;
        applied.push(rule.id);
        improvements.push(result.improvement);
      }
    }

    return { refined, rulesApplied: applied, improvements };
  }
}
```

### Naming Conventions

```typescript
// ✅ Good naming
interface ProcessInput { }          // PascalCase for types/interfaces
class PromptOrchestrator { }        // PascalCase for classes
const DEFAULT_TIMEOUT = 5000;       // SCREAMING_SNAKE_CASE for constants
function processPrompt() { }        // camelCase for functions
const promptResult = await...;      // camelCase for variables

// File names
process-input.types.ts              // kebab-case for files
prompt-orchestrator.service.ts      // kebab-case with purpose suffix

// Database naming
prompt_evaluations                  // snake_case for tables
created_at                          // snake_case for columns
```

---

## Testing Guidelines

### Test Structure

We use **Jest** for testing with the following structure:

```
tests/
├── unit/                    # Unit tests (isolated components)
├── integration/             # Integration tests (multiple components)
├── e2e/                    # End-to-end tests (full workflow)
├── fixtures/               # Test data
├── helpers/                # Test utilities
└── __mocks__/             # Manual mocks
```

### Unit Testing

```typescript
// tests/unit/core/analyzer.test.ts
describe('PromptAnalyzer', () => {
  let analyzer: PromptAnalyzer;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as jest.Mocked<Logger>;

    analyzer = new PromptAnalyzer(mockLogger);
  });

  describe('analyze()', () => {
    it('should analyze a simple prompt correctly', async () => {
      // Arrange
      const prompt = 'Create a user table with email and password fields';

      // Act
      const result = await analyzer.analyze(prompt);

      // Assert
      expect(result).toMatchObject({
        tokens: expect.arrayContaining([
          expect.objectContaining({
            text: 'Create',
            pos: expect.stringMatching(/^VB/)
          })
        ]),
        complexity: expect.any(Number),
        domainHints: expect.arrayContaining(['sql', 'database']),
        technicalTerms: expect.arrayContaining(['table', 'email', 'password'])
      });

      expect(result.complexity).toBeGreaterThan(0);
      expect(result.complexity).toBeLessThanOrEqual(1);
    });

    it('should handle empty prompts gracefully', async () => {
      // Arrange & Act & Assert
      await expect(analyzer.analyze('')).rejects.toThrow('Prompt cannot be empty');
    });

    it('should detect domain hints correctly', async () => {
      // Arrange
      const testCases = [
        { prompt: 'CREATE TABLE users', expectedDomains: ['sql'] },
        { prompt: 'Brand guidelines for startup', expectedDomains: ['branding'] },
        { prompt: 'Deploy microservice to Kubernetes', expectedDomains: ['devops'] }
      ];

      // Act & Assert
      for (const testCase of testCases) {
        const result = await analyzer.analyze(testCase.prompt);
        expect(result.domainHints).toEqual(expect.arrayContaining(testCase.expectedDomains));
      }
    });
  });

  describe('calculateComplexity()', () => {
    it('should assign higher complexity to longer prompts', async () => {
      // Arrange
      const shortPrompt = 'Create table';
      const longPrompt = 'Create a comprehensive database schema for an e-commerce platform with user authentication, product catalog, order management, and inventory tracking systems including proper relationships and constraints';

      // Act
      const shortResult = await analyzer.analyze(shortPrompt);
      const longResult = await analyzer.analyze(longPrompt);

      // Assert
      expect(longResult.complexity).toBeGreaterThan(shortResult.complexity);
    });
  });
});
```

### Integration Testing

```typescript
// tests/integration/orchestrator.test.ts
describe('PromptOrchestrator Integration', () => {
  let orchestrator: PromptOrchestrator;
  let testDb: TestDatabase;
  let testRedis: TestRedis;

  beforeAll(async () => {
    testDb = await setupTestDatabase();
    testRedis = await setupTestRedis();
  });

  afterAll(async () => {
    await teardownTestDatabase(testDb);
    await teardownTestRedis(testRedis);
  });

  beforeEach(async () => {
    orchestrator = new PromptOrchestrator({
      database: testDb.client,
      redis: testRedis.client,
      logger: createTestLogger()
    });

    await testDb.reset();
    await testRedis.reset();
  });

  it('should process SQL domain prompt end-to-end', async () => {
    // Arrange
    const input: ProcessInput = {
      raw: 'hazme una bonita tabla para usuarios',
      domain: PromptDomain.SQL,
      tone: PromptTone.TECHNICAL
    };

    // Act
    const result = await orchestrator.process(input);

    // Assert
    expect(result.refined).toContain('well-structured database table');
    expect(result.refined).toContain('users');
    expect(result.score.overall).toBeGreaterThan(0.7);
    expect(result.metadata.domain).toBe(PromptDomain.SQL);
    expect(result.metadata.rulesApplied).toContain('sql_vague_terms');
  });

  it('should cache results correctly', async () => {
    // Arrange
    const input: ProcessInput = {
      raw: 'create user authentication system',
      domain: PromptDomain.SAAS
    };

    // Act - First call
    const startTime1 = Date.now();
    const result1 = await orchestrator.process(input);
    const duration1 = Date.now() - startTime1;

    // Act - Second call (should be cached)
    const startTime2 = Date.now();
    const result2 = await orchestrator.process(input);
    const duration2 = Date.now() - startTime2;

    // Assert
    expect(result1).toEqual(result2);
    expect(result1.metadata.cacheHit).toBe(false);
    expect(result2.metadata.cacheHit).toBe(true);
    expect(duration2).toBeLessThan(duration1 / 2); // Cached should be significantly faster
  });
});
```

### End-to-End Testing

```typescript
// tests/e2e/mcp-server.test.ts
describe('MCP Server E2E', () => {
  let server: PromptSmithServer;
  let client: MCPClient;

  beforeAll(async () => {
    server = new PromptSmithServer();
    await server.start();
    client = new MCPClient();
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
    await server.shutdown();
  });

  it('should handle process_prompt tool call', async () => {
    // Arrange
    const request = {
      method: 'tools/call',
      params: {
        name: 'process_prompt',
        arguments: {
          raw: 'create database for ecommerce',
          domain: 'sql',
          tone: 'professional'
        }
      }
    };

    // Act
    const response = await client.request(request);

    // Assert
    expect(response).toMatchObject({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('"success": true')
        }
      ]
    });

    const data = JSON.parse(response.content[0].text);
    expect(data.success).toBe(true);
    expect(data.data.refined).toContain('e-commerce');
    expect(data.data.score.overall).toBeGreaterThan(0.5);
  });

  it('should handle validation errors correctly', async () => {
    // Arrange
    const request = {
      method: 'tools/call',
      params: {
        name: 'process_prompt',
        arguments: {
          raw: '', // Empty prompt should fail validation
          domain: 'sql'
        }
      }
    };

    // Act & Assert
    await expect(client.request(request)).rejects.toMatchObject({
      code: -32602, // Invalid params
      message: expect.stringContaining('Raw prompt is required')
    });
  });
});
```

### Test Utilities

```typescript
// tests/helpers/test-utils.ts
export function createMockLogger(): jest.Mocked<Logger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

export function createTestPromptInput(overrides: Partial<ProcessInput> = {}): ProcessInput {
  return {
    raw: 'test prompt',
    domain: PromptDomain.GENERAL,
    tone: PromptTone.PROFESSIONAL,
    ...overrides
  };
}

export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

export class TestDatabase {
  constructor(private client: SupabaseClient) {}

  async reset(): Promise<void> {
    await this.client.from('prompts').delete().gte('id', 0);
    await this.client.from('prompt_evaluations').delete().gte('id', 0);
    // Reset other tables...
  }

  async seed(fixture: string): Promise<void> {
    const data = await import(`../fixtures/${fixture}.json`);

    for (const [table, records] of Object.entries(data)) {
      await this.client.from(table).insert(records);
    }
  }
}
```

### Test Coverage Requirements

- **Unit Tests**: Minimum 80% line coverage
- **Integration Tests**: Cover all service interactions
- **E2E Tests**: Cover all MCP tools and error scenarios
- **Performance Tests**: Ensure response times meet SLAs

```bash
# Run tests with coverage
npm run test:coverage

# Coverage thresholds in package.json
"jest": {
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

---

## Adding New Domains

### Domain Implementation Checklist

- [ ] Create domain rule class
- [ ] Implement rule patterns and enhancements
- [ ] Add quality scoring weights
- [ ] Create system prompt template
- [ ] Add type definitions
- [ ] Write comprehensive tests
- [ ] Add examples and documentation
- [ ] Update domain registry

### Step 1: Create Domain Rule Class

```typescript
// src/rules/legal.ts
import { DomainRule, RuleCategory, DomainConfig } from '../types/domain.js';
import { PromptDomain, AnalysisResult } from '../types/prompt.js';

export class LegalRules {
  private patterns = {
    vague: [
      {
        match: /contract/gi,
        replace: 'comprehensive legal contract with specific terms and conditions',
        description: 'Enhance generic contract requests with specificity'
      },
      {
        match: /legal document/gi,
        replace: 'properly structured legal document following jurisdictional requirements',
        description: 'Add jurisdictional and structural requirements'
      }
    ],

    structure: [
      {
        match: /^(write|create|draft)\s+(contract|agreement)/gi,
        replace: 'Draft a legally compliant $2 including',
        description: 'Add legal compliance requirements'
      }
    ],

    enhancements: [
      {
        trigger: /contract|agreement/i,
        enhancement: 'Include jurisdiction clauses, termination conditions, and dispute resolution mechanisms'
      },
      {
        trigger: /terms|conditions/i,
        enhancement: 'Specify applicable law, governing jurisdiction, and compliance requirements'
      }
    ]
  };

  apply(prompt: string, analysis?: AnalysisResult): {
    refined: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let refined = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Apply domain-specific transformations
    this.patterns.vague.forEach(pattern => {
      if (pattern.match.test(refined)) {
        refined = refined.replace(pattern.match, pattern.replace);
        rulesApplied.push(`legal_vague_${pattern.description}`);
        improvements.push(`Enhanced legal terminology: ${pattern.description}`);
      }
    });

    // Add contextual enhancements
    const contextEnhancements = this.addLegalContext(refined, analysis);
    refined = contextEnhancements.enhanced;
    rulesApplied.push(...contextEnhancements.rulesApplied);
    improvements.push(...contextEnhancements.improvements);

    return { refined: refined.trim(), rulesApplied, improvements };
  }

  private addLegalContext(prompt: string, analysis?: AnalysisResult): {
    enhanced: string;
    rulesApplied: string[];
    improvements: string[];
  } {
    let enhanced = prompt;
    const rulesApplied: string[] = [];
    const improvements: string[] = [];

    // Add jurisdiction considerations
    if (/contract|agreement/i.test(prompt) && !/jurisdiction/i.test(prompt)) {
      enhanced += '\n\nSpecify the governing jurisdiction and applicable law.';
      rulesApplied.push('add_jurisdiction_requirements');
      improvements.push('Added jurisdiction requirements');
    }

    // Add compliance considerations
    if (/business|commercial/i.test(prompt) && !/compliance/i.test(prompt)) {
      enhanced += '\n\nInclude relevant regulatory compliance requirements.';
      rulesApplied.push('add_compliance_requirements');
      improvements.push('Added compliance considerations');
    }

    return { enhanced, rulesApplied, improvements };
  }

  generateSystemPrompt(analysis?: AnalysisResult, context?: string): string {
    return `You are a senior legal counsel with extensive experience in:

**Contract Law:**
- Contract formation, interpretation, and enforcement
- Commercial agreements and business contracts
- Terms and conditions, licensing agreements
- Dispute resolution and remediation clauses

**Legal Compliance:**
- Regulatory compliance across jurisdictions
- Industry-specific legal requirements
- Privacy laws (GDPR, CCPA, etc.) and data protection
- Intellectual property law and protection

**Legal Writing:**
- Clear, precise legal language and terminology
- Professional legal document structure and formatting
- Risk mitigation through comprehensive clauses
- Enforceable terms and conditions

Always provide:
- Legally compliant language appropriate for jurisdiction
- Clear definitions of key terms and obligations
- Proper legal structure with numbered sections
- Consideration of enforceability and risk factors
- Guidance on legal review and consultation needs

Note: This is for informational purposes only and does not constitute legal advice. Always consult qualified legal counsel for specific legal matters.`;
  }

  getDomainConfig(): DomainConfig {
    return {
      domain: PromptDomain.LEGAL,
      description: 'Legal document drafting and contract optimization',
      defaultRules: this.getDefaultRules(),
      systemPromptTemplate: this.generateSystemPrompt(),
      qualityWeights: {
        clarity: 0.4,      // Very high importance for legal clarity
        specificity: 0.3,  // High importance for legal precision
        structure: 0.2,    // Important for legal formatting
        completeness: 0.1  // Moderate importance
      },
      examples: [
        {
          title: 'Contract Enhancement',
          before: 'write contract for service provider',
          after: 'Draft a legally compliant service provider contract including:\n- Clear service delivery terms and performance standards\n- Payment schedules and penalty clauses\n- Intellectual property rights and confidentiality provisions\n- Termination conditions and notice requirements\n- Governing jurisdiction and dispute resolution mechanisms\n\nSpecify applicable law and include regulatory compliance requirements.',
          explanation: 'Enhanced vague contract request with comprehensive legal requirements',
          score_improvement: 0.72
        }
      ]
    };
  }

  private getDefaultRules(): DomainRule[] {
    // Implementation similar to SQL rules...
    return [];
  }
}
```

### Step 2: Register New Domain

```typescript
// src/types/prompt.ts
export enum PromptDomain {
  SQL = 'sql',
  BRANDING = 'branding',
  CINE = 'cine',
  SAAS = 'saas',
  DEVOPS = 'devops',
  LEGAL = 'legal',  // Add new domain
  GENERAL = 'general'
}
```

### Step 3: Update Rules Registry

```typescript
// src/rules/index.ts
import { LegalRules } from './legal.js';

export class DomainRulesRegistry {
  private rules = new Map<PromptDomain, any>([
    [PromptDomain.SQL, new SQLRules()],
    [PromptDomain.BRANDING, new BrandingRules()],
    [PromptDomain.CINE, new CineRules()],
    [PromptDomain.SAAS, new SaasRules()],
    [PromptDomain.DEVOPS, new DevopsRules()],
    [PromptDomain.LEGAL, new LegalRules()],  // Register new domain
    [PromptDomain.GENERAL, new GeneralRules()]
  ]);

  getRules(domain: PromptDomain): any {
    return this.rules.get(domain) || this.rules.get(PromptDomain.GENERAL);
  }
}
```

### Step 4: Add Comprehensive Tests

```typescript
// tests/unit/rules/legal.test.ts
describe('LegalRules', () => {
  let legalRules: LegalRules;

  beforeEach(() => {
    legalRules = new LegalRules();
  });

  describe('apply()', () => {
    it('should enhance vague contract requests', () => {
      // Arrange
      const prompt = 'write contract for software development';

      // Act
      const result = legalRules.apply(prompt);

      // Assert
      expect(result.refined).toContain('legally compliant');
      expect(result.refined).toContain('jurisdiction');
      expect(result.rulesApplied).toContain('legal_vague_terms');
      expect(result.improvements.length).toBeGreaterThan(0);
    });

    it('should add jurisdiction requirements', () => {
      // Arrange
      const prompt = 'create service agreement';

      // Act
      const result = legalRules.apply(prompt);

      // Assert
      expect(result.refined).toContain('governing jurisdiction');
      expect(result.rulesApplied).toContain('add_jurisdiction_requirements');
    });
  });

  describe('generateSystemPrompt()', () => {
    it('should generate appropriate legal system prompt', () => {
      // Act
      const systemPrompt = legalRules.generateSystemPrompt();

      // Assert
      expect(systemPrompt).toContain('legal counsel');
      expect(systemPrompt).toContain('Contract Law');
      expect(systemPrompt).toContain('not constitute legal advice');
    });
  });
});
```

### Step 5: Update MCP Server

```typescript
// src/server/index.ts - Add to domain enum validation
inputSchema: {
  properties: {
    domain: {
      type: 'string',
      enum: ['general', 'sql', 'branding', 'cine', 'saas', 'devops', 'legal'],
      description: 'The domain context for specialized processing',
      default: 'general'
    }
  }
}
```

---

## Contributing Features

### Feature Request Process

1. **Check Existing Issues**: Search for similar feature requests
2. **Create RFC**: For major features, create Request for Comments
3. **Design Discussion**: Discuss implementation approach
4. **Implementation**: Follow development workflow
5. **Documentation**: Update relevant documentation
6. **Review**: Code review and testing

### Major Feature Categories

#### MCP Tools

Adding new MCP tools requires:

```typescript
// 1. Add tool definition to server
{
  name: 'new_tool',
  description: 'Description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      // Define input parameters
    },
    required: ['required_params']
  }
}

// 2. Add handler method
private async handleNewTool(args: any) {
  // Validate inputs
  // Process request
  // Return standardized response
}

// 3. Add to request router
case 'new_tool':
  return await this.handleNewTool(args);
```

#### Scoring Algorithms

Adding new quality metrics:

```typescript
// 1. Define metric interface
interface NewQualityMetric {
  name: string;
  weight: number;
  calculate(prompt: string, analysis: AnalysisResult): number;
}

// 2. Implement metric
export class ReadabilityMetric implements NewQualityMetric {
  name = 'readability';
  weight = 0.15;

  calculate(prompt: string, analysis: AnalysisResult): number {
    // Implementation
    return score;
  }
}

// 3. Register in scorer
private metrics = [
  new ClarityMetric(),
  new SpecificityMetric(),
  new StructureMetric(),
  new CompletenessMetric(),
  new ReadabilityMetric()  // Add new metric
];
```

#### Template Types

Adding new template types:

```typescript
// 1. Extend template type enum
export enum TemplateType {
  BASIC = 'basic',
  CHAIN_OF_THOUGHT = 'chain-of-thought',
  FEW_SHOT = 'few-shot',
  ROLE_BASED = 'role-based',
  STEP_BY_STEP = 'step-by-step',
  MULTI_AGENT = 'multi-agent'  // New template type
}

// 2. Add template pattern
const templatePatterns: Record<TemplateType, string> = {
  // ... existing patterns
  [TemplateType.MULTI_AGENT]: `
Task: {{task_description}}

Agent 1 ({{agent_1_role}}):
{{agent_1_prompt}}

Agent 2 ({{agent_2_role}}):
{{agent_2_prompt}}

Collaboration Instructions:
{{collaboration_instructions}}
`
};

// 3. Add generation logic
private generateMultiAgentTemplate(prompt: string, variables: Record<string, any>): TemplateResult {
  // Implementation
}
```

---

## Code Review Process

### Review Checklist

#### Code Quality
- [ ] Code follows TypeScript best practices
- [ ] Proper error handling and logging
- [ ] No code duplication (DRY principle)
- [ ] Clear variable and function names
- [ ] Appropriate comments for complex logic

#### Testing
- [ ] Unit tests for new functionality
- [ ] Integration tests for service interactions
- [ ] Test coverage meets requirements (80%+)
- [ ] Edge cases and error scenarios covered

#### Performance
- [ ] No obvious performance bottlenecks
- [ ] Database queries are optimized
- [ ] Caching implemented where appropriate
- [ ] Memory usage is reasonable

#### Security
- [ ] Input validation implemented
- [ ] No sensitive data in logs
- [ ] SQL injection prevention
- [ ] Rate limiting considerations

#### Documentation
- [ ] Code is self-documenting
- [ ] Complex algorithms explained
- [ ] API changes documented
- [ ] README updated if needed

### Review Process

1. **Self-Review**: Author reviews own PR before submission
2. **Automated Checks**: CI/CD pipeline runs tests and linting
3. **Peer Review**: At least one team member reviews
4. **Approval**: Reviewer approves and merges
5. **Post-Merge**: Monitor for issues in development environment

### Review Guidelines

#### For Authors
- Keep PRs focused and reasonably sized (<500 lines)
- Write clear PR descriptions explaining changes
- Respond to feedback promptly and professionally
- Test changes thoroughly before submission

#### For Reviewers
- Focus on code correctness and maintainability
- Provide constructive feedback with examples
- Ask questions to understand design decisions
- Approve only when confident in the changes

---

## Release Process

### Versioning Strategy

We follow **Semantic Versioning** (SemVer):

- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backward compatible (1.0.0 → 1.0.1)

### Release Workflow

```bash
# 1. Prepare release branch
git checkout develop
git pull origin develop
git checkout -b release/1.2.0

# 2. Update version and changelog
npm version 1.2.0
npm run changelog:generate

# 3. Build and test
npm run build
npm run test:all
npm run test:e2e

# 4. Merge to main
git checkout main
git merge release/1.2.0
git tag v1.2.0
git push origin main --tags

# 5. Merge back to develop
git checkout develop
git merge main
git push origin develop

# 6. Publish to npm
npm publish
```

### Changelog Format

```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- New legal domain with contract optimization
- Multi-agent template type
- Advanced caching strategies

### Changed
- Improved SQL domain rule accuracy
- Updated scoring algorithm weights

### Fixed
- Fixed memory leak in template processing
- Resolved race condition in cache invalidation

### Security
- Updated dependencies with security patches
- Improved input validation

## [1.1.0] - 2023-12-20
...
```

### Pre-Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Performance benchmarks stable
- [ ] Security scan completed
- [ ] Changelog generated
- [ ] Version bumped
- [ ] Database migrations tested
- [ ] Backward compatibility verified

---

## Troubleshooting

### Common Development Issues

#### TypeScript Compilation Errors

```bash
# Clear TypeScript cache
rm -rf dist/
npm run clean
npm run build

# Check TypeScript configuration
npx tsc --showConfig

# Verify type definitions
npm run type-check
```

#### Test Failures

```bash
# Run specific test file
npm test -- tests/unit/core/analyzer.test.ts

# Run tests with verbose output
npm test -- --verbose

# Debug test with node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### Database Connection Issues

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Run migrations
npm run migrate

# Reset test database
npm run db:reset:test
```

#### Performance Issues

```bash
# Profile application
node --prof dist/cli.js
node --prof-process isolate-*.log > profile.txt

# Monitor memory usage
node --inspect dist/cli.js
# Open chrome://inspect in Chrome

# Analyze bundle size
npm run analyze:bundle
```

### Debugging Techniques

#### Enable Debug Logging

```bash
# Debug specific modules
DEBUG=promptsmith:orchestrator,promptsmith:analyzer npm run dev

# Debug all modules
DEBUG=promptsmith:* npm run dev

# Debug with timestamps
DEBUG=promptsmith:* DEBUG_COLORS=false npm run dev 2>&1 | ts '[%Y-%m-%d %H:%M:%S]'
```

#### Memory Debugging

```typescript
// Add memory monitoring
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`
  });
}, 5000);
```

#### Database Query Debugging

```typescript
// Enable query logging in Supabase client
const client = createClient(url, key, {
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'promptsmith-mcp-debug'
    }
  },
  // Enable debugging
  realtime: {
    logger: console.log
  }
});
```

### Getting Help

- **Documentation**: Check [docs/](../docs/) directory
- **GitHub Issues**: Search existing issues or create new one
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our developer Discord server
- **Email**: dev-support@promptsmith.dev

---

This development guide provides everything you need to contribute effectively to PromptSmith MCP Server. Happy coding! 🚀