import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database type definitions
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          is_admin?: boolean;
          created_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          amount_kwd: number;
          status: string;
          has_upsell: boolean;
          upayments_ref: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_kwd: number;
          status: string;
          has_upsell?: boolean;
          upayments_ref: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount_kwd?: number;
          status?: string;
          has_upsell?: boolean;
          upayments_ref?: string;
          created_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          module_title: string;
          title: string;
          duration: number;
          video_url: string;
          order_index: number;
          is_free: boolean;
        };
        Insert: {
          id?: string;
          module_id: string;
          module_title: string;
          title: string;
          duration: number;
          video_url: string;
          order_index: number;
          is_free?: boolean;
        };
        Update: {
          id?: string;
          module_id?: string;
          module_title?: string;
          title?: string;
          duration?: number;
          video_url?: string;
          order_index?: number;
          is_free?: boolean;
        };
      };
      progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed_at: string;
          watch_percentage: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          completed_at?: string;
          watch_percentage: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          completed_at?: string;
          watch_percentage?: number;
        };
      };
      resources: {
        Row: {
          id: string;
          lesson_id: string;
          title: string;
          file_url: string;
          file_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          title: string;
          file_url: string;
          file_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          title?: string;
          file_url?: string;
          file_type?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

// Create and export the Supabase client with proper typing
export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export types for convenience
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Purchase = Database['public']['Tables']['purchases']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type Progress = Database['public']['Tables']['progress']['Row'];
export type Resource = Database['public']['Tables']['resources']['Row'];
