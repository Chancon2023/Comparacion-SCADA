import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchDataset, defaultWeights, computeRadarRow } from "../components/utils";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from "recharts";

export default function RadarDetail() {
  const { name } = useParams();
  const [dataset, setDataset] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await fetchDataset();
      if (!data) return;
      setDataset(Array.isArray(data) ? { platforms: data } : data);
    })();
  }, []);

  const platform = useMemo(()=> {
    if (!dataset) return null;
    return (dataset.platforms || []).find(p => (p.name || "").toLowerCase() === decodeURIComponent(name||"").toLowerCase());
  }, [dataset, name]);

  const weights = useMemo(()=> dataset?.weights ?? defaultWeights(dataset || {}), [dataset]);
  const series = useMemo(()=> platform ? computeRadarRow(platform, weights) : null, [platform, weights]);

  if (!dataset) return <div className="max-w-5xl mx-auto p-6">Cargando…</div>;
  if (!platform) return <div className="max-w-5xl mx-auto p-6">No se encontró la plataforma.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">Radar detallado — {platform.name}</h1>
        <Link to="/ranking" className="rounded-xl px-4 py-2 bg-slate-900 text-white">← Volver</Link>
      </div>

      <div className="rounded-2xl p-6 bg-white shadow border">
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart outerRadius="80%" data={(series?.labels || []).map((label, i)=>({ feature: label, value: series.data[i] }))}>
            <PolarGrid />
            <PolarAngleAxis dataKey="feature" />
            <PolarRadiusAxis angle={30} domain={[0,100]} />
            <Tooltip formatter={(v)=> `${v.toFixed(0)}%`}/>
            <Radar name={platform.name} dataKey="value" stroke="#1d4ed8" fill="#93c5fd" fillOpacity={0.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}