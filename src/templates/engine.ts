import { Liquid } from 'liquidjs';
import { PromptDomain, TemplateType, TemplateResult } from '../types/prompt.js';
import { AnalysisResult } from '../types/prompt.js';

export interface TemplateContext {
  domain: PromptDomain;
  variables: Record<string, any>;
  examples?: ExampleContext[];
  analysis: AnalysisResult;
  userContext?: string;
}

export interface ExampleContext {
  input: string;
  output: string;
  explanation?: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  type: TemplateType;
  domain: PromptDomain | 'all';
  description: string;
  template: string;
  systemPrompt?: string;
  requiredVariables: string[];
  optionalVariables: string[];
  examples?: ExampleContext[];
}

export class TemplateEngine {
  private liquid: Liquid;
  private templates: Map<string, TemplateDefinition> = new Map();

  constructor() {
    this.liquid = new Liquid({
      cache: true,
      lenientIf: true,
      strictFilters: false,
      strictVariables: false,
      trimTagLeft: true,
      trimTagRight: true,
      trimOutputLeft: true,
      trimOutputRight: true,
    });

    // Register custom filters
    this.registerFilters();

    // Load built-in templates
    this.loadBuiltinTemplates();
  }

  async renderTemplate(
    templateId: string,
    context: TemplateContext
  ): Promise<TemplateResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate required variables
    const missingVars = template.requiredVariables.filter(
      varName => !(varName in context.variables)
    );

    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }

    try {
      // Prepare template context
      const templateContext = {
        ...context.variables,
        domain: context.domain,
        examples: context.examples || template.examples || [],
        analysis: context.analysis,
        userContext: context.userContext,
        // Helper variables
        hasExamples: (context.examples || template.examples || []).length > 0,
        exampleCount: (context.examples || template.examples || []).length,
        isComplex: (context.analysis?.complexity ?? 0) > 0.7,
        needsClarity: (context.analysis?.ambiguityScore ?? 0) > 0.5,
        technicalTerms: context.analysis?.technicalTerms || [],
        domainHints: context.analysis?.domainHints || []
      };

      // Render the main template
      const renderedPrompt = await this.liquid.parseAndRender(
        template.template,
        templateContext
      );

      // Render system prompt if available
      let renderedSystemPrompt = '';
      if (template.systemPrompt) {
        renderedSystemPrompt = await this.liquid.parseAndRender(
          template.systemPrompt,
          templateContext
        );
      }

      return {
        prompt: this.cleanupRenderedText(renderedPrompt),
        system: this.cleanupRenderedText(renderedSystemPrompt),
        variables: context.variables,
        type: template.type,
      };

    } catch (error) {
      throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateTemplate(
    prompt: string,
    variables: Record<string, any>,
    domain: PromptDomain,
    type: TemplateType = TemplateType.BASIC,
    analysis?: AnalysisResult
  ): Promise<TemplateResult> {
    // Find the best template for the given parameters
    const templateId = this.selectBestTemplate(domain, type, analysis);

    // Prepare context
    const context: TemplateContext = {
      domain,
      variables: {
        ...variables,
        original_prompt: prompt,
        refined_prompt: prompt
      },
      analysis: analysis ?? {
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
        estimatedTokens: prompt.split(' ').length
      },
    };

    return await this.renderTemplate(templateId, context);
  }

  registerTemplate(template: TemplateDefinition): void {
    this.templates.set(template.id, template);
  }

  getTemplate(templateId: string): TemplateDefinition | undefined {
    return this.templates.get(templateId);
  }

  listTemplates(domain?: PromptDomain, type?: TemplateType): TemplateDefinition[] {
    const templates = Array.from(this.templates.values());

    return templates.filter(template => {
      const domainMatch = !domain || template.domain === domain || template.domain === 'all';
      const typeMatch = !type || template.type === type;
      return domainMatch && typeMatch;
    });
  }

  private registerFilters(): void {
    // Capitalize filter
    this.liquid.registerFilter('capitalize', (input: string) => {
      if (typeof input !== 'string') return input;
      return input.charAt(0).toUpperCase() + input.slice(1);
    });

    // Title case filter
    this.liquid.registerFilter('title', (input: string) => {
      if (typeof input !== 'string') return input;
      return input.replace(/\w\S*/g, txt =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    });

    // Join with "and" filter
    this.liquid.registerFilter('join_and', (input: string[]) => {
      if (!Array.isArray(input)) return input;
      if (input.length === 0) return '';
      if (input.length === 1) return input[0];
      if (input.length === 2) return `${input[0]} and ${input[1]}`;
      return `${input.slice(0, -1).join(', ')}, and ${input[input.length - 1]}`;
    });

    // Wrap in quotes filter
    this.liquid.registerFilter('quote', (input: string) => {
      if (typeof input !== 'string') return input;
      return `"${input}"`;
    });

    // Domain-specific formatting filter
    this.liquid.registerFilter('domain_format', (input: string, domain: PromptDomain) => {
      if (typeof input !== 'string') return input;

      switch (domain) {
        case PromptDomain.SQL:
          return input.toLowerCase().replace(/\s+/g, '_');
        case PromptDomain.CINE:
          return input.toUpperCase();
        case PromptDomain.SAAS:
          return input.replace(/\s+/g, '');
        default:
          return input;
      }
    });

    // Bullet point filter
    this.liquid.registerFilter('bullets', (input: string[]) => {
      if (!Array.isArray(input)) return input;
      return input.map(item => `• ${item}`).join('\n');
    });

    // Numbered list filter
    this.liquid.registerFilter('numbered', (input: string[]) => {
      if (!Array.isArray(input)) return input;
      return input.map((item, index) => `${index + 1}. ${item}`).join('\n');
    });
  }

  private loadBuiltinTemplates(): void {
    // Load basic templates
    this.loadBasicTemplates();

    // Load chain-of-thought templates
    this.loadChainOfThoughtTemplates();

    // Load few-shot templates
    this.loadFewShotTemplates();

    // Load role-based templates
    this.loadRoleBasedTemplates();

    // Load step-by-step templates
    this.loadStepByStepTemplates();
  }

  private loadBasicTemplates(): void {
    const basicTemplate: TemplateDefinition = {
      id: 'basic_general',
      name: 'Basic Template',
      type: TemplateType.BASIC,
      domain: 'all',
      description: 'Simple, direct template for straightforward requests',
      template: `{{ refined_prompt | capitalize }}

{% if userContext %}
Context: {{ userContext }}
{% endif %}

{% if variables.requirements %}
Requirements:
{{ variables.requirements | bullets }}
{% endif %}`,
      systemPrompt: `You are a professional assistant. Provide clear, accurate, and helpful responses to the user's request.

{% if domain == 'sql' %}Focus on database best practices and SQL standards.
{% elsif domain == 'branding' %}Focus on strategic marketing and brand development.
{% elsif domain == 'cine' %}Focus on professional screenwriting and storytelling.
{% elsif domain == 'saas' %}Focus on user experience and scalable solutions.
{% elsif domain == 'devops' %}Focus on reliable infrastructure and automation.
{% endif %}`,
      requiredVariables: ['refined_prompt'],
      optionalVariables: ['userContext', 'requirements'],
    };

    this.registerTemplate(basicTemplate);
  }

  private loadChainOfThoughtTemplates(): void {
    const chainOfThoughtTemplate: TemplateDefinition = {
      id: 'chain_of_thought_general',
      name: 'Chain of Thought Template',
      type: TemplateType.CHAIN_OF_THOUGHT,
      domain: 'all',
      description: 'Template that encourages step-by-step reasoning',
      template: `{{ refined_prompt | capitalize }}

Let's approach this step-by-step:

1. First, let's understand the core requirements:
{% if variables.requirements %}
   {{ variables.requirements | bullets }}
{% else %}
   - Analyze the problem or task at hand
   - Identify key constraints and objectives
{% endif %}

2. Next, let's consider the approach:
   - What are the best practices for this type of work?
   - What potential challenges should we anticipate?
   - What resources or tools will be most effective?

3. Finally, let's plan the implementation:
   - What are the logical steps to complete this task?
   - How can we ensure quality and completeness?
   - What validation or testing should be included?

{% if userContext %}
Additional context to consider: {{ userContext }}
{% endif %}`,
      systemPrompt: `You are an expert problem solver. Break down complex tasks into logical steps and provide clear reasoning for your approach.

Think through problems systematically:
1. Understand the requirements thoroughly
2. Consider multiple approaches and their trade-offs
3. Provide step-by-step implementation guidance
4. Include validation and quality checks

{% if domain == 'sql' %}Focus on database design principles and query optimization.
{% elsif domain == 'branding' %}Focus on brand strategy development and marketing best practices.
{% elsif domain == 'cine' %}Focus on story structure and character development.
{% elsif domain == 'saas' %}Focus on user-centered design and technical scalability.
{% elsif domain == 'devops' %}Focus on infrastructure reliability and automation best practices.
{% endif %}`,
      requiredVariables: ['refined_prompt'],
      optionalVariables: ['requirements', 'userContext'],
    };

    this.registerTemplate(chainOfThoughtTemplate);
  }

  private loadFewShotTemplates(): void {
    const fewShotTemplate: TemplateDefinition = {
      id: 'few_shot_general',
      name: 'Few-Shot Learning Template',
      type: TemplateType.FEW_SHOT,
      domain: 'all',
      description: 'Template that includes examples to guide the response',
      template: `{{ refined_prompt | capitalize }}

{% if hasExamples %}
Here are some examples to guide your response:

{% for example in examples %}
Example {{ forloop.index }}:
Input: {{ example.input }}
Output: {{ example.output }}
{% if example.explanation %}
Explanation: {{ example.explanation }}
{% endif %}

{% endfor %}
{% endif %}

{% if userContext %}
Additional context: {{ userContext }}
{% endif %}

Now, please provide a response following the pattern established in the examples above.`,
      systemPrompt: `You are an expert in pattern recognition and example-based learning. Use the provided examples to understand the desired format, style, and approach for your response.

Key principles:
- Study the examples carefully to understand the expected pattern
- Maintain consistency with the style and structure shown
- Apply the same level of detail and quality as demonstrated
- Adapt the pattern to the specific request while staying true to the examples

{% if domain == 'sql' %}Focus on SQL formatting, naming conventions, and best practices shown in examples.
{% elsif domain == 'branding' %}Focus on brand voice, messaging style, and strategic approach from examples.
{% elsif domain == 'cine' %}Focus on storytelling structure, character development, and format from examples.
{% elsif domain == 'saas' %}Focus on user experience patterns and technical approaches from examples.
{% elsif domain == 'devops' %}Focus on infrastructure patterns and automation approaches from examples.
{% endif %}`,
      requiredVariables: ['refined_prompt'],
      optionalVariables: ['examples', 'userContext'],
    };

    this.registerTemplate(fewShotTemplate);
  }

  private loadRoleBasedTemplates(): void {
    const roleBasedTemplate: TemplateDefinition = {
      id: 'role_based_general',
      name: 'Role-Based Template',
      type: TemplateType.ROLE_BASED,
      domain: 'all',
      description: 'Template that assigns a specific expert role',
      template: `As a {{ variables.role | default: "professional expert" }}, {{ refined_prompt }}

{% if variables.expertise %}
Drawing from your expertise in:
{{ variables.expertise | bullets }}
{% endif %}

{% if variables.constraints %}
Please consider these constraints:
{{ variables.constraints | bullets }}
{% endif %}

{% if userContext %}
Additional context for your expert assessment: {{ userContext }}
{% endif %}

Provide your professional recommendation with clear reasoning and industry best practices.`,
      systemPrompt: `You are a {{ variables.role | default: "senior expert" }} with extensive professional experience.

{% if domain == 'sql' %}You are a senior database architect and SQL expert with deep knowledge of database design, query optimization, and best practices.
{% elsif domain == 'branding' %}You are a strategic brand consultant with expertise in marketing, positioning, and creative direction.
{% elsif domain == 'cine' %}You are a professional screenwriter and story consultant with industry experience.
{% elsif domain == 'saas' %}You are a product manager and technical architect specializing in SaaS development.
{% elsif domain == 'devops' %}You are a senior DevOps engineer and site reliability expert.
{% endif %}

Provide expert-level guidance that reflects:
- Deep industry knowledge and current best practices
- Professional standards and quality expectations
- Strategic thinking and long-term considerations
- Practical implementation advice based on real-world experience`,
      requiredVariables: ['refined_prompt'],
      optionalVariables: ['role', 'expertise', 'constraints', 'userContext'],
    };

    this.registerTemplate(roleBasedTemplate);
  }

  private loadStepByStepTemplates(): void {
    const stepByStepTemplate: TemplateDefinition = {
      id: 'step_by_step_general',
      name: 'Step-by-Step Template',
      type: TemplateType.STEP_BY_STEP,
      domain: 'all',
      description: 'Template that breaks down tasks into sequential steps',
      template: `{{ refined_prompt | capitalize }}

Please provide a detailed, step-by-step approach:

## Phase 1: Planning & Preparation
- [ ] Analyze requirements and constraints
- [ ] Gather necessary resources and tools
- [ ] Define success criteria and validation methods
{% if variables.planning_steps %}
{{ variables.planning_steps | bullets }}
{% endif %}

## Phase 2: Implementation
{% if variables.implementation_steps %}
{{ variables.implementation_steps | numbered }}
{% else %}
1. Begin with the foundational elements
2. Build incrementally with testing at each stage
3. Integrate components systematically
4. Validate functionality throughout the process
{% endif %}

## Phase 3: Validation & Quality Assurance
- [ ] Test all functionality thoroughly
- [ ] Review against original requirements
- [ ] Optimize for performance and usability
- [ ] Document the solution and process

{% if userContext %}
Special considerations: {{ userContext }}
{% endif %}`,
      systemPrompt: `You are a methodical expert who excels at breaking down complex tasks into manageable, sequential steps.

Approach every request with:
1. Clear planning and preparation phase
2. Logical implementation sequence
3. Built-in quality checks and validation
4. Comprehensive documentation

{% if domain == 'sql' %}Focus on database development lifecycle: design, implementation, testing, and optimization.
{% elsif domain == 'branding' %}Focus on brand development process: research, strategy, creative development, and implementation.
{% elsif domain == 'cine' %}Focus on screenplay development: concept, structure, writing, and revision.
{% elsif domain == 'saas' %}Focus on product development: planning, design, development, testing, and deployment.
{% elsif domain == 'devops' %}Focus on infrastructure development: design, provisioning, configuration, and monitoring.
{% endif %}

Ensure each step:
- Has clear deliverables and success criteria
- Builds logically on previous steps
- Includes quality validation
- Can be executed independently when possible`,
      requiredVariables: ['refined_prompt'],
      optionalVariables: ['planning_steps', 'implementation_steps', 'userContext'],
    };

    this.registerTemplate(stepByStepTemplate);
  }

  private selectBestTemplate(
    domain: PromptDomain,
    type: TemplateType,
    _analysis?: AnalysisResult
  ): string {
    // Priority order for template selection
    const domainSpecificId = `${type.replace('-', '_')}_${domain}`;
    const generalId = `${type.replace('-', '_')}_general`;

    // Check for domain-specific template first
    if (this.templates.has(domainSpecificId)) {
      return domainSpecificId;
    }

    // Fall back to general template
    if (this.templates.has(generalId)) {
      return generalId;
    }

    // Ultimate fallback to basic template
    return 'basic_general';
  }

  private cleanupRenderedText(text: string): string {
    return text
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
      .replace(/\s+$/gm, '') // Remove trailing spaces from lines
      .trim();
  }
}