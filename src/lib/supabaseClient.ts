import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Fallbacks prevent a blank screen if the deployment environment fails to inject VITE_SUPABASE_*.
// These values are public (project URL + anon/publishable key) and are safe to ship client-side.
const FALLBACK_SUPABASE_URL = "https://ykjwukkfqdocehxtfjcw.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrand1a2tmcWRvY2VoeHRmamN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTE1NTgsImV4cCI6MjA3ODY4NzU1OH0.INFJx7rfgl8Qx6XbympzwUaqSrpElU5FRqK0-P9KOyM";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
