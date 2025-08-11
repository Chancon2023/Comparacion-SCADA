import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { COLORS, scoreValue } from "../components/utils.js";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function RadarDetail() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());

  useEffect(() => {
    fetch("/scada_comparison.json").then(r=>r.json()).then(j=>{
      setData(j);
      const names = Object.keys(j.softwares || {});
      setSelected(names[0] || "");
      const feats = new Set();
      names.forEach(n => Object.keys(j.softwares[n]?.features || {}).forEach(f => feats.add(f)));
      setSelectedFeatures(new Set(Array.from(feats).slice(0, 10)));
    });
  }, []);

  const softwareNames = useMemo(()=> data ? Object.keys(data.softwares) : [], [data]);
  const palette = useMemo(()=> {
    const idx = Math.max(0, softwareNames.indexOf(selected));
    return { main: COLORS[idx % COLORS.length], other: "#94a3b8" };
  }, [softwareNames, selected]);

  const chartData = useMemo(() => {
    if (!data || !selected) return [];
    const feats = Array.from(selectedFeatures);
    return feats.map(feat => {
      const entry = { feature: feat };
      const valSel = data.softwares[selected]?.features?.[feat];
      entry[selected] = scoreValue(valSel);
      let sum=0, count=0;
      softwareNames.forEach(n => { if (n===selected) return; const v = data.softwares[n]?.features?.[feat]; if (v!==undefined) { sum += scoreValue(v); count++; } });
      entry["Promedio de otros"] = count? sum/count : 0;
      return entry;
    });
  }, [data, selected, selectedFeatures, softwareNames]);

  if (!data) return <div className="p-6">Cargando…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">SCADA:</label>
            <select value={selected} onChange={(e)=>setSelected(e.target.value)} className="border rounded-xl px-3 py-2">
              {softwareNames.map(n => (<option key={n} value={n}>{n}</option>))}
            </select>
            <label className="text-sm font-medium ml-4">Características:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[220px] overflow-auto pr-1 flex-1">
              {Array.from(new Set(softwareNames.flatMap(n => Object.keys(data.softwares[n]?.features || {})))).sort().map(f => (
                <label key={f} className="flex items-center gap-2 border rounded-xl px-3 py-2">
                  <input type="checkbox" checked={selectedFeatures.has(f)} onChange={()=>{
                    setSelectedFeatures(prev => { const next = new Set(prev); next.has(f)? next.delete(f): next.add(f); return next; });
                  }} />
                  <span className="text-sm">{f}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="card p-4 lg:col-span-7">
            <h3 className="font-medium mb-2">Radar comparativo: {selected} vs promedio</h3>
            <div className="h-[460px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="feature" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0,2]} />
                  <Radar name={selected} dataKey={selected} stroke={palette.main} fill={palette.main} strokeWidth={2} fillOpacity={0.2} />
                  <Radar name="Promedio de otros" dataKey="Promedio de otros" stroke={palette.other} fill={palette.other} strokeDasharray="5 5" fillOpacity={0.12} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-4 lg:col-span-5">
            <h3 className="font-medium mb-2">Ficha: {selected}</h3>
            <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap break-words">{data.softwares[selected]?.description || "(Sin reseña)"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Pros</h4>
                <ul className="text-sm space-y-1">{(data.softwares[selected]?.pros?.length ? data.softwares[selected].pros : ["(No detectados)"]).slice(0,8).map((t,i)=>(<li key={i} className="badge pro">{t}</li>))}</ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Contras</h4>
                <ul className="text-sm space-y-1">{(data.softwares[selected]?.cons?.length ? data.softwares[selected].cons : ["(No detectados)"]).slice(0,8).map((t,i)=>(<li key={i} className="badge con">{t}</li>))}</ul>
              </div>
            </div>
          </div>
        </section>

        <section className="card p-4">
          <h3 className="font-medium mb-2">Detalle de funcionalidades y comentarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(data.softwares[selected]?.features || {}).slice(0,80).map(([k,v]) => (
              <div key={k} className="border rounded-xl p-3">
                <div className="text-sm font-medium mb-1">{k}</div>
                <div className="text-sm whitespace-pre-wrap break-words">{v || "—"}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
