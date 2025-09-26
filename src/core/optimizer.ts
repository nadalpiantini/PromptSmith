import {
  AnalysisResult,
  PromptTone,
  PromptDomain,
  ProcessInput,
} from '../types/prompt.js';
import { DomainRule } from '../types/domain.js';

interface OptimizationContext {
  prompt: string;
  tone?: PromptTone;
  context?: string;
  analysis: AnalysisResult;
}

interface OptimizationResult {
  optimized: string;
  improvements: OptimizationImprovement[];
  rulesApplied: string[];
  enhancements: OptimizationImprovement[];
  systemPrompt: string;
  templateVariables: string[];
  contextSuggestions: string[];
}

interface OptimizationImprovement {
  type: 'clarity' | 'specificity' | 'structure' | 'tone' | 'context' | 'enhancement' | 'performance' | 'technical' | 'format';
  description: string;
  before?: string;
  after?: string;
  impact: 'low' | 'medium' | 'high';
  category?: string;
}

export class PromptOptimizer {
  private domainRules: Map<PromptDomain, DomainRule[]> = new Map();

  constructor() {
    this.initializeRules();
  }

  async optimize(prompt: string, analysis: AnalysisResult, domain?: string): Promise<OptimizationResult> {
    const context: OptimizationContext = {
      prompt,
      analysis,
      tone: undefined,
      context: undefined
    };
    let optimized = context.prompt;
    const improvements: OptimizationImprovement[] = [];
    const rulesApplied: string[] = [];

    try {
      // 1. Apply structural improvements
      const structuralResult = this.improveStructure(optimized, context);
      optimized = structuralResult.text;
      improvements.push(...structuralResult.improvements);
      rulesApplied.push(...structuralResult.rulesApplied);

      // 2. Enhance clarity
      const clarityResult = this.improveClarity(optimized, context);
      optimized = clarityResult.text;
      improvements.push(...clarityResult.improvements);
      rulesApplied.push(...clarityResult.rulesApplied);

      // 3. Increase specificity
      const specificityResult = this.improveSpecificity(optimized, context);
      optimized = specificityResult.text;
      improvements.push(...specificityResult.improvements);
      rulesApplied.push(...specificityResult.rulesApplied);

      // 4. Apply tone adjustments
      if (context.tone) {
        const toneResult = this.adjustTone(optimized, context.tone);
        optimized = toneResult.text;
        improvements.push(...toneResult.improvements);
        rulesApplied.push(...toneResult.rulesApplied);
      }

      // 5. Add context if needed
      if (context.context) {
        const contextResult = this.addContext(optimized, context.context);
        optimized = contextResult.text;
        improvements.push(...contextResult.improvements);
        rulesApplied.push(...contextResult.rulesApplied);
      }

      // 6. Final polish
      const polishResult = this.finalPolish(optimized, context);
      optimized = polishResult.text;
      improvements.push(...polishResult.improvements);
      rulesApplied.push(...polishResult.rulesApplied);

      return {
        optimized: optimized.trim(),
        improvements,
        rulesApplied: [...new Set(rulesApplied)], // Remove duplicates
        enhancements: improvements,
        systemPrompt: this.generateSystemPrompt(domain),
        templateVariables: this.extractTemplateVariables(optimized),
        contextSuggestions: this.generateContextSuggestions(analysis),
      };

    } catch (error) {
      throw new Error(`Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private improveStructure(text: string, context: OptimizationContext): {
    text: string;
    improvements: OptimizationImprovement[];
    rulesApplied: string[];
  } {
    let improved = text;
    const improvements: OptimizationImprovement[] = [];
    const rulesApplied: string[] = [];

    // Ensure proper capitalization
    if (!improved.match(/^[A-Z]/)) {
      const before = improved;
      improved = improved.charAt(0).toUpperCase() + improved.slice(1);
      improvements.push({
        type: 'structure',
        description: 'Capitalized the first letter',
        before: before.substring(0, 20) + '...',
        after: improved.substring(0, 20) + '...',
        impact: 'low',
      });
      rulesApplied.push('capitalize_first_letter');
    }

    // Ensure proper ending punctuation
    if (!improved.match(/[.!?]$/)) {
      const before = improved;
      improved = improved.trim() + '.';
      improvements.push({
        type: 'structure',
        description: 'Added proper ending punctuation',
        before: before.substring(before.length - 20),
        after: improved.substring(improved.length - 20),
        impact: 'low',
      });
      rulesApplied.push('add_ending_punctuation');
    }

    // Convert command-style to request-style for better tone
    const commandPatterns = [
      { pattern: /^(hazme|dame|haz|da|create|make|give|do)\s+/i, replacement: 'Please generate ' },
      { pattern: /^necesito\s+/i, replacement: 'I need you to ' },
      { pattern: /^quiero\s+/i, replacement: 'I would like you to ' },
      { pattern: /^write\s+/i, replacement: 'Please write ' },
      { pattern: /^build\s+/i, replacement: 'Please build ' },
    ];

    commandPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(improved)) {
        const before = improved;
        improved = improved.replace(pattern, replacement);
        improvements.push({
          type: 'structure',
          description: 'Converted command to polite request',
          before: before.substring(0, 30) + '...',
          after: improved.substring(0, 30) + '...',
          impact: 'medium',
        });
        rulesApplied.push('command_to_request');
      }
    });

    // Break up run-on sentences
    if (improved.length > 150 && !improved.includes('.') && !improved.includes('?') && !improved.includes('!')) {
      const sentences = this.splitIntoSentences(improved);
      if (sentences.length > 1) {
        const before = improved;
        improved = sentences.join('. ');
        if (!improved.endsWith('.')) improved += '.';

        improvements.push({
          type: 'structure',
          description: 'Split long sentence into multiple sentences',
          impact: 'high',
        });
        rulesApplied.push('split_run_on_sentence');
      }
    }

    return { text: improved, improvements, rulesApplied };
  }

  private improveClarity(text: string, context: OptimizationContext): {
    text: string;
    improvements: OptimizationImprovement[];
    rulesApplied: string[];
  } {
    let improved = text;
    const improvements: OptimizationImprovement[] = [];
    const rulesApplied: string[] = [];

    // Replace vague terms with specific ones
    const vagueReplacements = [
      { vague: /\bbonit[oa]s?\b/gi, specific: 'well-formatted and professional', context: 'all' },
      { vague: /\bbuen[oa]s?\b/gi, specific: 'high-quality', context: 'all' },
      { vague: /\bmal[oa]s?\b/gi, specific: 'problematic', context: 'all' },
      { vague: /\bthing[s]?\b/gi, specific: 'element', context: 'all' },
      { vague: /\bstuff\b/gi, specific: 'components', context: 'all' },
      { vague: /\bnice\b/gi, specific: 'well-designed', context: 'all' },
      { vague: /\bbig\b/gi, specific: 'comprehensive', context: 'all' },
      { vague: /\bsmall\b/gi, specific: 'concise', context: 'all' },
      { vague: /\bfast\b/gi, specific: 'optimized for performance', context: 'technical' },
      { vague: /\beasy\b/gi, specific: 'user-friendly', context: 'all' },
    ];

    vagueReplacements.forEach(({ vague, specific, context: ruleContext }) => {
      if (vague.test(improved)) {
        const before = improved;
        improved = improved.replace(vague, specific);

        improvements.push({
          type: 'clarity',
          description: `Replaced vague term "${vague.source}" with more specific language`,
          before: this.extractContext(before, vague),
          after: this.extractContext(improved, new RegExp(specific, 'gi')),
          impact: 'high',
        });
        rulesApplied.push(`replace_vague_${vague.source.replace(/[^a-z]/gi, '_')}`);
      }
    });

    // Add specificity to ambiguous requests
    if (context.analysis.ambiguityScore > 0.5) {
      const clarifications = this.generateClarifications(improved, context);
      if (clarifications.length > 0) {
        const before = improved;
        improved = `${improved}\n\nPlease ensure the result includes:\n${clarifications.join('\n')}`;

        improvements.push({
          type: 'clarity',
          description: 'Added specific requirements to reduce ambiguity',
          impact: 'high',
        });
        rulesApplied.push('add_clarifications');
      }
    }

    // Replace pronouns with specific references when possible
    const pronounReplacements = [
      { pronoun: /\bit\b/gi, context: 'needs_context' },
      { pronoun: /\bthis\b/gi, context: 'needs_context' },
      { pronoun: /\bthat\b/gi, context: 'needs_context' },
    ];

    // This would need more sophisticated context understanding
    // For now, we'll flag it as needing improvement

    return { text: improved, improvements, rulesApplied };
  }

  private improveSpecificity(text: string, context: OptimizationContext): {
    text: string;
    improvements: OptimizationImprovement[];
    rulesApplied: string[];
  } {
    let improved = text;
    const improvements: OptimizationImprovement[] = [];
    const rulesApplied: string[] = [];

    // Add technical specifications based on domain hints
    const domainEnhancements = this.getDomainSpecificEnhancements(improved, context);
    if (domainEnhancements.length > 0) {
      const before = improved;
      improved = `${improved}\n\nSpecific requirements:\n${domainEnhancements.join('\n')}`;

      improvements.push({
        type: 'specificity',
        description: 'Added domain-specific technical requirements',
        impact: 'high',
      });
      rulesApplied.push('add_domain_specifications');
    }

    // Add format specifications
    if (!improved.toLowerCase().includes('format') && !improved.toLowerCase().includes('style')) {
      const formatSuggestions = this.suggestFormat(improved, context);
      if (formatSuggestions) {
        const before = improved;
        improved = `${improved}\n\nFormat: ${formatSuggestions}`;

        improvements.push({
          type: 'specificity',
          description: 'Added format specifications',
          impact: 'medium',
        });
        rulesApplied.push('add_format_specifications');
      }
    }

    // Add examples request when beneficial
    if (context.analysis.complexity > 0.6 && !improved.toLowerCase().includes('example')) {
      const before = improved;
      improved = `${improved}\n\nPlease include examples to illustrate the solution.`;

      improvements.push({
        type: 'specificity',
        description: 'Added request for examples',
        impact: 'medium',
      });
      rulesApplied.push('add_examples_request');
    }

    return { text: improved, improvements, rulesApplied };
  }

  private adjustTone(text: string, tone: PromptTone): {
    text: string;
    improvements: OptimizationImprovement[];
    rulesApplied: string[];
  } {
    let improved = text;
    const improvements: OptimizationImprovement[] = [];
    const rulesApplied: string[] = [];

    const toneAdjustments = {
      formal: {
        patterns: [
          { from: /\bhi\b/gi, to: 'Greetings' },
          { from: /\bhey\b/gi, to: 'Hello' },
          { from: /\bokay\b/gi, to: 'acceptable' },
          { from: /\bguys\b/gi, to: 'team' },
        ],
        prefix: 'I would like to request ',
      },
      casual: {
        patterns: [
          { from: /\bI would like to request\b/gi, to: 'I need' },
          { from: /\bPlease generate\b/gi, to: 'Create' },
          { from: /\bkindly\b/gi, to: '' },
        ],
        prefix: '',
      },
      technical: {
        patterns: [
          { from: /\bmake\b/gi, to: 'implement' },
          { from: /\bbuild\b/gi, to: 'develop' },
          { from: /\bfix\b/gi, to: 'resolve' },
        ],
        prefix: 'Please implement ',
      },
      creative: {
        patterns: [
          { from: /\bimplement\b/gi, to: 'craft' },
          { from: /\bgenerate\b/gi, to: 'create' },
          { from: /\bdevelop\b/gi, to: 'design' },
        ],
        prefix: 'Let\'s create ',
      },
    };

    const adjustments = toneAdjustments[tone];
    if (adjustments) {
      // Apply pattern replacements
      adjustments.patterns.forEach(({ from, to }) => {
        if (from.test(improved)) {
          const before = improved;
          improved = improved.replace(from, to);

          improvements.push({
            type: 'tone',
            description: `Adjusted tone to be more ${tone}`,
            before: this.extractContext(before, from),
            after: this.extractContext(improved, new RegExp(to, 'gi')),
            impact: 'medium',
          });
          rulesApplied.push(`tone_${tone}_adjustment`);
        }
      });
    }

    return { text: improved, improvements, rulesApplied };
  }

  private addContext(text: string, context: string): {
    text: string;
    improvements: OptimizationImprovement[];
    rulesApplied: string[];
  } {
    const improvements: OptimizationImprovement[] = [];
    const rulesApplied: string[] = [];

    const improved = `${text}\n\nAdditional context: ${context}`;

    improvements.push({
      type: 'context',
      description: 'Added additional context for better understanding',
      impact: 'high',
    });
    rulesApplied.push('add_context');

    return { text: improved, improvements, rulesApplied };
  }

  private finalPolish(text: string, context: OptimizationContext): {
    text: string;
    improvements: OptimizationImprovement[];
    rulesApplied: string[];
  } {
    let improved = text;
    const improvements: OptimizationImprovement[] = [];
    const rulesApplied: string[] = [];

    // Remove redundant whitespace
    const before = improved;
    improved = improved.replace(/\s+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim();

    if (before !== improved) {
      improvements.push({
        type: 'structure',
        description: 'Cleaned up formatting and whitespace',
        impact: 'low',
      });
      rulesApplied.push('clean_whitespace');
    }

    // Ensure logical flow
    const sections = improved.split('\n\n');
    if (sections.length > 1) {
      // Reorder if needed (main request first, then specifications, then context)
      const reordered = this.reorderSections(sections);
      if (reordered !== improved) {
        improved = reordered;
        improvements.push({
          type: 'structure',
          description: 'Improved logical flow of sections',
          impact: 'medium',
        });
        rulesApplied.push('reorder_sections');
      }
    }

    return { text: improved, improvements, rulesApplied };
  }

  // Helper methods

  private generateSystemPrompt(domain?: string): string {
    const basePrompt = "You are an expert assistant";
    if (!domain) return basePrompt;
    
    const domainPrompts: Record<string, string> = {
      'sql': 'You are an expert database architect and SQL specialist',
      'branding': 'You are a professional branding and marketing expert',
      'cine': 'You are an expert screenwriter and film industry professional',
      'saas': 'You are a SaaS product development and business strategy expert',
      'devops': 'You are a DevOps and infrastructure engineering expert',
      'general': 'You are a helpful and knowledgeable assistant'
    };
    
    return domainPrompts[domain] || basePrompt;
  }

  private extractTemplateVariables(text: string): string[] {
    const variables: string[] = [];
    const matches = text.match(/\{\{(\w+)\}\}/g);
    if (matches) {
      matches.forEach(match => {
        const variable = match.replace(/\{\{|\}\}/g, '');
        if (!variables.includes(variable)) {
          variables.push(variable);
        }
      });
    }
    return variables;
  }

  private generateContextSuggestions(analysis: AnalysisResult): string[] {
    const suggestions: string[] = [];
    
    if (analysis.ambiguityScore > 0.5) {
      suggestions.push('Consider being more specific about requirements');
    }
    
    if (analysis.complexity < 0.3) {
      suggestions.push('Add more technical details for better clarity');
    }
    
    if (analysis.domainHints.length === 0) {
      suggestions.push('Specify the domain or context for better optimization');
    }
    
    return suggestions;
  }

  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting - could be improved with more sophisticated NLP
    const sentences = [];
    const words = text.split(' ');
    let currentSentence = [];

    for (let i = 0; i < words.length; i++) {
      currentSentence.push(words[i]);

      // Start new sentence after certain conjunctions if current is long enough
      if (currentSentence.length > 8) {
        if (['and', 'but', 'or', 'so', 'because', 'since', 'while'].includes(words[i].toLowerCase())) {
          sentences.push(currentSentence.join(' '));
          currentSentence = [];
        }
      }
    }

    if (currentSentence.length > 0) {
      sentences.push(currentSentence.join(' '));
    }

    return sentences.length > 1 ? sentences : [text];
  }

  private generateClarifications(text: string, context: OptimizationContext): string[] {
    const clarifications: string[] = [];

    // Based on ambiguity analysis
    if (context.analysis.ambiguityScore > 0.7) {
      clarifications.push('- Clear and specific requirements');
      clarifications.push('- Well-defined scope and boundaries');
    }

    // Based on domain hints
    context.analysis.domainHints.forEach(domain => {
      switch (domain) {
        case 'sql':
          clarifications.push('- Proper table structure with appropriate data types');
          clarifications.push('- Indexes and constraints where applicable');
          break;
        case 'branding':
          clarifications.push('- Target audience and brand voice');
          clarifications.push('- Key messaging and value propositions');
          break;
        case 'saas':
          clarifications.push('- User experience considerations');
          clarifications.push('- Technical architecture requirements');
          break;
      }
    });

    return clarifications;
  }

  private getDomainSpecificEnhancements(text: string, context: OptimizationContext): string[] {
    const enhancements: string[] = [];

    context.analysis.domainHints.forEach(domain => {
      switch (domain) {
        case 'sql':
          if (!text.toLowerCase().includes('constraint')) {
            enhancements.push('- Include appropriate constraints and relationships');
          }
          if (!text.toLowerCase().includes('index')) {
            enhancements.push('- Consider indexing for performance optimization');
          }
          if (!text.toLowerCase().includes('sample')) {
            enhancements.push('- Provide sample data for testing');
          }
          break;
        case 'branding':
          if (!text.toLowerCase().includes('audience')) {
            enhancements.push('- Define target audience characteristics');
          }
          if (!text.toLowerCase().includes('tone') && !text.toLowerCase().includes('voice')) {
            enhancements.push('- Specify brand voice and tone guidelines');
          }
          break;
        case 'cine':
          if (!text.toLowerCase().includes('format')) {
            enhancements.push('- Follow industry-standard screenplay format');
          }
          if (!text.toLowerCase().includes('character')) {
            enhancements.push('- Develop well-defined character profiles');
          }
          break;
      }
    });

    return enhancements;
  }

  private suggestFormat(text: string, context: OptimizationContext): string | null {
    const lowerText = text.toLowerCase();

    if (context.analysis.domainHints.includes('sql')) {
      return 'SQL with proper formatting, comments, and examples';
    }

    if (context.analysis.domainHints.includes('cine')) {
      return 'Industry-standard screenplay format';
    }

    if (lowerText.includes('code') || lowerText.includes('script')) {
      return 'Well-commented code with clear variable names';
    }

    if (lowerText.includes('document') || lowerText.includes('report')) {
      return 'Structured document with clear headings and sections';
    }

    return null;
  }

  private extractContext(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    if (!match) return '';

    const index = match.index || 0;
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + match[0].length + 20);

    return text.substring(start, end);
  }

  private reorderSections(sections: string[]): string {
    // Simple reordering logic - main content first, specifications second, context last
    const mainContent: string[] = [];
    const specifications: string[] = [];
    const context: string[] = [];

    sections.forEach(section => {
      const lower = section.toLowerCase();
      if (lower.includes('specific requirements:') || lower.includes('format:')) {
        specifications.push(section);
      } else if (lower.includes('additional context:') || lower.includes('note:')) {
        context.push(section);
      } else {
        mainContent.push(section);
      }
    });

    return [...mainContent, ...specifications, ...context].join('\n\n');
  }

  private initializeRules(): void {
    // Initialize domain-specific rules
    // This would be loaded from configuration or database in a real implementation
  }
}