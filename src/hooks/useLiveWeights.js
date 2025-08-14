// src/hooks/useLiveWeights.js
import { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";

const DEFAULT_WEIGHTS = {
  seguridad: 2.0,
  redundancia: 1.5,
  integracion: 1.2,
};

export function useLiveWeights() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchWeights() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("weights").select("key,value");
        if (error) throw error;
        if (Array.isArray(data) && data.length) {
          const m = { ...DEFAULT_WEIGHTS };
          for (const row of data) {
            const k = String(row.key || "").toLowerCase();
            const v = Number(row.value);
            if (!Number.isNaN(v) && k) m[k] = v;
          }
          if (mounted) setWeights(m);
        }
      } catch (err) {
        console.warn("[useLiveWeights] usando pesos por defecto:", err?.message || err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchWeights();
    return () => { mounted = false; };
  }, []);

  return { weights, loading, error };
}
