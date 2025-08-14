// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (url && anon) ? createClient(url, anon) : null;

/**
 * weights table:
 *   id (pk), data (jsonb)
 * Returns { data: { Seguridad: 2, Redundancia: 1.5, ... } } or null
 */
export async function fetchWeights() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('weights')
    .select('data')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('fetchWeights error', error);
    return null;
  }
  return data?.data ?? null;
}

/**
 * reviews table (optional):
 *   id, platform, pros (text[]), cons (text[]), source_url
 */
export async function fetchReviews() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('platform, pros, cons, source_url');
  if (error) {
    console.warn('fetchReviews error', error);
    return [];
  }
  return data || [];
}