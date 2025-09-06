import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://napdxuqbvaruwdkpastv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcGR4dXFidmFydXdka3Bhc3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzgzNzcsImV4cCI6MjA3MjcxNDM3N30.zC00WMYfdtU6eSy9o3y0LZFZH-de6fJ8SLZPrB2Zpbc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (to be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          target_score: number;
          test_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          target_score?: number;
          test_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          target_score?: number;
          test_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          topic: string;
          duration_minutes: number;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          topic: string;
          duration_minutes: number;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          topic?: string;
          duration_minutes?: number;
          notes?: string;
          created_at?: string;
        };
      };
      practice_exams: {
        Row: {
          id: string;
          user_id: string;
          exam_type: string;
          total_score: number;
          biology_score: number;
          chemistry_score: number;
          physics_score: number;
          cars_score: number;
          psychology_score: number;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_type: string;
          total_score: number;
          biology_score: number;
          chemistry_score: number;
          physics_score: number;
          cars_score: number;
          psychology_score: number;
          completed_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exam_type?: string;
          total_score?: number;
          biology_score?: number;
          chemistry_score?: number;
          physics_score?: number;
          cars_score?: number;
          psychology_score?: number;
          completed_at?: string;
          created_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          goal_type: string;
          target_value: number;
          current_value: number;
          target_date: string;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_type: string;
          target_value: number;
          current_value?: number;
          target_date: string;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal_type?: string;
          target_value?: number;
          current_value?: number;
          target_date?: string;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}