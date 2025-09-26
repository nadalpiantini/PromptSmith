// Supabase Database Types for PromptSmith MCP
// Generated for sujeto10.supabase.co with "promptsmith_" table prefix
// Deploy target: prompsmith.sujeto10.com

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      promptsmith_prompts: {
        Row: {
          id: string
          name: string | null
          domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general'
          category: string | null
          tags: string[]
          description: string | null
          raw_prompt: string
          refined_prompt: string
          system_prompt: string | null
          quality_score: Json
          template_type: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step'
          template_variables: Json
          version: number
          parent_id: string | null
          usage_count: number
          success_rate: number
          avg_response_time: number | null
          last_used_at: string | null
          author_id: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          domain?: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general'
          category?: string | null
          tags?: string[]
          description?: string | null
          raw_prompt: string
          refined_prompt: string
          system_prompt?: string | null
          quality_score?: Json
          template_type?: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step'
          template_variables?: Json
          version?: number
          parent_id?: string | null
          usage_count?: number
          success_rate?: number
          avg_response_time?: number | null
          last_used_at?: string | null
          author_id?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          domain?: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general'
          category?: string | null
          tags?: string[]
          description?: string | null
          raw_prompt?: string
          refined_prompt?: string
          system_prompt?: string | null
          quality_score?: Json
          template_type?: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step'
          template_variables?: Json
          version?: number
          parent_id?: string | null
          usage_count?: number
          success_rate?: number
          avg_response_time?: number | null
          last_used_at?: string | null
          author_id?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      promptsmith_prompt_evaluations: {
        Row: {
          id: string
          prompt_id: string
          model: string
          temperature: number | null
          max_tokens: number | null
          response_quality: Json
          evaluation_context: Json
          processing_time_ms: number | null
          token_usage: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          prompt_id: string
          model?: string
          temperature?: number | null
          max_tokens?: number | null
          response_quality?: Json
          evaluation_context?: Json
          processing_time_ms?: number | null
          token_usage?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          prompt_id?: string
          model?: string
          temperature?: number | null
          max_tokens?: number | null
          response_quality?: Json
          evaluation_context?: Json
          processing_time_ms?: number | null
          token_usage?: Json | null
          created_at?: string
        }
      }
      promptsmith_custom_rules: {
        Row: {
          id: string
          user_id: string
          domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general'
          name: string
          pattern: string
          replacement: string
          priority: number
          active: boolean
          description: string | null
          category: 'vague_terms' | 'structure' | 'enhancement' | 'terminology' | 'formatting' | 'context'
          examples: Json
          usage_count: number
          success_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general'
          name: string
          pattern: string
          replacement: string
          priority?: number
          active?: boolean
          description?: string | null
          category: 'vague_terms' | 'structure' | 'enhancement' | 'terminology' | 'formatting' | 'context'
          examples?: Json
          usage_count?: number
          success_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          domain?: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general'
          name?: string
          pattern?: string
          replacement?: string
          priority?: number
          active?: boolean
          description?: string | null
          category?: 'vague_terms' | 'structure' | 'enhancement' | 'terminology' | 'formatting' | 'context'
          examples?: Json
          usage_count?: number
          success_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      promptsmith_templates: {
        Row: {
          id: string
          name: string
          domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general'
          template_type: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step'
          template_content: string
          system_prompt: string | null
          variables: Json
          description: string | null
          tags: string[]
          is_public: boolean
          author_id: string | null
          usage_count: number
          average_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general'
          template_type: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step'
          template_content: string
          system_prompt?: string | null
          variables?: Json
          description?: string | null
          tags?: string[]
          is_public?: boolean
          author_id?: string | null
          usage_count?: number
          average_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general'
          template_type?: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step'
          template_content?: string
          system_prompt?: string | null
          variables?: Json
          description?: string | null
          tags?: string[]
          is_public?: boolean
          author_id?: string | null
          usage_count?: number
          average_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      promptsmith_analytics: {
        Row: {
          id: string
          event_type: string
          user_id: string | null
          session_id: string | null
          domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general' | null
          prompt_id: string | null
          processing_time: number | null
          input_length: number | null
          output_length: number | null
          quality_improvement: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          user_id?: string | null
          session_id?: string | null
          domain?: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general' | null
          prompt_id?: string | null
          processing_time?: number | null
          input_length?: number | null
          output_length?: number | null
          quality_improvement?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          user_id?: string | null
          session_id?: string | null
          domain?: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general' | null
          prompt_id?: string | null
          processing_time?: number | null
          input_length?: number | null
          output_length?: number | null
          quality_improvement?: number | null
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      promptsmith_get_usage_stats: {
        Args: {
          start_date?: string
          end_date?: string
        }
        Returns: {
          total_prompts: number
          total_evaluations: number
          avg_quality_score: number
          top_domains: string[]
          active_users: number
        }[]
      }
    }
    Enums: {
      promptsmith_domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general' | 'mobile' | 'web' | 'backend' | 'frontend' | 'ai' | 'gaming' | 'crypto' | 'education' | 'healthcare' | 'finance' | 'legal'
      promptsmith_tone: 'formal' | 'casual' | 'technical' | 'creative'
      promptsmith_template_type: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step'
      promptsmith_rule_category: 'vague_terms' | 'structure' | 'enhancement' | 'terminology' | 'formatting' | 'context'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}