export const COLORS = [
  "#2563EB","#16A34A","#F59E0B","#DB2777","#0EA5E9","#10B981",
  "#8B5CF6","#EF4444","#F97316","#22D3EE","#84CC16","#A855F7"
];

// Unificación de Zenon
const ALIASES = {
  "zenon energy edition (ncs)": "Zenon COPADATA",
  "zenon energy edition": "Zenon COPADATA",
  "zenon (ncs)": "Zenon COPADATA",
  "zee600 abb (zenon)": "Zenon COPADATA"
};

// Normalización básica
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

// Diccionarios de señales
const POS = [
  "amigable","facil","intuitivo","robust","escalab","redundan","segur",
  "cumple","soporta","integrac","flexib","rapido","alto desempeno",
  "no requiere","no es necesario","implementacion exitosa","exitos"
];

const NEG = [
  "no soporta","no cumple","no permite","no cuenta","no es compatible",
  "no funciona","falla","inestabl","bug","error","limitad","licencia costosa","licencias costosas",
  "dificil","complej","requiere software externo","alto costo","caro","caras","no disponible",
  "driver","controlador","no recomendado","problema","problemas"
];

const WARN = [
  "a comprobar","pendiente","por definir","validar","en pruebas","revisar"
];

// Reglas especiales de contradiccion (documentacion vs practica)
const SPECIAL = [
  // IEC 61850: si aparecen "61850" y alguna negativa del set: no funciona/problemas/driver -> advertencia
  { when: /61850|iec ?61850/, neg: /(no funciona|problema|driver|controlador|inestabl|falla)/, reason: "Soporte IEC 61850 declarado, pero observadas incidencias (driver/problemas)." },
  // PRP/HSR
  { when: /prp|hsr/, neg: /(no funciona|problema|inestabl|falla)/, reason: "Soporte PRP/HSR declarado, pero reportadas incidencias en practica." },
];

function any(t, list) { return list.some(x => t.includes(x)); }

export function analyzeText(raw) {
  const v = String(raw || "");
  const t = normalize(v);

  const pos = any(t, POS);
  const neg = any(t, NEG);
  const warn = any(t, WARN);
  let specialNote = "";

  // Detectar contradicciones por reglas especiales
  for (const rule of SPECIAL) {
    if (rule.when.test(t) && rule.neg.test(t)) {
      specialNote = rule.reason;
      break;
    }
  }

  if (neg && pos) return { tag: "warn", note: specialNote || "Comentario con señales positivas y negativas: validar en pruebas.", raw: v };
  if (specialNote) return { tag: "warn", note: specialNote, raw: v };
  if (warn) return { tag: "warn", note: "A comprobar/validar según documento.", raw: v };
  if (neg) return { tag: "neg", note: "", raw: v };
  if (pos) return { tag: "pos", note: "", raw: v };
  return { tag: "neutral", note: "", raw: v };
}

// Puntuacion para radar (0..2)
export function scoreValue(v) {
  const a = analyzeText(v);
  if (a.tag === "neg") return 0;
  if (a.tag === "warn") return 0.5;
  if (a.tag === "pos") return 2;
  return 1; // neutral
}

// Clase para celda en matrices
export function classForCell(v) {
  const t = analyzeText(v).tag;
  if (t === "pos") return "cell ok";
  if (t === "neg") return "cell no";
  if (t === "warn") return "cell warn";
  return "cell";
}

// Pros / Advertencias / Contras a partir de las caracteristicas
export function extractFindings(features) {
  const pros = new Set();
  const cautions = new Set();
  const cons = new Set();

  for (const [k, raw] of Object.entries(features || {})) {
    const a = analyzeText(raw);
    const msg = (k + ": " + String(raw||"")).trim();
    if (a.tag === "pos") pros.add(msg);
    else if (a.tag === "warn") cautions.add((a.note ? (k + ": " + a.note) : msg));
    else if (a.tag === "neg") cons.add(msg);
  }
  return {
    pros: Array.from(pros).slice(0, 10),
    cautions: Array.from(cautions).slice(0, 10),
    cons: Array.from(cons).slice(0, 10),
  };
}

// Unificar plataformas (Zenon) y devolver copia limpia
export function prepareData(raw) {
  if (!raw || !raw.softwares) return raw;
  const out = { ...raw, softwares: {} };
  for (const [name, s] of Object.entries(raw.softwares)) {
    out.softwares[name] = { description: s.description || "", pros: [], cons: [], features: { ...(s.features || {}) } };
  }
  function normName(n){ return normalize(n); }
  for (const [aliasLower, canonical] of Object.entries(ALIASES)) {
    const found = Object.keys(out.softwares).find(n => normName(n) === aliasLower);
    if (found) {
      const src = out.softwares[found];
      if (!out.softwares[canonical]) out.softwares[canonical] = { description: "", pros: [], cons: [], features: {} };
      const dst = out.softwares[canonical];
      if (!dst.description && src.description) dst.description = src.description;
      for (const [k, v] of Object.entries(src.features || {})) if (!dst.features[k]) dst.features[k] = v;
      delete out.softwares[found];
    }
  }
  return out;
}

// Ranking normalizado 0..100 (penaliza advertencias)
export function computeRanking(data) {
  const names = Object.keys(data.softwares || {});
  const rows = names.map((n) => {
    const feats = data.softwares[n]?.features || {};
    const analyzed = Object.values(feats).map(analyzeText);
    let sum = 0, count = 0;
    analyzed.forEach(a => { sum += (a.tag==="neg"?0: a.tag==="warn"?0.5: a.tag==="pos"?2:1); count += 1; });
    const score = count ? sum/(2*count) : 0; // 0..1
    // motivos
    const { pros, cautions, cons } = extractFindings(feats);
    return { name: n, score: Number((score*100).toFixed(1)), pros, cautions, cons };
  });
  rows.sort((a,b)=> b.score - a.score);
  return rows;
}
