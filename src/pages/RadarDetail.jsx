import React, { useEffect, useMemo, useState } from "react";
import { classForCell, scoreValue } from "../components/utils";

const DATA_URL = "/data/scada_dataset.json";

export default function RadarDetail() {
  const [raw, setRaw] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error("No se pudo leer scada_dataset.json");
        const d = await res.json();
        if (!alive) return;
        setRaw(d);
        // por defecto primera plataforma
        const first = (d.platforms && d.platforms[0]?.name) || null;
        setSelected(first);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const platforms = useMemo(() => raw?.platforms || [], [raw]);
  const platform = useMemo(
    () => platforms.find((p) => p.name === selected) || platforms[0],
    [platforms, selected]
  );
  const features = useMemo(
    () => (raw?.features && Array.isArray(raw.features) ? raw.features : Object.keys(platform?.features || {})),
    [raw, platform]
  );

  if (error) {
    return (
      <div className="p-6 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
        Error cargando datos: {error}
      </div>
    );
  }

  if (!platform) {
    return <div className="p-6">Cargando…</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Detalle por plataforma
        </h1>
        <select
          className="px-3 py-2 rounded-xl border border-slate-300 bg-white"
          value={selected || ""}
          onChange={(e) => setSelected(e.target.value)}
        >
          {platforms.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
        <h2 className="text-lg md:text-xl font-semibold mb-3">{platform.name}</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {features.map((f) => {
            const v = platform.features?.[f];
            const cls = classForCell(v);
            return (
              <div key={f} className={`rounded-xl px-3 py-2 ${cls}`}>
                <div className="text-sm font-medium">{f}</div>
                <div className="text-sm opacity-80">{String(v)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
