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

// Reglas de ALERTAS DURAS (frases exactas o casi exactas del cliente)

const HARD_NEG_RULES = [
  // IEC 61850 driver / MMS issues y "no funciona"
  { re: /(falla|fallo|falla.*driver|driver.*falla).*(iec\s*61850|61850).*(mms|comunicaci[oó]n)/, note: "Falla el driver IEC 61850 para comunicación MMS entre IEDs y SCADA." },
  { re: /(driver|controlador).*(iec\s*61850|61850).*(no\sfunciona|no\soper[aá]|no\sintegra)/, note: "IEC 61850 no soportado adecuadamente: driver no integra correctamente." },
  { re: /(iec\s*61850|61850).*(no\ssoportado|deficiente|inadecuad[oa]|incapaz).*(integrar|integraci[oó]n).*(marcas|distintas)/, note: "IEC 61850 inadecuado: no integra IED de diferentes marcas." },
  { re: /ning[uú]n?\s+caso\s+de\s+[eé]xito.*integraci[oó]n.*(iec)?\s*61850/, note: "Sin casos de éxito en integración IEC 61850." },

  // Redundancia no funciona
  { re: /redundan(cia)?\s+(no\sfunciona|no\sopera|no\slogra\sconfigurar)/, note: "La redundancia no funciona." },

  // Logs llenan discos (soporta 'logs' o 'ogs')
  { re: /l?ogs?.*(llenan|llen[ao]).*discos?.*(servidores?)/, note: "Logs llenan discos de servidores y afectan estabilidad." },

  // Herramienta de desarrollo HMI
  { re: /(herramienta|tool).*desarrollo.*hmi.*(deficient|deficiente|pobre)/, note: "Herramienta de desarrollo HMI deficiente." },

  // Herramientas de configuración tediosas
  { re: /herramientas?\s+de\s+configuraci[oó]n.*tedios[ao]s?/, note: "Herramientas de configuración tediosas." },

  // Actualizaciones / parches problemáticos
  { re: /(actualizaci[oó]n|actualizaciones|parches).*(corregir|errores).*(no\sfuncionan|fallan|procedimiento\s+extenso)/, note: "Actualizaciones para corregir errores: no funcionan de primera o requieren procedimiento extenso." },

  // NTSyCS / agrupamientos / transformación de puntos
  { re: /no\s+cumple.*ntsycs/, note: "No cumple NTSyCS (agrupamientos/transformación de señales con timestamp)." },
  { re: /no\s+es\s+capaz\s+de\s+realizar.*agrupamientos?.*se[nñ]ales?.*(estampa|timestamp|tiempo)/, note: "No agrupa señales manteniendo estampa de tiempo." },
  { re: /no\s+es\s+posible\s+realizar.*transformaci[oó]n.*puntos?\s+simples?.*a\s+dobles?/, note: "No permite transformar puntos simples a dobles." },
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

  // ALERTAS DURAS: si machea, clasifica directo como negativo con nota
  for (const r of HARD_NEG_RULES) {
    if (r.re.test(t)) {
      return { tag: "neg", note: r.note || "", raw: v };
    }
  }
  for (const r of (typeof HARD_WARN_RULES!=="undefined" ? HARD_WARN_RULES : [])) {
    if (r.re.test(t)) {
      return { tag: "warn", note: r.note || "", raw: v };
    }
  }


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
    else if (a.tag === "neg") cons.add(a.note ? (k + ": " + a.note) : msg);
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

// --------- Categorización por área y ponderación ---------
const AREA_RULES = [
  { area: "Seguridad", test: /(seguridad|nerc|cip|ciber|antivirus|hardening|ldap|rbac|ntsycs)/ },
  { area: "Redundancia", test: /(redundan|prp|hsr|servidor(es)? primario|backup|cluster|alta disponibilidad)/ },
  { area: "Integración", test: /(integrac|protocolos|iec\s*61850|dnp3|modbus|opc|opc ua|iec\s*60870|104|mqtt)/ },
];

export function detectArea(featureName) {
  const t = normalize(featureName);
  for (const rule of AREA_RULES) {
    if (rule.test.test(t)) return rule.area;
  }
  return "General";
}

// Pesos por área (pedido del cliente)
export const DEFAULT_WEIGHTS = {
  "Seguridad": 2.0,
  "Redundancia": 1.5,
  "Integración": 1.2,
  "General": 1.0
};

// Scoring ponderado (0..2) con opcion "soloCriticos"
export function weightedScoreForFeature(featureName, rawValue, weights=DEFAULT_WEIGHTS) {
  const area = detectArea(featureName);
  const w = weights[area] ?? 1.0;
  const base = scoreValue(rawValue); // 0, 0.5, 1, 2
  return {score: base, weight: w, area};
}

export function computeRadarRow(selectedNames, featureName, data, showAvg, weights=DEFAULT_WEIGHTS, soloCriticos=false) {
  const area = detectArea(featureName);
  const isCritical = (area==="Seguridad" || area==="Redundancia" || area==="Integración");
  if (soloCriticos && !isCritical) return null;

  const entry = { feature: featureName };
  // Selected series
  selectedNames.forEach(n => {
    const v = data.softwares[n]?.features?.[featureName];
    entry[n] = scoreValue(v); // render unweighted value (scale 0..2)
  });
  // Promedio de otros (unweighted display; weighting se usa en ranking)
  if (showAvg) {
    let sum=0, count=0;
    Object.keys(data.softwares).forEach(n => {
      if (selectedNames.includes(n)) return;
      const v = data.softwares[n]?.features?.[featureName];
      if (v!==undefined) { sum += scoreValue(v); count++; }
    });
    entry["Promedio otros"] = count? sum/count : 0;
  }
  entry._area = area;
  entry._critical = isCritical;
  return entry;
}

// Ranking normalizado 0..100 usando pesos por área y penalizando advertencias
export function computeRanking(data, weights=DEFAULT_WEIGHTS, soloCriticos=false) {
  const names = Object.keys(data.softwares || {});
  const rows = names.map((n) => {
    const feats = data.softwares[n]?.features || {};
    let wsum = 0, sum = 0;
    for (const [k,v] of Object.entries(feats)) {
      const area = detectArea(k);
      const isCritical = (area==="Seguridad" || area==="Redundancia" || area==="Integración");
      if (soloCriticos && !isCritical) continue;
      const w = weights[area] ?? 1.0;
      const s = scoreValue(v); // 0,0.5,1,2
      sum += w * s;
      wsum += w * 2; // max for this feature with weight
    }
    const score = wsum ? (sum/wsum) : 0; // 0..1
    const { pros, cautions, cons } = extractFindings(feats);
    return { name: n, score: Number((score*100).toFixed(1)), pros, cautions, cons };
  });
  rows.sort((a,b)=> b.score - a.score);
  return rows;
}


// Reglas de ADVERTENCIAS DURAS (si machea, va a "A tener en cuenta")

// Reglas de ADVERTENCIAS DURAS (mensajes firmes pero no de falla)
const HARD_WARN_RULES = [
  { re: /curva\s+de\s+aprendizaje.*(inicialmente)?.*complej[ao].*(pero)?.*(documentaci[oó]n|herramientas).*ayud[aen]/, note: "Curva de aprendizaje: inicialmente complejo, la documentación ayuda." },
];

