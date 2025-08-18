
import React, { useEffect, useMemo, useState } from "react";
import { loadDataset, computeScore, downloadJSON, mergeEditableComments } from "../components/utils";
import { Link } from "react-router-dom";

export default function Ranking() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ds = await loadDataset();
        const merged = mergeEditableComments(ds);
        setData(merged);
      } catch (e) {
        setError(e.message || String(e));
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    if (!data) return [];
    const w = data.weights || {};
    return [...(data.platforms || [])].map(p => ({
      ...p, __score: computeScore(p, w)
    })).sort((a, b) => b.__score.final - a.__score.final);
  }, [data]);

  const enterAdmin = () => {
    const code = prompt("Clave de edición (solo para administrador):");
    if (!code) return;
    if (code === "admin123") setAdmin(true);
    else alert("Clave incorrecta.");
  };

  const onEditComments = (pid, text) => {
    const lines = text.split("\n").map(s => s.trim()).filter(Boolean);
    // persist to localStorage for now
    const raw = localStorage.getItem("scada-comments");
    const obj = raw ? JSON.parse(raw) : {};
    obj[pid] = { comments: lines };
    localStorage.setItem("scada-comments", JSON.stringify(obj));
    setData(prev => {
      if (!prev) return prev;
      const clone = JSON.parse(JSON.stringify(prev));
      const p = clone.platforms.find(x => x.id === pid);
      if (p) p.comments = lines;
      return clone;
    });
  };

  const exportDataset = () => {
    if (!data) return;
    downloadJSON("scada_dataset.json", data);
  };

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl p-6">
          <p className="font-medium">
            No se encontró un dataset en <code className="px-1 py-0.5 bg-white rounded">/public/data/</code>.
            Coloca un JSON (p.ej. <code>scada_dataset.json</code>) y vuelve a intentar.
          </p>
          <p className="text-sm mt-2 opacity-80">
            Rutas probadas: <code>/data/scada_dataset.json</code>, <code>/data/scada_dataset_mining_extended.json</code>, <code>/data/dataset.json</code>
          </p>
        </div>
        <div className="mt-6">
          <Link className="inline-block rounded-2xl bg-slate-900 text-white px-4 py-2" to="/">← Volver</Link>
        </div>
      </div>
    );
  }

  if (!data) return <div className="max-w-5xl mx-auto p-6">Cargando ranking…</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Ranking de plataformas SCADA</h1>
        <div className="flex items-center gap-2">
          {!admin ? (
            <button onClick={enterAdmin} className="rounded-2xl px-3 py-2 bg-slate-900 text-white">Modo edición</button>
          ) : (
            <>
              <button onClick={() => setAdmin(false)} className="rounded-2xl px-3 py-2 bg-slate-200">Salir edición</button>
              <button onClick={exportDataset} className="rounded-2xl px-3 py-2 bg-emerald-600 text-white">Exportar JSON</button>
            </>
          )}
          <Link className="rounded-2xl px-3 py-2 bg-slate-100" to="/">← Volver</Link>
        </div>
      </div>

      <ol className="space-y-6">
        {sorted.map((p, idx) => (
          <li key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-5 md:p-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-slate-500 text-sm">#{idx+1}</div>
                <div className="text-lg md:text-xl font-medium">{p.name}</div>
                <div className="text-slate-500 text-sm mt-0.5">{p.vendor}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold">{p.__score.final}</div>
                <div className="text-slate-500 text-xs">base {p.__score.base} − penal {p.__score.penalty}</div>
              </div>
            </div>

            <div className="px-5 md:px-6 pb-5 grid md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="font-medium mb-2">Por qué destaca</div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {(p.pros||[]).map((t,i)=>(<li key={i}>{t}</li>))}
                </ul>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <div className="font-medium mb-2">A tener en cuenta</div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {(p.comments||[]).map((t,i)=>(<li key={i}>{t}</li>))}
                </ul>
                {admin && (
                  <div className="mt-2">
                    <textarea
                      className="w-full border rounded-lg p-2 text-sm"
                      rows={5}
                      defaultValue={(p.comments||[]).join("\n")}
                      onBlur={(e)=>onEditComments(p.id, e.target.value)}
                      placeholder="Una línea por comentario…"
                    />
                    <div className="text-xs text-slate-500 mt-1">Se guarda localmente; usa “Exportar JSON” para subirlo al repo.</div>
                  </div>
                )}
              </div>

              <div className="bg-rose-50 rounded-xl p-4">
                <div className="font-medium mb-2">Contras / flags</div>
                {(!p.red_flags || p.red_flags.length === 0) ? (
                  <div className="text-sm text-slate-500 italic">No detectados</div>
                ) : (
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {p.red_flags.map((rf,i)=>(
                      <li key={i}>
                        <span className={rf.severity === "hard" ? "text-rose-700 font-medium" : "text-amber-700"}>
                          [{rf.severity}]</span> {rf.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
