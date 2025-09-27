import { z } from 'zod';

// Domain enum
export enum PromptDomain {
  SQL = 'sql',
  BRANDING = 'branding',
  CINE = 'cine',
  SAAS = 'saas',
  DEVOPS = 'devops',
  GENERAL = 'general',
  // Additional domains detected by the system
  MOBILE = 'mobile',
  WEB = 'web',
  BACKEND = 'backend',
  FRONTEND = 'frontend',
  AI = 'ai',
  GAMING = 'gaming',
  CRYPTO = 'crypto',
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare',
  FINANCE = 'finance',
  LEGAL = 'legal'
}

// Tone enum
export enum PromptTone {
  FORMAL = 'formal',
  CASUAL = 'casual',
  TECHNICAL = 'technical',
  CREATIVE = 'creative'
}

// Quality metrics
export interface QualityScore {
  clarity: number;
  specificity: number;
  structure: number;
  completeness: number;
  overall: number;
}

// Optimization result
export interface OptimizationResult {
  optimized: string;
  improvements: OptimizationImprovement[];
  rulesApplied: string[];
  enhancements?: OptimizationImprovement[];
  systemPrompt?: string;
  templateVariables?: string[];
  contextSuggestions?: string[];
}

// Optimization improvement
export interface OptimizationImprovement {
  type: 'clarity' | 'specificity' | 'structure' | 'tone' | 'context';
  description: string;
  before?: string;
  after?: string;
  impact: 'low' | 'medium' | 'high';
}

// Analysis result
export interface AnalysisResult {
  tokens: Token[];
  entities: Entity[];
  intent: Intent;
  complexity: number;
  ambiguityScore: number;
  hasVariables: boolean;
  language: string;
  domainHints: string[];
  sentimentScore: number;
  readabilityScore: number;
  technicalTerms: string[];
  estimatedTokens: number;
}

// Token
export interface Token {
  text: string;
  pos: string; // Part of speech
  lemma: string;
  isStopWord: boolean;
  sentiment: number;
}

// Named entity
export interface Entity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

// Intent classification
export interface Intent {
  category: string;
  confidence: number;
  subcategories: string[];
}

// Process input
export interface ProcessInput {
  raw: string;
  domain: PromptDomain;
  tone?: PromptTone;
  context?: string;
  variables?: Record<string, string>;
  targetModel?: string;
  maxTokens?: number;
  temperature?: number;
}

// Process result
export interface ProcessResult {
  original: string;
  refined: string;
  system: string;
  analysis: AnalysisResult;
  score: QualityScore;
  validation: ValidationResult;
  suggestions: string[];
  metadata: ProcessMetadata;
  template?: TemplateResult;
  examples?: ExampleResult[];
}

// Template result
export interface TemplateResult {
  prompt: string;
  system: string;
  variables: Record<string, string>;
  type: TemplateType;
}

// Template types
export enum TemplateType {
  BASIC = 'basic',
  CHAIN_OF_THOUGHT = 'chain-of-thought',
  FEW_SHOT = 'few-shot',
  ROLE_BASED = 'role-based',
  STEP_BY_STEP = 'step-by-step'
}

// Example result
export interface ExampleResult {
  input: string;
  output: string;
  context?: string;
}

// Process metadata
export interface ProcessMetadata {
  domain: PromptDomain;
  tone?: PromptTone;
  processingTime: number;
  version: string;
  modelUsed?: string;
  cacheHit: boolean;
  rulesApplied: string[];
  templateUsed?: string;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  qualityMetrics: QualityMetrics;
}

// Validation error
export interface ValidationError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  position?: { start: number; end: number };
}

// Validation warning
export interface ValidationWarning {
  code: string;
  message: string;
  suggestion: string;
  position?: { start: number; end: number };
}

// Validation suggestion
export interface ValidationSuggestion {
  type: 'enhancement' | 'fix' | 'optimization';
  message: string;
  before?: string;
  after?: string;
}

// Quality metrics
export interface QualityMetrics {
  clarity: number;
  specificity: number;
  structure: number;
  completeness: number;
  consistency: number;
  actionability: number;
}

// Evaluation result
export interface EvaluationResult {
  score: QualityScore;
  breakdown: QualityBreakdown;
  recommendations: Recommendation[];
  comparisons?: ComparisonMetric[];
}

// Quality breakdown
export interface QualityBreakdown {
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

// Quality factor
export interface QualityFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

// Recommendation
export interface Recommendation {
  type: 'critical' | 'important' | 'suggestion';
  title: string;
  description: string;
  before?: string;
  after?: string;
  impact: 'high' | 'medium' | 'low';
}

// Comparison result
export interface ComparisonResult {
  variants: PromptVariant[];
  winner?: string;
  metrics: ComparisonMetric[];
  summary: string;
}

// Prompt variant
export interface PromptVariant {
  id: string;
  prompt: string;
  score: QualityScore;
  metrics: VariantMetric[];
}

// Variant metric
export interface VariantMetric {
  name: string;
  value: number;
  unit: string;
  better: 'higher' | 'lower' | 'optimal' | 'balanced';
}

// Comparison metric
export interface ComparisonMetric {
  name: string;
  values: Record<string, number>;
  winner: string;
  significance: number;
}

// Saved prompt
export interface SavedPrompt {
  id: string;
  name: string;
  domain: PromptDomain;
  tags: string[];
  description?: string;
  prompt: string;
  systemPrompt?: string;
  score: QualityScore;
  metadata: SaveMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// Save metadata
export interface SaveMetadata {
  name: string;
  domain?: string;
  tags?: string[];
  description?: string;
  category?: string;
  isPublic?: boolean;
  authorId?: string;
  version?: string;
}

// Search parameters
export interface SearchParams {
  query?: string;
  domain?: string;
  tags?: string[];
  category?: string;
  minScore?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'score' | 'created' | 'updated' | 'usage';
  sortOrder?: 'asc' | 'desc';
}

// Search result
export interface SearchResult {
  id: string;
  name: string;
  domain: PromptDomain;
  tags: string[];
  description?: string;
  prompt: string;
  score: QualityScore;
  usage: UsageStats;
  createdAt: Date;
  relevance: number;
}

// Usage statistics
export interface UsageStats {
  count: number;
  successRate: number;
  avgResponseTime: number;
  lastUsed: Date;
}

// Zod validation schemas
export const ProcessInputSchema = z.object({
  raw: z.string().min(1).max(10000),
  domain: z.nativeEnum(PromptDomain),
  tone: z.nativeEnum(PromptTone).optional(),
  context: z.string().optional(),
  variables: z.record(z.string()).optional(),
  targetModel: z.string().optional(),
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).optional()
});

export const SaveMetadataSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().max(500).optional(),
  category: z.string().optional(),
  isPublic: z.boolean().default(false),
  authorId: z.string().optional()
});

export const SearchParamsSchema = z.object({
  query: z.string().optional(),
  domain: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  minScore: z.number().min(0).max(1).optional(),
  limit: z.number().positive().max(100).default(10),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['score', 'created', 'updated', 'usage']).default('score'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type ProcessInputType = z.infer<typeof ProcessInputSchema>;
export type SaveMetadataType = z.infer<typeof SaveMetadataSchema>;
export type SearchParamsType = z.infer<typeof SearchParamsSchema>;