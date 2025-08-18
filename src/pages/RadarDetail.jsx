import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { COLORS, scoreValue, prepareData, analyzeText } from "../components/utils.js";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function RadarDetail() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());
  const [showAvg, setShowAvg] = useState(true);
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [showSource, setShowSource] = useState(null);

  useEffect(() => {
    fetch("/scada_comparison.json")
      .then(r => r.json())
      .then(j => {
        j = prepareData(j);
        setData(j);
        const names = Object.keys(j.softwares || {});
        setSelected(names.slice(0, 2));

        // Construye lista de features global
        const feats = new Set();
        names.forEach(n =>
          Object.keys(j.softwares[n]?.features || {}).forEach(f => feats.add(f))
        );
        setSelectedFeatures(new Set(Array.from(feats).slice(0, 10)));
      });
  }, []);

  const softwareNames = useMemo(
    () => (data ? Object.keys(data.softwares || {}) : []),
    [data]
  );

  const palette = useMemo(() => {
    const map = {};
    softwareNames.forEach((n, i) => (map[n] = COLORS[i % COLORS.length]));
    return map;
  }, [softwareNames]);

  // Helper: filtra features si está activado "solo críticos"
  const filterCritical = (feat) =>
    !onlyCritical ||
    /minería|subestac|redun|ciber|protocolo|iec|61850/i.test(feat || "");

  // Construye filas del radar (0..2) por feature y software seleccionado
  const chartData = useMemo(() => {
    if (!data) return [];
    const feats = Array.from(selectedFeatures).filter(filterCritical);
    const rows = feats.map((feat) => {
      const row = { feature: feat };
      const vals = [];

      selected.forEach((name) => {
        const comment = data?.softwares?.[name]?.features?.[feat] ?? "";
        const v = scoreValue(comment); // 0, 1, 2
        row[name] = v;
        vals.push(v);
      });

      if (showAvg) {
        row["Promedio otros"] = vals.length
          ? vals.reduce((a, b) => a + b, 0) / vals.length
          : 0;
      }
      return row;
    });

    return rows;
  }, [data, selected, selectedFeatures, showAvg, onlyCritical]);

  // Pros / Contras a partir de los textos por feature
  function getFindings(featuresObj) {
    const pros = [], cautions = [], cons = [];
    for (const [feat, text] of Object.entries(featuresObj || {})) {
      const a = analyzeText(text);
      if (a.hardNeg || a.neg) cons.push(text || feat);
      else if (a.warn) cautions.push(text || feat);
      else if (a.pos) pros.push(text || feat);
    }
    return { pros, cautions, cons };
  }

  if (!data) return <div className="p-6">Cargando…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Selección de softwares y features */}
        <section className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">Selecciona hasta 3 SCADA:</label>
            <div className="flex flex-wrap gap-2">
              {softwareNames.map((n) => {
                const active = selected.includes(n);
                const disabled = !active && selected.length >= 3;
                return (
                  <button
                    key={n}
                    className={`btn ${active ? "active" : ""}`}
                    onClick={() => {
                      setSelected((prev) => {
                        const has = prev.includes(n);
                        if (has) return prev.filter((x) => x !== n);
                        if (prev.length >= 3) return prev;
                        return [...prev, n];
                      });
                    }}
                    style={{
                      borderColor: palette[n],
                      color: active ? "#fff" : palette[n],
                      backgroundColor: active ? palette[n] : "white",
                      opacity: disabled ? 0.5 : 1,
                    }}
                    disabled={disabled}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <label className="ml-4 text-sm">
              <input
                type="checkbox"
                checked={showAvg}
                onChange={(e) => setShowAvg(e.target.checked)}
              />{" "}
              Mostrar promedio de otros
            </label>
            <label className="ml-4 text-sm">
              <input
                type="checkbox"
                checked={onlyCritical}
                onChange={(e) => setOnlyCritical(e.target.checked)}
              />{" "}
              Solo ítems críticos (Seguridad / Redundancia / Integración)
            </label>
          </div>

          <div className="mt-3">
            <label className="text-sm font-medium">Características:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[220px] overflow-auto pr-1">
              {Array.from(
                new Set(
                  softwareNames.flatMap((n) =>
                    Object.keys(data.softwares[n]?.features || {})
                  )
                )
              )
                .sort()
                .map((f) => (
                  <label
                    key={f}
                    className="flex items-center gap-2 border rounded-xl px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFeatures.has(f)}
                      onChange={() => {
                        setSelectedFeatures((prev) => {
                          const next = new Set(prev);
                          next.has(f) ? next.delete(f) : next.add(f);
                          return next;
                        });
                      }}
                    />
                    <span className="text-sm">{f}</span>
                  </label>
                ))}
            </div>
          </div>
        </section>

        {/* Radar */}
        <section className="card p-4">
          <h3 className="font-medium mb-2">Radar comparativo</h3>
          <div className="min-h-[380px]">
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={chartData} outerRadius="70%">
                <PolarGrid />
                <PolarAngleAxis dataKey="feature" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 2]} tickCount={5} axisLine={false} />
                {selected.map((n) => (
                  <Radar
                    key={n}
                    name={n}
                    dataKey={n}
                    stroke={palette[n]}
                    fill={palette[n]}
                    strokeWidth={2}
                    fillOpacity={0.18}
                  />
                ))}
                {showAvg && (
                  <Radar
                    name="Promedio otros"
                    dataKey="Promedio otros"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    strokeDasharray="5 5"
                    fillOpacity={0.1}
                  />
                )}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            {(!chartData || chartData.length === 0) && (
              <div className="text-center text-sm text-slate-500 mt-3">
                Sin datos para mostrar. Revisa filtros/selección o desactiva “solo
                críticos”.
              </div>
            )}
          </div>
        </section>

        {/* Pros / Contras por plataforma */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selected.map((n) => {
            const s = data.softwares[n] || {};
            const pc = getFindings(s.features || {});
            return (
              <div key={n} className="card p-4">
                <h3 className="font-medium mb-1">Ficha: {n}</h3>
                <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap break-words">
                  {s.description || "(Sin reseña)"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Pros</h4>
                    <ul className="text-sm space-y-1">
                      {(pc.pros.length ? pc.pros : ["(No detectados)"])
                        .slice(0, 8)
                        .map((t, i) => (
                          <li
                            key={i}
                            className="badge pro flex items-center gap-2"
                          >
                            {t}
                            <button
                              className="underline text-xs"
                              onClick={() => setShowSource(t)}
                            >
                              ver origen
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">A tener en cuenta</h4>
                    <ul className="text-sm space-y-1">
                      {(pc.cautions.length ? pc.cautions : ["(No detectados)"])
                        .slice(0, 8)
                        .map((t, i) => (
                          <li
                            key={i}
                            className="badge warn flex items-center gap-2"
                          >
                            {t}
                            <button
                              className="underline text-xs"
                              onClick={() => setShowSource(t)}
                            >
                              ver origen
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Contras</h4>
                    <ul className="text-sm space-y-1">
                      {(pc.cons.length ? pc.cons : ["(No detectados)"])
                        .slice(0, 8)
                        .map((t, i) => (
                          <li
                            key={i}
                            className="badge con flex items-center gap-2"
                          >
                            {t}
                            <button
                              className="underline text-xs"
                              onClick={() => setShowSource(t)}
                            >
                              ver origen
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {showSource && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowSource(null)}
        >
          <div
            className="bg-white rounded-2xl p-4 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-semibold mb-2">Origen (texto del Excel)</h4>
            <pre className="whitespace-pre-wrap break-words text-sm bg-slate-50 p-3 rounded-lg border">
              {showSource}
            </pre>
            <div className="text-right mt-3">
              <button className="btn" onClick={() => setShowSource(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
