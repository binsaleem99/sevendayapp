// Helper types for Supabase queries with proper type casting

import type { Database } from './supabase';

// Table row types
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type PurchaseRow = Database['public']['Tables']['purchases']['Row'];
export type LessonRow = Database['public']['Tables']['lessons']['Row'];
export type ProgressRow = Database['public']['Tables']['progress']['Row'];
export type ResourceRow = Database['public']['Tables']['resources']['Row'];

// Table insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type PurchaseInsert = Database['public']['Tables']['purchases']['Insert'];
export type LessonInsert = Database['public']['Tables']['lessons']['Insert'];
export type ProgressInsert = Database['public']['Tables']['progress']['Insert'];
export type ResourceInsert = Database['public']['Tables']['resources']['Insert'];

// Table update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type PurchaseUpdate = Database['public']['Tables']['purchases']['Update'];
export type LessonUpdate = Database['public']['Tables']['lessons']['Update'];
export type ProgressUpdate = Database['public']['Tables']['progress']['Update'];
export type ResourceUpdate = Database['public']['Tables']['resources']['Update'];
