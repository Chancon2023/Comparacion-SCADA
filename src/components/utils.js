// Utility helpers shared across pages (v3.7.1, no-supabase build)

/** Color palette used by charts/cards */
export const COLORS = {
  ok: "#16a34a",        // green-600
  warn: "#f59e0b",      // amber-500
  no: "#ef4444",        // red-500
  neutral: "#94a3b8",   // slate-400
  bar: "#3b82f6",       // blue-500
};

/** Map qualitative value -> numeric [0,1] */
export function normalize(value) {
  if (value == null) return 0;
  if (typeof value === "number") {
    // Assume already 0..1 or 0..100
    if (value > 1) return Math.max(0, Math.min(1, value / 100));
    return Math.max(0, Math.min(1, value));
  }
  const v = String(value).trim().toLowerCase();
  if (["ok", "sí", "si", "alta", "alto", "yes"].includes(v)) return 1;
  if (["media", "medio", "partial", "parcial", "warn", "depende"].includes(v)) return 0.5;
  if (["no", "baja", "bajo"].includes(v)) return 0;
  // textual numbers like "80%"
  const m = v.match(/(\d+)\s*%/);
  if (m) return Math.max(0, Math.min(1, parseFloat(m[1]) / 100));
  const n = parseFloat(v);
  if (!Number.isNaN(n)) return Math.max(0, Math.min(1, n));
  return 0;
}

/** Small UI helper that returns Tailwind classes by qualitative value */
export function classForCell(value) {
  const n = normalize(value);
  if (n >= 0.75) return "bg-green-50 text-green-800 ring-1 ring-green-200";
  if (n >= 0.5) return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
  if (n > 0) return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
  return "bg-red-50 text-red-700 ring-1 ring-red-200";
}

/** Compute weighted score for a platform given features + weight map */
export function scoreValue(features, weights) {
  if (!features || !weights) return 0;
  let sum = 0, wsum = 0;
  Object.entries(weights).forEach(([k,w]) => {
    const v = normalize(features[k]);
    const ww = typeof w === "number" ? w : 1;
    sum += v * ww;
    wsum += ww;
  });
  if (wsum === 0) return 0;
  return sum / wsum;
}

/** Build default weight map from dataset features (critical first) */
export function defaultWeights(dataset) {
  // Try to infer list of features from first platform
  const first = dataset?.platforms?.[0] || dataset?.[0];
  const features = first?.features ? Object.keys(first.features) : [];
  const weights = {};
  // Give a bit more importance to the usual criticals
  const bonus = ["Ciberseguridad", "Redundancia", "Protocolos", "Compatibilidad con hardware", "Integración IEC61850"];
  for (const f of features) {
    weights[f] = bonus.includes(f) ? 2 : 1;
  }
  return weights;
}

/** Prepare high level stats for charts/home */
export function prepareData(dataset) {
  const list = dataset?.platforms ?? dataset ?? [];
  const weights = dataset?.weights ?? defaultWeights(dataset);
  return list.map(p => ({
    name: p.name,
    vendor: p.vendor,
    group: p.group || "General",
    score: scoreValue(p.features || {}, weights),
  }));
}

/** Compute a radar row for a single platform */
export function computeRadarRow(platform, weights) {
  const features = platform.features || {};
  const labels = Object.keys(weights || features);
  const data = labels.map(k => normalize(features[k]) * 100);
  return { labels, data };
}

/** Safe fetch with fallbacks for JSON under /public/data */
export async function fetchDataset() {
  const tried = [];
  const candidates = [
    "/data/scada_dataset.json",
    "/data/scada_dataset_mining_extended.json",
    "/data/dataset.json",
  ];
  for (const url of candidates) {
    try {
      tried.push(url);
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return { data: json, tried };
      }
    } catch {}
  }
  return { data: null, tried };
}