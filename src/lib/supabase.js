// src/lib/supabase.js
// Safe client factory WITHOUT requiring "@supabase/supabase-js" in package.json.
//
// Vite/Rollup in Netlify couldn't resolve the package during build.
// This version loads it at runtime from ESM CDN and caches the client.
// --> No extra dependency needed.
//
// Usage in your code:
//   import { getSupabase } from "../lib/supabase";
//   const supabase = await getSupabase();
//   if (supabase) { ... }

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let clientPromise = null;

/**
 * Returns a Supabase client or null if env variables are missing.
 * Loads the SDK dynamically from ESM CDN. The special comment hints Vite to ignore prebundle.
 */
export async function getSupabase() {
  if (!URL || !KEY) {
    if (import.meta.env.DEV) {
      console.warn("[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no definidos. Se retorna null.");
    }
    return null;
  }
  if (!clientPromise) {
    clientPromise = (async () => {
      const mod = await import(/* @vite-ignore */ "https://esm.sh/@supabase/supabase-js@2?bundle");
      const { createClient } = mod;
      return createClient(URL, KEY);
    })();
  }
  return clientPromise;
}

/**
 * Helper opcional: lee una tabla. Si no hay Supabase (sin env), retorna [] sin romper la app.
 */
export async function safeSelect(table, opts = {}) {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from(table).select(opts.select || "*");
  if (error) {
    console.error(`[supabase] Error leyendo ${table}:`, error);
    return [];
  }
  return data || [];
}