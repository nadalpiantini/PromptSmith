import {
  QualityScore,
  QualityBreakdown,
  QualityFactor,
  AnalysisResult,
  ValidationResult,
  PromptDomain,
} from '../types/prompt.js';
import { domainRegistry } from '../rules/index.js';

export interface ScoringContext {
  prompt: string;
  domain: PromptDomain;
  analysis?: AnalysisResult;
  validation?: ValidationResult;
  originalPrompt?: string;
}

export interface ScoringWeights {
  clarity: number;
  specificity: number;
  structure: number;
  completeness: number;
}

export interface ScoreCalculationResult {
  score: QualityScore;
  breakdown: QualityBreakdown;
  improvement: number;
  confidence: number;
  factors: QualityFactor[];
}

export class PromptScorer {
  private defaultWeights: ScoringWeights = {
    clarity: 0.25,
    specificity: 0.25,
    structure: 0.25,
    completeness: 0.25
  };

  async calculate(
    prompt: string,
    validation?: ValidationResult,
    analysis?: AnalysisResult,
    domain: PromptDomain = PromptDomain.GENERAL
  ): Promise<QualityScore> {
    const context: ScoringContext = {
      prompt,
      domain,
      ...(analysis && { analysis }),
      ...(validation && { validation })
    };

    const result = await this.calculateDetailed(context);
    return result.score;
  }

  async calculateDetailed(context: ScoringContext): Promise<ScoreCalculationResult> {
    try {
      // Get domain-specific weights
      const weights = domainRegistry.getQualityWeights(context.domain) || this.defaultWeights;

      // Calculate individual quality metrics
      const clarityScore = this.calculateClarity(context);
      const specificityScore = this.calculateSpecificity(context);
      const structureScore = this.calculateStructure(context);
      const completenessScore = this.calculateCompleteness(context);

      // Calculate weighted overall score
      const overall = this.calculateWeightedScore({
        clarity: clarityScore,
        specificity: specificityScore,
        structure: structureScore,
        completeness: completenessScore
      }, weights);

      // Create quality score object
      const score: QualityScore = {
        clarity: clarityScore,
        specificity: specificityScore,
        structure: structureScore,
        completeness: completenessScore,
        overall
      };

      // Generate detailed breakdown
      const breakdown = this.generateBreakdown(context, score);

      // Calculate improvement if original prompt provided
      const improvement = this.calculateImprovement(context);

      // Calculate confidence in the scoring
      const confidence = this.calculateConfidence(context, score);

      // Generate quality factors
      const factors = this.generateQualityFactors(context, score);

      return {
        score,
        breakdown,
        improvement,
        confidence,
        factors
      };

    } catch (error) {
      throw new Error(`Scoring calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  private calculateClarity(context: ScoringContext): number {
    let score = 1.0;

    // Penalize for high ambiguity
    if (context.analysis?.ambiguityScore) {
      score -= context.analysis.ambiguityScore * 0.4;
    }

    // Penalize for low readability
    if (context.analysis?.readabilityScore) {
      score -= (1 - context.analysis.readabilityScore) * 0.3;
    }

    // Penalize for vague terms
    const vagueTerms = this.detectVagueTerms(context.prompt);
    const vagueTermRatio = vagueTerms.length / (context.prompt.split(/\s+/).length || 1);
    score -= vagueTermRatio * 0.3;

    // Boost for clear structure
    if (this.hasClearStructure(context.prompt)) {
      score += 0.1;
    }

    // Boost for specific terminology
    if (context.analysis?.technicalTerms && context.analysis.technicalTerms.length > 0) {
      score += Math.min(0.1, context.analysis.technicalTerms.length * 0.02);
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateSpecificity(context: ScoringContext): number {
    let score = 0.5; // Base score

    // Boost for technical terms
    if (context.analysis?.technicalTerms) {
      const techTermRatio = context.analysis.technicalTerms.length /
        (context.prompt.split(/\s+/).length || 1);
      score += techTermRatio * 0.3;
    }

    // Boost for specific details (numbers, formats, constraints)
    if (this.containsSpecificDetails(context.prompt)) {
      score += 0.2;
    }

    // Boost for requirements and constraints
    if (this.containsRequirements(context.prompt)) {
      score += 0.2;
    }

    // Boost for domain-specific terminology
    if (context.analysis?.domainHints && context.analysis.domainHints.length > 0) {
      score += context.analysis.domainHints.length * 0.1;
    }

    // Penalize for overly generic language
    if (this.isOverlyGeneric(context.prompt)) {
      score -= 0.3;
    }

    // Boost for examples or specific use cases
    if (this.containsExamples(context.prompt)) {
      score += 0.15;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateStructure(context: ScoringContext): number {
    let score = 0.5; // Base score

    // Check for proper grammar and punctuation
    if (this.hasGoodGrammar(context.prompt)) {
      score += 0.2;
    }

    // Check for logical flow and organization
    if (this.hasLogicalFlow(context.prompt)) {
      score += 0.2;
    }

    // Check for appropriate length
    const lengthScore = this.calculateLengthScore(context.prompt.length);
    score += lengthScore * 0.15;

    // Check for clear action verbs
    if (this.hasActionVerbs(context.prompt)) {
      score += 0.15;
    }

    // Penalize for run-on sentences
    if (this.hasRunOnSentences(context.prompt)) {
      score -= 0.2;
    }

    // Boost for sectioned or bulleted content
    if (this.hasStructuredContent(context.prompt)) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateCompleteness(context: ScoringContext): number {
    let score = 0.3; // Base score

    // Boost for clear objectives
    if (this.hasActionVerbs(context.prompt)) {
      score += 0.3;
    }

    // Boost for context provision
    if (context.prompt.length > 100) {
      score += 0.2;
    }

    // Boost for requirements specification
    if (this.containsRequirements(context.prompt)) {
      score += 0.15;
    }

    // Boost for expected output specification
    if (this.specifiesExpectedOutput(context.prompt)) {
      score += 0.15;
    }

    // Domain-specific completeness checks
    score += this.calculateDomainCompleteness(context);

    // Validation-based adjustments
    if (context.validation) {
      if (context.validation.errors.length === 0) {
        score += 0.1;
      }

      if (context.validation.warnings.length === 0) {
        score += 0.05;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateWeightedScore(scores: Omit<QualityScore, 'overall'>, weights: ScoringWeights): number {
    return (
      scores.clarity * weights.clarity +
      scores.specificity * weights.specificity +
      scores.structure * weights.structure +
      scores.completeness * weights.completeness
    );
  }

  private generateBreakdown(context: ScoringContext, score: QualityScore): QualityBreakdown {
    return {
      clarity: {
        score: score.clarity,
        factors: this.getClarityFactors(context, score.clarity)
      },
      specificity: {
        score: score.specificity,
        factors: this.getSpecificityFactors(context, score.specificity)
      },
      structure: {
        score: score.structure,
        factors: this.getStructureFactors(context, score.structure)
      },
      completeness: {
        score: score.completeness,
        factors: this.getCompletenessFactors(context, score.completeness)
      }
    };
  }

  private getClarityFactors(context: ScoringContext, score: number): QualityFactor[] {
    const factors: QualityFactor[] = [];

    if (context.analysis?.ambiguityScore && context.analysis.ambiguityScore > 0.5) {
      factors.push({
        name: 'Ambiguity',
        weight: 0.4,
        score: 1 - context.analysis.ambiguityScore,
        description: 'Contains ambiguous or vague terms that may lead to unclear results'
      });
    }

    if (context.analysis?.readabilityScore && context.analysis.readabilityScore < 0.6) {
      factors.push({
        name: 'Readability',
        weight: 0.3,
        score: context.analysis.readabilityScore,
        description: 'Text complexity and readability level'
      });
    }

    const vagueTerms = this.detectVagueTerms(context.prompt);
    if (vagueTerms.length > 0) {
      factors.push({
        name: 'Specific Language',
        weight: 0.3,
        score: Math.max(0, 1 - (vagueTerms.length / 10)),
        description: `Contains ${vagueTerms.length} vague terms that could be more specific`
      });
    }

    return factors;
  }

  private getSpecificityFactors(context: ScoringContext, score: number): QualityFactor[] {
    const factors: QualityFactor[] = [];

    if (context.analysis?.technicalTerms) {
      factors.push({
        name: 'Technical Terminology',
        weight: 0.3,
        score: Math.min(1, context.analysis.technicalTerms.length / 5),
        description: `Uses ${context.analysis.technicalTerms.length} technical terms`
      });
    }

    if (this.containsSpecificDetails(context.prompt)) {
      factors.push({
        name: 'Specific Details',
        weight: 0.2,
        score: 1.0,
        description: 'Includes specific numbers, formats, or constraints'
      });
    }

    if (context.analysis?.domainHints && context.analysis.domainHints.length > 0) {
      factors.push({
        name: 'Domain Expertise',
        weight: 0.25,
        score: Math.min(1, context.analysis.domainHints.length / 3),
        description: `Shows knowledge of ${context.analysis.domainHints.length} domain(s)`
      });
    }

    return factors;
  }

  private getStructureFactors(context: ScoringContext, score: number): QualityFactor[] {
    const factors: QualityFactor[] = [];

    if (this.hasGoodGrammar(context.prompt)) {
      factors.push({
        name: 'Grammar & Punctuation',
        weight: 0.2,
        score: 1.0,
        description: 'Proper grammar and punctuation'
      });
    }

    if (this.hasLogicalFlow(context.prompt)) {
      factors.push({
        name: 'Logical Flow',
        weight: 0.2,
        score: 1.0,
        description: 'Well-organized with logical progression'
      });
    }

    const lengthScore = this.calculateLengthScore(context.prompt.length);
    factors.push({
      name: 'Appropriate Length',
      weight: 0.15,
      score: lengthScore,
      description: `Length: ${context.prompt.length} characters`
    });

    return factors;
  }

  private getCompletenessFactors(context: ScoringContext, score: number): QualityFactor[] {
    const factors: QualityFactor[] = [];

    if (this.hasActionVerbs(context.prompt)) {
      factors.push({
        name: 'Clear Objectives',
        weight: 0.3,
        score: 1.0,
        description: 'Contains clear action verbs and objectives'
      });
    }

    if (this.containsRequirements(context.prompt)) {
      factors.push({
        name: 'Requirements Specified',
        weight: 0.2,
        score: 1.0,
        description: 'Includes specific requirements or constraints'
      });
    }

    if (this.specifiesExpectedOutput(context.prompt)) {
      factors.push({
        name: 'Expected Output',
        weight: 0.2,
        score: 1.0,
        description: 'Specifies what kind of output is expected'
      });
    }

    return factors;
  }

  private generateQualityFactors(context: ScoringContext, score: QualityScore): QualityFactor[] {
    const allFactors = [
      ...this.getClarityFactors(context, score.clarity),
      ...this.getSpecificityFactors(context, score.specificity),
      ...this.getStructureFactors(context, score.structure),
      ...this.getCompletenessFactors(context, score.completeness)
    ];

    // Return top factors sorted by impact (weight * (1 - score))
    return allFactors
      .map(factor => ({
        ...factor,
        impact: factor.weight * (1 - factor.score)
      }))
      .sort((a, b) => (b as any).impact - (a as any).impact)
      .slice(0, 8);
  }

  private calculateImprovement(context: ScoringContext): number {
    if (!context.originalPrompt) return 0;

    // Simple improvement calculation
    // In practice, this would compare original vs refined scores
    const originalLength = context.originalPrompt.length;
    const refinedLength = context.prompt.length;

    // Base improvement on length change and assumed quality increase
    const lengthRatio = refinedLength / originalLength;
    const improvement = Math.min(0.5, Math.max(0, lengthRatio - 1) * 0.3 + 0.2);

    return improvement;
  }

  private calculateConfidence(context: ScoringContext, score: QualityScore): number {
    let confidence = 0.8; // Base confidence

    // Increase confidence with more analysis data
    if (context.analysis) {
      confidence += 0.1;

      if (context.analysis.technicalTerms.length > 0) {
        confidence += 0.05;
      }

      if (context.analysis.domainHints.length > 0) {
        confidence += 0.05;
      }
    }

    // Increase confidence with validation data
    if (context.validation) {
      confidence += 0.1;

      if (context.validation.errors.length === 0) {
        confidence += 0.05;
      }
    }

    // Decrease confidence for very short or very long prompts
    if (context.prompt.length < 20 || context.prompt.length > 1000) {
      confidence -= 0.1;
    }

    return Math.max(0.5, Math.min(1.0, confidence));
  }

  private calculateDomainCompleteness(context: ScoringContext): number {
    let bonus = 0;

    switch (context.domain) {
      case PromptDomain.SQL:
        if (/table|schema|database/.test(context.prompt.toLowerCase())) bonus += 0.05;
        if (/constraint|index|key/.test(context.prompt.toLowerCase())) bonus += 0.05;
        break;

      case PromptDomain.BRANDING:
        if (/audience|target|brand/.test(context.prompt.toLowerCase())) bonus += 0.05;
        if (/voice|tone|message/.test(context.prompt.toLowerCase())) bonus += 0.05;
        break;

      case PromptDomain.CINE:
        if (/character|story|script/.test(context.prompt.toLowerCase())) bonus += 0.05;
        if (/scene|dialogue|format/.test(context.prompt.toLowerCase())) bonus += 0.05;
        break;

      case PromptDomain.SAAS:
        if (/user|feature|platform/.test(context.prompt.toLowerCase())) bonus += 0.05;
        if (/scalable|integration|api/.test(context.prompt.toLowerCase())) bonus += 0.05;
        break;

      case PromptDomain.DEVOPS:
        if (/deploy|infrastructure|pipeline/.test(context.prompt.toLowerCase())) bonus += 0.05;
        if (/security|monitoring|automation/.test(context.prompt.toLowerCase())) bonus += 0.05;
        break;
    }

    return bonus;
  }

  // Helper methods for quality assessment

  private detectVagueTerms(prompt: string): string[] {
    const vagueTerms = [
      'good', 'bad', 'nice', 'cool', 'awesome', 'great',
      'bonito', 'bonita', 'bueno', 'malo',
      'stuff', 'things', 'something', 'anything',
      'big', 'small', 'fast', 'slow', 'easy', 'hard'
    ];

    const found: string[] = [];
    const words = prompt.toLowerCase().split(/\s+/);

    vagueTerms.forEach(term => {
      if (words.includes(term)) {
        found.push(term);
      }
    });

    return found;
  }

  private hasClearStructure(prompt: string): boolean {
    // Check for proper capitalization and punctuation
    return /^[A-Z]/.test(prompt) && /[.!?]$/.test(prompt.trim());
  }

  private containsSpecificDetails(prompt: string): boolean {
    return /\b(\d+|specific|particular|exact|precise|#|\$|%)\b/i.test(prompt);
  }

  private containsRequirements(prompt: string): boolean {
    return /\b(must|should|require|need|constraint|requirement|specification)\b/i.test(prompt);
  }

  private containsExamples(prompt: string): boolean {
    return /\b(example|sample|instance|demonstrate|illustrate|show)\b/i.test(prompt);
  }

  private isOverlyGeneric(prompt: string): boolean {
    const genericTerms = ['generic', 'general', 'basic', 'simple', 'standard', 'normal'];
    return genericTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(prompt));
  }

  private hasGoodGrammar(prompt: string): boolean {
    return /^[A-Z]/.test(prompt.trim()) && /[.!?]$/.test(prompt.trim());
  }

  private hasLogicalFlow(prompt: string): boolean {
    return /\b(then|next|after|before|because|so|therefore|however|first|second|finally)\b/i.test(prompt);
  }

  private calculateLengthScore(length: number): number {
    if (length >= 100 && length <= 300) return 1.0;
    if (length >= 50 && length <= 500) return 0.8;
    if (length >= 20 && length <= 800) return 0.6;
    return 0.4;
  }

  private hasActionVerbs(prompt: string): boolean {
    const actionVerbs = [
      'create', 'build', 'make', 'develop', 'design', 'implement',
      'analyze', 'review', 'evaluate', 'assess', 'examine',
      'optimize', 'improve', 'enhance', 'refactor',
      'explain', 'describe', 'demonstrate', 'show'
    ];

    return actionVerbs.some(verb => new RegExp(`\\b${verb}\\b`, 'i').test(prompt));
  }

  private hasRunOnSentences(prompt: string): boolean {
    const sentences = prompt.split(/[.!?]+/);
    return sentences.some(sentence => sentence.trim().split(/\s+/).length > 25);
  }

  private hasStructuredContent(prompt: string): boolean {
    return /[•\-\*]\s|^\d+\.\s|\n\s*\n/m.test(prompt);
  }

  private specifiesExpectedOutput(prompt: string): boolean {
    return /\b(output|result|return|format|deliver|produce|generate|provide)\b/i.test(prompt);
  }
}