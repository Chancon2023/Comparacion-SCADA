import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { classForCell, prepareData, loadDataset, saveLocalComment } from "../components/utils";

export default function Ranking() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await loadDataset();
        const normalized = prepareData(data);
        setRows(normalized);
      } catch (e) {
        setError(e.message || "No se pudo cargar el dataset.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <div className="text-lg">Cargando ranking…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <div className="font-semibold mb-2">No se encontró un dataset en /public/data/.</div>
          <div className="text-sm opacity-90">
            Coloca un JSON (p.ej. <code>scada_dataset.json</code>) y vuelve a intentar.
            <br />
            Rutas probadas: <code>/data/scada_dataset.json</code>, <code>/data/scada_dataset_mining_extended.json</code>, <code>/data/dataset.json</code>.
            <br />
            Sube tu archivo JSON a <code>public/data/</code> y vuelve a publicar.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-semibold">Ranking de plataformas SCADA</h1>
        <Link to="/" className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800">← Volver</Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rows.map((p, idx) => (
          <div key={p.uid} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">#{idx + 1} — {p.name}</div>
                <div className="text-slate-500 text-sm">{p.vendor}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${classForCell(p.score)}`}>
                {p.score}
              </div>
            </div>

            {/* Scores */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(p.category_scores || {}).map(([k, v]) => (
                <div key={k} className={`px-2 py-1 rounded-lg text-sm ${classForCell(v)}`}>
                  <div className="font-medium">{k}</div>
                  <div>{v}%</div>
                </div>
              ))}
            </div>

            {/* Pros / Cons / Alerts */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="font-medium text-emerald-800 mb-1">Pros</div>
                <ul className="list-disc pl-5 space-y-1 text-emerald-900">
                  {(p.pros || []).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="font-medium text-amber-800 mb-1">A tener en cuenta</div>
                <ul className="list-disc pl-5 space-y-1 text-amber-900">
                  {(p.cautions || []).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <div className="font-medium text-rose-800 mb-1">Contras / Alertas duras</div>
                <ul className="list-disc pl-5 space-y-1 text-rose-900">
                  {(p.cons || []).map((t, i) => <li key={i}>{t}</li>)}
                  {(p.alerts || []).map((t, i) => <li key={"a"+i}><strong>ALERTA:</strong> {t}</li>)}
                </ul>
              </div>
            </div>

            {/* Comentarios (editables locales) */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Comentarios (solo para ti, guardados en este navegador)
              </label>
              <textarea
                defaultValue={p.userComment || ""}
                onBlur={(e) => saveLocalComment(p.uid, e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                rows={3}
                placeholder="Escribe observaciones de pruebas, contactos, hallazgos…"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
