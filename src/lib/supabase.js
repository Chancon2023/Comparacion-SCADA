// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Dev-safe: si faltan envs, exportamos null para que la app siga funcionando
export const supabase = (url && anon) ? createClient(url, anon) : null;

/** Lee la tabla 'weights' y devuelve { [feature]: weight } */
export async function fetchWeights() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("weights")
    .select("*")
    .order("feature", { ascending: true });
  if (error) {
    console.error("Supabase weights error:", error);
    return null;
  }
  const weights = {};
  for (const row of data || []) {
    if (row?.feature != null && typeof row?.weight === "number") {
      weights[row.feature] = row.weight;
    }
  }
  return weights;
}

/** Lee reseñas de la tabla 'reviews'  */
export async function fetchReviews() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("reviews").select("*");
  if (error) {
    console.error("Supabase reviews error:", error);
    return [];
  }
  return data || [];
}

/** Crea o actualiza una reseña */
export async function upsertReview(payload) {
  if (!supabase) throw new Error("Supabase no inicializado");
  const { data, error } = await supabase
    .from("reviews")
    .upsert(payload)
    .select();
  if (error) throw error;
  return data;
}