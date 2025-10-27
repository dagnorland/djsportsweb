/**
 * Supabase client factory for SSR-safe usage
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/config/env';

// Database types
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
      user_sync_data: {
        Row: {
          id: string;
          spotify_user_id: string;
          track_start_times: Json;
          playlist_types: Json;
          device_name: string;
          last_synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          spotify_user_id: string;
          track_start_times?: Json;
          playlist_types?: Json;
          device_name: string;
          last_synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          spotify_user_id?: string;
          track_start_times?: Json;
          playlist_types?: Json;
          device_name?: string;
          last_synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get Supabase client instance (SSR-safe)
 */
export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side: create new client
    return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }
  
  // Client-side: reuse existing client
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }
  
  return supabaseClient;
}

/**
 * Get Supabase client for server-side usage
 */
export function getSupabaseServerClient() {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}

