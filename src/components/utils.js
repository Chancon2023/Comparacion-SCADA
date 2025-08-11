/* utils.js – perfil minería + compatibilidad v3.7.1
 * Exports:
 *  - analyzeText, scoreFeature, computeRanking
 *  - MINING_WEIGHTS, CRITICAL_KEYS
 *  - sum, groupBy, toCSV, downloadBlob, formatNumber
 *  - (legacy) prepareData, classForCell  <-- para Home.jsx v3.7.1
 */

// ========= Marcadores en español / emojis =========
export const POS_MARKERS = [
  "✔",
  /\balta\b/i,
  /muy escalable/i,
  /nativ[ao]/i,
  /agn[oó]stic[oa]/i,
  /smart objects/i,
  /hot-?standby|prp|hsr|circular redundancy/i,
  /cumple.*iec\s*62443/i,
  /html5/i,
  /soporte t[ée]cnico local|integradores/i,
  /compatibilidad.*versiones/i,
  /bajo.*tco/i
];

export const WARN_MARKERS = [
  "⚠",
  /\bmedia\b/i,
  /requiere (personalizaci[oó]n|ingenier[íi]a|desarrollo|servicios externos|c[oó]digo)/i,
  /variable seg[uú]n proyecto/i
];

export const NEG_MARKERS = [
  "❌",
  /no nat[iv]a/i,
  /dependiente de su propio hardware/i,
  /costoso|licenciamiento complejo/i,
  /migraciones costosas/i,
  /limitada.*reingenier[íi]a/i,
  /no disponible/i
];

// ========= Reglas duras (negativas obligatorias) =========
export const HARD_NEG_RULES = [
  { label: "IEC61850 MMS falla", re: /(falla|no funciona).*(iec\s*61850|mms)/i },
  { label: "No soporta IEC61850 bien", re: /(iec\s*61850).*(no (soporta|capaz)|no integra.*(ied|marcas))/i },
  { label: "Sin casos de éxito IEC61850", re: /ning[uú]n caso de [éE]xito.*iec\s*61850/i },
  { label: "Redundancia no funciona", re: /la redundancia no funciona/i },
  { label: "Logs llenan disco", re: /(logs|ogs).*(llenan|llenado).*(discos|disco).*(servidores)/i },
  { label: "HMI deficiente", re: /herramienta.*(desarrollo).*hmi.*(deficiente|no adecuada)/i },
  { label: "Config tediosa", re: /herramientas de configuraci[oó]n.*tediosas/i },
  { label: "Parches/updates problemáticos", re: /(actualizaciones|parches).*(no funcionan|requieren.*procedimiento.*extenso|complejo)/i },
  { label: "No cumple NTSyCS", re: /no cumple.*ntsycs/i },
  { label: "No agrupa señales con timestamp", re: /(no (agrupa|mantiene).*(estampa|timestamp))|(no.*transformaci[oó]n.*puntos.*simples.*dobles)/i },
];

// ========= Pesos específicos para perfil minería =========
export const MINING_WEIGHTS = {
  "Adaptación a minería": 2.0,
  "Integración de subestaciones": 2.0,
  "Redundancia y disponibilidad": 1.8,
  "Ciberseguridad": 1.8,
  "Interfaz de usuario (HMI/SCADA)": 1.5,
  "Compatibilidad entre versiones": 1.5,
  "Configuración y mantenimiento": 1.6,
  "Acceso remoto/web": 1.4,
  "Costo total de propiedad (TCO)": 1.4,
  "Protocolos soportados": 1.8,
};

// ========= Claves críticas para CAP duro =========
export const CRITICAL_KEYS = new Set([
  "Adaptación a minería",
  "Integración de subestaciones",
  "Redundancia y disponibilidad",
  "Ciberseguridad",
  "Protocolos soportados",
]);

// ========= Helpers =========
export const sum = (arr) => arr.reduce((a,b)=>a+b,0);
export const groupBy = (arr, fn) => arr.reduce((acc, it) => { const k = fn(it); (acc[k] ||= []).push(it); return acc; }, {});
export const formatNumber = (n, d=1) => Number.isFinite(n) ? Number(n.toFixed(d)) : 0;

export function toCSV(rows, headers) {
  const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const head = headers.map(esc).join(",");
  const body = rows.map(r => headers.map(h => esc(r[h])).join(",")).join("\n");
  return [head, body].join("\n");
}

export function downloadBlob(filename, content, mime="text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ========= Análisis de texto =========
export function analyzeText(text) {
  if (!text) return { pos: 0, warn: 0, neg: 0, hardNeg: false };
  const t = String(text).toLowerCase();
  const has = (arr) => arr.some(r => typeof r === "string" ? t.includes(r.toLowerCase()) : r.test(t));
  const pos  = has(POS_MARKERS)  ? 1 : 0;
  const warn = has(WARN_MARKERS) ? 1 : 0;
  let   neg  = has(NEG_MARKERS)  ? 1 : 0;
  const hardNeg = HARD_NEG_RULES.some(rule => rule.re.test(t));
  if (hardNeg) neg = Math.max(neg, 1);
  return { pos, warn, neg, hardNeg };
}

// ========= Scoring por feature =========
export function scoreFeature(featName, text, opts = {}) {
  const { pos, warn, neg, hardNeg } = analyzeText(text);
  const base = pos ? 1 : warn ? 0.5 : neg ? 0 : 0.25;
  const profile = opts.profile || "mining";
  const w = profile === "mining" && MINING_WEIGHTS[featName] ? MINING_WEIGHTS[featName] : 1.0;
  return { value: base * w, weight: w, hardNeg };
}

// ========= Ranking por software =========
export function computeRanking(softwares, opts = {}) {
  const profile = opts.profile || "mining";
  const rows = [];
  for (const [name, node] of Object.entries(softwares || {})) {
    let total = 0, wsum = 0, hasHardNegCritical = false;
    const feats = node?.features || {};
    for (const [featName, comment] of Object.entries(feats)) {
      const { value, weight, hardNeg } = scoreFeature(featName, comment, { profile });
      total += value; wsum += weight;
      if (hardNeg && CRITICAL_KEYS.has(featName)) hasHardNegCritical = true;
    }
    let score = wsum > 0 ? (total / wsum) * 100 : 0;
    if (hasHardNegCritical) score = Math.min(score, 60);
    rows.push({ name, score: formatNumber(score, 1) });
  }
  rows.sort((a, b) => b.score - a.score);
  return rows;
}

// ========= Compatibilidad v3.7.1 =========
// Algunas páginas (Home.jsx) importan estos utilitarios.
// Los definimos de forma segura para no romper el build.

/** Prepara/normaliza el dataset si fuese necesario.
 *  En esta versión, devolvemos tal cual para mantener compatibilidad.
 */
export function prepareData(data) {
  return data;
}

/** Devuelve clases Tailwind para chips/badges según el estado del texto. */
export function classForCell(value) {
  const v = String(value ?? "").toLowerCase();

  const POS = "bg-emerald-50 text-emerald-800 border border-emerald-200";
  const WARN = "bg-amber-50 text-amber-900 border border-amber-200";
  const NEG = "bg-rose-50 text-rose-900 border border-rose-200";
  const NEU = "bg-slate-50 text-slate-600 border border-slate-200";

  if (/[✔✓]\b|alta\b|nativa|agn[oó]stic|bajo.*tco|smart objects|hot-?standby|prp|hsr|iec\s*62443|html5/i.test(v)) {
    return POS;
  }
  if (/⚠|media\b|requiere (personalizaci[oó]n|ingenier[íi]a|desarrollo|servicios externos|c[oó]digo)|variable seg[uú]n/i.test(v)) {
    return WARN;
  }
  if (/❌|no nat|dependiente de su propio hardware|costoso|licenciamiento complejo|migraciones costosas|limitada.*reingenier|no disponible/i.test(v)) {
    return NEG;
  }
  return NEU;
}
