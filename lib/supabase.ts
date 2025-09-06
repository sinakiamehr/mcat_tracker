import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Web-compatible storage
const createWebStorage = () => {
  return {
    getItem: (key: string) => {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      return null;
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    },
    removeItem: (key: string) => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    },
  };
};

// Platform-specific storage
const storage = Platform.OS === 'web' ? createWebStorage() : AsyncStorage;

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
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