import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const scoreValue = (v) => {
  if (!v) return 0;
  const s = String(v).toLowerCase();
  if (/[\u2714\u2705\ud83d\udc4d]/.test(s) || /(alta|yes|sí)/.test(s)) return 2;
  if (/[\u26a0]/.test(s) || /media/.test(s)) return 1;
  if (/[\u2716\u274c\u26d4]/.test(s) || /\bno\b/.test(s)) return 0;
  return 1;
};

function classForCell(v) {
  const s = String(v || "");
  if (/[\u2714\u2705\ud83d\udc4d]/.test(s) || /(Alta|Yes|Sí)/i.test(s)) return "bg-green-100 text-green-900";
  if (/[\u26a0]/.test(s) || /Media/i.test(s)) return "bg-yellow-100 text-yellow-900";
  if (/[\u2716\u274c\u26d4]/.test(s) || /\bNo\b/.test(s)) return "bg-red-100 text-red-900";
  return "bg-slate-100 text-slate-900";
}

export default function App() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
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
        const first = Array.from(feats).slice(0, Math.min(8, feats.size));
        setSelectedFeatures(new Set(first));
      });
  }, []);

  const softwareNames = useMemo(() => data ? Object.keys(data.softwares) : [], [data]);
  const allFeatures = useMemo(() => {
    if (!data) return [];
    const set = new Set();
    for (const s of softwareNames) Object.keys(data.softwares[s]?.features || {}).forEach((k)=>set.add(k));
    return Array.from(set).sort();
  }, [data, softwareNames]);

  const filteredSofts = softwareNames.filter((n) => n.toLowerCase().includes(query.toLowerCase()));

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
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">SCADA Comparison Dashboard</h1>
            <p className="text-sm text-slate-600">Comparador interactivo: reseñas, pros/contras y dashboards por ítem.</p>
          </div>
          <div className="flex items-center gap-2">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar plataforma…" className="border rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
            <a href="/scada_comparison.json" className="text-sm underline">Descargar datos</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
          <motion.div className="card p-4" initial={{opacity:0, y:10}} animate={{opacity:1,y:0}}>
            <h2 className="font-semibold mb-2">Plataformas</h2>
            <div className="flex flex-wrap gap-2">
              {filteredSofts.map((n)=> (
                <button key={n} className={`btn ${selectedSofts.has(n) ? "active" : ""}`} onClick={()=>{
                  setSelectedSofts(prev=>{
                    const next = new Set(prev);
                    next.has(n) ? next.delete(n) : next.add(n);
                    return next;
                  });
                }}>{n}</button>
              ))}
            </div>
          </motion.div>

          <motion.div className="card p-4" initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} transition={{delay:.05}}>
            <h2 className="font-semibold mb-2">Características</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-auto pr-1">
              {allFeatures.map((f)=> (
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
          </motion.div>
        </aside>

        <section className="lg:col-span-8 xl:col-span-9 space-y-6">
          <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            initial="hidden" animate="show"
            variants={{ hidden:{opacity:0}, show:{opacity:1, transition:{staggerChildren:.04}} }}>
            {softwareNames.filter(n=>selectedSofts.has(n)).map((n)=>(
              <motion.article key={n} className="card p-4" variants={{hidden:{opacity:0,y:8},show:{opacity:1,y:0}}}>
                <h3 className="font-semibold text-lg mb-1">{n}</h3>
                <p className="text-sm text-slate-700 mb-3">{data.softwares[n]?.description || "(Sin reseña)"} </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Pros</h4>
                    <ul className="text-sm space-y-1">
                      {(data.softwares[n]?.pros?.length ? data.softwares[n].pros : ["(No detectados)"]).slice(0,6).map((p,i)=>(<li key={i} className="badge pro">{p}</li>))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Contras</h4>
                    <ul className="text-sm space-y-1">
                      {(data.softwares[n]?.cons?.length ? data.softwares[n].cons : ["(No detectados)"]).slice(0,6).map((c,i)=>(<li key={i} className="badge con">{c}</li>))}
                    </ul>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>

          <motion.div className="card p-4" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
            <h2 className="font-semibold mb-3">Matriz comparativa</h2>
            <div className="overflow-auto rounded-xl border">
              <table>
                <thead>
                  <tr>
                    <th className="w-[28rem]">Ítem</th>
                    {softwareNames.filter(n=>selectedSofts.has(n)).map((n)=>(<th key={n}>{n}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(selectedFeatures).map((feat)=>(
                    <tr key={feat}>
                      <td className="font-medium">{feat}</td>
                      {softwareNames.filter(n=>selectedSofts.has(n)).map((n)=>{
                        const v = data.softwares[n]?.features?.[feat];
                        return <td key={n+feat}><span className={`badge ${classForCell(v)}`}>{v || "—"}</span></td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
            <div className="card p-4">
              <h3 className="font-medium mb-2">Radar: puntuación aproximada</h3>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="feature" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0,2]} />
                    {softwareNames.filter((n)=>selectedSofts.has(n)).map((n)=>(
                      <Radar key={n} name={n} dataKey={n} strokeWidth={1.5} fillOpacity={0.2} />
                    ))}
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-4">
              <h3 className="font-medium mb-2">Barras: promedio por plataforma</h3>
              <div className="h-[380px]">
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
                    <Bar dataKey="avg" name="Promedio (0–2)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
      <footer className="max-w-7xl mx-auto px-4 pb-10 text-xs text-slate-500">
        Hecho con amor desde tus planillas. Ideal para publicar en Netlify / Vercel.
      </footer>
    </div>
  );
}
