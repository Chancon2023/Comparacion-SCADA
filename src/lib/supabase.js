// Lightweight Supabase client that works on Netlify without bundling @supabase/supabase-js.
// We use a dynamic import from esm.sh in both dev and prod to avoid Rollup resolution errors.
export async function getSupabase() {
  if (typeof window !== "undefined" && window.__supa) return window.__supa;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[supabase] Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY");
    return null;
  }

  // dynamic ESM import (avoid bundler resolution)
  const mod = await import(/* @vite-ignore */ "https://esm.sh/@supabase/supabase-js@2.45.0");
  const supabase = mod.createClient(url, key);
  if (typeof window !== "undefined") window.__supa = supabase;
  return supabase;
}