import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SavedPrompt,
  SearchParams,
  SearchResult,
  SaveMetadata,
  QualityScore,
} from '../types/prompt.js';
import { Database } from '../types/database.js';

export class StoreService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async save(
    refined: string,
    original: string,
    metadata: SaveMetadata,
    score: QualityScore,
    systemPrompt: string
  ): Promise<SavedPrompt> {
    try {
      // Insert the prompt record
      const { data: promptData, error: promptError } = await this.supabase
        .from('promptsmith_prompts')
        .insert({
          name: metadata.name,
          raw_prompt: original,
          refined_prompt: refined,
          system_prompt: systemPrompt,
          domain: (metadata.domain || 'general') as 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general',
          description: metadata.description || '',
          tags: metadata.tags || [],
          is_public: metadata.isPublic || false,
          author_id: metadata.authorId || null,
          quality_score: {
            overall: score.overall,
            clarity: score.clarity,
            specificity: score.specificity,
            structure: score.structure,
            completeness: score.completeness
          }
        })
        .select()
        .single();

      if (promptError) {
        throw new Error(`Failed to save prompt: ${promptError.message}`);
      }

      return {
        id: promptData.id,
        name: metadata.name,
        prompt: refined,
        systemPrompt,
        domain: metadata.domain as any,
        description: metadata.description || '',
        tags: metadata.tags || [],
        score,
        createdAt: new Date(promptData.created_at || new Date()),
        updatedAt: new Date(promptData.updated_at || new Date()),
        metadata: {
          name: metadata.name,
          domain: metadata.domain || 'general',
          ...(metadata.authorId && { authorId: metadata.authorId })
        }
      };

    } catch (error) {
      console.error('Store save operation failed:', error);
      throw new Error(`Failed to save prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async search(params: SearchParams): Promise<SearchResult[]> {
    try {
      let query = this.supabase
        .from('promptsmith_prompts')
        .select(`
          id,
          name,
          raw_prompt,
          refined_prompt,
          system_prompt,
          domain,
          description,
          tags,
          is_public,
          author_id,
          quality_score,
          created_at,
          updated_at
        `);

      // Apply filters
      if (params.domain) {
        query = query.eq('domain', params.domain as 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general');
      }

      if (params.tags && params.tags.length > 0) {
        query = query.contains('tags', params.tags);
      }

      if (params.query) {
        query = query.or(`description.ilike.%${params.query}%,raw_prompt.ilike.%${params.query}%,refined_prompt.ilike.%${params.query}%`);
      }

      // if (params.isPublic !== undefined) {
      //   query = query.eq('is_public', params.isPublic);
      // }

      if (params.minScore !== undefined) {
        query = query.gte('prompt_evaluations.overall_score', params.minScore);
      }

      // Apply ordering
      switch (params.sortBy) {
        case 'score':
          query = query.order('prompt_evaluations.overall_score', { ascending: false });
          break;
        case 'created':
          query = query.order('created_at', { ascending: false });
          break;
        case 'updated':
          query = query.order('updated_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const limit = params.limit || 20;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      // Transform data to SearchResult format
      return (data || []).map(row => ({
        id: row.id,
        name: row.name || 'Unnamed',
        domain: row.domain as any,
        description: row.description || '',
        tags: row.tags || [],
        prompt: row.refined_prompt,
        score: row.quality_score && typeof row.quality_score === 'object' ? {
          overall: (row.quality_score as any).overall || 0,
          clarity: (row.quality_score as any).clarity || 0,
          specificity: (row.quality_score as any).specificity || 0,
          structure: (row.quality_score as any).structure || 0,
          completeness: (row.quality_score as any).completeness || 0,
        } : { overall: 0, clarity: 0, specificity: 0, structure: 0, completeness: 0 },
        usage: {
          count: 0,
          successRate: 0,
          avgResponseTime: 0,
          lastUsed: new Date(row.updated_at || row.created_at || new Date()),
        },
        createdAt: new Date(row.created_at || new Date()),
        relevance: this.calculateRelevanceScore(row, params)
      }));

    } catch (error) {
      console.error('Store search operation failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getById(id: string): Promise<SavedPrompt | null> {
    try {
      const { data, error } = await this.supabase
        .from('promptsmith_prompts')
        .select(`
          id,
          name,
          raw_prompt,
          refined_prompt,
          system_prompt,
          domain,
          description,
          tags,
          is_public,
          author_id,
          quality_score,
          created_at,
          updated_at
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get prompt: ${error.message}`);
      }

      return {
        id: data.id,
        name: data.name || 'Unnamed',
        prompt: data.refined_prompt,
        systemPrompt: data.system_prompt || '',
        domain: data.domain as any,
        description: data.description || '',
        tags: data.tags || [],
        score: data.quality_score && typeof data.quality_score === 'object' ? {
          overall: (data.quality_score as any).overall || 0,
          clarity: (data.quality_score as any).clarity || 0,
          specificity: (data.quality_score as any).specificity || 0,
          structure: (data.quality_score as any).structure || 0,
          completeness: (data.quality_score as any).completeness || 0,
        } : {
          overall: 0,
          clarity: 0,
          specificity: 0,
          structure: 0,
          completeness: 0
        },
        createdAt: new Date(data.created_at || new Date()),
        updatedAt: new Date(data.updated_at || new Date()),
        metadata: {
          name: data.name || 'Unnamed',
          domain: data.domain,
          ...(data.author_id && { authorId: data.author_id })
        }
      };

    } catch (error) {
      console.error('Store getById operation failed:', error);
      throw new Error(`Failed to get prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async update(
    id: string,
    updates: Partial<{
      refined: string;
      systemPrompt: string;
      description: string;
      tags: string[];
      isPublic: boolean;
      metadata: any;
    }>
  ): Promise<SavedPrompt> {
    try {
      const updateData: any = {};

      if (updates.refined !== undefined) updateData.refined_prompt = updates.refined;
      if (updates.systemPrompt !== undefined) updateData.system_prompt = updates.systemPrompt;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

      updateData.updated_at = new Date().toISOString();

      const { error } = await this.supabase
        .from('promptsmith_prompts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update prompt: ${error.message}`);
      }

      // Fetch the complete record with evaluation
      const updated = await this.getById(id);
      if (!updated) {
        throw new Error('Prompt not found after update');
      }

      return updated;

    } catch (error) {
      console.error('Store update operation failed:', error);
      throw new Error(`Failed to update prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Delete evaluations first (due to foreign key constraint)
      const { error: evaluationError } = await this.supabase
        .from('promptsmith_prompt_evaluations')
        .delete()
        .eq('prompt_id', id);

      if (evaluationError) {
        console.error('Failed to delete evaluations:', evaluationError);
        // Continue with prompt deletion even if evaluation deletion fails
      }

      // Delete the prompt
      const { error: promptError } = await this.supabase
        .from('promptsmith_prompts')
        .delete()
        .eq('id', id);

      if (promptError) {
        throw new Error(`Failed to delete prompt: ${promptError.message}`);
      }

      return true;

    } catch (error) {
      console.error('Store delete operation failed:', error);
      throw new Error(`Failed to delete prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStats(): Promise<{
    totalPrompts: number;
    averageScore: number;
    domainDistribution: Record<string, number>;
    tagDistribution: Record<string, number>;
    qualityDistribution: { excellent: number; good: number; average: number; poor: number };
  }> {
    try {
      // Get total prompts and average score
      const { data: statsData, error: statsError } = await this.supabase
        .from('promptsmith_prompts')
        .select(`
          id,
          domain,
          tags,
          quality_score
        `);

      if (statsError) {
        throw new Error(`Failed to get stats: ${statsError.message}`);
      }

      const totalPrompts = statsData?.length || 0;
      const scores = statsData?.map(p => (p.quality_score as any)?.overall).filter(Boolean) || [];
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      // Calculate domain distribution
      const domainDistribution: Record<string, number> = {};
      statsData?.forEach(p => {
        domainDistribution[p.domain] = (domainDistribution[p.domain] || 0) + 1;
      });

      // Calculate tag distribution
      const tagDistribution: Record<string, number> = {};
      statsData?.forEach(p => {
        p.tags?.forEach(tag => {
          tagDistribution[tag] = (tagDistribution[tag] || 0) + 1;
        });
      });

      // Calculate quality distribution
      const qualityDistribution = { excellent: 0, good: 0, average: 0, poor: 0 };
      scores.forEach(score => {
        if (score >= 0.9) qualityDistribution.excellent++;
        else if (score >= 0.7) qualityDistribution.good++;
        else if (score >= 0.5) qualityDistribution.average++;
        else qualityDistribution.poor++;
      });

      return {
        totalPrompts,
        averageScore,
        domainDistribution,
        tagDistribution,
        qualityDistribution
      };

    } catch (error) {
      console.error('Store getStats operation failed:', error);
      throw new Error(`Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateRelevanceScore(row: any, params: SearchParams): number {
    let relevance = 0.5; // Base relevance

    // Boost based on quality score
    if (row.prompt_evaluations?.[0]?.response_quality?.overall) {
      relevance += row.prompt_evaluations[0].response_quality.overall * 0.3;
    }

    // Boost based on query match (rough approximation)
    if (params.query) {
      const query = params.query.toLowerCase();
      const content = `${row.description} ${row.raw_prompt} ${row.refined_prompt}`.toLowerCase();
      const matches = (content.match(new RegExp(query, 'g')) || []).length;
      relevance += Math.min(matches * 0.1, 0.3);
    }

    // Boost based on tag matches
    if (params.tags && params.tags.length > 0) {
      const matchingTags = params.tags.filter(tag => row.tags?.includes(tag)).length;
      relevance += (matchingTags / params.tags.length) * 0.2;
    }

    return Math.min(1.0, relevance);
  }
}