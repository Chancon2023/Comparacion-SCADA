export const COLORS = [
  "#2563EB","#16A34A","#F59E0B","#DB2777","#0EA5E9","#10B981",
  "#8B5CF6","#EF4444","#F97316","#22D3EE","#84CC16","#A855F7"
];

const ALIASES = {
  "zenon energy edition (ncs)": "Zenon COPADATA",
  "zenon energy edition": "Zenon COPADATA",
  "zenon (ncs)": "Zenon COPADATA",
  "zee600 abb (zenon)": "Zenon COPADATA"
};

const OK_SIGNS = ["\u2714"];
const WARN_SIGNS = ["\u26A0"];
const NO_SIGNS = ["\u2716", "\u274C", "\u26D4"];

function normalize(str) {
  const s = String(str || "");
  return s
    .toLowerCase()
    .replace(/[áàâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[íìîï]/g, "i")
    .replace(/[óòôö]/g, "o")
    .replace(/[úùûü]/g, "u")
    .replace(/[ñ]/g, "n");
}

function hasAny(str, arr) {
  const t = String(str || "");
  return arr.some(ch => t.indexOf(ch) >= 0);
}

export function scoreValue(v) {
  const t = normalize(v);
  const pos = /(amigable|facil|intuitivo|robust|escalab|redundan|segur|cumple|soporta|integrac|flexib|rapido|alto desempeno|no requiere|no es necesario)/;
  const neg = /(no soporta|no cumple|no permite|no cuenta|no es compatible|no funciona|licencia(s)? (costosa|cara)|complej|dificil|lento|limitad|inestabl|requiere software externo)/;
  if (hasAny(v, OK_SIGNS) || pos.test(t)) return 2;
  if (hasAny(v, NO_SIGNS) || neg.test(t)) return 0;
  if (hasAny(v, WARN_SIGNS) || /\bmedia\b/.test(t)) return 1;
  return 1;
}

export function classForCell(v) {
  const t = normalize(v);
  const pos = /(amigable|facil|intuitivo|robust|escalab|redundan|segur|cumple|soporta|integrac|flexib|rapido|alto desempeno|no requiere|no es necesario)/;
  const neg = /(no soporta|no cumple|no permite|no cuenta|no es compatible|no funciona|licencia(s)? (costosa|cara)|complej|dificil|lento|limitad|inestabl|requiere software externo)/;
  if (hasAny(v, OK_SIGNS) || pos.test(t)) return "cell ok";
  if (hasAny(v, NO_SIGNS) || neg.test(t)) return "cell no";
  if (hasAny(v, WARN_SIGNS) || /\bmedia\b/.test(t)) return "cell warn";
  return "cell";
}

export function extractProsCons(features) {
  const pros = new Set();
  const cons = new Set();
  for (const [k, raw] of Object.entries(features || {})) {
    const v = String(raw || "");
    const t = normalize(v);
    const positive = (hasAny(v, OK_SIGNS) || /(amigable|facil|intuitivo|robust|escalab|redundan|segur|cumple|soporta|integrac|flexib|rapido|alto desempeno|no requiere|no es necesario)/.test(t));
    const negative = (hasAny(v, NO_SIGNS) || /(no soporta|no cumple|no permite|no cuenta|no es compatible|no funciona|licencia(s)? (costosa|cara)|complej|dificil|lento|limitad|inestabl|requiere software externo)/.test(t));
    const msg = (k + ": " + v).trim();
    if (positive && !negative) pros.add(msg);
    else if (negative && !positive) cons.add(msg);
  }
  return { pros: Array.from(pros).slice(0, 8), cons: Array.from(cons).slice(0, 8) };
}

export function prepareData(raw) {
  if (!raw || !raw.softwares) return raw;
  const out = { ...raw, softwares: {} };
  for (const [name, s] of Object.entries(raw.softwares)) {
    out.softwares[name] = { description: s.description || "", pros: s.pros || [], cons: s.cons || [], features: { ...(s.features || {}) } };
  }
  for (const [aliasLower, canonical] of Object.entries(ALIASES)) {
    const found = Object.keys(out.softwares).find(n => normalize(n) === aliasLower);
    if (found) {
      const src = out.softwares[found];
      const dstName = canonical;
      if (!out.softwares[dstName]) out.softwares[dstName] = { description: "", pros: [], cons: [], features: {} };
      const dst = out.softwares[dstName];
      if (!dst.description && src.description) dst.description = src.description;
      for (const [k, v] of Object.entries(src.features || {})) {
        if (!dst.features[k]) dst.features[k] = v;
      }
      dst.pros = Array.from(new Set([...(dst.pros||[]), ...(src.pros||[])]));
      dst.cons = Array.from(new Set([...(dst.cons||[]), ...(src.cons||[])]));
      delete out.softwares[found];
    }
  }
  return out;
}

export function computeRanking(data) {
  const names = Object.keys(data.softwares || {});
  const rows = names.map((n) => {
    const feats = data.softwares[n]?.features || {};
    const vals = Object.values(feats).map(scoreValue);
    const score = vals.length ? vals.reduce((a,b)=>a+b,0) / (2 * vals.length) : 0;
    const { pros, cons } = extractProsCons(feats);
    return { name: n, score: Number((score*100).toFixed(1)), pros, cons };
  });
  rows.sort((a,b)=> b.score - a.score);
  return rows;
}
