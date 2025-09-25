import { z } from 'zod';
import { PromptDomain, PromptTone } from './prompt.js';

// MCP Tool input schemas
export const RefinePromptInputSchema = z.object({
  raw: z.string().min(1).max(10000).describe("Raw vibecoding prompt"),
  domain: z.nativeEnum(PromptDomain).optional().describe("Target domain for optimization"),
  tone: z.nativeEnum(PromptTone).optional().describe("Desired tone of the refined prompt"),
  context: z.string().optional().describe("Additional context for refinement"),
  variables: z.record(z.string()).optional().describe("Template variables"),
  targetModel: z.string().optional().describe("Target LLM model"),
  includeExamples: z.boolean().optional().describe("Include few-shot examples"),
  includeChainOfThought: z.boolean().optional().describe("Include chain of thought reasoning")
});

export const EvaluatePromptInputSchema = z.object({
  prompt: z.string().min(1).describe("Prompt to evaluate"),
  criteria: z.array(z.enum(['clarity', 'specificity', 'structure', 'completeness'])).optional().describe("Evaluation criteria"),
  domain: z.nativeEnum(PromptDomain).optional().describe("Domain context for evaluation"),
  compareWith: z.string().optional().describe("Compare with another prompt")
});

export const ComparePromptsInputSchema = z.object({
  variants: z.array(z.string()).min(2).max(5).describe("Prompt variants to compare"),
  testInput: z.string().optional().describe("Test input for comparison"),
  criteria: z.array(z.string()).optional().describe("Comparison criteria"),
  domain: z.nativeEnum(PromptDomain).optional().describe("Domain context")
});

export const SavePromptInputSchema = z.object({
  prompt: z.string().min(1).describe("Prompt to save"),
  metadata: z.object({
    name: z.string().min(1).max(100).describe("Prompt name"),
    domain: z.string().optional().describe("Domain category"),
    tags: z.array(z.string()).optional().describe("Tags for categorization"),
    description: z.string().max(500).optional().describe("Description of the prompt"),
    category: z.string().optional().describe("Subcategory within domain"),
    isPublic: z.boolean().default(false).describe("Make prompt publicly available")
  }).describe("Prompt metadata")
});

export const SearchPromptsInputSchema = z.object({
  query: z.string().optional().describe("Search query"),
  domain: z.string().optional().describe("Filter by domain"),
  tags: z.array(z.string()).optional().describe("Filter by tags"),
  category: z.string().optional().describe("Filter by category"),
  minScore: z.number().min(0).max(1).optional().describe("Minimum quality score"),
  limit: z.number().min(1).max(50).default(10).describe("Maximum results"),
  includePrivate: z.boolean().default(false).describe("Include private prompts")
});

export const AnalyzePromptInputSchema = z.object({
  prompt: z.string().min(1).describe("Prompt to analyze"),
  deep: z.boolean().optional().describe("Perform deep analysis"),
  includeSuggestions: z.boolean().default(true).describe("Include improvement suggestions")
});

export const OptimizePromptInputSchema = z.object({
  prompt: z.string().min(1).describe("Prompt to optimize"),
  objective: z.enum(['clarity', 'brevity', 'specificity', 'engagement']).optional().describe("Optimization objective"),
  constraints: z.object({
    maxLength: z.number().optional().describe("Maximum length constraint"),
    tone: z.nativeEnum(PromptTone).optional().describe("Required tone"),
    includeVariables: z.boolean().optional().describe("Include template variables")
  }).optional().describe("Optimization constraints")
});

export const GenerateVariantsInputSchema = z.object({
  basePrompt: z.string().min(1).describe("Base prompt for variants"),
  count: z.number().min(1).max(5).default(3).describe("Number of variants to generate"),
  diversity: z.enum(['low', 'medium', 'high']).default('medium').describe("Diversity level"),
  domain: z.nativeEnum(PromptDomain).optional().describe("Domain context")
});

export const TestPromptInputSchema = z.object({
  prompt: z.string().min(1).describe("Prompt to test"),
  testCases: z.array(z.object({
    input: z.string().describe("Test input"),
    expectedType: z.string().optional().describe("Expected response type"),
    criteria: z.array(z.string()).optional().describe("Success criteria")
  })).describe("Test cases"),
  model: z.string().optional().describe("Model to use for testing")
});

// MCP Tool output types
export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface RefinePromptOutput {
  original: string;
  refined: string;
  system: string;
  improvements: Array<{
    type: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  score: {
    before: number;
    after: number;
    improvement: number;
  };
  suggestions: string[];
  metadata: {
    domain: string;
    processingTime: number;
    rulesApplied: string[];
    templateUsed?: string;
  };
}

export interface EvaluatePromptOutput {
  score: {
    clarity: number;
    specificity: number;
    structure: number;
    completeness: number;
    overall: number;
  };
  breakdown: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  metrics: {
    wordCount: number;
    sentenceCount: number;
    readabilityScore: number;
    complexityLevel: 'low' | 'medium' | 'high';
  };
  recommendations: Array<{
    type: 'critical' | 'important' | 'suggestion';
    message: string;
    example?: string;
  }>;
}

export interface ComparePromptsOutput {
  winner: {
    index: number;
    prompt: string;
    score: number;
    reasons: string[];
  };
  comparison: Array<{
    index: number;
    prompt: string;
    scores: Record<string, number>;
    pros: string[];
    cons: string[];
  }>;
  summary: string;
  recommendations: string[];
}

export interface SavePromptOutput {
  id: string;
  message: string;
  url?: string;
  metadata: {
    name: string;
    domain?: string;
    tags: string[];
    createdAt: string;
  };
}

export interface SearchPromptsOutput {
  results: Array<{
    id: string;
    name: string;
    domain: string;
    tags: string[];
    description?: string;
    prompt: string;
    score: number;
    usage: {
      count: number;
      rating: number;
    };
    createdAt: string;
    relevance: number;
  }>;
  total: number;
  query: string;
  filters: Record<string, any>;
}

export interface AnalyzePromptOutput {
  analysis: {
    language: string;
    intent: {
      primary: string;
      confidence: number;
      alternatives: string[];
    };
    entities: Array<{
      text: string;
      type: string;
      confidence: number;
    }>;
    sentiment: {
      polarity: number;
      subjectivity: number;
    };
    complexity: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
    };
  };
  quality: {
    clarity: number;
    specificity: number;
    actionability: number;
  };
  suggestions: Array<{
    type: 'enhancement' | 'fix' | 'optimization';
    message: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface OptimizePromptOutput {
  original: string;
  optimized: string;
  changes: Array<{
    type: 'addition' | 'removal' | 'modification';
    description: string;
    before?: string;
    after?: string;
  }>;
  metrics: {
    lengthReduction: number;
    clarityImprovement: number;
    specificityImprovement: number;
  };
  objective: string;
  constraintsSatisfied: boolean;
}

export interface GenerateVariantsOutput {
  basePrompt: string;
  variants: Array<{
    id: string;
    prompt: string;
    approach: string;
    score: number;
    differences: string[];
  }>;
  diversity: {
    lexical: number;
    semantic: number;
    structural: number;
  };
  recommendations: string[];
}

export interface TestPromptOutput {
  prompt: string;
  model: string;
  results: Array<{
    testCase: {
      input: string;
      expectedType?: string;
      criteria?: string[];
    };
    response: {
      text: string;
      tokens: number;
      time: number;
    };
    evaluation: {
      success: boolean;
      score: number;
      feedback: string[];
    };
  }>;
  summary: {
    totalTests: number;
    passed: number;
    averageScore: number;
    averageTime: number;
    totalTokens: number;
  };
}

// Error types
export interface MCPError {
  code: string;
  message: string;
  details?: any;
}

export const MCPErrorCodes = {
  INVALID_INPUT: 'invalid_input',
  PROCESSING_ERROR: 'processing_error',
  API_ERROR: 'api_error',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  UNAUTHORIZED: 'unauthorized',
  NOT_FOUND: 'not_found',
  INTERNAL_ERROR: 'internal_error'
} as const;

// Type guards
export const isMCPError = (error: any): error is MCPError => {
  return error && typeof error === 'object' && 'code' in error && 'message' in error;
};

// MCP Resource types
export interface PromptResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface TemplateResource {
  uri: string;
  name: string;
  domain: PromptDomain;
  variables: string[];
  description?: string;
}

// MCP Server capabilities
export interface ServerCapabilities {
  tools: {
    refine_prompt: boolean;
    evaluate_prompt: boolean;
    compare_prompts: boolean;
    save_prompt: boolean;
    search_prompts: boolean;
    analyze_prompt: boolean;
    optimize_prompt: boolean;
    generate_variants: boolean;
    test_prompt: boolean;
  };
  resources: {
    templates: boolean;
    examples: boolean;
    rules: boolean;
  };
  prompts: {
    system_prompts: boolean;
    domain_prompts: boolean;
  };
}

// Type exports
export type RefinePromptInput = z.infer<typeof RefinePromptInputSchema>;
export type EvaluatePromptInput = z.infer<typeof EvaluatePromptInputSchema>;
export type ComparePromptsInput = z.infer<typeof ComparePromptsInputSchema>;
export type SavePromptInput = z.infer<typeof SavePromptInputSchema>;
export type SearchPromptsInput = z.infer<typeof SearchPromptsInputSchema>;
export type AnalyzePromptInput = z.infer<typeof AnalyzePromptInputSchema>;
export type OptimizePromptInput = z.infer<typeof OptimizePromptInputSchema>;
export type GenerateVariantsInput = z.infer<typeof GenerateVariantsInputSchema>;
export type TestPromptInput = z.infer<typeof TestPromptInputSchema>;