import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { prepareData, computeRanking } from "../components/utils.js";

export default function Ranking(){
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(()=>{
    fetch("/scada_comparison.json").then(r=>r.json()).then(j=>{
      j = prepareData(j);
      setData(j);
      setRows(computeRanking(j));
    });
  }, []);

  if (!data) return <div className="p-6">Cargando…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="card p-4">
          <h2 className="font-semibold mb-2">Ranking de plataformas SCADA</h2>
          <p className="text-sm text-slate-600 mb-3">Ranking como promedio normalizado (0..100) de todas las caracteristicas. Razones extraidas de los comentarios.</p>
          <ol className="space-y-4">
            {rows.map((r,idx)=>(
              <li key={r.name} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500">#{idx+1}</div>
                    <div className="text-lg font-semibold">{r.name}</div>
                  </div>
                  <div className="text-2xl font-bold">{r.score}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Por que destaca</h4>
                    <ul className="text-sm space-y-1">{(r.pros.length ? r.pros : ["(No detectados)"]).slice(0,4).map((t,i)=>(<li key={i} className="badge pro">{t}</li>))}</ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">A tener en cuenta</h4>
                    <ul className="text-sm space-y-1">{(r.cautions.length ? r.cautions : ["(No detectados)"]).slice(0,4).map((t,i)=>(<li key={i} className="badge warn">{t}</li>))}</ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Contras</h4>
                    <ul className="text-sm space-y-1">{(r.cons.length ? r.cons : ["(No detectados)"]).slice(0,4).map((t,i)=>(<li key={i} className="badge con">{t}</li>))}</ul>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
