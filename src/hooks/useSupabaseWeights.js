// src/hooks/useSupabaseWeights.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Devuelve pesos y reseñas live desde Supabase con fallback a localStorage.
 * Estructuras esperadas en BD:
 *  - Tabla `weights`: { feature: string (pk), weight: number }
 *  - Tabla `reviews`: { platform: string, type: 'pro'|'con'|'note', text: string, source?: string }
 */
export default function useSupabaseWeights() {
  const [weights, setWeights] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [[wErr, wData], [rErr, rData]] = await Promise.all([
          supabase.from('weights').select('*').then(({ data, error }) => [error, data]),
          supabase.from('reviews').select('*').then(({ data, error }) => [error, data]),
        ]);

        if (wErr) throw wErr;
        if (rErr) throw rErr;

        const wMap = {};
        (wData || []).forEach((row) => {
          if (row && row.feature) wMap[row.feature] = Number(row.weight ?? 1);
        });

        const rMap = {};
        (rData || []).forEach((row) => {
          if (!row || !row.platform) return;
          const p = row.platform;
          rMap[p] = rMap[p] || { pros: [], cons: [], notes: [] };
          if (row.type === 'pro') rMap[p].pros.push(row.text);
          else if (row.type === 'con') rMap[p].cons.push(row.text);
          else rMap[p].notes.push(row.text);
        });

        if (!cancelled) {
          setWeights(wMap);
          setReviews(rMap);
          localStorage.setItem('live_weights', JSON.stringify(wMap));
          localStorage.setItem('live_reviews', JSON.stringify(rMap));
        }
      } catch (e) {
        console.warn('[useSupabaseWeights] Fallback localStorage:', e?.message || e);
        try {
          const w = JSON.parse(localStorage.getItem('live_weights') || '{}');
          const r = JSON.parse(localStorage.getItem('live_reviews') || '{}');
          if (!cancelled) {
            setWeights(w);
            setReviews(r);
          }
        } catch {}
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { weights, reviews, loading, error };
}