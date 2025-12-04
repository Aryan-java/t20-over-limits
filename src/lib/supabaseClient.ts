import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// Fallback values from Lovable Cloud configuration
const FALLBACK_URL = 'https://ykjwukkfqdocehxtfjcw.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrand1a2tmcWRvY2VoeHRmamN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTE1NTgsImV4cCI6MjA3ODY4NzU1OH0.INFJx7rfgl8Qx6XbympzwUaqSrpElU5FRqK0-P9KOyM';

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  
  const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY;
  
  supabaseInstance = createClient(url, key, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
  
  return supabaseInstance;
};

export const isSupabaseConfigured = () => {
  return true; // Always configured with fallbacks
};
