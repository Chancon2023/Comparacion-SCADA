// src/pages/Ranking.jsx
import React, { useEffect, useMemo, useState } from "react";
import supabase from "../lib/supabase";
import MiningConclusion from "../components/MiningConclusion";
import dataset from "../data/scada_dataset.json";
import { scoreValue } from "../components/utils";
import { Link } from "react-router-dom";

const DEFAULT_WEIGHTS = {
  seguridad: 2.0,
  redundancia: 1.5,
  integracion: 1.2,
  rendimiento: 1.0,
  costos: 1.0
};

function computeScore(p, weights) {
  // Suma ponderada simple sobre p.weightsKeys (si existen) o sobre p.scores
  let sum = 0;
  let denom = 0;
  const src = p.scores || {};
  for (const [k, v] of Object.entries(src)) {
    const w = weights[k] || 1.0;
    sum += scoreValue(v) * w;
    denom += w;
  }
  return denom ? (sum / denom) * 100 : 0;
}

export default function Ranking() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from("weights").select("*").limit(1);
        if (!cancelled && data && data.length) {
          const w = data[0];
          const merged = { ...DEFAULT_WEIGHTS, ...w };
          delete merged.id;
          delete merged.created_at;
          setWeights(merged);
        }
      } catch (e) {
        console.warn("[weights] usando por defecto", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => {
    const list = (dataset.platforms || []).map(p => ({
      name: p.name,
      score: computeScore(p, weights),
      why: p.highlights || []
    }));
    return list.sort((a, b) => b.score - a.score);
  }, [weights]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Ranking de plataformas SCADA</h1>
        <Link to="/" className="rounded-lg px-4 py-2 bg-gray-200 hover:bg-gray-300">← Volver</Link>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Ranking como promedio normalizado (0..100) con pesos {JSON.stringify(weights)}.{" "}
        Si Supabase no está configurado, se usan pesos por defecto.
      </p>

      <div className="space-y-4">
        {rows.map((r, idx) => (
          <div key={r.name} className="rounded-2xl shadow bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-gray-500">#{idx + 1}</div>
              <div className="font-medium">{r.name}</div>
              <div className="text-2xl font-bold">{r.score.toFixed(1)}</div>
            </div>
            {!!r.why?.length && (
              <ul className="mt-3 text-sm text-gray-700 list-disc pl-6">
                {r.why.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>

      <MiningConclusion />
    </div>
  );
}
