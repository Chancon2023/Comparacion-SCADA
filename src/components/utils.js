// Utilidades comunes y seguras (sin supabase)
export const COLORS = {
  ok: "#22c55e",
  mid: "#f59e0b",
  no: "#ef4444",
  neutral: "#94a3b8",
};

// Mapear comentarios a valor numérico (ejemplo base)
export function scoreValue(txt = "") {
  const t = (txt || "").toLowerCase();
  if (!t) return 0.5;
  if (t.includes("no ") || t.includes("no soporta") || t.includes("falla")) return 0.0;
  if (t.includes("media") || t.includes("parcial")) return 0.5;
  if (t.includes("ok") || t.includes("alta") || t.includes("éxito") || t.includes("exitosa")) return 1.0;
  return 0.5;
}

// Normaliza un registro de plataforma (defensivo)
export function prepareData(raw = {}) {
  const result = { ...raw };
  result.pros = Array.isArray(raw.pros) ? raw.pros : [];
  result.cons = Array.isArray(raw.cons) ? raw.cons : [];
  result.notes = Array.isArray(raw.notes) ? raw.notes : [];
  result.features = raw.features && typeof raw.features === "object" ? raw.features : {};
  result.name = raw.name || raw.title || "Plataforma";
  return result;
}

// Para celdas de tablas/indicadores
export function classForCell(v) {
  if (v >= 0.85) return "bg-green-100 text-green-800";
  if (v >= 0.5) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

// Fila para el radar/tabla de detalle (segura)
export function computeRadarRow(platform = {}, featureKeys = []) {
  const feats = platform.features || {};
  const row = {};
  featureKeys.forEach((k) => {
    const val = feats[k];
    row[k] = typeof val === "number" ? val : scoreValue(val);
  });
  return row;
}

// Ponderación por defecto (si no hay weights.json)
export const DEFAULT_WEIGHTS = {
  "Ciberseguridad": 1.0,
  "Redundancia": 1.0,
  "Protocolos": 1.0,
  "Compatibilidad con hardware": 0.8,
  "Mantenibilidad": 0.8,
  "Acceso remoto/web": 0.7,
  "Casos de Éxito": 0.9,
  "Integración IEC61850": 1.0,
};

// Score global de una plataforma en base a features + pesos
export function computeScore(platform = {}, weights = DEFAULT_WEIGHTS) {
  const feats = platform.features || {};
  let sum = 0, wsum = 0;
  Object.keys(weights || {}).forEach((k) => {
    const w = Number(weights[k] ?? 0);
    const raw = feats[k];
    const v = typeof raw === "number" ? raw : scoreValue(raw);
    sum += v * w;
    wsum += w;
  });
  if (wsum === 0) return 0;
  return sum / wsum; // 0..1
}
