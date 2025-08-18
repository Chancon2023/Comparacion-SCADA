// src/lib/supabase.js
// Cliente Supabase compatible con import por defecto y nombrado.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Evita romper el build: solo warn en tiempo de ejecución
  // eslint-disable-next-line no-console
  console.warn("[supabase] Variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no configuradas.");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
export default supabase;
