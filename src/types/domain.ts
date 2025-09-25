import { PromptDomain } from './prompt.js';

// Domain rule interface
export interface DomainRule {
  id: string;
  domain: PromptDomain;
  pattern: RegExp | string;
  replacement: string | ((match: string) => string);
  priority: number;
  active: boolean;
  description: string;
  category: RuleCategory;
  examples?: RuleExample[];
}

// Rule categories
export enum RuleCategory {
  VAGUE_TERMS = 'vague_terms',
  STRUCTURE = 'structure',
  ENHANCEMENT = 'enhancement',
  TERMINOLOGY = 'terminology',
  FORMATTING = 'formatting',
  CONTEXT = 'context'
}

// Rule example
export interface RuleExample {
  before: string;
  after: string;
  explanation: string;
}

// Domain configuration
export interface DomainConfig {
  domain: PromptDomain;
  description: string;
  defaultRules: DomainRule[];
  systemPromptTemplate: string;
  commonPatterns: Pattern[];
  qualityWeights: QualityWeights;
  examples: DomainExample[];
}

// Pattern
export interface Pattern {
  name: string;
  regex: RegExp;
  description: string;
  replacement?: string;
}

// Quality weights for different domains
export interface QualityWeights {
  clarity: number;
  specificity: number;
  structure: number;
  completeness: number;
}

// Domain example
export interface DomainExample {
  title: string;
  before: string;
  after: string;
  explanation: string;
  score_improvement: number;
}

// SQL specific types
export interface SQLContext {
  tableNames: string[];
  columnNames: string[];
  relationships: string[];
  complexityLevel: 'basic' | 'intermediate' | 'advanced';
}

// Branding specific types
export interface BrandingContext {
  brandTone: 'professional' | 'friendly' | 'edgy' | 'playful';
  targetAudience: string;
  industry: string;
  brandValues: string[];
}

// Cinema specific types
export interface CinemaContext {
  genre: string;
  duration: 'short' | 'feature' | 'series';
  budget: 'low' | 'medium' | 'high';
  targetRating: string;
}

// SaaS specific types
export interface SaaSContext {
  productType: string;
  targetMarket: 'b2b' | 'b2c' | 'both';
  stage: 'startup' | 'growth' | 'enterprise';
  techStack: string[];
}

// DevOps specific types
export interface DevOpsContext {
  infrastructure: 'cloud' | 'on-premise' | 'hybrid';
  platforms: string[];
  scale: 'small' | 'medium' | 'large' | 'enterprise';
  compliance: string[];
}

// Domain context union type
export type DomainContext =
  | SQLContext
  | BrandingContext
  | CinemaContext
  | SaaSContext
  | DevOpsContext;

// Template variables for different domains
export interface TemplateVariables {
  [key: string]: string | number | boolean | string[];
}

// Domain-specific template variables
export interface SQLTemplateVariables extends TemplateVariables {
  tables?: string[];
  columns?: string[];
  relationships?: string[];
  database_type?: 'postgresql' | 'mysql' | 'sqlite' | 'oracle';
  use_case?: 'reporting' | 'transaction' | 'analytics' | 'migration';
}

export interface BrandingTemplateVariables extends TemplateVariables {
  brand_name?: string;
  target_audience?: string;
  brand_voice?: string;
  key_messages?: string[];
  campaign_type?: 'launch' | 'awareness' | 'conversion' | 'retention';
}

export interface CinemaTemplateVariables extends TemplateVariables {
  project_type?: 'script' | 'treatment' | 'logline' | 'synopsis';
  genre?: string;
  characters?: string[];
  setting?: string;
  theme?: string;
}

export interface SaaSTemplateVariables extends TemplateVariables {
  product_name?: string;
  feature_set?: string[];
  user_personas?: string[];
  integration_needs?: string[];
  scalability_requirements?: string;
}

export interface DevOpsTemplateVariables extends TemplateVariables {
  infrastructure_type?: string;
  deployment_environment?: 'dev' | 'staging' | 'production';
  tools?: string[];
  compliance_requirements?: string[];
  monitoring_needs?: string[];
}

// Domain expertise levels
export enum ExpertiseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

// Domain learning path
export interface LearningPath {
  domain: PromptDomain;
  level: ExpertiseLevel;
  prerequisites: string[];
  objectives: string[];
  resources: Resource[];
  assessments: Assessment[];
}

// Resource
export interface Resource {
  type: 'documentation' | 'tutorial' | 'example' | 'tool';
  title: string;
  url: string;
  description: string;
  difficulty: ExpertiseLevel;
}

// Assessment
export interface Assessment {
  question: string;
  correctAnswer: string;
  explanation: string;
  difficulty: ExpertiseLevel;
}

// Domain registry for managing all domains
export interface DomainRegistry {
  domains: Map<PromptDomain, DomainConfig>;
  register(domain: PromptDomain, config: DomainConfig): void;
  get(domain: PromptDomain): DomainConfig | undefined;
  list(): PromptDomain[];
  getPatterns(domain: PromptDomain): Pattern[];
  getRules(domain: PromptDomain): DomainRule[];
}

// Custom rule for user-defined patterns
export interface CustomRule extends DomainRule {
  userId: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  usage: RuleUsage;
}

// Rule usage statistics
export interface RuleUsage {
  count: number;
  successRate: number;
  lastUsed: Date;
  averageImprovement: number;
}