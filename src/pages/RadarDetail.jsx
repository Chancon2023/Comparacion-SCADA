import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { COLORS, scoreValue, prepareData, extractFindings, computeRadarRow } from "../components/utils.js";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function RadarDetail() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());
  const [showAvg, setShowAvg] = useState(true);
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [showSource, setShowSource] = useState(null);

  useEffect(() => {
    fetch("/scada_comparison.json").then(r=>r.json()).then(j=>{
      j = prepareData(j);
      setData(j);
      const names = Object.keys(j.softwares || {});
      setSelected(names.slice(0, 2));
      const feats = new Set();
      names.forEach(n => Object.keys(j.softwares[n]?.features || {}).forEach(f => feats.add(f)));
      setSelectedFeatures(new Set(Array.from(feats).slice(0, 10)));
    });
  }, []);

  const softwareNames = useMemo(()=> data ? Object.keys(data.softwares) : [], [data]);
  const palette = useMemo(()=> { const map = {}; softwareNames.forEach((n,i)=> map[n] = COLORS[i % COLORS.length]); return map; }, [softwareNames]);

    const chartData = useMemo(() => {
    if (!data) return [];
    const feats = Array.from(selectedFeatures);
    const rows = [];
    feats.forEach(feat => {
      const row = computeRadarRow(selected, feat, data, showAvg, undefined, onlyCritical);
      if (row) rows.push(row);
    });
    return rows;
  }, [data, selected, selectedFeatures, showAvg, onlyCritical]);
    return feats.map(feat => {
      const entry = { feature: feat };
      selected.forEach(n => {
        const val = data.softwares[n]?.features?.[feat];
        entry[n] = scoreValue(val);
      });
      if (showAvg) {
        let sum=0, count=0;
        softwareNames.forEach(n => { if (selected.includes(n)) return; const v = data.softwares[n]?.features?.[feat]; if (v!==undefined) { sum += scoreValue(v); count++; } });
        entry["Promedio otros"] = count? sum/count : 0;
      }
      return entry;
    });
  }, [data, selected, selectedFeatures, showAvg, softwareNames]);

  if (!data) return <div className="p-6">Cargando…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">Selecciona hasta 3 SCADA:</label>
            <div className="flex flex-wrap gap-2">
              {softwareNames.map(n => {
                const active = selected.includes(n);
                const disabled = !active && selected.length >= 3;
                return (
                  <button key={n}
                    className={`btn ${active? "active": ""}`}
                    onClick={()=>{
                      setSelected(prev => {
                        const has = prev.includes(n);
                        if (has) return prev.filter(x=>x!==n);
                        if (prev.length >= 3) return prev;
                        return [...prev, n];
                      });
                    }}
                    style={{ borderColor: palette[n], color: active? "#fff" : palette[n], backgroundColor: active? palette[n] : "white", opacity: disabled? 0.5 : 1 }}
                    disabled={disabled}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <label className="ml-4 text-sm"><input type="checkbox" checked={showAvg} onChange={(e)=>setShowAvg(e.target.checked)} /> Mostrar promedio de otros</label>
            <label className="ml-4 text-sm"><input type="checkbox" checked={onlyCritical} onChange={(e)=>setOnlyCritical(e.target.checked)} /> Solo ítems críticos (Seguridad / Redundancia / Integración)</label>
          </div>

          <div className="mt-3">
            <label className="text-sm font-medium">Características:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[220px] overflow-auto pr-1">
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

        <section className="card p-4">
          <h3 className="font-medium mb-2">Radar comparativo</h3>
          <div className="h-[480px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="feature" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0,2]} />
                {selected.map(n => (
                  <Radar key={n} name={n} dataKey={n} stroke={palette[n]} fill={palette[n]} strokeWidth={2} fillOpacity={0.18} />
                ))}
                {showAvg && <Radar name="Promedio otros" dataKey="Promedio otros" stroke="#94a3b8" fill="#94a3b8" strokeDasharray="5 5" fillOpacity={0.10} />}
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selected.map(n => {
            const s = data.softwares[n] || {};
            const pc = extractFindings(s.features || {});
            return (
              <div key={n} className="card p-4">
                <h3 className="font-medium mb-1">Ficha: {n}</h3>
                <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap break-words">{s.description || "(Sin reseña)"}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Pros</h4>
                    <ul className="text-sm space-y-1">{(pc.pros.length? pc.pros : ["(No detectados)"]).slice(0,8).map((t,i)=>(<li key={i} className="badge pro flex items-center gap-2">{t}<button className="underline text-xs" onClick={()=>setShowSource(t)}>ver origen</button></li>))}</ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">A tener en cuenta</h4>
                    <ul className="text-sm space-y-1">{(pc.cautions.length? pc.cautions : ["(No detectados)"]).slice(0,8).map((t,i)=>(<li key={i} className="badge con">{t}</li>))}</ul>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      
      {showSource && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={()=>setShowSource(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-2xl w-full" onClick={(e)=>e.stopPropagation()}>
            <h4 className="font-semibold mb-2">Origen (texto del Excel)</h4>
            <pre className="whitespace-pre-wrap break-words text-sm bg-slate-50 p-3 rounded-lg border">{showSource}</pre>
            <div className="text-right mt-3">
              <button className="btn" onClick={()=>setShowSource(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
</main>
    </div>
  );
}
