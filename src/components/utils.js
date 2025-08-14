// src/components/utils.js
// Provee helpers que algunos archivos importan. Ajusta según tu lógica real.

export const COLORS = [
  "#2563EB", "#16A34A", "#F97316", "#9333EA", "#0EA5E9",
  "#EF4444", "#84CC16", "#A855F7", "#F59E0B", "#22D3EE"
];

export function classForCell(value) {
  // Asigna clases según valor (ok, medio, mal)
  if (value === "ok" || value === true) return "bg-emerald-100 text-emerald-800";
  if (value === "no" || value === false) return "bg-rose-100 text-rose-800";
  return "bg-gray-100 text-gray-800";
}

export function scoreValue(val) {
  // Normaliza a 0..1 (si viene 0..2: divide por 2; si viene boolean: true=1)
  if (typeof val === "number") return Math.max(0, Math.min(1, val > 2 ? val/10 : val/2));
  if (typeof val === "boolean") return val ? 1 : 0;
  return 0.5;
}

export function computeRadarRow(featureKey, platform) {
  // Devuelve un score 0..1 para una característica de una plataforma
  const raw = platform?.scores?.[featureKey];
  return scoreValue(raw);
}

export function prepareData(dataset, selectedNames) {
  // Estructura básica para gráficas comparativas
  const features = dataset.features || [];
  const rows = features.map((feat) => {
    const entry = { feature: feat };
    (selectedNames || []).forEach((name) => {
      const p = dataset.platforms?.find((x) => x.name === name);
      entry[name] = p ? computeRadarRow(feat, p) : 0;
    });
    return entry;
  });
  return rows;
}

export function extractFindings(dataset, name) {
  const p = dataset.platforms?.find((x) => x.name === name);
  return p?.findings || { pros: [], cons: [], warnings: [] };
}
