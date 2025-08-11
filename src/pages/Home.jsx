import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { prepareData, extractFindings } from "../components/utils.js";

export default function Home() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [show, setShow] = useState(null);

  useEffect(()=>{
    fetch("/scada_comparison.json").then(r=>r.json()).then(j=> setData(prepareData(j)));
  },[]);

  const names = useMemo(()=> data ? Object.keys(data.softwares) : [], [data]);
  const filtered = useMemo(()=> names.filter(n => n.toLowerCase().includes(q.toLowerCase())), [names, q]);

  if (!data) return <div className="p-6">Cargando…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Navbar />
      <main className="container px-4 py-6 space-y-6">
        <section className="card p-4">
          <h2 className="section-title mb-1">Resumen</h2>
          <p className="text-sm text-slate-600">Comparador interactivo basado en tus planillas. Explora plataformas, mira pros/contras con origen y navega a los dashboards/rádar.</p>
        </section>

        <section className="card p-4">
          <div className="flex items-center gap-3">
            <h3 className="section-title">Plataformas</h3>
            <div className="ml-auto flex items-center gap-2">
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar…" className="border rounded-xl px-3 py-2 text-sm w-56" />
              <a href="/charts" className="btn">Ver gráficos</a>
            </div>
          </div>

          <div className="grid-cards mt-3">
            {filtered.map(n => {
              const s = data.softwares[n];
              const pc = extractFindings(s.features || {});
              return (
                <div key={n} className="col-4">
                  <div className="border rounded-2xl p-4 bg-white h-full flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold flex-1">{n}</h4>
                      <span className="tag">{(pc.pros.length||0)} pro</span>
                      <span className="tag">{(pc.cautions.length||0)} aten.</span>
                      <span className="tag">{(pc.cons.length||0)} contra</span>
                    </div>
                    <ul className="list-disc pl-5 list-compact text-sm space-y-1">
                      {pc.pros.slice(0,2).map((t,i)=>(<li key={i} className="clamp-2">{t}</li>))}
                      {pc.cautions.slice(0,1).map((t,i)=>(<li key={"w"+i} className="clamp-2 text-amber-700">{t}</li>))}
                    </ul>
                    <div className="mt-auto flex items-center gap-2">
                      <button className="btn" onClick={()=>setShow({name:n, pc, desc:s.description||"(Sin reseña)"})}>Ver detalles</button>
                      <a className="btn" href="/radar">Abrir radar</a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={()=>setShow(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-3xl w-full" onClick={e=>e.stopPropagation()}>
            <h4 className="font-semibold mb-1">{show.name}</h4>
            <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap">{show.desc}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><h5 className="font-medium text-sm mb-1">Pros</h5><ul className="space-y-1 text-sm maxh-280 scroll-y">{(show.pc.pros.length?show.pc.pros:["(No detectados)"]).map((t,i)=>(<li key={i} className="badge pro">{t}</li>))}</ul></div>
              <div><h5 className="font-medium text-sm mb-1">A tener en cuenta</h5><ul className="space-y-1 text-sm maxh-280 scroll-y">{(show.pc.cautions.length?show.pc.cautions:["(No detectados)"]).map((t,i)=>(<li key={i} className="badge warn">{t}</li>))}</ul></div>
              <div><h5 className="font-medium text-sm mb-1">Contras</h5><ul className="space-y-1 text-sm maxh-280 scroll-y">{(show.pc.cons.length?show.pc.cons:["(No detectados)"]).map((t,i)=>(<li key={i} className="badge con">{t}</li>))}</ul></div>
            </div>
            <div className="text-right mt-3"><button className="btn" onClick={()=>setShow(null)}>Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
