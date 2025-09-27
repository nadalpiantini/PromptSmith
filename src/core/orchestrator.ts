import { PromptAnalyzer } from './analyzer.js';
import { PromptOptimizer } from './optimizer.js';
import { PromptValidator } from './validator.js';
import { RefineService } from '../services/refine.js';
import { ScoreService } from '../services/score.js';
import { StoreService } from '../services/store.js';
import { CacheService } from '../services/cache.js';
import { TelemetryService } from '../services/telemetry.js';
import { ObservabilityService } from '../services/observability.js';
import {
  ProcessInput,
  ProcessResult,
  EvaluationResult,
  ComparisonResult,
  SavedPrompt,
  SearchParams,
  SearchResult,
  QualityScore,
  AnalysisResult,
  PromptDomain,
  ValidationResult,
  SaveMetadata,
} from '../types/prompt.js';

export class PromptOrchestrator {
  private analyzer: PromptAnalyzer;
  private optimizer: PromptOptimizer;
  private validator: PromptValidator;
  private refiner: RefineService;
  private scorer: ScoreService;
  private store: StoreService;
  private cache: CacheService;
  private telemetry: TelemetryService;
  private observability: ObservabilityService;

  constructor() {
    this.analyzer = new PromptAnalyzer();
    this.optimizer = new PromptOptimizer();
    this.validator = new PromptValidator();
    this.refiner = new RefineService();
    this.scorer = new ScoreService();
    this.store = new StoreService();
    this.cache = new CacheService();
    this.telemetry = new TelemetryService();
    this.observability = new ObservabilityService();
  }

  async process(input: ProcessInput): Promise<ProcessResult> {
    const startTime = Date.now();
    let cacheHit = false;

    // Start distributed tracing span
    const spanId = await this.observability.startSpan('prompt_processing');

    try {
      // 1. Check cache first
      const cacheKey = this.generateCacheKey(input);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        cacheHit = true;
        await this.telemetry.track('cache_hit', {
          domain: input.domain,
          cacheKey,
        });
        await this.observability.addSpanLog(spanId, { step: 'cache_hit', cache_key: cacheKey });
        await this.observability.finishSpan(spanId, { cache_hit: true, result: 'success' });
        return cached;
      }
      
      await this.observability.addSpanLog(spanId, { step: 'cache_miss', cache_key: cacheKey });

      // 2. Analyze the input prompt
      await this.observability.addSpanLog(spanId, { step: 'analysis_start' });
      this.telemetry.track('analysis_start', { domain: input.domain });
      const analysis = await this.analyzer.analyze(input.raw);
      this.telemetry.track('analysis_complete', {
        domain: input.domain,
        complexity: analysis.complexity,
        ambiguityScore: analysis.ambiguityScore,
      });
      await this.observability.addSpanLog(spanId, { 
        step: 'analysis_complete', 
        complexity: analysis.complexity,
        ambiguity_score: analysis.ambiguityScore,
        tokens: analysis.estimatedTokens
      });

      // 3. Apply domain-specific refinement rules
      this.telemetry.track('refinement_start', { domain: input.domain });
      const refinementResult = await this.refiner.applyDomainRules(
        input.raw,
        input.domain,
        analysis
      );
      this.telemetry.track('refinement_complete', {
        domain: input.domain,
        rulesApplied: refinementResult.rulesApplied?.length || 0,
      });

      // 4. Optimize the prompt structure and content
      this.telemetry.track('optimization_start', { domain: input.domain });
      const optimizationResult = await this.optimizer.optimize(
        refinementResult.refined,
        analysis,
        input.domain
      );
      this.telemetry.track('optimization_complete', {
        domain: input.domain,
        improvements: optimizationResult.improvements?.length || 0,
      });

      // 5. Generate template if requested
      let templateResult = null;
      if (input.variables || this.shouldGenerateTemplate(analysis, input)) {
        this.telemetry.track('template_generation_start', { domain: input.domain });
        templateResult = await this.refiner.generateTemplate(
          optimizationResult.optimized,
          input.variables || {},
          input.domain
        );
        this.telemetry.track('template_generation_complete', { domain: input.domain });
      }

      // 6. Validate the optimized prompt
      this.telemetry.track('validation_start', { domain: input.domain });
      const validation = await this.validator.validate(
        templateResult?.prompt || optimizationResult.optimized,
        analysis
      );
      this.telemetry.track('validation_complete', {
        domain: input.domain,
        isValid: validation.isValid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
      });

      // 7. Calculate quality score
      this.telemetry.track('scoring_start', { domain: input.domain });
      const score = await this.scorer.calculate(
        templateResult?.prompt || optimizationResult.optimized,
        validation,
        analysis
      );
      this.telemetry.track('scoring_complete', {
        domain: input.domain,
        overallScore: score.overall,
      });

      // 8. Generate system prompt
      const systemPrompt = await this.refiner.generateSystemPrompt(
        input.domain,
        analysis,
        input.context
      );

      // 9. Generate examples if beneficial
      let examples = null;
      if (this.shouldIncludeExamples(analysis, input, score)) {
        examples = await this.refiner.generateExamples(
          templateResult?.prompt || optimizationResult.optimized,
          input.domain,
          analysis
        );
      }

      // 10. Compile final result
      const processingTime = Date.now() - startTime;
      const result: ProcessResult = {
        original: input.raw,
        refined: templateResult?.prompt || optimizationResult.optimized,
        system: systemPrompt,
        analysis,
        score,
        validation,
        suggestions: this.compileSuggestions(
          optimizationResult.improvements || [],
          validation.suggestions || [],
          score
        ),
        metadata: {
          domain: input.domain,
          ...(input.tone && { tone: input.tone }),
          processingTime,
          version: '1.0.0',
          ...(input.targetModel && { modelUsed: input.targetModel }),
          cacheHit,
          rulesApplied: [
            ...(refinementResult.rulesApplied || []).map(rule => typeof rule === 'string' ? rule : rule.ruleId),
            ...(optimizationResult.rulesApplied || []),
          ],
          ...(templateResult?.type && { templateUsed: templateResult.type }),
        },
        ...(templateResult && { template: templateResult }),
        ...(examples && { examples }),
      };

      // 11. Cache the result
      await this.cache.set(cacheKey, result, this.getCacheTTL(score));

      // 12. Track completion
      await this.telemetry.track('processing_complete', {
        domain: input.domain,
        processingTime,
        qualityImprovement: this.calculateImprovement(input.raw, result),
        cacheHit,
      });

      // 13. Record performance metrics and finish span
      await this.observability.recordMetric(
        'prompt_processing_duration',
        processingTime,
        'histogram',
        { domain: input.domain, cache_hit: cacheHit.toString() }
      );
      
      await this.observability.recordMetric(
        'prompt_quality_score',
        result.score.overall,
        'gauge',
        { domain: input.domain }
      );

      await this.observability.addSpanLog(spanId, { 
        step: 'processing_complete',
        processing_time: processingTime,
        quality_score: result.score.overall,
        cache_hit: cacheHit
      });

      await this.observability.finishSpan(spanId, { 
        result: 'success',
        processing_time: processingTime,
        quality_score: result.score.overall,
        cache_hit: cacheHit
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Track error in observability stack
      await this.observability.trackError(error as Error, {
        domain: input.domain,
        processing_time: processingTime,
        input_length: input.raw.length,
        step: 'processing_pipeline'
      });
      
      await this.observability.addSpanLog(spanId, { 
        step: 'error_occurred',
        error_message: (error as Error).message,
        processing_time: processingTime
      });
      
      await this.observability.finishSpan(spanId, { 
        result: 'error',
        error_type: (error as Error).constructor.name,
        processing_time: processingTime
      });
      
      await this.telemetry.error('processing_error', error, {
        domain: input.domain,
        processingTime,
        inputLength: input.raw.length,
      });
      
      // Circuit breaker: provide fallback response for critical failures
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.warn('Database connection failed, providing fallback response');
        
        // Return a basic fallback result
        return {
          original: input.raw,
          refined: input.raw, // No refinement available
          score: {
            clarity: 0.5,
            specificity: 0.5, 
            structure: 0.5,
            completeness: 0.5,
            overall: 0.5
          },
          analysis: {
            tokens: [],
            entities: [],
            intent: { category: 'unknown', confidence: 0, subcategories: [] },
            complexity: 0.5,
            ambiguityScore: 0.5,
            hasVariables: false,
            language: 'en',
            domainHints: [],
            sentimentScore: 0.5,
            readabilityScore: 0.5,
            technicalTerms: [],
            estimatedTokens: input.raw.split(' ').length
          },
          validation: {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [],
            qualityMetrics: {
              clarity: 0.5,
              specificity: 0.5,
              structure: 0.5,
              completeness: 0.5,
              consistency: 0.5,
              actionability: 0.5
            }
          },
          system: 'System operating in fallback mode.',
          suggestions: ['System is in offline mode - basic response provided'],
          metadata: {
            domain: input.domain,
            processingTime,
            version: '1.0.0',
            cacheHit: false,
            rulesApplied: []
          }
        };
      }
      
      throw error;
    }
  }

  async evaluate(
    prompt: string,
    criteria?: string[],
    domain?: string
  ): Promise<EvaluationResult> {
    try {
      await this.telemetry.track('evaluation_start', { domain });

      // Analyze the prompt
      const analysis = await this.analyzer.analyze(prompt);

      // Validate the prompt
      const validation = await this.validator.validate(prompt, analysis);

      // Calculate comprehensive scores
      const score = await this.scorer.calculate(prompt, validation, analysis);

      // Generate detailed breakdown
      const breakdown = {
        clarity: { score: score.clarity, factors: [] as any[] },
        specificity: { score: score.specificity, factors: [] as any[] },
        structure: { score: score.structure, factors: [] as any[] },
        completeness: { score: score.completeness, factors: [] as any[] }
      };

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        prompt,
        analysis,
        validation,
        score
      );

      await this.telemetry.track('evaluation_complete', {
        domain,
        overallScore: score.overall,
        recommendationCount: recommendations.length,
      });

      return {
        score,
        breakdown,
        recommendations,
      };

    } catch (error) {
      await this.telemetry.error('evaluation_error', error, { domain });
      throw error;
    }
  }

  async compare(variants: string[], testInput?: string): Promise<ComparisonResult> {
    try {
      await this.telemetry.track('comparison_start', {
        variantCount: variants.length,
      });

      const evaluatedVariants = await Promise.all(
        variants.map(async (prompt, index) => {
          const analysis = await this.analyzer.analyze(prompt);
          const validation = await this.validator.validate(prompt, analysis);
          const score = await this.scorer.calculate(prompt, validation, analysis);

          return {
            id: `variant_${index}`,
            prompt,
            score,
            metrics: await this.calculateVariantMetrics(prompt, analysis, validation),
          };
        })
      );

      // Determine winner based on overall score
      const winner = evaluatedVariants.reduce((best, current) =>
        current.score.overall > best.score.overall ? current : best
      );

      // Generate comparison metrics
      const metrics = this.generateComparisonMetrics(evaluatedVariants);

      // Create summary
      const summary = this.generateComparisonSummary(evaluatedVariants, winner);

      await this.telemetry.track('comparison_complete', {
        variantCount: variants.length,
        winnerId: winner.id,
        winnerScore: winner.score.overall,
      });

      return {
        variants: evaluatedVariants,
        winner: winner.id,
        metrics,
        summary,
      };

    } catch (error) {
      await this.telemetry.error('comparison_error', error);
      throw error;
    }
  }

  async save(prompt: string, metadata: SaveMetadata): Promise<SavedPrompt> {
    try {
      await this.telemetry.track('save_start', {
        domain: metadata.domain,
        isPublic: metadata.isPublic,
      });

      // Analyze and score the prompt before saving
      const analysis = await this.analyzer.analyze(prompt);
      const validation = await this.validator.validate(prompt, analysis);
      const score = await this.scorer.calculate(prompt, validation, analysis);

      // Generate system prompt
      const systemPrompt = await this.refiner.generateSystemPrompt(
        metadata.domain as any || 'general',
        analysis
      );

      // Save to store
      const saved = await this.store.save(
        prompt,
        prompt, // original = refined for manually saved prompts
        metadata,
        score,
        systemPrompt
      );

      await this.telemetry.track('save_complete', {
        domain: metadata.domain,
        promptId: saved.id,
        qualityScore: score.overall,
      });

      return saved;

    } catch (error) {
      await this.telemetry.error('save_error', error, {
        domain: metadata.domain,
      });
      throw error;
    }
  }

  async search(params: SearchParams): Promise<SearchResult[]> {
    try {
      await this.telemetry.track('search_start', {
        domain: params.domain,
        hasQuery: !!params.query,
        tagCount: params.tags?.length || 0,
      });

      const results = await this.store.search(params);

      await this.telemetry.track('search_complete', {
        domain: params.domain,
        resultCount: results.length,
        query: params.query,
      });

      return results;

    } catch (error) {
      await this.telemetry.error('search_error', error, {
        domain: params.domain,
        query: params.query,
      });
      throw error;
    }
  }

  // Helper methods

  private generateCacheKey(input: ProcessInput): string {
    const keyData = {
      raw: input.raw,
      domain: input.domain,
      tone: input.tone,
      context: input.context,
      variables: input.variables,
    };

    // Simple hash function for cache key
    return `prompt_${this.hashObject(keyData)}`;
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private shouldGenerateTemplate(analysis: AnalysisResult, input: ProcessInput): boolean {
    // Generate template if:
    // 1. High complexity suggests reusability
    // 2. Multiple domain hints suggest cross-domain usage
    // 3. Contains patterns that could be variabilized
    return analysis.complexity > 0.7 ||
           analysis.domainHints.length > 1 ||
           this.hasVariabilizablePatterns(input.raw);
  }

  private hasVariabilizablePatterns(prompt: string): boolean {
    const patterns = [
      /\b(table|database|schema)\b/gi,
      /\b(user|customer|client)\b/gi,
      /\b(component|module|function)\b/gi,
    ];

    return patterns.some(pattern => (prompt.match(pattern) || []).length > 1);
  }

  private shouldIncludeExamples(
    analysis: AnalysisResult,
    input: ProcessInput,
    score: QualityScore
  ): boolean {
    // Include examples if:
    // 1. High complexity benefits from illustration
    // 2. Low clarity score needs clarification
    // 3. Domain suggests examples would be helpful
    return analysis.complexity > 0.6 ||
           score.clarity < 0.7 ||
           ['sql', 'cine', 'saas'].includes(input.domain);
  }

  private compileSuggestions(
    optimizationImprovements: any[],
    validationSuggestions: any[],
    score: QualityScore
  ): string[] {
    const suggestions: string[] = [];

    // Add optimization-based suggestions
    optimizationImprovements
      .filter(imp => imp.impact === 'high')
      .forEach(imp => suggestions.push(imp.description));

    // Add validation suggestions
    validationSuggestions
      .filter(sug => sug.type === 'enhancement')
      .forEach(sug => suggestions.push(sug.message));

    // Add score-based suggestions
    if (score.clarity < 0.7) {
      suggestions.push('Consider adding more specific details and reducing vague terms');
    }

    if (score.specificity < 0.7) {
      suggestions.push('Add more specific requirements and technical details');
    }

    if (score.structure < 0.7) {
      suggestions.push('Improve sentence structure and logical flow');
    }

    if (score.completeness < 0.7) {
      suggestions.push('Specify expected outputs and success criteria');
    }

    // Remove duplicates and limit to most important
    return [...new Set(suggestions)].slice(0, 5);
  }

  private getCacheTTL(score: QualityScore): number {
    // Higher quality prompts get longer cache TTL
    const baseTTL = 3600; // 1 hour
    const qualityMultiplier = Math.max(0.5, score.overall);
    return Math.floor(baseTTL * qualityMultiplier);
  }

  private calculateImprovement(original: string, result: ProcessResult): number {
    // Simple improvement calculation based on length and quality difference
    const lengthImprovement = (result.refined.length - original.length) / original.length;
    const qualityImprovement = result.score.overall; // Assuming original score would be lower

    return Math.max(0, Math.min(1, qualityImprovement + lengthImprovement * 0.1));
  }

  private async generateRecommendations(
    prompt: string,
    analysis: AnalysisResult,
    validation: ValidationResult,
    score: QualityScore
  ): Promise<any[]> {
    const recommendations = [];

    // Critical recommendations based on validation errors
    validation.errors.forEach(error => {
      if (error.severity === 'critical' || error.severity === 'high') {
        recommendations.push({
          type: 'critical',
          title: error.message,
          description: `This issue must be addressed: ${error.message}`,
          impact: 'high',
        });
      }
    });

    // Important recommendations based on quality scores
    if (score.clarity < 0.6) {
      recommendations.push({
        type: 'important',
        title: 'Improve Clarity',
        description: 'The prompt contains ambiguous language that may lead to unclear results. Consider replacing vague terms with more specific language.',
        impact: 'high',
      });
    }

    if (score.specificity < 0.6) {
      recommendations.push({
        type: 'important',
        title: 'Add Specificity',
        description: 'The prompt would benefit from more specific requirements, constraints, or technical details.',
        impact: 'medium',
      });
    }

    // Suggestion-level recommendations
    validation.suggestions.forEach(suggestion => {
      recommendations.push({
        type: 'suggestion',
        title: suggestion.message,
        description: suggestion.message,
        before: suggestion.before,
        after: suggestion.after,
        impact: 'low',
      });
    });

    return recommendations;
  }

  private async calculateVariantMetrics(
    prompt: string,
    analysis: AnalysisResult,
    validation: ValidationResult
  ): Promise<any[]> {
    return [
      {
        name: 'Length',
        value: prompt.length,
        unit: 'characters',
        better: 'optimal', // Neither higher nor lower is always better
      },
      {
        name: 'Complexity',
        value: analysis.complexity,
        unit: 'score',
        better: 'balanced', // Moderate complexity is often best
      },
      {
        name: 'Readability',
        value: analysis.readabilityScore,
        unit: 'score',
        better: 'higher',
      },
      {
        name: 'Error Count',
        value: validation.errors.length,
        unit: 'count',
        better: 'lower',
      },
    ];
  }

  private generateComparisonMetrics(variants: any[]): any[] {
    const metrics = [];

    // Overall quality comparison
    const qualityScores: Record<string, number> = {};
    variants.forEach(variant => {
      qualityScores[variant.id] = variant.score.overall;
    });

    metrics.push({
      name: 'Overall Quality',
      values: qualityScores,
      winner: Object.entries(qualityScores).reduce((a, b) =>
        qualityScores[a[0]] > qualityScores[b[0]] ? a : b
      )[0],
      significance: this.calculateSignificance(Object.values(qualityScores)),
    });

    // Clarity comparison
    const clarityScores: Record<string, number> = {};
    variants.forEach(variant => {
      clarityScores[variant.id] = variant.score.clarity;
    });

    metrics.push({
      name: 'Clarity',
      values: clarityScores,
      winner: Object.entries(clarityScores).reduce((a, b) =>
        clarityScores[a[0]] > clarityScores[b[0]] ? a : b
      )[0],
      significance: this.calculateSignificance(Object.values(clarityScores)),
    });

    return metrics;
  }

  private calculateSignificance(values: number[]): number {
    if (values.length < 2) return 0;

    const max = Math.max(...values);
    const min = Math.min(...values);
    return max - min; // Simple difference as significance measure
  }

  private generateComparisonSummary(variants: any[], winner: any): string {
    const winnerScore = (winner.score.overall * 100).toFixed(1);
    const avgScore = variants.reduce((sum, v) => sum + v.score.overall, 0) / variants.length;
    const avgScoreFormatted = (avgScore * 100).toFixed(1);

    return `${winner.id} achieved the highest quality score of ${winnerScore}% (average: ${avgScoreFormatted}%). ` +
           `Key advantages include better ${this.getTopStrengths(winner.score).join(' and ')}.`;
  }

  private getTopStrengths(score: QualityScore): string[] {
    const scores = {
      clarity: score.clarity,
      specificity: score.specificity,
      structure: score.structure,
      completeness: score.completeness,
    };

    return Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([key]) => key);
  }
}