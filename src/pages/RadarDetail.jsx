// src/pages/RadarDetail.jsx
import React, { useMemo, useState } from "react";
import dataset from "../data/scada_dataset.json";
import { prepareData } from "../components/utils";
import { Link } from "react-router-dom";

const ALL_FEATURES = (dataset.features || []);

export default function RadarDetail() {
  const [selected, setSelected] = useState((dataset.platforms || []).slice(0, 3).map(p => p.name));
  const [features, setFeatures] = useState(ALL_FEATURES);

  const rows = useMemo(() => prepareData(dataset, selected), [selected]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Radar detallado</h1>
        <Link to="/" className="rounded-lg px-4 py-2 bg-gray-200 hover:bg-gray-300">← Volver</Link>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Selecciona hasta 3 plataformas para comparar (dataset mínimo de ejemplo incluido).
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {(dataset.platforms || []).map(p => {
          const active = selected.includes(p.name);
          return (
            <button
              key={p.name}
              onClick={() => {
                setSelected(prev => {
                  if (prev.includes(p.name)) return prev.filter(x => x !== p.name);
                  if (prev.length >= 3) return [...prev.slice(1), p.name];
                  return [...prev, p.name];
                });
              }}
              className={`px-3 py-1 rounded-full border ${active ? "bg-black text-white" : "bg-white"}`}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <pre className="text-xs overflow-auto">
{JSON.stringify(rows.slice(0, 5), null, 2)}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          (Este mock imprime las primeras filas calculadas. Sustituye por tu componente de Radar real.)
        </p>
      </div>
    </div>
  );
}
