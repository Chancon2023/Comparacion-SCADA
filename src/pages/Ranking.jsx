import React, { useEffect, useMemo, useState } from "react";
import { COLORS, scoreValue, prepareData } from "../components/utils";
import supabase from "../lib/supabase";

function computeScore(platform, features, weights) {
  let num = 0, den = 0;
  features.forEach(name => {
    const w = weights?.[name] ?? 1;
    const v = scoreValue(platform?.scores?.[name] ?? 0);
    num += v * w;
    den += 100 * w;
  });
  return den ? Math.round((num / den) * 100) : 0;
}

export default function Ranking() {
  const [data, setData] = useState(null);
  const [weights, setWeights] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let payload = null;
        if (supabase) {
          const { data: rows, error } = await supabase
            .from("datasets").select("payload").eq("name", "scada_dataset").limit(1).maybeSingle();
          if (!error && rows && rows.payload) payload = rows.payload;
        }
        if (!payload) {
          const res = await fetch("/data/scada_dataset.json", { cache: "no-store" });
          if (res.ok) payload = await res.json();
        }
        if (!cancelled) setData(prepareData(payload));
      } catch (e) {
        console.error("[Ranking] Carga dataset:", e);
        if (!cancelled) setData(prepareData(null));
      }
    })();
    return () => (cancelled = true);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (supabase) {
          const { data: rows, error } = await supabase.from("weights").select("*").limit(1).maybeSingle();
          if (!error && rows) setWeights(rows);
        }
      } catch (e) {
        console.warn("[Ranking] No se pudieron cargar pesos:", e);
      }
    })();
  }, []);

  const features = useMemo(() => data?.features?.map(f => f.name) || [], [data]);
  const rows = useMemo(() => {
    if (!data) return [];
    const list = (data.platforms || []).map(p => ({
      name: p.name,
      score: computeScore(p, features, weights),
      highlights: p.highlights || [],
    }));
    return list.sort((a,b) => b.score - a.score);
  }, [data, features, weights]);

  if (!data) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Ranking de plataformas SCADA</h1>
        <a href="/" className="text-blue-600 hover:underline">← Volver</a>
      </div>
      <div className="space-y-4">
        {rows.map((r, idx) => (
          <div key={r.name} className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">#{idx+1} {r.name}</div>
              <div className="text-2xl font-bold">{r.score}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// al tope del archivo
import MiningConclusion from "../components/MiningConclusion";

// ...dentro del JSX, al final
<MiningConclusion />
