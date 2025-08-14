// src/pages/RadarDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { fetchWeights } from "../lib/supabase";

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

export default function RadarDetail() {
  const nav = useNavigate();
  const [search] = useSearchParams();
  const selected = (search.get("s") || "").split(",").filter(Boolean).slice(0, 3);

  const [dataset, setDataset] = useState(null);
  const [weights, setWeights] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await loadDataset();
      setDataset(data);
      const w = await fetchWeights();
      if (w) setWeights(w);
    })();
  }, []);

  const features = useMemo(() => {
    if (!dataset?.platforms?.length) return [];
    // Tomamos todas las keys presentes en features (unión)
    const set = new Set();
    for (const p of dataset.platforms) {
      Object.keys(p.features || {}).forEach((k) => set.add(k));
    }
    return Array.from(set);
  }, [dataset]);

  const prepared = useMemo(() => {
    if (!dataset || !dataset.platforms || !features.length) return null;
    // Data para RadarChart: [{ feature, A:val, B:val, ...}, ...]
    const data = features.map((feat) => {
      const row = { feature: feat };
      for (const name of selected) {
        const p = dataset.platforms.find((x) => x.name === name);
        const v = p?.features?.[feat];
        const w = weights?.[feat] ?? 1;
        row[name] = scoreValue(v) * w; // ponderado
      }
      return row;
    });
    return data;
  }, [dataset, features, selected, weights]);

  if (!dataset) {
    return (
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => nav(-1)} className="rounded-xl px-3 py-1.5 bg-gray-200 hover:bg-gray-300">
            ← Volver
          </button>
          <h1 className="text-2xl font-semibold">Radar detallado</h1>
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
        <h1 className="text-2xl font-semibold">Radar detallado</h1>
      </div>

      {!selected.length ? (
        <div className="text-sm text-gray-600">Selecciona plataformas con <code>?s=Zenon,Hitachi</code></div>
      ) : null}

      <div className="w-full h-[520px] bg-white rounded-2xl shadow p-4">
        {prepared ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={prepared}>
              <PolarGrid />
              <PolarAngleAxis dataKey="feature" />
              <Tooltip />
              {selected.map((name, i) => (
                <Radar
                  key={name}
                  name={name}
                  dataKey={name}
                  strokeOpacity={0.9}
                  fillOpacity={0.2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="p-4 text-sm text-gray-600">No hay datos para renderizar.</div>
        )}
      </div>
    </div>
  );
}