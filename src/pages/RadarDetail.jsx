import React, { useEffect, useMemo, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { COLORS, scoreValue, prepareData } from "../components/utils";
import supabase from "../lib/supabase";

const CRITICAL = ["Ciberseguridad", "Redundancia", "Protocolos", "Compatibilidad con hardware"];

export default function RadarDetail() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [weights, setWeights] = useState(null);

  // dataset: intenta primero Supabase (tabla datasets, col json 'payload'), si falla usa /data/scada_dataset.json
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let payload = null;
        if (supabase) {
          const { data: rows, error } = await supabase
            .from("datasets")
            .select("payload")
            .eq("name", "scada_dataset")
            .limit(1)
            .maybeSingle();
          if (!error && rows && rows.payload) {
            payload = rows.payload;
          }
        }
        if (!payload) {
          const res = await fetch("/data/scada_dataset.json", { cache: "no-store" });
          if (res.ok) payload = await res.json();
        }
        if (!cancelled) setData(prepareData(payload));
      } catch (e) {
        console.error("[RadarDetail] Carga dataset:", e);
        if (!cancelled) setData(prepareData(null));
      }
    })();
    return () => (cancelled = true);
  }, []);

  // pesos (Supabase tabla weights)
  useEffect(() => {
    (async () => {
      try {
        if (supabase) {
          const { data: rows, error } = await supabase.from("weights").select("*").limit(1).maybeSingle();
          if (!error && rows) {
            setWeights(rows);
          }
        }
      } catch (e) {
        console.warn("[RadarDetail] No se pudieron cargar pesos:", e);
      }
    })();
  }, []);

  const features = useMemo(() => {
    if (!data) return [];
    const feats = data.features.map(f => f.name);
    return onlyCritical ? feats.filter(n => CRITICAL.some(c => n.toLowerCase().includes(c.toLowerCase()))) : feats;
  }, [data, onlyCritical]);

  const chartData = useMemo(() => {
    if (!data || !data.platforms) return [];
    const chosen = selected.length ? selected : data.platforms.slice(0,3).map(p => p.name);
    return chosen.map((name, idx) => {
      const platform = data.platforms.find(p => p.name === name);
      const entry = { subject: name, fullMark: 100, fill: COLORS[idx % COLORS.length] };
      (features || []).forEach(featName => {
        const raw = platform?.scores?.[featName] ?? 0;
        const w = weights?.[featName] ?? 1;
        entry[featName] = scoreValue(raw) * w;
      });
      return entry;
    });
  }, [data, features, selected, weights]);

  if (!data) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {(data.platforms || []).map(p => {
          const active = selected.includes(p.name);
          return (
            <button
              key={p.name}
              className={"px-3 py-1 rounded-full border " + (active ? "bg-blue-600 text-white" : "bg-white")}
              onClick={() => {
                setSelected(prev => active ? prev.filter(x => x !== p.name) : [...prev, p.name].slice(-3));
              }}
            >
              {p.name}
            </button>
          );
        })}
        <label className="ml-auto flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyCritical} onChange={e => setOnlyCritical(e.target.checked)} />
          Solo ítems críticos
        </label>
      </div>

      <div className="h-[520px] w-full bg-white rounded-2xl shadow p-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            {chartData.map((_, idx) => (
              <Radar key={idx} dataKey={features[idx % features.length]} stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} fillOpacity={0.35} />
            ))}
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
