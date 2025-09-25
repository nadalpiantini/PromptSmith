// Database type definitions for Supabase
// Auto-generated types based on the database schema

export interface Database {
  public: {
    Tables: {
      promptsmith_prompts: {
        Row: {
          id: string;
          name: string | null;
          domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general';
          category: string | null;
          tags: string[] | null;
          description: string | null;
          raw_prompt: string;
          refined_prompt: string;
          system_prompt: string | null;
          quality_score: Json;
          template_type: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step';
          template_variables: Json;
          version: number | null;
          parent_id: string | null;
          usage_count: number | null;
          success_rate: number | null;
          avg_response_time: number | null;
          last_used_at: string | null;
          author_id: string | null;
          is_public: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          domain?: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general';
          category?: string | null;
          tags?: string[] | null;
          description?: string | null;
          raw_prompt: string;
          refined_prompt: string;
          system_prompt?: string | null;
          quality_score?: Json;
          template_type?: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step';
          template_variables?: Json;
          version?: number | null;
          parent_id?: string | null;
          usage_count?: number | null;
          success_rate?: number | null;
          avg_response_time?: number | null;
          last_used_at?: string | null;
          author_id?: string | null;
          is_public?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          domain?: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general';
          category?: string | null;
          tags?: string[] | null;
          description?: string | null;
          raw_prompt?: string;
          refined_prompt?: string;
          system_prompt?: string | null;
          quality_score?: Json;
          template_type?: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step';
          template_variables?: Json;
          version?: number | null;
          parent_id?: string | null;
          usage_count?: number | null;
          success_rate?: number | null;
          avg_response_time?: number | null;
          last_used_at?: string | null;
          author_id?: string | null;
          is_public?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'promptsmith_prompts_parent_id_fkey';
            columns: ['parent_id'];
            referencedRelation: 'promptsmith_prompts';
            referencedColumns: ['id'];
          }
        ];
      };
      promptsmith_prompt_evaluations: {
        Row: {
          id: string;
          prompt_id: string;
          model: string;
          temperature: number | null;
          max_tokens: number | null;
          response_quality: Json;
          evaluation_context: Json;
          processing_time_ms: number | null;
          token_usage: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          model: string;
          temperature?: number | null;
          max_tokens?: number | null;
          response_quality?: Json;
          evaluation_context?: Json;
          processing_time_ms?: number | null;
          token_usage?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          model?: string;
          temperature?: number | null;
          max_tokens?: number | null;
          response_quality?: Json;
          evaluation_context?: Json;
          processing_time_ms?: number | null;
          token_usage?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'promptsmith_prompt_evaluations_prompt_id_fkey';
            columns: ['prompt_id'];
            referencedRelation: 'promptsmith_prompts';
            referencedColumns: ['id'];
          }
        ];
      };
      promptsmith_custom_rules: {
        Row: {
          id: string;
          user_id: string;
          domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general';
          name: string;
          pattern: string;
          replacement: string;
          priority: number | null;
          active: boolean | null;
          description: string | null;
          category: 'vague_terms' | 'structure' | 'enhancement' | 'terminology' | 'formatting' | 'context';
          examples: Json;
          usage_count: number | null;
          success_rate: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general';
          name: string;
          pattern: string;
          replacement: string;
          priority?: number | null;
          active?: boolean | null;
          description?: string | null;
          category: 'vague_terms' | 'structure' | 'enhancement' | 'terminology' | 'formatting' | 'context';
          examples?: Json;
          usage_count?: number | null;
          success_rate?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          domain?: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general';
          name?: string;
          pattern?: string;
          replacement?: string;
          priority?: number | null;
          active?: boolean | null;
          description?: string | null;
          category?: 'vague_terms' | 'structure' | 'enhancement' | 'terminology' | 'formatting' | 'context';
          examples?: Json;
          usage_count?: number | null;
          success_rate?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      promptsmith_templates: {
        Row: {
          id: string;
          name: string;
          domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general';
          template_type: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step';
          template_content: string;
          system_prompt: string | null;
          variables: Json;
          description: string | null;
          tags: string[] | null;
          is_public: boolean | null;
          author_id: string | null;
          usage_count: number | null;
          average_score: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general';
          template_type: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step';
          template_content: string;
          system_prompt?: string | null;
          variables?: Json;
          description?: string | null;
          tags?: string[] | null;
          is_public?: boolean | null;
          author_id?: string | null;
          usage_count?: number | null;
          average_score?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general';
          template_type?: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step';
          template_content?: string;
          system_prompt?: string | null;
          variables?: Json;
          description?: string | null;
          tags?: string[] | null;
          is_public?: boolean | null;
          author_id?: string | null;
          usage_count?: number | null;
          average_score?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      promptsmith_analytics: {
        Row: {
          id: string;
          event_type: string;
          user_id: string | null;
          session_id: string | null;
          domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general' | null;
          prompt_id: string | null;
          processing_time: number | null;
          input_length: number | null;
          output_length: number | null;
          quality_improvement: number | null;
          metadata: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          event_type: string;
          user_id?: string | null;
          session_id?: string | null;
          domain?: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general' | null;
          prompt_id?: string | null;
          processing_time?: number | null;
          input_length?: number | null;
          output_length?: number | null;
          quality_improvement?: number | null;
          metadata?: Json;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          event_type?: string;
          user_id?: string | null;
          session_id?: string | null;
          domain?: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general' | null;
          prompt_id?: string | null;
          processing_time?: number | null;
          input_length?: number | null;
          output_length?: number | null;
          quality_improvement?: number | null;
          metadata?: Json;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'promptsmith_analytics_prompt_id_fkey';
            columns: ['prompt_id'];
            referencedRelation: 'promptsmith_prompts';
            referencedColumns: ['id'];
          }
        ];
      };
      promptsmith_user_feedback: {
        Row: {
          id: string;
          prompt_id: string | null;
          evaluation_id: string | null;
          user_id: string | null;
          rating: number | null;
          feedback_text: string | null;
          improvement_suggestions: string | null;
          feedback_type: string | null;
          metadata: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          prompt_id?: string | null;
          evaluation_id?: string | null;
          user_id?: string | null;
          rating?: number | null;
          feedback_text?: string | null;
          improvement_suggestions?: string | null;
          feedback_type?: string | null;
          metadata?: Json;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          prompt_id?: string | null;
          evaluation_id?: string | null;
          user_id?: string | null;
          rating?: number | null;
          feedback_text?: string | null;
          improvement_suggestions?: string | null;
          feedback_type?: string | null;
          metadata?: Json;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'promptsmith_user_feedback_evaluation_id_fkey';
            columns: ['evaluation_id'];
            referencedRelation: 'promptsmith_prompt_evaluations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'promptsmith_user_feedback_prompt_id_fkey';
            columns: ['prompt_id'];
            referencedRelation: 'promptsmith_prompts';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      promptsmith_get_usage_stats: {
        Args: {
          start_date?: string;
          end_date?: string;
        };
        Returns: {
          total_prompts: number;
          total_evaluations: number;
          avg_quality_score: number;
          top_domains: string[];
          active_users: number;
        }[];
      };
      update_prompt_usage: {
        Args: {
          prompt_uuid: string;
          success?: boolean;
          response_time?: number;
        };
        Returns: undefined;
      };
      calculate_quality_score: {
        Args: {
          clarity: number;
          specificity: number;
          structure: number;
          completeness: number;
        };
        Returns: Json;
      };
      exec_sql: {
        Args: {
          sql: string;
        };
        Returns: undefined;
      };
      set_config: {
        Args: {
          setting_name: string;
          setting_value: string;
          is_local: boolean;
        };
        Returns: string;
      };
    };
    Enums: {
      promptsmith_domain: 'sql' | 'branding' | 'cine' | 'saas' | 'devops' | 'general';
      promptsmith_tone: 'formal' | 'casual' | 'technical' | 'creative';
      promptsmith_template_type: 'basic' | 'chain-of-thought' | 'few-shot' | 'role-based' | 'step-by-step';
      promptsmith_rule_category: 'vague_terms' | 'structure' | 'enhancement' | 'terminology' | 'formatting' | 'context';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
      Database['public']['Views'])
  ? (Database['public']['Tables'] &
      Database['public']['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
  ? Database['public']['Enums'][PublicEnumNameOrOptions]
  : never;