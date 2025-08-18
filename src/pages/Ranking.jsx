import React, { useMemo } from "react";
import data from "../data/scada_dataset.json";
import { computeScore, prepareData, DEFAULT_WEIGHTS } from "../components/utils";
import MiningConclusion from "../components/MiningConclusion";

export default function Ranking() {
  const dataset = useMemo(() => {
    const arr = Array.isArray(data) ? data : data?.platforms || [];
    return arr.map(prepareData);
  }, []);

  const weights = DEFAULT_WEIGHTS;

  const rows = useMemo(() => {
    return dataset
      .map((p) => ({
        name: p.name,
        score: computeScore(p, weights),
        platform: p,
      }))
      .sort((a, b) => b.score - a.score);
  }, [dataset, weights]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">Ranking de plataformas SCADA</h1>

      <div className="space-y-4">
        {rows.map((r, idx) => (
          <div key={idx} className="rounded-2xl border p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">
                #{idx + 1} — {r.name}
              </div>
              <div className="text-xl font-semibold">
                {(r.score * 100).toFixed(1)}
              </div>
            </div>

            {r.platform.pros?.length ? (
              <ul className="mt-3 text-sm text-slate-700 list-disc pl-5">
                {r.platform.pros.slice(0, 3).map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            ) : null}
          </div>
        ))}
      </div>

      <MiningConclusion />
    </div>
  );
}
