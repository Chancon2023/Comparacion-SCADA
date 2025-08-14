// src/components/utils.js
export const COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#14b8a6', // teal-500
  '#8b5cf6', // violet-500
  '#f97316', // orange-500
];

export function scoreValue(v) {
  if (typeof v === 'number') return v;
  const s = (v ?? '').toString().trim().toLowerCase();
  if (!s) return 0;
  if (['ok', 'alta', 'sí', 'si', 'yes', 'positivo'].some(k => s.startsWith(k))) return 2;
  if (['media', 'medio', 'parcial'].some(k => s.includes(k))) return 1;
  if (['no', 'baja', 'negativo'].some(k => s.startsWith(k))) return 0;
  // fallback neutral
  return 0;
}

export const DEFAULT_WEIGHTS = {
  'Seguridad': 2,
  'Redundancia': 1.5,
  'Integración': 1.2,
};

export function computeRadarRow(platform, features, weights = {}) {
  const w = { ...DEFAULT_WEIGHTS, ...(weights || {}) };
  return features.map(f => {
    const raw = platform?.features?.[f];
    const v = scoreValue(raw);
    const ww = w[f] ?? 1;
    return v * ww;
  });
}

/**
 * Basic aggregation for stacked bars per platform.
 * dataset shape expected:
 * {
 *   platforms: [{ name, features: {featName: 'ok'|'media'|'no', ...}, pros, cons }, ...],
 *   features?: [featName...]
 * }
 */
export function prepareData(dataset) {
  if (!dataset || !Array.isArray(dataset.platforms)) {
    return { labels: [], series: [] };
  }
  const series = dataset.platforms.map(p => {
    let ok = 0, mid = 0, bad = 0;
    const feats = p.features || {};
    for (const k of Object.keys(feats)) {
      const s = scoreValue(feats[k]);
      if (s >= 1.5) ok++;
      else if (s >= 0.5) mid++;
      else bad++;
    }
    return { name: p.name, ok, mid, bad };
  });
  const labels = dataset.platforms.map(p => p.name);
  return { labels, series };
}

export function extractFindings(platform) {
  return {
    pros: platform?.pros ?? [],
    cons: platform?.cons ?? [],
  };
}