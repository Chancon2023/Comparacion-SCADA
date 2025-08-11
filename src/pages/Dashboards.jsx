import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { COLORS, prepareData } from "../components/utils.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

function classify(v){
  const s = String(v||"").toLowerCase();
  if (/(amigable|facil|intuitivo|robust|escalab|redundan|segur|cumple|soporta|integrac|flexib|rapido|alto desempeno|no requiere|no es necesario)/.test(s)) return "ok";
  if (/(no soporta|no cumple|no permite|no cuenta|no es compatible|no funciona|licencia(s)? (costosa|cara)|complej|dificil|lento|limitad|inestabl|requiere software externo)/.test(s)) return "no";
  if (/\bmedia\b/.test(s)) return "warn";
  return "info";
}

export default function Dashboards(){
  const [data, setData] = useState(null);
  useEffect(()=>{ fetch("/scada_comparison.json").then(r=>r.json()).then(j=> setData(prepareData(j))); }, []);
  const softwareNames = useMemo(()=> data ? Object.keys(data.softwares) : [], [data]);

  const stacked = useMemo(()=>{
    if (!data) return [];
    return softwareNames.map((n,i)=>{
      const feats = data.softwares[n]?.features || {};
      const counts = {name:n, ok:0, warn:0, no:0, info:0, color:COLORS[i%COLORS.length]};
      Object.values(feats).forEach(v=> counts[classify(v)] += 1);
      return counts;
    });
  }, [data, softwareNames]);

  const coverage = useMemo(()=>{
    if (!data) return [];
    const features = Array.from(new Set(softwareNames.flatMap(n => Object.keys(data.softwares[n]?.features || {}))));
    const rows = features.map(f => {
      let ok=0; softwareNames.forEach(n => { const v = data.softwares[n]?.features?.[f]; if (classify(v)==="ok") ok++; });
      return { feature:f, ok };
    }).sort((a,b)=> b.ok - a.ok).slice(0,15);
    return rows;
  }, [data, softwareNames]);

  if (!data) return <div className="p-6">Cargando…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="card p-4">
          <h2 className="font-semibold mb-2">Distribución de estados por plataforma</h2>
          <p className="text-sm text-slate-600 mb-2">Cuenta cuantas caracteristicas estan en 'ok' (positivas), 'media' y 'no' (negativas), a partir de los comentarios.</p>
          <div className="h-[460px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stacked}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ok" stackId="a" name="Ok" fill="#10B981" />
                <Bar dataKey="warn" stackId="a" name="Media" fill="#F59E0B" />
                <Bar dataKey="no" stackId="a" name="No" fill="#EF4444" />
                <Bar dataKey="info" stackId="a" name="Otros" fill="#94A3B8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-semibold mb-2">Cobertura por característica (Top 15)</h2>
          <p className="text-sm text-slate-600 mb-2">Numero de plataformas que cumplen cada caracteristica (clasificacion positiva).</p>
          <div className="h-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coverage} layout="vertical" margin={{left: 120}}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="feature" width={300} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ok" name="# plataformas con positivo" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
}
