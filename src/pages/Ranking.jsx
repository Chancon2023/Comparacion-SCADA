import React, { useEffect, useMemo, useState } from "react";
import { fetchDataset, scoreValue, defaultWeights } from "../components/utils";

export default function Ranking() {
  const [dataset, setDataset] = useState(null);
  const [error, setError] = useState("");
  const [tried, setTried] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [comments, setComments] = useState(() => {
    try { return JSON.parse(localStorage.getItem("scada_comments") || "{}"); }
    catch { return {}; }
  });

  useEffect(() => {
    (async () => {
      const { data, tried } = await fetchDataset();
      setTried(tried);
      if (!data) {
        setError("No se encontró un dataset en /public/data/. Coloca un JSON (p.ej. scada_dataset.json) y vuelve a intentar.");
        return;
      }
      // Normaliza formato: { platforms: [...], weights? }
      const normalized = Array.isArray(data) ? { platforms: data } : data;
      if (!normalized.platforms) {
        setError("El JSON no contiene 'platforms'.");
        return;
      }
      setDataset(normalized);
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem("scada_comments", JSON.stringify(comments));
  }, [comments]);

  const weights = useMemo(() => dataset?.weights ?? defaultWeights(dataset || {}), [dataset]);

  const ranking = useMemo(() => {
    if (!dataset) return [];
    const list = dataset.platforms.map(p => ({
      ...p,
      // merge editable comments (local)
      pros: p.pros || [],
      cautions: p.cautions || [],
      cons: p.cons || [],
    })).map(p => {
      const extra = comments[p.name] || {};
      return {
        ...p,
        pros: [...p.pros, ...(extra.pros || [])],
        cautions: [...p.cautions, ...(extra.cautions || [])],
        cons: [...p.cons, ...(extra.cons || [])],
        score: scoreValue(p.features || {}, weights),
      };
    });
    return list.sort((a,b)=> b.score - a.score);
  }, [dataset, comments, weights]);

  const addComment = (name, type) => {
    const text = prompt(`Nuevo comentario para ${name} (${type})`);
    if (!text) return;
    setComments(prev => {
      const curr = { ...(prev[name] || {}) };
      curr[type] = [...(curr[type] || []), text];
      return { ...prev, [name]: curr };
    });
  };

  const exportMerged = () => {
    if (!dataset) return;
    const merged = {
      ...dataset,
      platforms: dataset.platforms.map(p => {
        const extra = comments[p.name] || {};
        return {
          ...p,
          pros: [...(p.pros||[]), ...(extra.pros||[])],
          cautions: [...(p.cautions||[]), ...(extra.cautions||[])],
          cons: [...(p.cons||[]), ...(extra.cons||[])],
        };
      }),
    };
    const blob = new Blob([JSON.stringify(merged, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "scada_dataset_merged.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="rounded-2xl p-6 bg-rose-50 text-rose-900 border border-rose-200">
          <p className="font-medium">{error}</p>
          <p className="mt-2 text-sm">Rutas probadas: {tried.join(", ") || "(ninguna)"}</p>
          <p className="mt-3 text-sm">
            Sube tu archivo JSON a <code>/public/data/</code> y vuelve a publicar.
          </p>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return <div className="max-w-6xl mx-auto p-6 text-slate-600">Cargando dataset…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">Ranking de plataformas SCADA</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditMode(v => !v)}
            className="rounded-xl px-4 py-2 bg-slate-900 text-white shadow hover:bg-slate-800"
          >
            {editMode ? "Salir de edición" : "Editar comentarios"}
          </button>
          <button
            onClick={exportMerged}
            className="rounded-xl px-4 py-2 bg-white border shadow hover:bg-slate-50"
          >
            Exportar JSON
          </button>
        </div>
      </div>

      <ol className="space-y-4">
        {ranking.map((p, idx) => (
          <li key={p.name} className="rounded-2xl p-5 bg-white shadow border border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-slate-500 text-sm">#{idx+1}</div>
                <h2 className="text-xl font-semibold">{p.name}</h2>
                {p.vendor && <div className="text-slate-500 text-sm">{p.vendor}</div>}
              </div>
              <div className="text-3xl font-bold tabular-nums">{(p.score*100).toFixed(1)}</div>
            </div>

            <div className="mt-4 grid md:grid-cols-3 gap-4">
              <div className="rounded-xl p-4 bg-emerald-50/50 border border-emerald-100">
                <div className="font-medium text-emerald-900 mb-1">Por qué destaca</div>
                <ul className="list-disc pl-5 space-y-1 text-emerald-900">
                  {p.pros?.length ? p.pros.map((t,i)=>(<li key={i}>{t}</li>)) : <li>No registrado</li>}
                </ul>
                {editMode && (
                  <button onClick={()=>addComment(p.name,"pros")} className="mt-2 text-xs text-emerald-800 underline">añadir</button>
                )}
              </div>

              <div className="rounded-xl p-4 bg-amber-50/60 border border-amber-100">
                <div className="font-medium text-amber-900 mb-1">A tener en cuenta</div>
                <ul className="list-disc pl-5 space-y-1 text-amber-900">
                  {p.cautions?.length ? p.cautions.map((t,i)=>(<li key={i}>{t}</li>)) : <li>No registrado</li>}
                </ul>
                {editMode && (
                  <button onClick={()=>addComment(p.name,"cautions")} className="mt-2 text-xs text-amber-800 underline">añadir</button>
                )}
              </div>

              <div className="rounded-xl p-4 bg-rose-50/60 border border-rose-100">
                <div className="font-medium text-rose-900 mb-1">Contras</div>
                <ul className="list-disc pl-5 space-y-1 text-rose-900">
                  {p.cons?.length ? p.cons.map((t,i)=>(<li key={i}>{t}</li>)) : <li>No registrado</li>}
                </ul>
                {editMode && (
                  <button onClick={()=>addComment(p.name,"cons")} className="mt-2 text-xs text-rose-800 underline">añadir</button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}