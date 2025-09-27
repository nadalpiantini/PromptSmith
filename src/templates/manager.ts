import { TemplateEngine, TemplateContext, ExampleContext } from './engine.js';
import { registerDomainTemplates } from './domain-templates.js';
import { PromptDomain, TemplateType, TemplateResult, AnalysisResult } from '../types/prompt.js';

export interface TemplateGenerationOptions {
  prompt: string;
  domain: PromptDomain;
  variables?: Record<string, any>;
  templateType?: TemplateType;
  analysis?: AnalysisResult;
  context?: string;
  examples?: ExampleContext[];
  forceTemplate?: boolean;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class TemplateManager {
  private engine: TemplateEngine;

  constructor() {
    this.engine = new TemplateEngine();

    // Register all domain-specific templates
    registerDomainTemplates(this.engine);
  }

  async generateTemplate(options: TemplateGenerationOptions): Promise<TemplateResult> {
    try {
      // Determine the best template type if not specified
      const templateType = options.templateType || this.selectOptimalTemplateType(options);

      // Prepare variables
      const variables = this.prepareVariables(options);

      // Prepare examples
      const examples = this.prepareExamples(options);

      // Create template context with proper analysis fallback
      const context: TemplateContext = {
        domain: options.domain,
        variables,
        examples,
        analysis: options.analysis ?? {
          tokens: [],
          entities: [],
          intent: { category: 'general', confidence: 0.5, subcategories: [] },
          complexity: 0.5,
          ambiguityScore: 0.3,
          hasVariables: false,
          language: 'en',
          domainHints: [],
          sentimentScore: 0.5,
          readabilityScore: 0.5,
          technicalTerms: [],
          estimatedTokens: options.prompt?.split(' ').length || 0
        },
        ...(options.context && { userContext: options.context }),
      };

      // Generate the template
      const result = await this.engine.generateTemplate(
        options.prompt,
        variables,
        options.domain,
        templateType,
        options.analysis
      );

      return result;

    } catch (error) {
      throw new Error(`Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async renderCustomTemplate(
    templateId: string,
    context: TemplateContext
  ): Promise<TemplateResult> {
    try {
      return await this.engine.renderTemplate(templateId, context);
    } catch (error) {
      throw new Error(`Custom template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  validateTemplate(templateContent: string): TemplateValidationResult {
    const result: TemplateValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Test template parsing
      this.engine['liquid'].parse(templateContent);

      // Check for common issues
      this.validateTemplateContent(templateContent, result);
      this.validateTemplateVariables(templateContent, result);
      this.validateTemplateStructure(templateContent, result);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Template parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  getAvailableTemplates(domain?: PromptDomain, type?: TemplateType): Array<{
    id: string;
    name: string;
    description: string;
    domain: PromptDomain | 'all';
    type: TemplateType;
    requiredVariables: string[];
    optionalVariables: string[];
  }> {
    const templates = this.engine.listTemplates(domain, type);
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      domain: template.domain,
      type: template.type,
      requiredVariables: template.requiredVariables,
      optionalVariables: template.optionalVariables
    }));
  }

  getTemplateRecommendations(options: {
    domain: PromptDomain;
    complexity?: number;
    hasExamples?: boolean;
    userPreference?: TemplateType;
    analysis?: AnalysisResult;
  }): Array<{
    templateType: TemplateType;
    confidence: number;
    reasoning: string;
  }> {
    const recommendations = [];

    // Basic template recommendation
    recommendations.push({
      templateType: TemplateType.BASIC,
      confidence: 0.7,
      reasoning: 'Always suitable for straightforward requests'
    });

    // Chain of thought for complex tasks
    if (options.complexity && options.complexity > 0.6) {
      recommendations.push({
        templateType: TemplateType.CHAIN_OF_THOUGHT,
        confidence: 0.85,
        reasoning: 'High complexity benefits from step-by-step reasoning'
      });
    }

    // Few-shot when examples are available
    if (options.hasExamples) {
      recommendations.push({
        templateType: TemplateType.FEW_SHOT,
        confidence: 0.9,
        reasoning: 'Examples available for pattern-based learning'
      });
    }

    // Role-based for domain expertise
    if (options.domain !== PromptDomain.GENERAL) {
      recommendations.push({
        templateType: TemplateType.ROLE_BASED,
        confidence: 0.8,
        reasoning: `${options.domain} domain benefits from expert perspective`
      });
    }

    // Step-by-step for process-oriented tasks
    if (options.analysis?.technicalTerms?.some(term =>
      ['build', 'create', 'implement', 'setup', 'configure'].includes(term.toLowerCase())
    )) {
      recommendations.push({
        templateType: TemplateType.STEP_BY_STEP,
        confidence: 0.75,
        reasoning: 'Implementation tasks benefit from systematic approach'
      });
    }

    // Boost user preference
    if (options.userPreference) {
      const userPrefIndex = recommendations.findIndex(r => r.templateType === options.userPreference);
      if (userPrefIndex !== -1) {
        recommendations[userPrefIndex].confidence += 0.2;
        recommendations[userPrefIndex].reasoning += ' (user preference)';
      }
    }

    // Sort by confidence
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  async generateExamples(
    prompt: string,
    domain: PromptDomain,
    count: number = 2
  ): Promise<ExampleContext[]> {
    // This would integrate with the example generation system
    // For now, return domain-specific examples
    const domainExamples = this.getDomainExamples(domain);

    // Select most relevant examples based on prompt content
    const relevantExamples = domainExamples
      .filter(example => this.isExampleRelevant(example, prompt))
      .slice(0, count);

    return relevantExamples;
  }

  private selectOptimalTemplateType(options: TemplateGenerationOptions): TemplateType {
    const recommendations = this.getTemplateRecommendations({
      domain: options.domain,
      complexity: options.analysis?.complexity ?? 0,
      hasExamples: (options.examples?.length || 0) > 0,
      ...(options.analysis && { analysis: options.analysis })
    });

    // Return the highest confidence recommendation
    return recommendations.length > 0 ? recommendations[0].templateType : TemplateType.BASIC;
  }

  private prepareVariables(options: TemplateGenerationOptions): Record<string, any> {
    const variables: Record<string, any> = {
      refined_prompt: options.prompt,
      original_prompt: options.prompt,
      domain: options.domain,
      ...options.variables
    };

    // Add analysis-derived variables
    if (options.analysis) {
      variables.complexity = options.analysis.complexity;
      variables.technical_terms = options.analysis.technicalTerms;
      variables.domain_hints = options.analysis.domainHints;
      variables.has_variables = options.analysis.hasVariables;
    }

    // Add domain-specific variables
    variables.domain_specific = this.getDomainSpecificVariables(options.domain, options.analysis);

    return variables;
  }

  private prepareExamples(options: TemplateGenerationOptions): ExampleContext[] {
    if (options.examples && options.examples.length > 0) {
      return options.examples;
    }

    // Generate relevant examples if not provided
    if (options.forceTemplate || this.shouldIncludeExamples(options)) {
      return this.getDomainExamples(options.domain).slice(0, 2);
    }

    return [];
  }

  private shouldIncludeExamples(options: TemplateGenerationOptions): boolean {
    // Include examples for complex prompts
    if (options.analysis?.complexity && options.analysis.complexity > 0.7) {
      return true;
    }

    // Include examples for specific domains
    if ([PromptDomain.SQL, PromptDomain.CINE].includes(options.domain)) {
      return true;
    }

    // Include examples for template types that benefit from them
    if (options.templateType === TemplateType.FEW_SHOT) {
      return true;
    }

    return false;
  }

  private getDomainSpecificVariables(domain: PromptDomain, _analysis?: AnalysisResult): Record<string, any> {
    const variables: Record<string, any> = {};

    switch (domain) {
      case PromptDomain.SQL:
        variables.database_type = 'postgresql';
        variables.naming_convention = 'snake_case';
        break;

      case PromptDomain.BRANDING:
        variables.brand_voice = 'professional';
        variables.target_demographic = 'professionals';
        break;

      case PromptDomain.CINE:
        variables.format = 'feature screenplay';
        variables.structure = 'three-act';
        break;

      case PromptDomain.SAAS:
        variables.deployment_model = 'cloud-native';
        variables.pricing_model = 'subscription';
        break;

      case PromptDomain.DEVOPS:
        variables.cloud_provider = 'aws';
        variables.deployment_strategy = 'blue-green';
        break;
    }

    return variables;
  }

  private getDomainExamples(domain: PromptDomain): ExampleContext[] {
    const exampleMap: Record<PromptDomain, ExampleContext[]> = {
      [PromptDomain.SQL]: [
        {
          input: 'Create user management table',
          output: 'CREATE TABLE users (\n    id SERIAL PRIMARY KEY,\n    username VARCHAR(50) UNIQUE NOT NULL,\n    email VARCHAR(255) UNIQUE NOT NULL,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);',
          explanation: 'Basic user table with constraints and proper data types'
        }
      ],
      [PromptDomain.BRANDING]: [
        {
          input: 'Create brand positioning statement',
          output: 'For [target audience], [brand name] is the [category] that [unique benefit] because [reasons to believe].',
          explanation: 'Standard positioning statement template'
        }
      ],
      [PromptDomain.CINE]: [
        {
          input: 'Character introduction scene',
          output: 'FADE IN:\n\nINT. COFFEE SHOP - MORNING\n\nJANE (30s, determined) sits alone, laptop open, multiple coffee cups scattered around her table.',
          explanation: 'Professional screenplay format with character introduction'
        }
      ],
      [PromptDomain.SAAS]: [
        {
          input: 'User dashboard requirements',
          output: 'Dashboard should include: key metrics at top, customizable widgets, real-time data updates, export functionality, and responsive design for mobile access.',
          explanation: 'Comprehensive dashboard specification'
        }
      ],
      [PromptDomain.DEVOPS]: [
        {
          input: 'CI/CD pipeline setup',
          output: 'Pipeline stages: 1) Code commit trigger, 2) Automated testing, 3) Security scanning, 4) Build artifacts, 5) Deploy to staging, 6) Production deployment with rollback capability.',
          explanation: 'Complete CI/CD pipeline specification'
        }
      ],
      [PromptDomain.MOBILE]: [
        {
          input: 'Create mobile app navigation',
          output: 'Implement bottom tab navigation with Home, Search, Profile, and Settings screens using React Navigation.',
          explanation: 'Standard mobile app navigation pattern'
        }
      ],
      [PromptDomain.WEB]: [
        {
          input: 'Build responsive landing page',
          output: 'Create a mobile-first responsive landing page with hero section, features grid, and call-to-action using CSS Grid and Flexbox.',
          explanation: 'Modern web development approach'
        }
      ],
      [PromptDomain.BACKEND]: [
        {
          input: 'Create REST API endpoint',
          output: 'Implement GET /api/users endpoint with pagination, filtering, and proper error handling using Express.js.',
          explanation: 'Standard REST API implementation'
        }
      ],
      [PromptDomain.FRONTEND]: [
        {
          input: 'Build React component',
          output: 'Create a reusable Button component with variants (primary, secondary) and proper TypeScript types.',
          explanation: 'Component-based frontend development'
        }
      ],
      [PromptDomain.AI]: [
        {
          input: 'Train machine learning model',
          output: 'Implement a supervised learning pipeline with data preprocessing, model training, validation, and deployment using scikit-learn.',
          explanation: 'Standard ML workflow'
        }
      ],
      [PromptDomain.GAMING]: [
        {
          input: 'Create game character system',
          output: 'Design a character class system with attributes (health, mana, strength) and abilities using object-oriented programming.',
          explanation: 'Game development patterns'
        }
      ],
      [PromptDomain.CRYPTO]: [
        {
          input: 'Implement smart contract',
          output: 'Create an ERC-20 token contract with mint, burn, and transfer functions using Solidity.',
          explanation: 'Blockchain development standards'
        }
      ],
      [PromptDomain.EDUCATION]: [
        {
          input: 'Design learning module',
          output: 'Create an interactive learning module with objectives, content, assessments, and progress tracking.',
          explanation: 'Educational content structure'
        }
      ],
      [PromptDomain.HEALTHCARE]: [
        {
          input: 'Build patient management system',
          output: 'Implement a HIPAA-compliant patient record system with secure data storage and access controls.',
          explanation: 'Healthcare software requirements'
        }
      ],
      [PromptDomain.FINANCE]: [
        {
          input: 'Create financial dashboard',
          output: 'Build a real-time financial dashboard with charts, transactions, and budget tracking using secure APIs.',
          explanation: 'Fintech application development'
        }
      ],
      [PromptDomain.LEGAL]: [
        {
          input: 'Draft contract template',
          output: 'Create a comprehensive service agreement template with terms, conditions, and legal clauses.',
          explanation: 'Legal document structure'
        }
      ],
      [PromptDomain.GENERAL]: []
    };

    return exampleMap[domain] || [];
  }

  private isExampleRelevant(example: ExampleContext, prompt: string): boolean {
    // Simple relevance check based on shared keywords
    const promptWords = prompt.toLowerCase().split(/\s+/);
    const exampleWords = example.input.toLowerCase().split(/\s+/);

    const sharedWords = promptWords.filter(word =>
      word.length > 3 && exampleWords.includes(word)
    );

    return sharedWords.length >= 1;
  }

  private validateTemplateContent(content: string, result: TemplateValidationResult): void {
    // Check for unbalanced liquid tags
    const openTags = (content.match(/\{\%/g) || []).length;
    const closeTags = (content.match(/\%\}/g) || []).length;

    if (openTags !== closeTags) {
      result.warnings.push('Potentially unbalanced Liquid tags detected');
    }

    // Check for undefined variable references
    const variableMatches = content.match(/\{\{\s*(\w+)[^}]*\}\}/g);
    if (variableMatches) {
      variableMatches.forEach(match => {
        const variable = match.replace(/[{}]/g, '').trim().split(/[\s|.]/)[0];
        if (!['refined_prompt', 'domain', 'userContext', 'variables'].includes(variable)) {
          result.suggestions.push(`Consider defining variable: ${variable}`);
        }
      });
    }
  }

  private validateTemplateVariables(content: string, result: TemplateValidationResult): void {
    // Check for common variable naming issues
    const variables = content.match(/\{\{\s*(\w+)/g) || [];

    variables.forEach(varMatch => {
      const variable = varMatch.replace(/[{}]/g, '').trim();

      if (variable.includes('-')) {
        result.warnings.push(`Variable "${variable}" contains hyphens. Consider using underscores.`);
      }

      if (variable !== variable.toLowerCase()) {
        result.suggestions.push(`Variable "${variable}" should use lowercase naming.`);
      }
    });
  }

  private validateTemplateStructure(content: string, result: TemplateValidationResult): void {
    // Check for good template practices
    if (!content.includes('refined_prompt')) {
      result.warnings.push('Template should include the refined_prompt variable');
    }

    if (content.length < 50) {
      result.warnings.push('Template seems very short. Consider adding more structure.');
    }

    if (content.length > 2000) {
      result.warnings.push('Template is very long. Consider breaking it into smaller sections.');
    }

    // Check for proper conditional structure
    const ifCount = (content.match(/\{\%\s*if/g) || []).length;
    const endifCount = (content.match(/\{\%\s*endif/g) || []).length;

    if (ifCount !== endifCount) {
      result.errors.push('Unmatched if/endif statements in template');
      result.isValid = false;
    }
  }
}