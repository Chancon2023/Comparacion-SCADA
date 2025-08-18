// src/lib/supabase.js
// Cliente Supabase vía CDN (window.supabase). Evita bundling con @supabase/supabase-js.
const url = import.meta?.env?.VITE_SUPABASE_URL || "";
const anon = import.meta?.env?.VITE_SUPABASE_ANON_KEY || "";

let supabase = null;

if (typeof window !== "undefined" && window.supabase) {
  try {
    supabase = window.supabase.createClient(url, anon);
  } catch (e) {
    console.error("No se pudo crear el cliente Supabase:", e);
  }
} else {
  console.warn(
    "[supabase] CDN no cargado. Asegúrate de tener el <script> de UMD en index.html."
  );
}

export { supabase }; // <- export nombrado
export default supabase; // <- y default para compatibilidad
