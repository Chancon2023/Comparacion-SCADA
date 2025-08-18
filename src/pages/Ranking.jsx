import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Ranking.jsx (Supabase-free, robust loader)
 * - Carga el dataset desde /data/ por fetch (varias rutas candidatas).
 * - Tolera cambios de forma (array u objeto) y valores diferentes.
 * - Evita errores de 'reading length' con defaults seguros.
 * - Muestra botón Volver y estado de carga/errores.
 *
 * Coloca tu JSON en /public/data/ (Netlify sirve /data/...)
 * Ej: public/data/scada_dataset.json
 */

const CANDIDATE_PATHS = [
  "/data/scada_dataset.json",
  "/data/scada_dataset_mining_extended.json",
  "/data/dataset.json",
];

function valToScore(v) {
  if (v == null) return 0.5;
  const s = String(v).toLowerCase();

  const good = ["ok", "si", "sí", "true", "✓", "✔", "✅", "alta", "soportado", "compatible"];
  const mid = ["medio", "parcial", "depende", "limitado", "regular"];
  const bad = ["no", "false", "x", "❌", "falla", "no soportado", "n/a"];

  if (good.some((k) => s.includes(k))) return 1;
  if (bad.some((k) => s.includes(k))) return 0;
  if (mid.some((k) => s.includes(k))) return 0.5;
  // por defecto, punto medio
  return 0.5;
}

function computeScoreFromFeatures(features) {
  // features puede ser obj, array o undefined
  if (!features) return { score: 0, count: 0 };
  let values = [];

  if (Array.isArray(features)) {
    values = features;
  } else if (typeof features === "object") {
    values = Object.values(features);
  }

  let total = 0;
  let count = 0;
  for (const v of values) {
    total += valToScore(v);
    count += 1;
  }
  return { score: count > 0 ? total / count : 0, count };
}

function normalizePlatforms(raw) {
  // admite varios formatos: {platforms: [...]}, {plataformas: [...]}, o un dict {name: {...}}
  if (!raw) return [];
  if (Array.isArray(raw.platforms)) return raw.platforms;
  if (Array.isArray(raw.plataformas)) return raw.plataformas;

  if (Array.isArray(raw)) return raw;

  if (typeof raw === "object") {
    // dict -> array de { name, ...data }
    const entries = Object.entries(raw);
    // intenta detectar si hay una clave plataformas adentro
    if (entries.length && entries.every(([k, v]) => typeof v === "object")) {
      return entries.map(([name, info]) => ({ name, ...(info || {}) }));
    }
  }
  return [];
}

export default function Ranking() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      for (const path of CANDIDATE_PATHS) {
        try {
          const res = await fetch(path, { cache: "no-store" });
          if (!res.ok) continue;
          const json = await res.json();
          if (!cancelled) {
            setData(json);
            setLoading(false);
          }
          return;
        } catch (e) {
          // intenta siguiente
        }
      }
      // si llega aquí, no se encontró dataset
      if (!cancelled) {
        setError(
          "No se encontró un dataset en /public/data/. Coloca un JSON (p.ej. scada_dataset.json) y vuelve a intentar."
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => {
    const platforms = normalizePlatforms(data?.platforms || data?.plataformas || data);
    if (!platforms || platforms.length === 0) return [];

    const scored = platforms.map((p) => {
      // intenta usar p.features; si no existe, usa el propio objeto p
      const feat = p.features || p.caracteristicas || p;
      const { score, count } = computeScoreFromFeatures(feat);
      return {
        name: p.name || p.titulo || p.plataforma || "Sin nombre",
        score,
        count,
        raw: p,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored;
  }, [data]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Ranking de plataformas SCADA</h1>
        <Link
          to="/"
          className="px-4 py-2 rounded-xl bg-slate-900 text-white shadow hover:bg-slate-800"
        >
          ← Volver
        </Link>
      </div>

      {loading && (
        <div className="p-4 rounded-xl bg-slate-50 border text-slate-700">
          Cargando dataset desde <code>/data/</code>...
        </div>
      )}

      {!loading && error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
          {error}
          <div className="mt-2 text-sm text-rose-700">
            Rutas probadas: {CANDIDATE_PATHS.join(", ")}
          </div>
          <div className="mt-2 text-sm">
            Sube tu archivo JSON a <code>public/data/</code> y vuelve a publicar.
          </div>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          No hay plataformas para mostrar en el ranking. Revisa la forma del JSON de datos.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-4">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="rounded-2xl border bg-white shadow-sm p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-medium text-lg">{it.name}</div>
                  <div className="text-sm text-slate-600">
                    {it.count} características consideradas
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold">{Math.round(it.score * 100)}</div>
                <div className="text-xs text-slate-500">puntaje (0–100)</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
