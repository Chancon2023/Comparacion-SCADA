import React, { useMemo } from "react";
import data from "../data/scada_dataset.json";
import { prepareData, classForCell, scoreValue } from "../components/utils";

export default function Home() {
  const dataset = useMemo(() => {
    const arr = Array.isArray(data) ? data : data?.platforms || [];
    return arr.map(prepareData);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">SCADA Comparación Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-4">
        {dataset.map((p, i) => {
          const f = p.features || {};
          const keys = Object.keys(f || {});
          const alguna = keys[0];
          const raw = alguna ? f[alguna] : undefined;
          const v = typeof raw === "number" ? raw : scoreValue(raw);

          return (
            <div key={i} className="rounded-2xl border bg-white p-4">
              <div className="font-medium mb-2">{p.name || `Plataforma ${i+1}`}</div>
              {alguna ? (
                <div className={"inline-block px-2 py-1 rounded " + classForCell(v)}>
                  {alguna}: {(v*100).toFixed(0)}%
                </div>
              ) : (
                <div className="text-slate-500 text-sm">Sin features cargados</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
