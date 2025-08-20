import React, { useEffect, useMemo, useState } from "react";
import MiningConclusion from "../components/MiningConclusion";
import { computeRanking } from "../components/utils";

export default function Ranking() {
  const [data, setData] = useState(null);
  const [onlyCritical, setOnlyCritical] = useState(true);

  useEffect(() => {
    fetch("/scada_comparison.json")
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    // Puedes usar onlyCritical para filtrar features si tu app lo soporta.
    // Aquí nos enfocamos en el perfil "mining" para el ranking.
    return computeRanking(data.softwares, { profile: "mining" });
  }, [data, onlyCritical]);

  if (!data) return <div className="p-6">Cargando…</div>;

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Ranking de plataformas SCADA</h1>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyCritical} onChange={e=>setOnlyCritical(e.target.checked)} />
          Solo ítems críticos (Seguridad / Redundancia / Integración)
        </label>
      </div>

      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={r.name} className="rounded-2xl bg-white shadow p-4 flex items-center justify-between">
            <div className="text-slate-900">
              <div className="text-sm opacity-60">#{i+1}</div>
              <div className="text-lg font-medium">{r.name}</div>
            </div>
            <div className="text-3xl font-semibold tabular-nums">{r.score}</div>
          </div>
        ))}
      </div>

      <MiningConclusion />
    </div>
  );
}
