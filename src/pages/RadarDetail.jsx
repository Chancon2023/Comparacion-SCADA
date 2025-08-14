import React, { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../lib/supabase";

// Carga segura del dataset desde /public
async function loadDataset() {
  const candidates = ["/scada_dataset.json", "/data/scada_dataset.json"];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (res.ok) return await res.json();
    } catch {}
  }
  throw new Error("No se pudo cargar el dataset JSON (colócalo en /public como scada_dataset.json).");
}

export default function RadarDetail() {
  const [data, setData] = useState(null);
  const [weights, setWeights] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const ds = await loadDataset();
        setData(ds);
      } catch (e) {
        setError(e.message || String(e));
      }
      try {
        const supabase = await getSupabase();
        if (supabase) {
          const { data: wdata } = await supabase.from("weights").select("key,value");
          if (wdata) {
            const obj = {};
            for (const row of wdata) obj[row.key] = Number(row.value);
            setWeights(obj);
            try { localStorage.setItem("weights_live", JSON.stringify(obj)); } catch {}
          }
        }
      } catch (e) {
        console.warn("[Radar] Supabase opcional:", e);
      }
    })();
  }, []);

  const info = useMemo(() => {
    if (!data) return null;
    // No alteramos tu lógica de radar, solo mostramos un preview
    return {
      platforms: Object.keys(data.platforms || {}),
      features: data.features || []
    };
  }, [data]);

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!data || !info) return <div className="p-6">Cargando…</div>;

  return (
    <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-3">Radar detallado</h1>

      {weights && (
        <div className="mb-4 text-sm text-slate-600">
          <span className="font-medium">Pesos activos (Supabase):</span>{" "}
          {Object.entries(weights).slice(0,6).map(([k,v]) => `${k}:${v}`).join(" • ")}
        </div>
      )}

      {/* Aquí mantiene tu gráfico y controles existentes. Este bloque solo informa que el dataset cargó. */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm mb-6">
        <div className="text-sm text-slate-700">
          <div><span className="font-medium">Plataformas:</span> {info.platforms.join(", ")}</div>
          <div><span className="font-medium">Características:</span> {info.features.join(", ")}</div>
        </div>
      </div>

      {/* Mantén tu componente de radar real aquí */}
    </div>
  );
}