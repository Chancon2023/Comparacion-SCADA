// src/pages/Ranking.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase, fetchWeights, fetchReviews } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

// Pesos locales por defecto (fallback)
const DEFAULT_WEIGHTS = {
  Seguridad: 2,
  Redundancia: 1.5,
  Integración: 1.2,
  "Acceso remoto/web": 1.2,
  "Casos de Éxito": 1.0,
  "Compatibilidad con antivirus": 0.8,
  "Compatibilidad con hardware": 0.8,
  "Configuración y mantenimiento": 1.0,
};

// Intentamos varias rutas para que funcione con 3.7.1 o 3.8+
const DATA_URLS = [
  "/data/scada_dataset_mining_extended_v371.json",
  "/data/scada_dataset.json",
  "/scada_dataset_mining_extended_v371.json",
  "/scada_dataset.json",
];

async function loadDataset() {
  for (const url of DATA_URLS) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return res.json();
    } catch {}
  }
  return null;
}

function scoreValue(v) {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("ok") || s.includes("✔")) return 2;
  if (s.includes("media") || s.includes("mid") || s.includes("⚠")) return 1;
  if (s.includes("no") || s.includes("❌")) return 0;
  const n = Number(v);
  if (!Number.isNaN(n)) return n;
  return 0;
}

export default function Ranking() {
  const nav = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await loadDataset();
      setDataset(data);
      const w = await fetchWeights();
      if (w && Object.keys(w).length) setWeights((prev) => ({ ...prev, ...w }));
      const r = await fetchReviews();
      setReviews(r);
    })();
  }, []);

  const ranking = useMemo(() => {
    if (!dataset || !dataset.platforms) return [];
    return dataset.platforms.map((p) => {
      let total = 0;
      let base = 0;
      for (const [feat, state] of Object.entries(p.features || {})) {
        const w = weights[feat] ?? 1;
        total += scoreValue(state) * w;
        base += 2 * w;
      }
      const score = base > 0 ? Math.round((total / base) * 1000) / 10 : 0;
      const pros = reviews.filter((r) => r.platform === p.name && r.type === "pro");
      const cons = reviews.filter((r) => r.platform === p.name && r.type === "con");
      return { ...p, score, pros, cons };
    }).sort((a, b) => b.score - a.score);
  }, [dataset, weights, reviews]);

  if (!dataset) {
    return (
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => nav(-1)} className="rounded-xl px-3 py-1.5 bg-gray-200 hover:bg-gray-300">
            ← Volver
          </button>
          <h1 className="text-2xl font-semibold">Ranking de plataformas SCADA</h1>
        </div>
        <div>Cargando dataset…</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => nav(-1)} className="rounded-xl px-3 py-1.5 bg-gray-200 hover:bg-gray-300">
          ← Volver
        </button>
        <h1 className="text-2xl font-semibold">Ranking de plataformas SCADA</h1>
      </div>

      <div className="mb-3 text-sm text-gray-500">
        * Pesos en vivo desde <b>Supabase</b> (tabla <code>weights</code>). Fallback: pesos locales.
      </div>

      <div className="space-y-4">
        {ranking.map((p, idx) => (
          <div key={p.name} className="bg-white rounded-2xl shadow p-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <div className="text-gray-500">#{idx + 1}</div>
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="ml-auto text-xl font-bold">{p.score}</div>
            </div>

            {(p.pros?.length || p.cons?.length) ? (
              <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm">
                <div className="md:col-span-1">
                  <div className="font-medium mb-1">Pros</div>
                  <ul className="space-y-1">
                    {(p.pros || []).map((r) => (
                      <li key={r.id} className="bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                        {r.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-1">
                  <div className="font-medium mb-1">Contras</div>
                  <ul className="space-y-1">
                    {(p.cons || []).map((r) => (
                      <li key={r.id} className="bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
                        {r.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}