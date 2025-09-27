import { TemplateManager, templateManager } from '../templates/index.js';
import { domainRegistry } from '../rules/index.js';
import { AnalysisResult, PromptDomain, TemplateResult, TemplateType } from '../types/prompt.js';

export interface RefinementResult {
  refined: string;
  rulesApplied: Array<{
    ruleId: string;
    description: string;
    category: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  improvements: Array<{
    type: string;
    before: string;
    after: string;
    reason: string;
  }>;
}

export interface ExampleSet {
  input: string;
  output: string;
  explanation?: string;
}

export class RefineService {
  private templateManager: TemplateManager;

  constructor() {
    this.templateManager = templateManager;
  }

  async applyDomainRules(
    raw: string,
    domain: string,
    analysis: AnalysisResult
  ): Promise<RefinementResult> {
    try {
      // Apply domain-specific rules using the registry
      const result = domainRegistry.applyDomainRules(raw, domain as PromptDomain, analysis);

      return {
        refined: result.refined,
        rulesApplied: result.rulesApplied.map(ruleId => ({
          ruleId,
          description: ruleId,
          category: 'enhancement',
          impact: 'medium' as const
        })),
        improvements: result.improvements.map(improvement => ({
          type: 'enhancement',
          before: raw,
          after: result.refined,
          reason: improvement
        }))
      };

    } catch (error) {
      console.error('Domain rule application failed:', error);
      // Return original on failure
      return {
        refined: raw,
        rulesApplied: [],
        improvements: [{
          type: 'error',
          before: raw,
          after: raw,
          reason: `Domain rule processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  async generateTemplate(
    prompt: string,
    variables: Record<string, any>,
    domain: string
  ): Promise<TemplateResult> {
    try {
      return await this.templateManager.generateTemplate({
        prompt,
        domain: domain as PromptDomain,
        variables,
        templateType: this.selectOptimalTemplateType(prompt, variables, domain),
        forceTemplate: true
      });
    } catch (error) {
      throw new Error(`Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateSystemPrompt(
    domain: string,
    analysis: AnalysisResult,
    context?: string
  ): Promise<string> {
    try {
      // Use domain registry to generate system prompt
      const systemPrompt = domainRegistry.generateSystemPrompt(domain as PromptDomain, analysis, context);
      return systemPrompt;
    } catch (error) {
      console.error('System prompt generation failed:', error);
      return this.generateGeneralSystemPrompt(domain, analysis, context);
    }
  }

  async generateExamples(
    prompt: string,
    domain: string,
    analysis: AnalysisResult,
    count: number = 2
  ): Promise<ExampleSet[]> {
    try {
      // Use domain registry to get examples
      const domainExamples = domainRegistry.getDomainExamples(domain as PromptDomain);

      if (domainExamples.length > 0) {
        return domainExamples.slice(0, count).map(example => ({
          input: example.before,
          output: example.after,
          explanation: example.explanation
        }));
      }

      // Fall back to template manager examples
      return await this.templateManager.generateExamples(prompt, domain as PromptDomain, count);
    } catch (error) {
      console.error('Example generation failed:', error);
      return [];
    }
  }

  private selectOptimalTemplateType(
    prompt: string,
    variables: Record<string, any>,
    domain: string
  ): TemplateType {
    // Simple heuristic for template type selection
    const promptLower = prompt.toLowerCase();
    const hasVariables = Object.keys(variables).length > 0;

    // Check for step-by-step indicators
    if (promptLower.includes('step') ||
        promptLower.includes('guide') ||
        promptLower.includes('how to') ||
        promptLower.includes('tutorial')) {
      return TemplateType.STEP_BY_STEP;
    }

    // Check for role-based indicators
    if (promptLower.includes('as a') ||
        promptLower.includes('you are') ||
        promptLower.includes('expert') ||
        promptLower.includes('professional')) {
      return TemplateType.ROLE_BASED;
    }

    // Check for reasoning indicators
    if (promptLower.includes('analyze') ||
        promptLower.includes('explain') ||
        promptLower.includes('reasoning') ||
        promptLower.includes('think through')) {
      return TemplateType.CHAIN_OF_THOUGHT;
    }

    // Few-shot if we have variables that could be examples
    if (hasVariables && (variables.examples || variables.samples)) {
      return TemplateType.FEW_SHOT;
    }

    // Default to basic
    return TemplateType.BASIC;
  }

  private generateGeneralSystemPrompt(
    domain: string,
    analysis: AnalysisResult,
    context?: string
  ): string {
    const basePrompt = "You are a professional assistant providing accurate and helpful responses.";

    let domainSpecific = "";
    switch (domain) {
      case 'sql':
        domainSpecific = " Focus on database best practices, SQL standards, and query optimization.";
        break;
      case 'branding':
        domainSpecific = " Focus on strategic marketing, brand development, and creative direction.";
        break;
      case 'cine':
        domainSpecific = " Focus on professional screenwriting, storytelling, and film industry standards.";
        break;
      case 'saas':
        domainSpecific = " Focus on user experience, scalable solutions, and SaaS best practices.";
        break;
      case 'devops':
        domainSpecific = " Focus on reliable infrastructure, automation, and operational excellence.";
        break;
    }

    let complexityGuidance = "";
    if (analysis.complexity > 0.7) {
      complexityGuidance = " Take a systematic approach to break down complex requirements.";
    }

    let contextGuidance = "";
    if (context) {
      contextGuidance = ` Consider this context: ${context}`;
    }

    return basePrompt + domainSpecific + complexityGuidance + contextGuidance;
  }
}