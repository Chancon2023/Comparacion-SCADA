// src/lib/supabase.js
// Cliente Supabase sin imports (usa UMD cargado en index.html).
// Si las env vars faltan o el script no se cargó, devolvemos un "fake client" que evita crasheos.

const URL = import.meta?.env?.VITE_SUPABASE_URL;
const KEY = import.meta?.env?.VITE_SUPABASE_ANON_KEY;

function createFakeClient() {
  const warn = () => console.warn("[supabase] no configurado (usando fake client)");
  return {
    from() {
      warn();
      return {
        select: async () => ({ data: null, error: { message: "supabase not configured" } }),
        upsert: async () => ({ data: null, error: { message: "supabase not configured" } }),
        insert: async () => ({ data: null, error: { message: "supabase not configured" } }),
        update: async () => ({ data: null, error: { message: "supabase not configured" } }),
        delete: async () => ({ data: null, error: { message: "supabase not configured" } }),
        eq() { return this; },
        order() { return this; },
        limit() { return this; },
      };
    },
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  };
}

let client = createFakeClient();

try {
  if (window?.supabase && URL && KEY) {
    client = window.supabase.createClient(URL, KEY);
  } else {
    console.warn("[supabase] UMD no cargado o URL/KEY no definidas");
  }
} catch (e) {
  console.error("[supabase] error inicializando:", e);
}

export default client;
