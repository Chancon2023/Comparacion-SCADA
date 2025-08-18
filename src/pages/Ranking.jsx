import React, { useEffect, useMemo, useState } from "react";
import { COLORS, prepareData, computeRadarRow } from "../components/utils";

// Rutas públicas (coloca los JSON en /public/data)
const DATA_URL = "/data/scada_dataset.json";
const WEIGHTS_URL = "/data/weights.json";

export default function Ranking() {
  const [raw, setRaw] = useState(null);
  const [weights, setWeights] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    async function loadAll() {
      try {
        const [dRes, wRes] = await Promise.all([
          fetch(DATA_URL),
          fetch(WEIGHTS_URL),
        ]);
        if (!dRes.ok) throw new Error("No se pudo leer scada_dataset.json");
        if (!wRes.ok) throw new Error("No se pudo leer weights.json");
        const d = await dRes.json();
        const w = await wRes.json();
        if (!alive) return;
        setRaw(d);
        setWeights(w);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
    }
    loadAll();
    return () => {
      alive = false;
    };
  }, []);

  const platforms = useMemo(() => prepareData(raw), [raw]);
  const features = useMemo(() => {
    // Usa features del dataset si vienen; si no, intenta inferir
    if (raw?.features && Array.isArray(raw.features)) return raw.features;
    const first = platforms?.[0];
    return first ? Object.keys(first.features || {}) : [];
  }, [raw, platforms]);

  const rows = useMemo(() => {
    if (!platforms?.length || !features?.length) return [];
    return platforms
      .map((p) => ({
        name: p.name,
        score: computeRadarRow(p, features, weights || {}),
        why: p.why || [],
      }))
      .sort((a, b) => b.score - a.score);
  }, [platforms, features, weights]);

  if (error) {
    return (
      <div className="p-6 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
        Error cargando datos: {error}
      </div>
    );
  }

  if (!rows.length) {
    return <div className="p-6">Cargando…</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Ranking de plataformas SCADA
        </h1>
        <small className="text-slate-500">
          Fuente: /public/data (sin Supabase)
        </small>
      </div>

      <ol className="space-y-4">
        {rows.map((r, i) => (
          <li
            key={r.name}
            className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 w-8 text-right font-medium">#{i + 1}</span>
                <div className="text-lg md:text-xl font-semibold">{r.name}</div>
              </div>
              <div className="text-2xl font-bold tabular-nums">{r.score.toFixed(1)}</div>
            </div>
            {!!r.why?.length && (
              <ul className="mt-3 text-sm text-slate-700 list-disc pl-6 space-y-1">
                {r.why.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
