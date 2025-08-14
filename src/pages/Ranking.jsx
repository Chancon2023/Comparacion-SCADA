import React, { useEffect, useMemo, useState } from "react";
import MiningConclusion from "../components/MiningConclusion";
import { getSupabase } from "../lib/supabase";

export default function RankingPage() {
  const [weights, setWeights] = useState(null);
  const [reviews, setReviews] = useState({});
  const [error, setError] = useState(null);

  // 1) Pull live weights & reviews (optional) from Supabase — if credentials exist.
  useEffect(() => {
    (async () => {
      try {
        const supabase = await getSupabase();
        if (!supabase) return;

        const { data: wdata, error: werr } = await supabase.from("weights").select("key,value");
        if (!werr && wdata) {
          const obj = {};
          for (const row of wdata) obj[row.key] = Number(row.value);
          setWeights(obj);
          // small cache to localStorage (in case ranking code elsewhere reads from there)
          try { localStorage.setItem("weights_live", JSON.stringify(obj)); } catch {}
        }

        const { data: rdata } = await supabase.from("reviews").select("platform, text").limit(200);
        if (rdata) {
          const map = {};
          for (const r of rdata) {
            map[r.platform] = map[r.platform] || [];
            map[r.platform].push(r.text);
          }
          setReviews(map);
        }
      } catch (e) {
        console.warn("[Ranking] Supabase opcional:", e);
      }
    })();
  }, []);

  // 2) Fallback/merge: keep whatever the app already does for ranking.
  // We just show a tiny header with live weights loaded (if any)
  const weightsPreview = useMemo(() => {
    if (!weights) return null;
    const entries = Object.entries(weights).slice(0, 6);
    return entries.map(([k, v]) => `${k}:${v}`).join(" • ");
  }, [weights]);

  // Provide a small Back button (home)
  const goBack = () => {
    try {
      if (window.history.length > 1) window.history.back();
      else window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Ranking de plataformas SCADA</h1>
        <button
          onClick={goBack}
          className="rounded-2xl px-4 py-2 bg-slate-800 text-white shadow hover:bg-slate-700"
        >
          ← Volver
        </button>
      </div>

      {weightsPreview && (
        <div className="mb-6 text-sm text-slate-600">
          <span className="font-medium">Pesos activos (Supabase):</span> {weightsPreview}
        </div>
      )}

      {/* Aquí se renderiza el ranking existente del proyecto (lista/tabla original).
          No lo tocamos para no romper tu lógica actual. */}
      <div id="ranking-anchor" className="mb-8">
        {/* Conserva tu componente/lista original de ranking aquí */}
      </div>

      {/* Mini reseñas desde Supabase (si existen) */}
      {Object.keys(reviews).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Reseñas recientes (Supabase)</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(reviews).map(([platform, items]) => (
              <div key={platform} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="font-medium mb-1">{platform}</div>
                <ul className="list-disc pl-5 text-slate-700 space-y-1">
                  {items.slice(0, 3).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <MiningConclusion />
    </div>
  );
}