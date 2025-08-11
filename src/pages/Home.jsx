import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function classForCell(v) {
  const s = String(v || "");
  if (/([\u2714\u2705\ud83d\udc4d]|\b(Alta|Yes|Sí)\b)/i.test(s)) return "bg-green-100 text-green-900";
  if (/([\u26a0]|\bMedia\b)/i.test(s)) return "bg-yellow-100 text-yellow-900";
  if (/([\u2716\u274c\u26d4]|\bNo\b)/.test(s)) return "bg-red-100 text-red-900";
  return "bg-slate-100 text-slate-900";
}

export default function Home() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedSofts, setSelectedSofts] = useState(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    fetch("/scada_comparison.json")
      .then((r) => r.json())
      .then((j) => {
        setData(j);
        const names = Object.keys(j.softwares || {});
        setSelectedSofts(new Set(names));
        setActiveTab(names[0] || "");
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

  if (!data) return <div className="p-6">Cargando…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">SCADA Comparación Dashboard</h1>
            <p className="text-sm text-slate-600">Comparador interactivo: reseñas, pros/contras y dashboards por ítem.</p>
          </div>
          <div className="flex items-center gap-2">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar plataforma…" className="border rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
            <Link to="/graficos" className="btn primary">Ver gráficos</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs por software */}
        <section className="card p-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {softwareNames.map((n)=> (
              <button key={n} className={`btn ${activeTab===n? "active":""}`} onClick={()=>setActiveTab(n)}>{n}</button>
            ))}
          </div>
          {activeTab && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-4">
                <h3 className="font-semibold">{activeTab} — Reseña</h3>
                <p className="text-sm text-slate-700 mt-1">{data.softwares[activeTab]?.description || "(Sin reseña)"}</p>
              </div>
              <div className="card p-4 grid grid-cols-2 gap-3">
                <div>
                  <h4 className="font-medium text-sm mb-1">Pros</h4>
                  <ul className="text-sm space-y-1">
                    {(data.softwares[activeTab]?.pros?.length ? data.softwares[activeTab].pros : ["(No detectados)"]).slice(0,6).map((p,i)=>(<li key={i} className="badge pro">{p}</li>))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Contras</h4>
                  <ul className="text-sm space-y-1">
                    {(data.softwares[activeTab]?.cons?.length ? data.softwares[activeTab].cons : ["(No detectados)"]).slice(0,6).map((c,i)=>(<li key={i} className="badge con">{c}</li>))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Selección plataformas y características */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="card p-4 lg:col-span-4">
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
          </div>

          <div className="card p-4 lg:col-span-8">
            <h2 className="font-semibold mb-2">Características</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[360px] overflow-auto pr-1">
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
          </div>
        </section>

        {/* Matriz comparativa */}
        <section className="card p-4">
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
                      return <td key={n+feat}><div className={`badge ${classForCell(v)} cell-wrap`}>{v || "—"}</div></td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <footer className="max-w-7xl mx-auto px-4 pb-10 text-xs text-slate-500">
        Hecho con amor desde tus planillas. Ideal para publicar en Netlify / Vercel.
      </footer>
    </div>
  );
}
