# PromptSmith MCP API Reference

Complete documentation for all 8 MCP tools provided by PromptSmith server.

## Overview

PromptSmith exposes 8 MCP tools that cover the complete prompt lifecycle: processing, evaluation, comparison, storage, search, and system management. Each tool follows consistent patterns with comprehensive error handling and validation.

## Quick Reference

| Tool | Purpose | Complexity | Use Case |
|------|---------|------------|----------|
| [`process_prompt`](#process_prompt) | Transform vibecoding → optimized prompts | High | Primary prompt optimization |
| [`evaluate_prompt`](#evaluate_prompt) | Analyze prompt quality with scoring | Medium | Quality assessment |
| [`compare_prompts`](#compare_prompts) | A/B test multiple prompt variants | Medium | Prompt variant testing |
| [`save_prompt`](#save_prompt) | Store prompts in knowledge base | Low | Prompt library management |
| [`search_prompts`](#search_prompts) | Find existing prompts | Low | Knowledge base queries |
| [`get_prompt`](#get_prompt) | Retrieve specific prompt by ID | Low | Individual prompt access |
| [`get_stats`](#get_stats) | System statistics and metrics | Low | Performance monitoring |
| [`validate_prompt`](#validate_prompt) | Check for common prompt issues | Medium | Quality validation |

---

## process_prompt

**Purpose**: Transform raw "vibecoding" prompts into optimized, structured instructions with domain-specific enhancements.

### Input Schema

```typescript
{
  raw: string;                    // Required: Raw prompt text to process
  domain?: PromptDomain;          // Optional: Domain for specialized processing
  tone?: PromptTone;              // Optional: Desired tone for output
  context?: string;               // Optional: Additional context
  variables?: Record<string, any>; // Optional: Template variables
  targetModel?: string;           // Optional: Target LLM (e.g., "gpt-4", "claude-3")
  maxTokens?: number;             // Optional: Token limit for processing
  temperature?: number;           // Optional: Creativity level (0-2)
}
```

#### Domain Values
```typescript
'general' | 'sql' | 'branding' | 'cine' | 'saas' | 'devops'
```

#### Tone Values
```typescript
'professional' | 'casual' | 'technical' | 'creative' | 'formal'
```

### Output Schema

```typescript
{
  success: boolean;
  data: {
    original: string;             // Original input prompt
    refined: string;              // Optimized prompt text
    system: string;               // Generated system prompt
    analysis: AnalysisResult;     // Detailed prompt analysis
    score: QualityScore;          // Multi-dimensional quality metrics
    validation: ValidationResult; // Validation results and suggestions
    suggestions: string[];        // Actionable improvement suggestions
    metadata: ProcessMetadata;    // Processing information
    template?: TemplateResult;    // Generated template (if applicable)
    examples?: ExampleResult[];   // Generated examples (if beneficial)
  }
}
```

#### Quality Score Structure
```typescript
{
  clarity: number;        // 0-1: Language precision and clarity
  specificity: number;    // 0-1: Technical detail and completeness
  structure: number;      // 0-1: Organization and readability
  completeness: number;   // 0-1: Requirement coverage
  overall: number;        // 0-1: Weighted average
}
```

#### Process Metadata
```typescript
{
  domain: PromptDomain;
  tone?: PromptTone;
  processingTime: number;   // Processing time in milliseconds
  version: string;          // PromptSmith version used
  modelUsed?: string;       // Target model specified
  cacheHit: boolean;        // Whether result was cached
  rulesApplied: string[];   // Applied domain rules
  templateUsed?: string;    // Template type if generated
}
```

### Usage Examples

#### Basic Usage
```typescript
const result = await mcp.call('process_prompt', {
  raw: "necesito una tabla sql bonita para ventas",
  domain: "sql",
  tone: "technical"
});

console.log(result.data.refined);
// "Create a well-structured PostgreSQL sales database schema including:
// - Products table with SKU, name, price, inventory tracking
// - Customers table with contact details and segmentation
// - Orders table linking customers to products with timestamps
// - Include appropriate indexes, foreign keys, and sample data"

console.log(result.data.score);
// { clarity: 0.92, specificity: 0.89, structure: 0.95, completeness: 0.87, overall: 0.91 }
```

#### Advanced Usage with Variables
```typescript
const result = await mcp.call('process_prompt', {
  raw: "create user auth system",
  domain: "saas",
  tone: "technical",
  context: "B2B SaaS application with team management",
  variables: {
    auth_method: "{{auth_provider}}",
    user_model: "{{user_schema}}",
    team_model: "{{organization_schema}}"
  },
  targetModel: "claude-3-sonnet"
});

console.log(result.data.template);
// Generated Liquid template with variable placeholders
```

#### Domain-Specific Processing
```typescript
// Cinema Domain
const cineResult = await mcp.call('process_prompt', {
  raw: "escena dramática en hospital",
  domain: "cine",
  tone: "creative"
});

// DevOps Domain
const devopsResult = await mcp.call('process_prompt', {
  raw: "deploy script for api",
  domain: "devops",
  tone: "technical",
  context: "Kubernetes cluster with CI/CD pipeline"
});

// Branding Domain
const brandingResult = await mcp.call('process_prompt', {
  raw: "marketing copy for launch",
  domain: "branding",
  tone: "creative",
  context: "Tech startup, developer audience"
});
```

### Error Handling

```typescript
// Handle validation errors
try {
  const result = await mcp.call('process_prompt', {
    raw: "", // Empty string will fail validation
    domain: "sql"
  });
} catch (error) {
  if (error.code === 'INVALID_PARAMS') {
    console.log('Validation failed:', error.message);
    // "Raw prompt is required and must be a string"
  }
}

// Handle processing errors
try {
  const result = await mcp.call('process_prompt', {
    raw: "very complex prompt that might fail processing",
    domain: "general"
  });
} catch (error) {
  if (error.code === 'INTERNAL_ERROR') {
    console.log('Processing failed:', error.message);
  }
}
```

---

## evaluate_prompt

**Purpose**: Analyze and score existing prompts across multiple quality dimensions with detailed feedback.

### Input Schema

```typescript
{
  prompt: string;           // Required: Prompt text to evaluate
  criteria?: string[];      // Optional: Specific evaluation criteria
  domain?: PromptDomain;    // Optional: Domain context for evaluation
}
```

#### Criteria Options
```typescript
[
  'clarity',        // Language precision and understandability
  'specificity',    // Technical detail and precision
  'structure',      // Organization and flow
  'completeness',   // Requirement coverage
  'actionability',  // Clear action items
  'consistency',    // Internal consistency
  'domain_adherence' // Domain-specific best practices
]
```

### Output Schema

```typescript
{
  success: boolean;
  data: {
    score: QualityScore;              // Multi-dimensional scores
    breakdown: QualityBreakdown;      // Detailed scoring factors
    recommendations: Recommendation[];  // Improvement suggestions
    comparisons?: ComparisonMetric[];  // Benchmarking data
  }
}
```

#### Quality Breakdown
```typescript
{
  clarity: {
    score: number;
    factors: QualityFactor[];
  };
  specificity: {
    score: number;
    factors: QualityFactor[];
  };
  structure: {
    score: number;
    factors: QualityFactor[];
  };
  completeness: {
    score: number;
    factors: QualityFactor[];
  };
}
```

#### Quality Factor
```typescript
{
  name: string;           // Factor name (e.g., "Technical Terminology")
  weight: number;         // Factor weight in scoring (0-1)
  score: number;          // Individual factor score (0-1)
  description: string;    // Human-readable explanation
}
```

#### Recommendation Types
```typescript
{
  type: 'critical' | 'important' | 'suggestion';
  title: string;          // Short recommendation title
  description: string;    // Detailed explanation
  before?: string;        // Example of problematic text
  after?: string;         // Example of improved text
  impact: 'high' | 'medium' | 'low';
}
```

### Usage Examples

#### Basic Evaluation
```typescript
const result = await mcp.call('evaluate_prompt', {
  prompt: "Generate a SQL table for storing user data with proper indexing",
  domain: "sql"
});

console.log(result.data.score);
// { clarity: 0.75, specificity: 0.60, structure: 0.80, completeness: 0.65, overall: 0.70 }

console.log(result.data.recommendations);
// [
//   {
//     type: "important",
//     title: "Add Specificity",
//     description: "Specify column names, data types, and indexing strategy",
//     impact: "high"
//   }
// ]
```

#### Targeted Evaluation with Criteria
```typescript
const result = await mcp.call('evaluate_prompt', {
  prompt: "Create a modern, responsive login form with validation",
  criteria: ["specificity", "actionability", "completeness"],
  domain: "saas"
});

// Returns focused evaluation on specified criteria
console.log(result.data.breakdown.specificity);
// {
//   score: 0.45,
//   factors: [
//     {
//       name: "Technical Implementation Details",
//       weight: 0.3,
//       score: 0.2,
//       description: "Missing specific validation rules and UI framework"
//     }
//   ]
// }
```

#### Domain-Specific Evaluation
```typescript
// Cinema domain evaluation
const cineEval = await mcp.call('evaluate_prompt', {
  prompt: "Write a dramatic scene between two characters",
  domain: "cine"
});

// DevOps domain evaluation
const devopsEval = await mcp.call('evaluate_prompt', {
  prompt: "Set up monitoring for microservices",
  domain: "devops",
  criteria: ["specificity", "completeness"]
});
```

---

## compare_prompts

**Purpose**: A/B test multiple prompt variants to identify the best performer with detailed analysis.

### Input Schema

```typescript
{
  variants: string[];       // Required: Array of prompt variants (min 2)
  testInput?: string;       // Optional: Test input for comparison context
}
```

### Output Schema

```typescript
{
  success: boolean;
  data: {
    variants: PromptVariant[];      // Evaluated variants with scores
    winner?: string;                // ID of best-performing variant
    metrics: ComparisonMetric[];    // Cross-variant comparison metrics
    summary: string;                // Human-readable summary
  }
}
```

#### Prompt Variant Structure
```typescript
{
  id: string;                 // Variant identifier (e.g., "variant_0")
  prompt: string;             // Original prompt text
  score: QualityScore;        // Quality scores
  metrics: VariantMetric[];   // Individual variant metrics
}
```

#### Variant Metrics
```typescript
{
  name: string;               // Metric name
  value: number;              // Metric value
  unit: string;               // Unit of measurement
  better: 'higher' | 'lower' | 'optimal' | 'balanced';
}
```

#### Comparison Metrics
```typescript
{
  name: string;                     // Comparison dimension
  values: Record<string, number>;   // Values for each variant
  winner: string;                   // Best variant for this metric
  significance: number;             // Statistical significance (0-1)
}
```

### Usage Examples

#### Basic Comparison
```typescript
const result = await mcp.call('compare_prompts', {
  variants: [
    "Generate a SQL table for users",
    "Create a PostgreSQL user authentication schema with security considerations",
    "Design a scalable user database table with proper indexing and relationships"
  ]
});

console.log(result.data.winner);
// "variant_1"

console.log(result.data.summary);
// "variant_1 achieved the highest quality score of 87.5% (average: 73.2%).
//  Key advantages include better specificity and completeness."

console.log(result.data.variants[1].score);
// { clarity: 0.85, specificity: 0.92, structure: 0.88, completeness: 0.85, overall: 0.875 }
```

#### Advanced Comparison with Test Input
```typescript
const result = await mcp.call('compare_prompts', {
  variants: [
    "Create a user registration form",
    "Build a secure user signup form with email verification",
    "Develop a multi-step user registration flow with validation and confirmation"
  ],
  testInput: "SaaS application with team management features"
});

// Comparison considers how well each variant handles the test input
console.log(result.data.metrics);
// [
//   {
//     name: "Overall Quality",
//     values: { "variant_0": 0.65, "variant_1": 0.82, "variant_2": 0.78 },
//     winner: "variant_1",
//     significance: 0.17
//   },
//   {
//     name: "Context Relevance",
//     values: { "variant_0": 0.45, "variant_1": 0.75, "variant_2": 0.85 },
//     winner: "variant_2",
//     significance: 0.40
//   }
// ]
```

#### Detailed Variant Analysis
```typescript
const result = await mcp.call('compare_prompts', {
  variants: [
    "Write deployment script",
    "Create automated deployment pipeline with rollback capability",
    "Build comprehensive CI/CD deployment solution with monitoring"
  ]
});

// Access detailed metrics for each variant
result.data.variants.forEach(variant => {
  console.log(`${variant.id} metrics:`);
  variant.metrics.forEach(metric => {
    console.log(`  ${metric.name}: ${metric.value} ${metric.unit}`);
  });
});

// Output:
// variant_0 metrics:
//   Length: 23 characters
//   Complexity: 0.25 score
//   Readability: 0.85 score
//   Error Count: 0 count
//
// variant_1 metrics:
//   Length: 67 characters
//   Complexity: 0.65 score
//   Readability: 0.78 score
//   Error Count: 0 count
```

---

## save_prompt

**Purpose**: Store refined prompts in the knowledge base for reuse and sharing.

### Input Schema

```typescript
{
  prompt: string;           // Required: Refined prompt to save
  metadata: {               // Required: Prompt metadata
    domain: PromptDomain;   // Required: Domain classification
    description?: string;   // Optional: Purpose description
    tags?: string[];        // Optional: Categorization tags
    isPublic?: boolean;     // Optional: Public visibility (default: false)
    author?: string;        // Optional: Author name
    version?: string;       // Optional: Version identifier (default: "1.0.0")
  }
}
```

### Output Schema

```typescript
{
  success: boolean;
  data: SavedPrompt;        // Complete saved prompt object
}
```

#### Saved Prompt Structure
```typescript
{
  id: string;               // Unique prompt identifier
  name: string;             // Generated or provided name
  domain: PromptDomain;     // Domain classification
  tags: string[];           // Applied tags
  description?: string;     // Prompt description
  prompt: string;           // Saved prompt text
  systemPrompt?: string;    // Generated system prompt
  score: QualityScore;      // Quality assessment
  metadata: SaveMetadata;   // Complete metadata
  createdAt: Date;          // Creation timestamp
  updatedAt: Date;          // Last update timestamp
}
```

### Usage Examples

#### Basic Save
```typescript
const result = await mcp.call('save_prompt', {
  prompt: "Create a PostgreSQL user authentication schema with email verification, password hashing, and role-based permissions including indexes for optimal query performance",
  metadata: {
    domain: "sql",
    description: "User authentication database schema for web applications",
    tags: ["authentication", "postgresql", "security", "schema"],
    isPublic: false,
    author: "Developer Team",
    version: "1.0.0"
  }
});

console.log(result.data.id);
// "prompt_abc123def456"

console.log(result.data.score);
// { clarity: 0.88, specificity: 0.92, structure: 0.85, completeness: 0.90, overall: 0.89 }
```

#### Save with Public Sharing
```typescript
const result = await mcp.call('save_prompt', {
  prompt: "Write a compelling product launch announcement that highlights key features, addresses target audience pain points, and includes a clear call-to-action with urgency elements",
  metadata: {
    domain: "branding",
    description: "Product launch announcement template for SaaS companies",
    tags: ["marketing", "launch", "announcement", "saas"],
    isPublic: true,          // Make available for community search
    author: "Marketing Team",
    version: "2.1.0"
  }
});

// Prompt becomes searchable by other users
console.log(result.data.metadata.isPublic);
// true
```

#### Save Template-Ready Prompt
```typescript
const result = await mcp.call('save_prompt', {
  prompt: "Deploy {{application_name}} to {{environment}} environment using {{deployment_strategy}} with {{monitoring_level}} monitoring and {{rollback_policy}} rollback configuration",
  metadata: {
    domain: "devops",
    description: "Configurable deployment prompt template",
    tags: ["deployment", "template", "devops", "automation"],
    isPublic: true
  }
});

// Saved prompt can be used as template with variable substitution
```

---

## search_prompts

**Purpose**: Find existing prompts in the knowledge base using queries, filters, and sorting.

### Input Schema

```typescript
{
  query?: string;           // Optional: Text search query
  domain?: PromptDomain;    // Optional: Filter by domain
  tags?: string[];          // Optional: Filter by tags (AND logic)
  minScore?: number;        // Optional: Minimum quality score (0-1)
  sortBy?: SortOption;      // Optional: Sort criteria
  limit?: number;           // Optional: Max results (1-100, default: 20)
  offset?: number;          // Optional: Pagination offset (default: 0)
  isPublic?: boolean;       // Optional: Filter by visibility
}
```

#### Sort Options
```typescript
'score' | 'created' | 'updated' | 'relevance'
```

### Output Schema

```typescript
{
  success: boolean;
  data: {
    results: SearchResult[];    // Found prompts
    total: number;              // Total result count
    params: SearchParams;       // Applied search parameters
  }
}
```

#### Search Result Structure
```typescript
{
  id: string;                 // Prompt ID
  name: string;               // Prompt name
  domain: PromptDomain;       // Domain classification
  tags: string[];             // Applied tags
  description?: string;       // Prompt description
  prompt: string;             // Prompt text (may be truncated)
  score: QualityScore;        // Quality metrics
  usage: UsageStats;          // Usage statistics
  createdAt: Date;            // Creation date
  relevance: number;          // Search relevance score (0-1)
}
```

#### Usage Statistics
```typescript
{
  count: number;              // Times used
  successRate: number;        // Success rate (0-1)
  avgResponseTime: number;    // Average response time (ms)
  lastUsed: Date;             // Last usage timestamp
}
```

### Usage Examples

#### Basic Text Search
```typescript
const result = await mcp.call('search_prompts', {
  query: "SQL user table authentication",
  limit: 10
});

console.log(`Found ${result.data.results.length} results`);
result.data.results.forEach(prompt => {
  console.log(`${prompt.name} (score: ${prompt.score.overall}, relevance: ${prompt.relevance})`);
});
```

#### Domain and Tag Filtering
```typescript
const result = await mcp.call('search_prompts', {
  domain: "sql",
  tags: ["authentication", "security"],
  minScore: 0.8,
  sortBy: "score",
  limit: 5
});

// Returns high-quality SQL authentication prompts only
console.log(result.data.results);
```

#### Advanced Search with Sorting
```typescript
const result = await mcp.call('search_prompts', {
  query: "deployment pipeline",
  domain: "devops",
  sortBy: "updated",          // Most recently updated first
  isPublic: true,             // Public prompts only
  offset: 0,
  limit: 20
});

console.log(`Search parameters:`, result.data.params);
console.log(`Total results: ${result.data.total}`);
```

#### Pagination Example
```typescript
// Get first page
const page1 = await mcp.call('search_prompts', {
  domain: "saas",
  sortBy: "score",
  limit: 10,
  offset: 0
});

// Get second page
const page2 = await mcp.call('search_prompts', {
  domain: "saas",
  sortBy: "score",
  limit: 10,
  offset: 10
});

console.log(`Page 1: ${page1.data.results.length} results`);
console.log(`Page 2: ${page2.data.results.length} results`);
```

---

## get_prompt

**Purpose**: Retrieve a specific prompt by its unique identifier with complete details.

### Input Schema

```typescript
{
  id: string;               // Required: Prompt unique identifier
}
```

### Output Schema

```typescript
{
  success: boolean;
  data: SavedPrompt;        // Complete prompt object
}
```

### Usage Examples

#### Basic Retrieval
```typescript
const result = await mcp.call('get_prompt', {
  id: "prompt_abc123def456"
});

console.log(result.data.prompt);        // Full prompt text
console.log(result.data.systemPrompt);  // Associated system prompt
console.log(result.data.score);         // Quality scores
console.log(result.data.metadata);      // Complete metadata
```

#### Error Handling
```typescript
try {
  const result = await mcp.call('get_prompt', {
    id: "nonexistent_id"
  });
} catch (error) {
  if (error.code === 'INVALID_PARAMS') {
    console.log('Prompt not found:', error.message);
    // "Prompt with ID nonexistent_id not found"
  }
}
```

---

## get_stats

**Purpose**: Retrieve comprehensive system statistics and performance metrics.

### Input Schema

```typescript
{
  days?: number;            // Optional: Stats time range (1-365, default: 7)
}
```

### Output Schema

```typescript
{
  success: boolean;
  data: {
    store: StoreStats;          // Database statistics
    telemetry: TelemetryStats;  // Usage analytics
    health: HealthCheck;        // System health status
    system: SystemInfo;         // Server information
  }
}
```

#### Store Statistics
```typescript
{
  totalPrompts: number;       // Total stored prompts
  publicPrompts: number;      // Public prompts count
  domains: Record<string, number>; // Prompts per domain
  avgQualityScore: number;    // Average quality score
  topTags: Array<{tag: string, count: number}>; // Most used tags
}
```

#### Telemetry Statistics
```typescript
{
  totalRequests: number;      // Total API requests
  requestsByTool: Record<string, number>; // Usage by tool
  avgResponseTime: number;    // Average response time (ms)
  cacheHitRate: number;       // Cache effectiveness (0-1)
  errorRate: number;          // Error rate (0-1)
  peakUsageHour: number;      // Peak usage hour (0-23)
}
```

#### Health Check
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: ServiceHealth;   // Database connection status
    cache: ServiceHealth;      // Redis cache status
    external: ServiceHealth;   // External API status
  };
  lastCheck: Date;
}
```

#### System Information
```typescript
{
  name: string;              // Server name
  version: string;           // PromptSmith version
  uptime: number;            // Server uptime (seconds)
  memory: NodeJS.MemoryUsage; // Memory usage stats
  timestamp: string;         // Current timestamp
}
```

### Usage Examples

#### Basic Statistics
```typescript
const result = await mcp.call('get_stats');

console.log('System Health:', result.data.health.status);
console.log('Total Prompts:', result.data.store.totalPrompts);
console.log('Cache Hit Rate:', result.data.telemetry.cacheHitRate);
console.log('Average Response Time:', result.data.telemetry.avgResponseTime, 'ms');
```

#### Extended Time Range
```typescript
const result = await mcp.call('get_stats', {
  days: 30  // Get 30-day statistics
});

console.log('30-Day Statistics:');
console.log('Total Requests:', result.data.telemetry.totalRequests);
console.log('Most Used Tool:',
  Object.entries(result.data.telemetry.requestsByTool)
    .sort(([,a], [,b]) => b - a)[0]
);
```

#### Health Monitoring
```typescript
const result = await mcp.call('get_stats');

const health = result.data.health;
if (health.status !== 'healthy') {
  console.log('System Health Issue:');
  Object.entries(health.services).forEach(([service, status]) => {
    if (status.status !== 'healthy') {
      console.log(`${service}: ${status.status} - ${status.message}`);
    }
  });
}
```

---

## validate_prompt

**Purpose**: Check prompts for common issues, best practices violations, and improvement opportunities.

### Input Schema

```typescript
{
  prompt: string;           // Required: Prompt text to validate
  domain?: PromptDomain;    // Optional: Domain context (default: 'general')
}
```

### Output Schema

```typescript
{
  success: boolean;
  data: {
    isValid: boolean;             // Overall validation result
    errors: ValidationError[];    // Critical issues found
    warnings: ValidationWarning[]; // Non-critical issues
    suggestions: ValidationSuggestion[]; // Improvement opportunities
    analysis: {                   // Analysis summary
      complexity: number;         // Complexity score
      readabilityScore: number;   // Readability assessment
      ambiguityScore: number;     // Ambiguity level
      technicalTerms: number;     // Technical term count
      domainHints: string[];      // Detected domain indicators
    }
  }
}
```

#### Validation Error
```typescript
{
  code: string;             // Error code identifier
  message: string;          // Human-readable error message
  severity: 'low' | 'medium' | 'high' | 'critical';
  position?: {              // Optional: Error location in text
    start: number;
    end: number;
  };
}
```

#### Validation Warning
```typescript
{
  code: string;             // Warning code identifier
  message: string;          // Warning description
  suggestion: string;       // How to address the warning
  position?: {              // Optional: Warning location
    start: number;
    end: number;
  };
}
```

#### Validation Suggestion
```typescript
{
  type: 'enhancement' | 'fix' | 'optimization';
  message: string;          // Suggestion description
  before?: string;          // Current problematic text
  after?: string;           // Suggested improvement
}
```

### Usage Examples

#### Basic Validation
```typescript
const result = await mcp.call('validate_prompt', {
  prompt: "create table for users",
  domain: "sql"
});

console.log('Is Valid:', result.data.isValid);
console.log('Errors:', result.data.errors.length);
console.log('Warnings:', result.data.warnings.length);
console.log('Suggestions:', result.data.suggestions.length);

// Example output:
// Is Valid: false
// Errors: 0
// Warnings: 2
// Suggestions: 3
```

#### Detailed Error Analysis
```typescript
const result = await mcp.call('validate_prompt', {
  prompt: "",  // Empty prompt
  domain: "general"
});

console.log(result.data.errors);
// [
//   {
//     code: "EMPTY_PROMPT",
//     message: "Prompt cannot be empty",
//     severity: "critical"
//   }
// ]
```

#### Domain-Specific Validation
```typescript
const result = await mcp.call('validate_prompt', {
  prompt: "write some code for authentication",
  domain: "saas"
});

console.log(result.data.warnings);
// [
//   {
//     code: "VAGUE_REQUIREMENTS",
//     message: "Prompt lacks specific technical requirements",
//     suggestion: "Specify authentication method, user model, and security requirements"
//   }
// ]

console.log(result.data.suggestions);
// [
//   {
//     type: "enhancement",
//     message: "Add specific programming language and framework",
//     before: "write some code",
//     after: "write TypeScript code using Express.js"
//   }
// ]
```

#### Analysis Summary
```typescript
const result = await mcp.call('validate_prompt', {
  prompt: "Generate a comprehensive PostgreSQL database schema for an e-commerce platform including product catalog, user management, order processing, and inventory tracking with appropriate relationships and constraints",
  domain: "sql"
});

console.log(result.data.analysis);
// {
//   complexity: 0.85,
//   readabilityScore: 0.78,
//   ambiguityScore: 0.15,
//   technicalTerms: 8,
//   domainHints: ["postgresql", "database", "schema", "e-commerce"]
// }
```

---

## Error Handling

All tools follow consistent error patterns:

### Common Error Codes

- **`INVALID_PARAMS`**: Invalid input parameters or validation failure
- **`INTERNAL_ERROR`**: Server processing error
- **`METHOD_NOT_FOUND`**: Invalid tool name
- **`RATE_LIMITED`**: Too many requests
- **`SERVICE_UNAVAILABLE`**: External service dependency failure

### Error Response Format

```typescript
{
  error: {
    code: string;           // Error code
    message: string;        // Error description
    details?: any;          // Additional error context
  }
}
```

### Error Handling Example

```typescript
try {
  const result = await mcp.call('process_prompt', {
    raw: "test prompt",
    domain: "invalid_domain"  // Invalid domain
  });
} catch (error) {
  switch (error.code) {
    case 'INVALID_PARAMS':
      console.log('Input validation failed:', error.message);
      break;
    case 'INTERNAL_ERROR':
      console.log('Processing error:', error.message);
      break;
    case 'RATE_LIMITED':
      console.log('Too many requests. Please retry later.');
      break;
    default:
      console.log('Unexpected error:', error);
  }
}
```

---

## Best Practices

### Performance Optimization

1. **Use Caching**: Identical inputs return cached results
2. **Batch Operations**: Use `compare_prompts` for multiple variants
3. **Appropriate Domains**: Specify domain for better optimization
4. **Reasonable Limits**: Use pagination for large search results

### Quality Guidelines

1. **Specific Domains**: Use specialized domains when applicable
2. **Context Provision**: Include relevant context for better results
3. **Iterative Improvement**: Use evaluation and validation for refinement
4. **Template Usage**: Leverage variables for reusable prompts

### Error Handling

1. **Validate Inputs**: Check required parameters before calling
2. **Handle Failures Gracefully**: Implement proper error handling
3. **Retry Logic**: Implement exponential backoff for transient failures
4. **Monitor Performance**: Use `get_stats` for system monitoring

---

## Rate Limits

Default rate limits apply to prevent abuse:

- **Processing Tools** (`process_prompt`, `evaluate_prompt`, `compare_prompts`): 60 requests/hour
- **Storage Tools** (`save_prompt`): 100 requests/hour
- **Read-Only Tools** (`search_prompts`, `get_prompt`, `validate_prompt`): 1000 requests/hour
- **Admin Tools** (`get_stats`): 10 requests/hour

Rate limits are enforced per client and reset hourly. Contact support for enterprise rate limit increases.