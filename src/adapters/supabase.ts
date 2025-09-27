import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.js';
import {
  SavedPrompt,
  SearchParams,
  SearchResult,
  QualityScore,
  PromptDomain,
  SaveMetadata
} from '../types/prompt.js';
import { CustomRule } from '../types/domain.js';
import { mapToValidDomain } from '../utils/domain-mapper.js';
import {
  qualityScoreToJson,
  jsonToQualityScore,
  safeStringToDate,
  dbDomainToPromptDomain,
  ruleExamplesToJson,
  dbCategoryToRuleCategory,
  jsonToRuleExamples,
} from '../utils/type-converters.js';

export class SupabaseAdapter {
  private client: SupabaseClient<Database>;
  private isConnected = false;

  constructor(
    _url: string = process.env.SUPABASE_URL!,
    _key: string = process.env.SUPABASE_ANON_KEY!
  ) {
    const url = _url;
    const key = _key;
    if (!url || !key) {
      throw new Error('Supabase URL and key are required');
    }

    this.client = createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async connect(): Promise<void> {
    try {
      // Test connection with a simple query
      const { error } = await this.client
        .from('promptsmith_prompts')
        .select('id')
        .limit(1);

      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }

      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // Supabase client doesn't require explicit disconnection
    this.isConnected = false;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  // Set user context for RLS
  async setUserContext(userId: string): Promise<void> {
    await this.client.rpc('set_config', {
      setting_name: 'app.user_id',
      setting_value: userId,
      is_local: true,
    });
  }

  // Prompt operations

  async savePrompt(
    refined: string,
    original: string,
    metadata: SaveMetadata,
    score: QualityScore,
    systemPrompt?: string,
    templateData?: any
  ): Promise<SavedPrompt> {
    const { data, error } = await this.client
      .from('promptsmith_prompts')
      .insert({
        name: metadata.name || null,
        domain: mapToValidDomain(metadata.domain as PromptDomain || PromptDomain.GENERAL),
        category: metadata.category || null,
        tags: metadata.tags || [],
        description: metadata.description || null,
        raw_prompt: original,
        refined_prompt: refined,
        system_prompt: systemPrompt || null,
        quality_score: qualityScoreToJson(score),
        template_type: templateData?.type || 'basic',
        template_variables: templateData?.variables || {},
        author_id: metadata.authorId || null,
        is_public: metadata.isPublic || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save prompt: ${error.message}`);
    }

    return this.mapToSavedPrompt(data);
  }

  async getPrompt(id: string): Promise<SavedPrompt | null> {
    const { data, error } = await this.client
      .from('promptsmith_prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get prompt: ${error.message}`);
    }

    return this.mapToSavedPrompt(data);
  }

  async searchPrompts(params: SearchParams): Promise<{
    results: SearchResult[];
    total: number;
  }> {
    let query = this.client
      .from('promptsmith_prompts')
      .select('*, promptsmith_user_feedback(rating)', { count: 'exact' });

    // Apply filters
    if (params.domain) {
      query = query.eq('domain', mapToValidDomain(params.domain as PromptDomain));
    }

    if (params.tags && params.tags.length > 0) {
      query = query.overlaps('tags', params.tags);
    }

    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.minScore) {
      query = query.gte('quality_score->overall', params.minScore);
    }

    if (params.query) {
      query = query.textSearch('text_search_vector', params.query);
    }

    // Apply sorting
    const sortColumn = params.sortBy === 'score' ? 'quality_score->overall' : params.sortBy;
    query = query.order(sortColumn as string, { ascending: params.sortOrder === 'asc' });

    // Apply pagination
    query = query.range(
      params.offset || 0,
      (params.offset || 0) + (params.limit || 10) - 1
    );

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    const results: SearchResult[] = (data || []).map(prompt => ({
      id: prompt.id,
      name: prompt.name || 'Unnamed',
      domain: dbDomainToPromptDomain(prompt.domain),
      tags: prompt.tags || [],
      description: prompt.description || '',
      prompt: prompt.refined_prompt,
      score: jsonToQualityScore(prompt.quality_score),
      usage: {
        count: prompt.usage_count || 0,
        successRate: prompt.success_rate || 0,
        avgResponseTime: prompt.avg_response_time || 0,
        lastUsed: safeStringToDate(prompt.last_used_at || prompt.created_at!),
      },
      createdAt: safeStringToDate(prompt.created_at!),
      relevance: this.calculateRelevance(prompt, params.query || '', { domain: params.domain as PromptDomain }),
    }));

    return {
      results,
      total: count || 0,
    };
  }

  async updatePromptUsage(
    id: string,
    success: boolean = true,
    responseTime?: number
  ): Promise<void> {
    const params: { prompt_uuid: string; success?: boolean; response_time?: number } = {
      prompt_uuid: id,
    };

    if (success !== undefined) params.success = success;
    if (responseTime !== undefined) params.response_time = responseTime;

    const { error } = await this.client.rpc('update_prompt_usage', params);

    if (error) {
      throw new Error(`Failed to update usage: ${error.message}`);
    }
  }

  // Evaluation operations

  async saveEvaluation(
    promptId: string,
    evaluation: {
      model: string;
      temperature?: number;
      maxTokens?: number;
      responseTime?: number;
      quality?: any;
      context?: any;
      tokenUsage?: any;
    }
  ): Promise<string> {
    const { data, error } = await this.client
      .from('promptsmith_prompt_evaluations')
      .insert({
        prompt_id: promptId,
        model: evaluation.model,
        temperature: evaluation.temperature || null,
        max_tokens: evaluation.maxTokens || null,
        processing_time_ms: evaluation.responseTime || null,
        response_quality: evaluation.quality || {},
        evaluation_context: evaluation.context || {},
        token_usage: evaluation.tokenUsage || null,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save evaluation: ${error.message}`);
    }

    return data.id;
  }

  async getPromptEvaluations(promptId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('promptsmith_prompt_evaluations')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get evaluations: ${error.message}`);
    }

    return data || [];
  }

  // Custom rules operations

  async saveCustomRule(rule: Omit<CustomRule, 'id' | 'createdAt' | 'updatedAt' | 'usage'>): Promise<string> {
    const { data, error } = await this.client
      .from('promptsmith_custom_rules')
      .insert({
        user_id: rule.userId || '',
        name: rule.description || 'Unnamed Rule',
        domain: mapToValidDomain(rule.domain),
        category: rule.category,
        pattern: typeof rule.pattern === 'string' ? rule.pattern : rule.pattern.source,
        replacement: typeof rule.replacement === 'string' ? rule.replacement : rule.replacement.toString(),
        priority: rule.priority || 5,
        active: rule.active !== false,
        description: rule.description || null,
        examples: ruleExamplesToJson(rule.examples || []),
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save rule: ${error.message}`);
    }

    return data.id;
  }

  async getCustomRules(domain?: PromptDomain, activeOnly = true): Promise<CustomRule[]> {
    let query = this.client
      .from('promptsmith_custom_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (domain) {
      query = query.eq('domain', mapToValidDomain(domain));
    }

    if (activeOnly) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get rules: ${error.message}`);
    }

    return (data || []).map(rule => ({
      id: rule.id,
      domain: rule.domain ? dbDomainToPromptDomain(rule.domain) : PromptDomain.GENERAL,
      pattern: new RegExp(rule.pattern),
      replacement: rule.replacement,
      priority: rule.priority ?? 0,
      active: rule.active ?? true,
      description: rule.description || '',
      category: dbCategoryToRuleCategory(rule.category),
      examples: jsonToRuleExamples(rule.examples),
      userId: rule.user_id || undefined,
      createdAt: safeStringToDate(rule.created_at || new Date().toISOString()),
      updatedAt: safeStringToDate(rule.updated_at || new Date().toISOString()),
      usage: {
        count: rule.usage_count || 0,
        successRate: rule.success_rate || 0,
        lastUsed: safeStringToDate(rule.updated_at || new Date().toISOString()),
        averageImprovement: 0,
      },
    }));
  }

  // Template operations

  async saveTemplate(template: {
    name: string;
    domain: PromptDomain;
    templateType: string;
    content: string;
    systemPrompt?: string;
    variables?: any;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
    authorId?: string;
  }): Promise<string> {
    const { data, error } = await this.client
      .from('promptsmith_templates')
      .insert({
        name: template.name,
        domain: mapToValidDomain(template.domain as PromptDomain),
        template_type: template.templateType as any,
        template_content: template.content,
        system_prompt: template.systemPrompt ?? null,
        variables: template.variables || {},
        description: template.description ?? null,
        tags: template.tags || [],
        is_public: template.isPublic || false,
        author_id: template.authorId ?? null,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save template: ${error.message}`);
    }

    return data.id;
  }

  async getTemplates(domain?: PromptDomain, publicOnly = false): Promise<any[]> {
    let query = this.client
      .from('promptsmith_templates')
      .select('*')
      .order('usage_count', { ascending: false });

    if (domain) {
      query = query.eq('domain', mapToValidDomain(domain));
    }

    if (publicOnly) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get templates: ${error.message}`);
    }

    return data || [];
  }

  // Analytics operations

  async trackUsage(event: {
    eventType: string;
    userId?: string;
    sessionId?: string;
    domain?: PromptDomain;
    promptId?: string;
    processingTime?: number;
    inputLength?: number;
    outputLength?: number;
    qualityImprovement?: number;
    metadata?: any;
  }): Promise<void> {
    const { error } = await this.client
      .from('promptsmith_analytics')
      .insert({
        event_type: event.eventType,
        user_id: event.userId ?? null,
        session_id: event.sessionId ?? null,
        domain: event.domain ? mapToValidDomain(event.domain) : null,
        prompt_id: event.promptId ?? null,
        processing_time: event.processingTime ?? null,
        input_length: event.inputLength ?? null,
        output_length: event.outputLength ?? null,
        quality_improvement: event.qualityImprovement ?? null,
        metadata: event.metadata || {},
      });

    if (error) {
      console.warn(`Failed to track usage: ${error.message}`);
      // Don't throw here as analytics shouldn't break the main flow
    }
  }

  async saveFeedback(feedback: {
    promptId?: string;
    evaluationId?: string;
    userId?: string;
    rating?: number;
    feedbackText?: string;
    suggestions?: string;
    feedbackType?: string;
    metadata?: any;
  }): Promise<string> {
    const { data, error } = await this.client
      .from('promptsmith_user_feedback')
      .insert({
        prompt_id: feedback.promptId ?? null,
        evaluation_id: feedback.evaluationId ?? null,
        user_id: feedback.userId ?? null,
        rating: feedback.rating ?? null,
        feedback_text: feedback.feedbackText ?? null,
        improvement_suggestions: feedback.suggestions ?? null,
        feedback_type: feedback.feedbackType ?? null,
        metadata: feedback.metadata || {},
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save feedback: ${error.message}`);
    }

    return data.id;
  }

  // Statistics operations

  async getDomainStatistics(): Promise<any[]> {
    const { data, error } = await this.client
      .from('promptsmith_analytics')
      .select('*');

    if (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }

    return data || [];
  }

  async getUserStatistics(userId: string): Promise<any> {
    const { data, error } = await this.client
      .from('promptsmith_analytics')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get user statistics: ${error.message}`);
    }

    // Aggregate statistics
    const stats = {
      totalEvents: data?.length || 0,
      domainsUsed: Array.from(new Set(data?.map(d => d.domain).filter(Boolean))),
      avgProcessingTime: data?.reduce((sum, d) => sum + (d.processing_time || 0), 0) / (data?.length || 1),
      totalImprovement: data?.reduce((sum, d) => sum + (d.quality_improvement || 0), 0),
    };

    return stats;
  }

  // Utility methods

  private mapToSavedPrompt(data: any): SavedPrompt {
    return {
      id: data.id,
      name: data.name || 'Unnamed',
      domain: dbDomainToPromptDomain(data.domain),
      tags: data.tags || [],
      description: data.description,
      prompt: data.refined_prompt,
      systemPrompt: data.system_prompt,
      score: jsonToQualityScore(data.quality_score),
      metadata: {
        name: data.name || 'Unnamed',
        domain: dbDomainToPromptDomain(data.domain),
        tags: data.tags || [],
        description: data.description,
        category: data.category,
        isPublic: data.is_public,
        authorId: data.author_id,
      },
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // Migration helpers

  async runMigration(sql: string): Promise<void> {
    const { error } = await this.client.rpc('exec_sql', { sql });

    if (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }
  }

  async checkMigrationStatus(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('promptsmith_prompts')
        .select('id')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  private calculateRelevance(
    prompt: any, 
    query: string, 
    options?: { domain?: PromptDomain }
  ): number {
    if (!query) {
      return 1.0; // Default relevance when no search query
    }

    let relevance = 0;
    const queryLower = query.toLowerCase();
    const promptText = (prompt.original_prompt || '').toLowerCase();
    const refinedText = (prompt.refined_prompt || '').toLowerCase();
    const description = (prompt.description || '').toLowerCase();
    const tags = prompt.tags || [];

    // 1. Term matching in prompt content (40% weight)
    const termMatches = this.calculateTermMatches(queryLower, promptText, refinedText, description);
    relevance += termMatches * 0.4;

    // 2. Usage frequency and success rate (30% weight)
    const usageScore = this.calculateUsageScore(prompt);
    relevance += usageScore * 0.3;

    // 3. Domain matching (20% weight)
    const domainScore = this.calculateDomainScore(prompt.domain, options?.domain);
    relevance += domainScore * 0.2;

    // 4. Recency factor (10% weight)
    const recencyScore = this.calculateRecencyScore(prompt.last_used_at || prompt.created_at);
    relevance += recencyScore * 0.1;

    // 5. Tag matching bonus
    const tagBonus = this.calculateTagBonus(tags, queryLower);
    relevance += tagBonus;

    return Math.min(relevance, 1.0);
  }

  private calculateTermMatches(
    query: string, 
    original: string, 
    refined: string, 
    description: string
  ): number {
    const queryTerms = query.split(/\s+/).filter(term => term.length > 2);
    if (queryTerms.length === 0) return 0.5;

    let matches = 0;
    const totalTerms = queryTerms.length;

    queryTerms.forEach(term => {
      // Exact matches get full points
      if (original.includes(term) || refined.includes(term)) {
        matches += 1.0;
      } else if (description.includes(term)) {
        matches += 0.8; // Description matches slightly lower
      } else {
        // Partial matches
        const partialInOriginal = original.includes(term.substring(0, Math.max(3, term.length - 2)));
        const partialInRefined = refined.includes(term.substring(0, Math.max(3, term.length - 2)));
        if (partialInOriginal || partialInRefined) {
          matches += 0.5;
        }
      }
    });

    return Math.min(matches / totalTerms, 1.0);
  }

  private calculateUsageScore(prompt: any): number {
    const usageCount = prompt.usage_count || 0;
    const successRate = prompt.success_rate || 0;

    // Normalize usage count (logarithmic scale)
    const usageFactor = Math.min(Math.log10(usageCount + 1) / 2, 1.0);
    
    // Combine usage frequency and success rate
    return (usageFactor * 0.6) + (successRate * 0.4);
  }

  private calculateDomainScore(promptDomain: string, queryDomain?: PromptDomain): number {
    if (!queryDomain) return 0.5; // Neutral when no domain specified
    
    // Convert database domain to prompt domain for comparison
    const convertedDomain = dbDomainToPromptDomain(promptDomain as any);
    
    // Exact match gets full score
    if (convertedDomain === queryDomain) return 1.0;
    
    // Related domains get partial score
    const relatedDomains: Record<PromptDomain, PromptDomain[]> = {
      [PromptDomain.FRONTEND]: [PromptDomain.MOBILE, PromptDomain.SAAS],
      [PromptDomain.BACKEND]: [PromptDomain.DEVOPS, PromptDomain.SQL],
      [PromptDomain.MOBILE]: [PromptDomain.FRONTEND, PromptDomain.SAAS],
      [PromptDomain.SQL]: [PromptDomain.BACKEND, PromptDomain.DEVOPS],
      [PromptDomain.SAAS]: [PromptDomain.FRONTEND, PromptDomain.MOBILE, PromptDomain.BACKEND],
      [PromptDomain.DEVOPS]: [PromptDomain.BACKEND, PromptDomain.SQL],
      [PromptDomain.BRANDING]: [PromptDomain.SAAS],
      [PromptDomain.CINE]: [],
      [PromptDomain.AI]: [PromptDomain.BACKEND],
      [PromptDomain.GAMING]: [PromptDomain.FRONTEND],
      [PromptDomain.CRYPTO]: [PromptDomain.BACKEND],
      [PromptDomain.EDUCATION]: [],
      [PromptDomain.HEALTHCARE]: [PromptDomain.SAAS],
      [PromptDomain.FINANCE]: [PromptDomain.BACKEND, PromptDomain.CRYPTO],
      [PromptDomain.LEGAL]: [],
      [PromptDomain.GENERAL]: [],
      [PromptDomain.WEB]: [PromptDomain.FRONTEND]
    };

    const related = relatedDomains[queryDomain] || [];
    if (related.includes(convertedDomain)) return 0.7;
    
    return 0.2; // Low score for unrelated domains
  }

  private calculateRecencyScore(lastUsed: string): number {
    if (!lastUsed) return 0.1;
    
    const now = new Date();
    const lastUsedDate = new Date(lastUsed);
    const daysSince = (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Recent usage gets higher score (exponential decay)
    if (daysSince < 1) return 1.0;
    if (daysSince < 7) return 0.8;
    if (daysSince < 30) return 0.6;
    if (daysSince < 90) return 0.4;
    if (daysSince < 365) return 0.2;
    return 0.1;
  }

  private calculateTagBonus(tags: string[], query: string): number {
    if (!tags || tags.length === 0) return 0;
    
    let bonus = 0;
    tags.forEach(tag => {
      if (query.includes(tag.toLowerCase())) {
        bonus += 0.1; // Small bonus for each matching tag
      }
    });
    
    return Math.min(bonus, 0.2); // Cap tag bonus at 0.2
  }
}