
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const CRITICAL = ["ciberseguridad","redundancia","protocolos","compatibilidad_hardware"];
const PTS = { ok: 10, partial: 5, no: 0 };

function computeScore(platform, metaScoring) {
  // Base score from features
  const feats = platform.features || {};
  const featurePoints = CRITICAL.reduce((acc, key) => {
    const st = (feats[key] || "no").toLowerCase();
    return acc + (PTS[st] ?? 0);
  }, 0);
  const maxFeature = CRITICAL.length * PTS.ok; // 40
  // Normalize to 70% of total
  let score = Math.round((featurePoints / maxFeature) * 70);

  // Red flag penalties
  const penalties = (platform.red_flags || []).reduce((acc, rf) => {
    const lvl = (rf.level || "soft").toLowerCase();
    return acc + (lvl === "hard" ? 20 : 10);
  }, 0);

  score = Math.max(0, Math.min(100, score + 30 - penalties)); // 30 granularity for extras - penalties
  return score;
}

export default function Ranking() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const tryPaths = [
      "/data/scada_dataset.json",
      "/data/scada_dataset_mining_extended.json",
      "/data/dataset.json"
    ];

    (async () => {
      let loaded = null;
      for (const p of tryPaths) {
        try {
          const res = await fetch(p, { cache: "no-store" });
          if (res.ok) {
            loaded = await res.json();
            break;
          }
        } catch (e) {
          // continue
        }
      }
      if (!loaded) {
        setError("No se encontró un dataset en /public/data/. Coloca un JSON (p.ej. scada_dataset.json) y vuelve a intentar.");
      } else {
        setData(loaded);
      }
    })();
  }, []);

  const rows = useMemo(() => {
    if (!data?.platforms) return [];
    const meta = data.meta?.scoring || {};
    return data.platforms
      .map(p => ({
        ...p,
        score: computeScore(p, meta)
      }))
      .sort((a,b) => b.score - a.score);
  }, [data]);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl md:text-3xl font-semibold">Ranking de plataformas SCADA</h1>
          <button onClick={() => history.back()} className="px-3 py-2 rounded-xl bg-slate-900 text-white">← Volver</button>
        </div>
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800">
          <p>{error}</p>
          <p className="mt-2 text-sm opacity-80">
            Rutas probadas: /data/scada_dataset.json, /data/scada_dataset_mining_extended.json, /data/dataset.json
          </p>
          <p className="mt-2 text-sm opacity-80">
            Sube tu archivo JSON a <code className="font-mono">public/data/</code> y vuelve a publicar.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse text-slate-500">Cargando ranking…</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Ranking de plataformas SCADA</h1>
        <Link to="/" className="px-3 py-2 rounded-xl bg-slate-900 text-white">← Volver</Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rows.map((p, idx) => (
          <div key={p.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-slate-500">#{idx+1}</div>
                <h2 className="text-lg md:text-xl font-semibold">{p.name}</h2>
                <div className="text-sm text-slate-500">{p.vendor} — {p.category}</div>
              </div>
              <div className="text-3xl font-bold tabular-nums">{p.score}</div>
            </div>

            {/* Pros (features OK) */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                <div className="font-medium text-emerald-800 mb-1">Por qué destaca</div>
                <ul className="text-sm text-emerald-900 list-disc pl-4 space-y-1">
                  {(p.comments || []).map((c, i) => <li key={i}>{c}</li>)}
                  {CRITICAL.map(key => {
                    const st = p.features?.[key] || "no";
                    if (st === "ok") {
                      const tag = key.replace("_"," ");
                      return <li key={key}>✅ {tag[0].toUpperCase()+tag.slice(1)}</li>
                    }
                    return null;
                  })}
                </ul>
              </div>

              {/* Yellow box - to consider */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <div className="font-medium text-amber-800 mb-1">A tener en cuenta</div>
                <ul className="text-sm text-amber-900 list-disc pl-4 space-y-1">
                  {CRITICAL.map(key => {
                    const st = p.features?.[key] || "no";
                    if (st === "partial") {
                      const tag = key.replace("_"," ");
                      return <li key={key}>⚠️ {tag[0].toUpperCase()+tag.slice(1)} — cobertura parcial</li>
                    }
                    return null;
                  })}
                </ul>
              </div>

              {/* Red flags */}
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3">
                <div className="font-medium text-rose-800 mb-1">Contras / alertas</div>
                <ul className="text-sm text-rose-900 list-disc pl-4 space-y-1">
                  {(p.red_flags || []).length === 0 ? (
                    <li>No detectados</li>
                  ) : (
                    (p.red_flags || []).map((r, i) => (
                      <li key={i}>
                        {r.level === "hard" ? "⛔" : "🚩"} {r.text}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
