// src/components/utils.js
// Utilidades mínimas para que Home/Charts/RadarDetail compilen.
// Ajusta las fórmulas a tu lógica si es necesario.

export const COLORS = {
  ok: "#16a34a",
  mid: "#f59e0b",
  no: "#ef4444",
  bg: "#f3f4f6",
};

export function classForCell(state = "ok") {
  const map = { ok: "bg-emerald-100 text-emerald-800",
                mid: "bg-amber-100 text-amber-800",
                no: "bg-rose-100 text-rose-800" };
  return map[state] || map.ok;
}

// Normaliza valores diversos a 0..1
export function scoreValue(v) {
  if (v == null) return 0;
  if (typeof v === "number") {
    // Asume valores ya entre 0..100 o 0..1
    return v > 1 ? Math.min(1, Math.max(0, v / 100)) : Math.min(1, Math.max(0, v));
  }
  const s = String(v).toLowerCase();
  if (["ok","sí","si","true","alta","high"].includes(s)) return 1;
  if (["mid","media","medio"].includes(s)) return 0.6;
  if (["no","false","baja","low"].includes(s)) return 0.2;
  return 0.5;
}

// Prepara un subconjunto de features desde el dataset
export function prepareData(dataset = [], features = []) {
  if (!Array.isArray(dataset)) return [];
  const feats = features && features.length ? features : Object.keys(dataset[0] || {});
  return dataset.map(row => ({
    name: row.name || row.platform || row.software || "N/A",
    values: feats.reduce((acc, f) => {
      acc[f] = scoreValue(row[f]);
      return acc;
    }, {}),
  }));
}

// Calcula una fila de radar para una plataforma
export function computeRadarRow(rowValues = {}, weights = {}) {
  const entries = Object.entries(rowValues);
  return entries.map(([feat, val]) => ({
    feature: feat,
    value: scoreValue(val) * (weights[feat] ?? 1),
  }));
}

// Extrae mensajes (placeholder)
export function extractFindings(row = {}) {
  const reasons = [];
  if (row?.security || row?.ciberseguridad) reasons.push("Seguridad destacada");
  if (row?.redundancia || row?.redundancy) reasons.push("Redundancia presente");
  return reasons;
}

export default { COLORS, classForCell, scoreValue, prepareData, computeRadarRow, extractFindings };
