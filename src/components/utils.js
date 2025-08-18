export const COLORS = {
  ok: "#16a34a",
  meh: "#f59e0b",
  no: "#dc2626",
  na: "#9ca3af",
};

/** Devuelve clases básicas para chips/celdas (Tailwind) */
export function classForCell(v) {
  switch (v) {
    case "ok":
      return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200";
    case "meh":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200";
    case "no":
      return "bg-rose-50 text-rose-900 ring-1 ring-rose-200";
    default:
      return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
  }
}

/** Convierte el valor semántico (ok/meh/no) a puntaje 0..1 */
export function scoreValue(v) {
  if (typeof v === "number") return v;
  if (v === "ok") return 1;
  if (v === "meh") return 0.5;
  if (v === "no") return 0;
  return 0.5;
}

/** Normaliza el dataset a una lista de plataformas */
export function prepareData(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw.platforms) return raw.platforms;
  return [];
}

/** Calcula score 0..100 para un set de features ponderado */
export function computeRadarRow(platform, features, weights) {
  let total = 0;
  let count = 0;
  for (const f of features) {
    const raw = platform?.features?.[f];
    const w = (weights && Number(weights[f])) || 1;
    total += scoreValue(raw) * w;
    count += w;
  }
  if (!count) return 0;
  return (100 * (total / count));
}
