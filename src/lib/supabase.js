import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
try {
  if (url && anon) {
    supabase = createClient(url, anon, { auth: { persistSession: false } });
  } else {
    console.warn("[supabase] Variables no definidas, funcionando en modo local.");
  }
} catch (e) {
  console.error("[supabase] Error creando cliente:", e);
  supabase = null;
}

export default supabase;
