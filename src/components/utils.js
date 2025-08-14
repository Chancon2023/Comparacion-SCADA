// src/components/utils.js
// Utilidades comunes exportadas para evitar errores de "no exportado".

export const COLORS = {
  ok: "#10b981",   // emerald-500
  mid: "#f59e0b",  // amber-500
  no: "#ef4444",   // rose-500
  na: "#9ca3af",   // slate-400
};

/** Mapear estado -> clases Tailwind amigables */
export function classForCell(state) {
  switch (state) {
    case "ok":
      return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
    case "mid":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
    case "no":
      return "bg-rose-50 text-rose-800 ring-1 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

/** Normaliza dataset crudo a arreglo seguro */
export function prepareData(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw.platforms) return raw.platforms;
  return [];
}

/** Convierte un valor semántico a numérico (0..1) para gráficos */
export function scoreValue(v) {
  if (typeof v === "number") return Math.max(0, Math.min(1, v));
  if (v === "ok") return 1;
  if (v === "mid") return 0.5;
  if (v === "no") return 0;
  return 0;
}

/** Calcula un score ponderado (0..100) a partir de features + weights */
export function computeRadarRow(entry, weights = {}) {
  if (!entry || !entry.features) return 0;
  let totalW = 0;
  let sum = 0;
  for (const [key, val] of Object.entries(entry.features)) {
    const w = Number(weights[key] ?? 1);
    totalW += w;
    sum += scoreValue(val) * w;
  }
  if (!totalW) return 0;
  return Math.round((sum / totalW) * 100);
}

/** Extrae pro/contra/notas desde el item del dataset si existen */
export function extractFindings(item) {
  const pros = item?.pros || [];
  const cons = item?.cons || [];
  const notes = item?.notes || [];
  return { pros, cons, notes };
}