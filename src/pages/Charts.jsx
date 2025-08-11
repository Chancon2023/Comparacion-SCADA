import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell } from "recharts";

const COLORS = [
  "#2563EB","#16A34A","#F59E0B","#DB2777","#0EA5E9","#10B981",
  "#8B5CF6","#EF4444","#F97316","#22D3EE","#84CC16","#A855F7"
];

const scoreValue = (v) => {
  if (!v) return 0;
  const s = String(v).toLowerCase();
  if (/([\u2714\u2705\ud83d\udc4d]|\b(alta|yes|sí)\b)/.test(s)) return 2;
  if (/([\u26a0]|\bmedia\b)/.test(s)) return 1;
  if (/([\u2716\u274c\u26d4]|\bno\b)/.test(s)) return 0;
  return 1;
};

export default function Charts() {
  const [data, setData] = useState(null);
  const [selectedSofts, setSelectedSofts] = useState(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());

  useEffect(() => {
    fetch("/scada_comparison.json")
      .then((r) => r.json())
      .then((j) => {
        setData(j);
        const names = Object.keys(j.softwares || {});
        setSelectedSofts(new Set(names));
        const feats = new Set();
        names.forEach((n) => Object.keys(j.softwares[n]?.features || {}).forEach((f) => feats.add(f)));
        const first = Array.from(feats).slice(0, Math.min(6, feats.size));
        setSelectedFeatures(new Set(first));
      });
  }, []);

  const softwareNames = useMemo(()=> data ? Object.keys(data.softwares) : [], [data]);
  const palette = useMemo(()=> {
    const map = {};
    softwareNames.forEach((n,i)=> map[n] = COLORS[i % COLORS.length]);
    return map;
  }, [softwareNames]);

  const chartData = useMemo(() => {
    if (!data) return [];
    const feats = Array.from(selectedFeatures);
    return feats.map((feat) => {
      const entry = { feature: feat };
      for (const s of softwareNames) {
        if (!selectedSofts.has(s)) continue;
        const val = data.softwares[s]?.features?.[feat];
        entry[s] = scoreValue(val);
      }
      return entry;
    });
  }, [data, selectedFeatures, selectedSofts, softwareNames]);

  if (!data) return <div className="p-6">Cargando…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Gráficos — SCADA Comparación Dashboard</h1>
            <p className="text-sm text-slate-600">Selecciona plataformas y características para visualizar.</p>
          </div>
          <Link to="/" className="btn">← Volver</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="card p-4 lg:col-span-5">
            <h2 className="font-semibold mb-2">Plataformas</h2>
            <div className="flex flex-wrap gap-2">
              {softwareNames.map((n)=> (
                <button key={n} className={`btn ${selectedSofts.has(n) ? "active" : ""}`} onClick={()=>{
                  setSelectedSofts(prev=>{
                    const next = new Set(prev);
                    next.has(n) ? next.delete(n) : next.add(n);
                    return next;
                  });
                }} style={{borderColor: palette[n], color: selectedSofts.has(n)? "#fff" : palette[n], backgroundColor: selectedSofts.has(n)? palette[n] : "white"}}>{n}</button>
              ))}
            </div>
          </div>
          <div className="card p-4 lg:col-span-7">
            <h2 className="font-semibold mb-2">Características</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-auto pr-1">
              {Array.from(new Set(softwareNames.flatMap(n => Object.keys(data.softwares[n]?.features || {})))).sort().map((f)=> (
                <label key={f} className="flex items-center gap-2 border rounded-xl px-3 py-2">
                  <input type="checkbox" checked={selectedFeatures.has(f)} onChange={()=>{
                    setSelectedFeatures(prev=>{
                      const next = new Set(prev);
                      next.has(f) ? next.delete(f) : next.add(f);
                      return next;
                    });
                  }} />
                  <span className="text-sm">{f}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-4">
            <h3 className="font-medium mb-2">Radar: puntuación aproximada</h3>
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="feature" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0,2]} />
                  {softwareNames.filter((n)=>selectedSofts.has(n)).map((n)=> (
                    <Radar key={n} name={n} dataKey={n} stroke={palette[n]} fill={palette[n]} strokeWidth={2} fillOpacity={0.2} />
                  ))}
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="font-medium mb-2">Barras: promedio por plataforma</h3>
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={softwareNames.filter((n)=>selectedSofts.has(n)).map((n)=>{
                  const feats = Array.from(selectedFeatures);
                  const vals = feats.map((f)=>scoreValue(data.softwares[n]?.features?.[f]));
                  const avg = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
                  return { name:n, avg: Number(avg.toFixed(2)) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis domain={[0,2]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg" name="Promedio (0–2)">
                    {softwareNames.filter((n)=>selectedSofts.has(n)).map((n,i)=> (
                      <Cell key={n} fill={palette[n]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
