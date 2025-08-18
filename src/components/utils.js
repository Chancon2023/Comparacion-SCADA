/**
 * utils.js (v3.7.1 patch – sin Supabase)
 * Carga dataset, calcula ranking y maneja comentarios locales.
 */

export const CRITICAL_KEYS = [
  "Ciberseguridad",
  "Redundancia",
  "Protocolos",
  "Integración",
  "Compatibilidad con hardware"
];

const FALLBACK_PATHS = [
  "/data/scada_dataset.json",
  "/data/scada_dataset_mining_extended.json",
  "/data/dataset.json"
];

export async function loadDataset() {
  for (const p of FALLBACK_PATHS) {
    try {
      const res = await fetch(p, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // soporta {platforms: []} o [] plano
        const arr = Array.isArray(data) ? data : (data.platforms || []);
        if (arr.length) return arr;
      }
    } catch (e) {
      // seguir al siguiente path
    }
  }
  throw new Error("No se encontró dataset en /public/data/.");
}

export function classForCell(v) {
  if (v === null || v === undefined || isNaN(v)) return "bg-gray-100 text-gray-700";
  if (v >= 85) return "bg-emerald-100 text-emerald-800";
  if (v >= 70) return "bg-sky-100 text-sky-800";
  if (v >= 50) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

export function scoreValue(v) {
  if (v === null || v === undefined || isNaN(v)) return 0;
  return Math.max(0, Math.min(100, Number(v)));
}

export function computePlatformScore(p) {
  const categories = p.category_scores || {};
  const keys = Object.keys(categories);
  if (!keys.length) return 0;

  let wSum = 0;
  let acc = 0;
  keys.forEach(k => {
    const v = scoreValue(categories[k]);
    const w = CRITICAL_KEYS.includes(k) ? 2 : 1;
    acc += v * w;
    wSum += w;
  });

  let base = wSum ? acc / wSum : 0;

  const alerts = Array.isArray(p.alerts) ? p.alerts.length : 0;
  // penalización por alerta dura
  base -= Math.min(20, alerts * 2);

  return Math.round(Math.max(0, Math.min(100, base)));
}

export function prepareData(platforms) {
  // fusiona comentarios locales (si existen) y agrega score
  return platforms.map(p => {
    const uid = p.id || (p.vendor + "_" + p.name).replace(/\s+/g, "_").toLowerCase();
    const local = typeof window !== "undefined" ? window.localStorage.getItem("comments/" + uid) : null;
    const userComment = local ? JSON.parse(local) : "";
    return {
      ...p,
      uid,
      userComment,
      score: computePlatformScore(p)
    };
  }).sort((a, b) => b.score - a.score);
}

export function saveLocalComment(uid, text) {
  try {
    window.localStorage.setItem("comments/" + uid, JSON.stringify(text || ""));
  } catch (e) {
    console.warn("No se pudo guardar comentario:", e);
  }
}
