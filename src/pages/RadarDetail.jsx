import React, { useMemo, useState } from "react";
import data from "../data/scada_dataset.json";
import { computeRadarRow, prepareData, DEFAULT_WEIGHTS } from "../components/utils";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from "recharts";

const CRITICAL = ["Ciberseguridad","Redundancia","Protocolos","Compatibilidad con hardware","Integración IEC61850"];

export default function RadarDetail() {
  const [selected, setSelected] = useState(0);

  const dataset = useMemo(() => {
    const arr = Array.isArray(data) ? data : data?.platforms || [];
    return arr.map(prepareData);
  }, []);

  const platform = dataset[selected] || {};
  const featureKeys = useMemo(() => {
    const feats = platform.features || {};
    const keys = Object.keys(feats || {});
    const ordered = [
      ...CRITICAL.filter(k => keys.includes(k)),
      ...keys.filter(k => !CRITICAL.includes(k)),
    ];
    return ordered;
  }, [platform]);

  const radarData = useMemo(() => {
    const row = computeRadarRow(platform, featureKeys);
    return featureKeys.map((k) => ({
      feature: k,
      value: Number(row[k] ?? 0),
    }));
  }, [platform, featureKeys]);

  const weights = DEFAULT_WEIGHTS;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">Radar detallado</h1>

      <div className="flex gap-3 flex-wrap mb-6">
        {dataset.map((p, i) => {
          const active = i === selected;
          return (
            <button
              key={i}
              className={"px-3 py-1 rounded-full border " + (active ? "bg-black text-white" : "bg-white")}
              onClick={() => setSelected(i)}
            >
              {p.name || `Plataforma ${i+1}`}
            </button>
          );
        })}
      </div>

      <div className="w-full h-[420px] bg-white rounded-2xl border shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="feature" />
            <PolarRadiusAxis domain={[0, 1]} />
            <Tooltip />
            <Legend />
            <Radar name="Cobertura" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 text-sm text-slate-600">
        <div className="font-medium mb-1">Pesos actuales (locales):</div>
        <pre className="bg-slate-50 p-3 rounded-lg overflow-x-auto">{JSON.stringify(weights, null, 2)}</pre>
      </div>
    </div>
  );
}
