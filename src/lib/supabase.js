// src/lib/supabase.js
// Cliente Supabase para Vite. Requiere variables:
//
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
//
// Asegúrate de setearlas en Netlify (Site settings → Environment variables).

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;
