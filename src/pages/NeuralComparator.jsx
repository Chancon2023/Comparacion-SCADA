import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { motion } from "framer-motion";

const HIDDEN_LAYER = [
  { weights: [1.25, 0, 0, 0], bias: 0.05 },
  { weights: [0, 1.25, 0, 0], bias: 0.05 },
  { weights: [0, 0, 1.25, 0], bias: 0.05 },
  { weights: [0, 0, 0, 1.25], bias: 0.05 },
  { weights: [-1.6, 0, 0, 0], bias: 0.1 },
  { weights: [0, -1.45, 0, 0], bias: 0.1 },
  { weights: [0, 0, -1.4, 0], bias: 0.1 },
  { weights: [0, 0, 0, -1.35], bias: 0.1 },
];

const OUTPUT_LAYER = {
  weights: [1.7, 1.65, 1.6, 1.5, -1.25, -1.2, -1.2, -1.1],
  bias: 0.25,
};

const SCENARIOS = [
  {
    id: "mineria_247",
    name: "Minería 24/7 crítica",
    description: "Operación continua con altos estándares de ciberseguridad y redundancia.",
    values: {
      "Ciberseguridad": 92,
      "Redundancia": 95,
      "Protocolos": 92,
      "Compatibilidad con hardware": 88,
    },
  },
  {
    id: "utility_iec",
    name: "Utility con IEC 61850",
    description: "Empresa eléctrica tradicional con foco en interoperabilidad IEC/DNP.",
    values: {
      "Ciberseguridad": 88,
      "Redundancia": 92,
      "Protocolos": 95,
      "Compatibilidad con hardware": 82,
    },
  },
  {
    id: "laboratorio_piloto",
    name: "Piloto / laboratorio",
    description: "Pruebas de integración con hardware mixto y menor criticidad operativa.",
    values: {
      "Ciberseguridad": 78,
      "Redundancia": 75,
      "Protocolos": 85,
      "Compatibilidad con hardware": 72,
    },
  },
  {
    id: "personalizado",
    name: "Ajustar manualmente",
    description: "Define tus propios umbrales moviendo los controles inferiores.",
    values: null,
  },
];

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const relu = (x) => Math.max(0, x);
const dot = (a, b) => a.reduce((acc, v, i) => acc + v * (b[i] ?? 0), 0);

function evaluatePlatform(platform, requirements, features, weightMap) {
  const diffVector = features.map((feat) => {
    const score = platform.scores?.[feat] ?? 0;
    const required = requirements[feat] ?? 0;
    const weight = weightMap?.[feat] ?? 1;
    return ((score - required) / 100) * weight;
  });

  const hidden = HIDDEN_LAYER.map((neuron) =>
    relu(neuron.bias + dot(diffVector, neuron.weights))
  );

  const logit = OUTPUT_LAYER.bias + dot(hidden, OUTPUT_LAYER.weights);
  const score = sigmoid(logit);

  const coverage = features.map((feat, index) => {
    const currentScore = platform.scores?.[feat] ?? 0;
    const requiredScore = requirements[feat] ?? 0;
    const gap = currentScore - requiredScore;
    return {
      feature: feat,
      score: currentScore,
      required: requiredScore,
      gap,
      normalizedScore: currentScore / 100,
      deficit: Math.max(0, requiredScore - currentScore),
    };
  });

  const positiveCoverage = coverage.reduce((acc, item) => acc + Math.max(0, item.gap), 0);
  const negativeCoverage = coverage.reduce((acc, item) => acc + item.deficit, 0);
  const balance = coverage.length ? positiveCoverage / (coverage.length * 100) : 0;
  const stress = coverage.length ? negativeCoverage / (coverage.length * 100) : 0;
  const confidence = Math.max(0, Math.min(1, 0.7 * (1 - stress) + 0.3 * balance));

  const strengths = coverage.filter((item) => item.gap >= 5).map((item) => item.feature);
  const improvements = coverage.filter((item) => item.gap <= -5).map((item) => item.feature);
  const borderline = coverage.filter((item) => Math.abs(item.gap) < 5).map((item) => item.feature);

  return {
    id: platform.id,
    name: platform.name,
    vendor: platform.vendor,
    score,
    confidence,
    coverage,
    strengths,
    improvements,
    borderline,
  };
}

function formatPct(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

function badgeClass(gap) {
  if (gap >= 5) return "badge pro";
  if (gap <= -5) return "badge con";
  return "badge neutral";
}

export default function NeuralComparator() {
  const [dataset, setDataset] = useState(null);
  const [requirements, setRequirements] = useState({});
  const [selectedScenario, setSelectedScenario] = useState("mineria_247");

  useEffect(() => {
    fetch("/scada_dataset.json")
      .then((r) => r.json())
      .then((json) => {
        setDataset(json);
      });
  }, []);

  const features = useMemo(() => {
    if (!dataset) return [];
    return Object.keys(dataset.weights || {});
  }, [dataset]);

  useEffect(() => {
    if (!dataset) return;
    const scenario = SCENARIOS.find((s) => s.id === "mineria_247");
    const averages = {};
    for (const feat of features) {
      const scenarioValue = scenario?.values?.[feat];
      if (scenarioValue != null) {
        averages[feat] = scenarioValue;
        continue;
      }
      const sum = dataset.platforms.reduce(
        (acc, platform) => acc + (platform.scores?.[feat] ?? 0),
        0
      );
      const avg = dataset.platforms.length ? sum / dataset.platforms.length : 80;
      averages[feat] = Math.round(avg);
    }
    setRequirements(averages);
    setSelectedScenario(scenario?.id ?? "personalizado");
  }, [dataset, features]);

  const results = useMemo(() => {
    if (!dataset) return [];
    return dataset.platforms
      .map((platform) =>
        evaluatePlatform(platform, requirements, features, dataset.weights)
      )
      .sort((a, b) => b.score - a.score);
  }, [dataset, requirements, features]);

  const top = results[0];

  const chartData = useMemo(
    () =>
      results.map((item) => ({
        name: item.name,
        score: Number((item.score * 100).toFixed(2)),
        confidence: Number((item.confidence * 100).toFixed(1)),
      })),
    [results]
  );

  const applyScenario = (scenario) => {
    setSelectedScenario(scenario.id);
    if (!scenario.values) return;
    setRequirements((prev) => {
      const next = { ...prev };
      for (const feat of features) {
        if (scenario.values[feat] != null) {
          next[feat] = scenario.values[feat];
        }
      }
      return next;
    });
  };

  const handleSlider = (feat, value) => {
    setSelectedScenario("personalizado");
    setRequirements((prev) => ({
      ...prev,
      [feat]: Number(value),
    }));
  };

  if (!dataset) {
    return <div className="p-6">Cargando modelo inteligente…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="card p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Laboratorio neural de comparación SCADA</h2>
              <p className="text-sm text-slate-600 mt-1">
                Este laboratorio utiliza una red neuronal (4 entradas → 8 neuronas ReLU → salida sigmoidal) calibrada con el
                dataset energético para estimar la compatibilidad de cada plataforma frente a tus requisitos.
              </p>
            </div>
            <div className="text-xs text-slate-500 max-w-sm">
              <p>
                La red evalúa brechas de ciberseguridad, redundancia, protocolos y compatibilidad hardware, generando un puntaje
                de afinidad y un índice de confianza basado en tensiones detectadas.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => applyScenario(scenario)}
                className={`btn ${selectedScenario === scenario.id ? "active" : ""}`}
              >
                <div className="text-left">
                  <div className="font-medium text-sm">{scenario.name}</div>
                  <div className="text-[11px] text-slate-500 max-w-[220px]">{scenario.description}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="card p-6 xl:col-span-2 space-y-4">
            <h3 className="font-semibold text-lg">Define los umbrales mínimos</h3>
            <p className="text-sm text-slate-600">
              Ajusta los sliders para establecer el nivel mínimo aceptable por atributo. El modelo detectará brechas negativas
              y fortalezas para cada plataforma.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feat) => (
                <div key={feat} className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{feat}</span>
                    <span>{requirements[feat] ?? 0}</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    step="1"
                    value={requirements[feat] ?? 80}
                    onChange={(e) => handleSlider(feat, e.target.value)}
                    className="w-full accent-slate-900"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Básico</span>
                    <span>Excelente</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-lg">Recomendación inteligente</h3>
            {top ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div>
                  <div className="text-sm text-slate-500">Mayor afinidad neural</div>
                  <div className="text-xl font-semibold leading-tight">{top.name}</div>
                  <div className="text-xs text-slate-500">Proveedor: {top.vendor}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="border border-slate-200 rounded-xl p-3">
                    <div className="text-xs text-slate-500">Puntaje NN</div>
                    <div className="text-lg font-semibold">{formatPct(top.score)}</div>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-3">
                    <div className="text-xs text-slate-500">Confianza</div>
                    <div className="text-lg font-semibold">{formatPct(top.confidence, 0)}</div>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">Fortalezas detectadas:</span>
                    <span className="ml-1 text-slate-600">
                      {top.strengths.length ? top.strengths.join(", ") : "Sin excedentes marcados"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Brechas prioritarias:</span>
                    <span className="ml-1 text-slate-600">
                      {top.improvements.length ? top.improvements.join(", ") : "Ninguna relevante"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Atributos ajustados:</span>
                    <span className="ml-1 text-slate-600">
                      {top.borderline.length ? top.borderline.join(", ") : "Todos superan el umbral"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <p className="text-sm text-slate-600">Ajusta los umbrales para obtener una recomendación.</p>
            )}
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="font-semibold text-lg">Resultados de la red neuronal</h3>
              <p className="text-sm text-slate-600">
                El puntaje refleja la afinidad modelada; la confianza penaliza brechas severas detectadas en los requisitos.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Ajusta los umbrales para observar cómo cambia el ranking en tiempo real.
            </div>
          </div>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="score" name="Afinidad NN">
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill="#2563EB" />
                  ))}
                </Bar>
                <Bar dataKey="confidence" name="Confianza" fill="#16A34A" opacity={0.35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.slice(0, 3).map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-white space-y-2 text-sm">
                <div className="font-semibold text-slate-700">{item.name}</div>
                <div className="text-xs text-slate-500 mb-1">Afinidad: {formatPct(item.score)} · Confianza: {formatPct(item.confidence)}</div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Fortalezas</div>
                  <p className="text-xs text-slate-600">
                    {item.strengths.length ? item.strengths.join(", ") : "Sin excedentes"}
                  </p>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Brechas</div>
                  <p className="text-xs text-slate-600">
                    {item.improvements.length ? item.improvements.join(", ") : "No se detectan brechas"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <h3 className="font-semibold text-lg">Detalle por plataforma y atributo</h3>
          <div className="overflow-auto">
            <table>
              <thead>
                <tr>
                  <th>Plataforma</th>
                  <th>Puntaje NN</th>
                  <th>Confianza</th>
                  {features.map((feat) => (
                    <th key={feat}>Gap {feat}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.vendor}</div>
                    </td>
                    <td>{formatPct(item.score)}</td>
                    <td>{formatPct(item.confidence)}</td>
                    {item.coverage.map((cov) => (
                      <td key={cov.feature}>
                        <div className={badgeClass(cov.gap)}>
                          {cov.gap > 0 ? "+" : ""}{Math.round(cov.gap)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {Math.round(cov.score)} / {Math.round(cov.required)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
