// src/lib/supabaseClient.js
// Reutilizable en todo el proyecto. No expone claves en el bundle si usas envs en Netlify.
// Requiere las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});