import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/

// Lovable Cloud normally injects VITE_SUPABASE_* at build time.
// Some deployments can miss that injection, which would crash on import.
// We provide safe fallbacks (public URL + anon/publishable key) to prevent a blank screen.
const FALLBACK_SUPABASE_URL = "https://ykjwukkfqdocehxtfjcw.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrand1a2tmcWRvY2VoeHRmamN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTE1NTgsImV4cCI6MjA3ODY4NzU1OH0.INFJx7rfgl8Qx6XbympzwUaqSrpElU5FRqK0-P9KOyM";

export default defineConfig(({ mode }) => {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;

  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_PUBLISHABLE_KEY;

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabaseKey),
    },
  };
});

