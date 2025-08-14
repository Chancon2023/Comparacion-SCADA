// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail-soft: if envs are missing, export a dummy client that throws on use
let supabase = null;
if (url && anon) {
  supabase = createClient(url, anon, {
    auth: { persistSession: false },
  });
} else {
  supabase = {
    from() {
      return {
        select() {
          throw new Error(
            "[supabaseClient] Faltan variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY."
          );
        },
      };
    },
  };
}

export default supabase;
