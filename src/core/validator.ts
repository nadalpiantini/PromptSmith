import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationSuggestion,
  QualityMetrics,
  AnalysisResult,
} from '../types/prompt.js';

interface ValidationContext {
  prompt: string;
  analysis: AnalysisResult;
  domain?: string;
  targetAudience?: string;
}

export class PromptValidator {
  private readonly minLength = 10;
  private readonly maxLength = 5000;
  private readonly maxAmbiguityScore = 0.7;
  private readonly minReadabilityScore = 0.3;

  async validate(prompt: string, analysis?: AnalysisResult): Promise<ValidationResult> {
    try {
      const context: ValidationContext = {
        prompt,
        analysis: analysis || await this.quickAnalysis(prompt),
      };

      const errors = await this.validateErrors(context);
      const warnings = await this.validateWarnings(context);
      const suggestions = await this.generateSuggestions(context);
      const qualityMetrics = await this.calculateQualityMetrics(context);

      const isValid = errors.length === 0;

      return {
        isValid,
        errors,
        warnings,
        suggestions,
        qualityMetrics,
      };

    } catch (error) {
      throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateErrors(context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Length validation
    if (context.prompt.length < this.minLength) {
      errors.push({
        code: 'PROMPT_TOO_SHORT',
        message: `Prompt is too short (${context.prompt.length} characters). Minimum is ${this.minLength} characters.`,
        severity: 'high',
      });
    }

    if (context.prompt.length > this.maxLength) {
      errors.push({
        code: 'PROMPT_TOO_LONG',
        message: `Prompt is too long (${context.prompt.length} characters). Maximum is ${this.maxLength} characters.`,
        severity: 'medium',
      });
    }

    // Content validation
    if (!context.prompt.trim()) {
      errors.push({
        code: 'EMPTY_PROMPT',
        message: 'Prompt cannot be empty or contain only whitespace.',
        severity: 'critical',
      });
    }

    // Language validation
    if (this.containsOffensiveContent(context.prompt)) {
      errors.push({
        code: 'OFFENSIVE_CONTENT',
        message: 'Prompt contains potentially offensive or inappropriate content.',
        severity: 'critical',
      });
    }

    // Structure validation
    if (this.lacksBasicStructure(context.prompt)) {
      errors.push({
        code: 'LACKS_STRUCTURE',
        message: 'Prompt lacks basic grammatical structure or contains only fragments.',
        severity: 'high',
      });
    }

    return errors;
  }

  private async validateWarnings(context: ValidationContext): Promise<ValidationWarning[]> {
    const warnings: ValidationWarning[] = [];

    // Ambiguity warnings
    if (context.analysis.ambiguityScore > this.maxAmbiguityScore) {
      warnings.push({
        code: 'HIGH_AMBIGUITY',
        message: `Prompt has high ambiguity score (${(context.analysis.ambiguityScore * 100).toFixed(1)}%). This may lead to unclear results.`,
        suggestion: 'Consider replacing vague terms with more specific language.',
      });
    }

    // Readability warnings
    if (context.analysis.readabilityScore < this.minReadabilityScore) {
      warnings.push({
        code: 'LOW_READABILITY',
        message: `Prompt has low readability score (${(context.analysis.readabilityScore * 100).toFixed(1)}%). This may be difficult to understand.`,
        suggestion: 'Simplify sentence structure and use clearer language.',
      });
    }

    // Complexity warnings
    if (context.analysis.complexity > 0.8) {
      warnings.push({
        code: 'HIGH_COMPLEXITY',
        message: 'Prompt has very high complexity. This may be difficult to process effectively.',
        suggestion: 'Consider breaking complex requests into simpler, focused tasks.',
      });
    }

    // Missing context warnings
    if (this.needsMoreContext(context)) {
      warnings.push({
        code: 'NEEDS_CONTEXT',
        message: 'Prompt may benefit from additional context or background information.',
        suggestion: 'Add relevant context, constraints, or examples to clarify your request.',
      });
    }

    // Domain-specific warnings
    const domainWarnings = this.validateDomainSpecific(context);
    warnings.push(...domainWarnings);

    // Language mixing warning
    if (this.hasMixedLanguages(context.prompt)) {
      warnings.push({
        code: 'MIXED_LANGUAGES',
        message: 'Prompt contains mixed languages which may affect processing quality.',
        suggestion: 'Consider using a single language throughout the prompt.',
      });
    }

    return warnings;
  }

  private async generateSuggestions(context: ValidationContext): Promise<ValidationSuggestion[]> {
    const suggestions: ValidationSuggestion[] = [];

    // Clarity suggestions
    if (context.analysis.ambiguityScore > 0.5) {
      const vagueTerms = this.findVagueTerms(context.prompt);
      if (vagueTerms.length > 0) {
        suggestions.push({
          type: 'enhancement',
          message: `Replace vague terms: ${vagueTerms.join(', ')}`,
          before: vagueTerms[0],
          after: this.getSuggestedReplacement(vagueTerms[0]),
        });
      }
    }

    // Structure suggestions
    if (!this.hasActionVerb(context.prompt)) {
      suggestions.push({
        type: 'enhancement',
        message: 'Add a clear action verb to specify what you want accomplished',
        before: context.prompt.substring(0, 30) + '...',
        after: 'Please generate/create/analyze/explain ' + context.prompt.substring(0, 30) + '...',
      });
    }

    // Specificity suggestions
    if (!context.analysis.hasVariables && this.couldBenefitFromVariables(context.prompt)) {
      suggestions.push({
        type: 'enhancement',
        message: 'Consider using template variables for reusability',
        before: 'Create a table for users',
        after: 'Create a table for {{entity_type}}',
      });
    }

    // Format suggestions
    if (this.needsFormatSpecification(context)) {
      suggestions.push({
        type: 'enhancement',
        message: 'Specify desired output format',
        before: context.prompt,
        after: context.prompt + '\n\nFormat: [specify format requirements]',
      });
    }

    // Examples suggestion
    if (context.analysis.complexity > 0.6 && !context.prompt.toLowerCase().includes('example')) {
      suggestions.push({
        type: 'enhancement',
        message: 'Request examples for complex tasks',
        before: context.prompt,
        after: context.prompt + '\n\nPlease include examples to illustrate the solution.',
      });
    }

    // Domain-specific suggestions
    const domainSuggestions = this.generateDomainSuggestions(context);
    suggestions.push(...domainSuggestions);

    return suggestions;
  }

  private async calculateQualityMetrics(context: ValidationContext): Promise<QualityMetrics> {
    const clarity = this.calculateClarityScore(context);
    const specificity = this.calculateSpecificityScore(context);
    const structure = this.calculateStructureScore(context);
    const completeness = this.calculateCompletenessScore(context);
    const consistency = this.calculateConsistencyScore(context);
    const actionability = this.calculateActionabilityScore(context);

    return {
      clarity,
      specificity,
      structure,
      completeness,
      consistency,
      actionability,
    };
  }

  private calculateClarityScore(context: ValidationContext): number {
    let score = 1.0;

    // Penalize for high ambiguity
    score -= context.analysis.ambiguityScore * 0.4;

    // Penalize for low readability
    score -= (1 - context.analysis.readabilityScore) * 0.3;

    // Penalize for vague terms
    const vagueTerms = this.findVagueTerms(context.prompt);
    const vagueTermRatio = vagueTerms.length / context.analysis.tokens.length;
    score -= vagueTermRatio * 0.3;

    return Math.max(0, Math.min(1, score));
  }

  private calculateSpecificityScore(context: ValidationContext): number {
    let score = 0.5; // Base score

    // Boost for technical terms
    const techTermRatio = context.analysis.technicalTerms.length / context.analysis.tokens.length;
    score += techTermRatio * 0.3;

    // Boost for specific numbers, dates, formats
    if (this.containsSpecificDetails(context.prompt)) {
      score += 0.2;
    }

    // Boost for constraints and requirements
    if (this.containsConstraints(context.prompt)) {
      score += 0.2;
    }

    // Penalize for overly generic language
    if (this.isOverlyGeneric(context.prompt)) {
      score -= 0.3;
    }

    // Boost for domain-specific terminology
    if (context.analysis.domainHints.length > 0) {
      score += context.analysis.domainHints.length * 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateStructureScore(context: ValidationContext): number {
    let score = 0.5; // Base score

    // Check for proper grammar and structure
    if (this.hasGoodGrammar(context.prompt)) {
      score += 0.2;
    }

    // Check for logical flow
    if (this.hasLogicalFlow(context.prompt)) {
      score += 0.2;
    }

    // Check for proper punctuation
    if (this.hasProperPunctuation(context.prompt)) {
      score += 0.1;
    }

    // Check for appropriate length
    const lengthScore = this.calculateLengthScore(context.prompt.length);
    score += lengthScore * 0.1;

    // Penalize for run-on sentences
    if (this.hasRunOnSentences(context.prompt)) {
      score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateCompletenessScore(context: ValidationContext): number {
    let score = 0.3; // Base score

    // Check for clear objective
    if (this.hasActionVerb(context.prompt)) {
      score += 0.3;
    }

    // Check for context provision
    if (this.hasAdequateContext(context)) {
      score += 0.2;
    }

    // Check for constraints or requirements
    if (this.containsConstraints(context.prompt)) {
      score += 0.1;
    }

    // Check for expected output specification
    if (this.specifiesExpectedOutput(context.prompt)) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateConsistencyScore(context: ValidationContext): number {
    let score = 1.0;

    // Penalize for mixed languages
    if (this.hasMixedLanguages(context.prompt)) {
      score -= 0.3;
    }

    // Penalize for inconsistent terminology
    if (this.hasInconsistentTerminology(context.prompt)) {
      score -= 0.2;
    }

    // Penalize for conflicting requirements
    if (this.hasConflictingRequirements(context.prompt)) {
      score -= 0.4;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateActionabilityScore(context: ValidationContext): number {
    let score = 0.2; // Base score

    // Boost for clear action verbs
    if (this.hasActionVerb(context.prompt)) {
      score += 0.4;
    }

    // Boost for specific deliverables
    if (this.specifiesDeliverables(context.prompt)) {
      score += 0.2;
    }

    // Boost for measurable outcomes
    if (this.hasMeasurableOutcomes(context.prompt)) {
      score += 0.1;
    }

    // Penalize for overly abstract requests
    if (this.isOverlyAbstract(context.prompt)) {
      score -= 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  // Helper methods for validation checks

  private containsOffensiveContent(prompt: string): boolean {
    // Basic offensive content detection
    const offensivePatterns = [
      /\b(hate|kill|destroy|attack|harm)\s+\w+\b/i,
      // Add more patterns as needed
    ];

    return offensivePatterns.some(pattern => pattern.test(prompt));
  }

  private lacksBasicStructure(prompt: string): boolean {
    // Check if prompt has basic sentence structure
    const words = prompt.trim().split(/\s+/);
    return words.length < 3 || !/[a-zA-Z]/.test(prompt);
  }

  private needsMoreContext(context: ValidationContext): boolean {
    const shortPrompt = context.prompt.length < 50;
    const highAmbiguity = context.analysis.ambiguityScore > 0.6;
    const fewTechnicalTerms = context.analysis.technicalTerms.length === 0;

    return shortPrompt && highAmbiguity && fewTechnicalTerms;
  }

  private validateDomainSpecific(context: ValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    context.analysis.domainHints.forEach(domain => {
      switch (domain) {
        case 'sql':
          if (!context.prompt.toLowerCase().includes('table') &&
              !context.prompt.toLowerCase().includes('query')) {
            warnings.push({
              code: 'SQL_MISSING_SPECIFICS',
              message: 'SQL request may need more specific table or query details.',
              suggestion: 'Specify table names, columns, or query requirements.',
            });
          }
          break;

        case 'branding':
          if (!context.prompt.toLowerCase().includes('audience') &&
              !context.prompt.toLowerCase().includes('brand')) {
            warnings.push({
              code: 'BRANDING_MISSING_CONTEXT',
              message: 'Branding request may need target audience or brand context.',
              suggestion: 'Specify target audience, brand voice, or campaign objectives.',
            });
          }
          break;

        // Add more domain-specific validations
      }
    });

    return warnings;
  }

  private hasMixedLanguages(prompt: string): boolean {
    const spanishWords = (prompt.match(/\b(el|la|los|las|de|en|con|que|bonit[oa]|bueno|malo|necesito|quiero)\b/gi) || []).length;
    const englishWords = (prompt.match(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|good|bad|nice|need|want)\b/gi) || []).length;

    return spanishWords > 0 && englishWords > 0;
  }

  private findVagueTerms(prompt: string): string[] {
    const vagueTerms = ['bonito', 'bonita', 'bueno', 'malo', 'good', 'bad', 'nice', 'thing', 'stuff', 'some', 'many'];
    const found: string[] = [];

    vagueTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(prompt)) {
        found.push(term);
      }
    });

    return found;
  }

  private getSuggestedReplacement(vagueTerm: string): string {
    const replacements: Record<string, string> = {
      'bonito': 'well-formatted',
      'bonita': 'professional',
      'bueno': 'high-quality',
      'malo': 'problematic',
      'good': 'effective',
      'bad': 'ineffective',
      'nice': 'well-designed',
      'thing': 'element',
      'stuff': 'components',
      'some': 'specific',
      'many': 'multiple',
    };

    return replacements[vagueTerm.toLowerCase()] || 'specific';
  }

  private hasActionVerb(prompt: string): boolean {
    const actionVerbs = [
      'create', 'generate', 'make', 'build', 'write', 'develop', 'design',
      'analyze', 'review', 'evaluate', 'check', 'examine',
      'update', 'modify', 'change', 'improve', 'optimize',
      'explain', 'describe', 'show', 'demonstrate'
    ];

    return actionVerbs.some(verb => new RegExp(`\\b${verb}\\b`, 'i').test(prompt));
  }

  private couldBenefitFromVariables(prompt: string): boolean {
    // Check if prompt has repeated patterns that could be variabilized
    const patterns = [
      /\b(user|customer|client|person|entity)\b/gi,
      /\b(table|database|schema)\b/gi,
      /\b(component|module|function|class)\b/gi,
    ];

    return patterns.some(pattern => (prompt.match(pattern) || []).length > 1);
  }

  private needsFormatSpecification(context: ValidationContext): boolean {
    const formatKeywords = ['format', 'style', 'structure', 'layout'];
    const hasFormatKeywords = formatKeywords.some(keyword =>
      context.prompt.toLowerCase().includes(keyword)
    );

    return !hasFormatKeywords && context.analysis.complexity > 0.5;
  }

  private generateDomainSuggestions(context: ValidationContext): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];

    context.analysis.domainHints.forEach(domain => {
      switch (domain) {
        case 'sql':
          if (!context.prompt.toLowerCase().includes('constraint')) {
            suggestions.push({
              type: 'enhancement',
              message: 'Consider specifying constraints and relationships',
              after: 'Include appropriate constraints, foreign keys, and indexes',
            });
          }
          break;

        case 'branding':
          if (!context.prompt.toLowerCase().includes('tone')) {
            suggestions.push({
              type: 'enhancement',
              message: 'Specify brand tone and voice',
              after: 'Define the desired brand tone (professional, friendly, etc.)',
            });
          }
          break;
      }
    });

    return suggestions;
  }

  // Additional helper methods for quality metrics

  private containsSpecificDetails(prompt: string): boolean {
    return /\b(\d+|specific|particular|exact|precise)\b/i.test(prompt);
  }

  private containsConstraints(prompt: string): boolean {
    return /\b(must|should|require|need|constraint|limit|within)\b/i.test(prompt);
  }

  private isOverlyGeneric(prompt: string): boolean {
    const genericTerms = ['generic', 'general', 'basic', 'simple', 'standard'];
    return genericTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(prompt));
  }

  private hasGoodGrammar(prompt: string): boolean {
    // Basic grammar checks
    return /^[A-Z]/.test(prompt.trim()) && /[.!?]$/.test(prompt.trim());
  }

  private hasLogicalFlow(prompt: string): boolean {
    // Check for logical connectors
    return /\b(then|next|after|before|because|so|therefore|however)\b/i.test(prompt);
  }

  private hasProperPunctuation(prompt: string): boolean {
    return /[.!?]$/.test(prompt.trim());
  }

  private calculateLengthScore(length: number): number {
    // Optimal length is around 100-300 characters
    if (length >= 100 && length <= 300) return 1.0;
    if (length >= 50 && length <= 500) return 0.8;
    if (length >= 20 && length <= 1000) return 0.6;
    return 0.4;
  }

  private hasRunOnSentences(prompt: string): boolean {
    const sentences = prompt.split(/[.!?]+/);
    return sentences.some(sentence => sentence.trim().split(' ').length > 25);
  }

  private hasAdequateContext(context: ValidationContext): boolean {
    return context.prompt.length > 80 || context.analysis.technicalTerms.length > 2;
  }

  private specifiesExpectedOutput(prompt: string): boolean {
    return /\b(output|result|return|format|should|expect)\b/i.test(prompt);
  }

  private hasInconsistentTerminology(prompt: string): boolean {
    // Simple check for common terminology inconsistencies
    const inconsistencies = [
      ['user', 'client', 'customer'], // Should pick one
      ['table', 'database', 'db'], // Context dependent
    ];

    return inconsistencies.some(terms =>
      terms.filter(term => new RegExp(`\\b${term}\\b`, 'i').test(prompt)).length > 1
    );
  }

  private hasConflictingRequirements(prompt: string): boolean {
    // Check for obvious conflicts
    return /\b(simple\b.*complex|fast\b.*slow|big\b.*small)\b/i.test(prompt);
  }

  private specifiesDeliverables(prompt: string): boolean {
    return /\b(deliver|provide|create|generate|produce|build)\b/i.test(prompt);
  }

  private hasMeasurableOutcomes(prompt: string): boolean {
    return /\b(\d+|measure|metric|criteria|success|complete)\b/i.test(prompt);
  }

  private isOverlyAbstract(prompt: string): boolean {
    const abstractTerms = ['concept', 'idea', 'notion', 'abstract', 'theoretical'];
    return abstractTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(prompt));
  }

  private async quickAnalysis(prompt: string): Promise<AnalysisResult> {
    // Simplified analysis for validation purposes
    return {
      tokens: [],
      entities: [],
      intent: { category: 'unknown', confidence: 0, subcategories: [] },
      complexity: prompt.length / 200,
      ambiguityScore: this.findVagueTerms(prompt).length / 10,
      hasVariables: this.detectVariables(prompt),
      language: 'unknown',
      domainHints: [],
      sentimentScore: 0,
      readabilityScore: 0.5,
      technicalTerms: [],
    };
  }

  private detectVariables(text: string): boolean {
    const variablePatterns = [
      /\{\{\s*\w+\s*\}\}/g,
      /\$\w+/g,
      /:\w+/g,
    ];
    return variablePatterns.some(pattern => pattern.test(text));
  }
}