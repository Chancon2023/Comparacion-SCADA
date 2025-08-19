// src/lib/localRag.js
// Índice local con BM25 + serialización segura para localStorage

const STORAGE_KEY = "rag_index_v1";

// ---------------- Utils ----------------
const tokenize = (text) =>
  (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9áéíóúñü\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

const uniq = (arr) => Array.from(new Set(arr));

const safeGet = (maybeMap, key) => {
  if (!maybeMap) return 0;
  if (typeof maybeMap.get === "function") return maybeMap.get(key) ?? 0;
  // objeto plano o array de pares
  if (Array.isArray(maybeMap)) {
    // [[k,v],[k2,v2]...]
    const found = maybeMap.find((p) => p[0] === key);
    return found ? found[1] : 0;
  }
  return maybeMap[key] ?? 0;
};

const safeSet = (maybeMap, key, val) => {
  if (!maybeMap) return;
  if (typeof maybeMap.set === "function") {
    maybeMap.set(key, val);
  } else if (Array.isArray(maybeMap)) {
    const idx = maybeMap.findIndex((p) => p[0] === key);
    if (idx >= 0) maybeMap[idx][1] = val;
    else maybeMap.push([key, val]);
  } else {
    maybeMap[key] = val;
  }
};

const mapToEntries = (m) => (m instanceof Map ? Array.from(m.entries()) : m);
const entriesToMap = (e) =>
  e instanceof Map ? e : new Map(Array.isArray(e) ? e : Object.entries(e || {}));

// ---------------- Index building ----------------
function buildIndex(rawDocs) {
  // rawDocs: [{id, title, text, meta?}]
  const docs = [];
  const df = new Map(); // document frequency por término
  let totalLen = 0;

  rawDocs.forEach((rd, i) => {
    const text = `${rd.title || ""}\n${rd.text || ""}`;
    const tokens = tokenize(text);
    const tf = new Map(); // term freq por doc
    tokens.forEach((t) => safeSet(tf, t, safeGet(tf, t) + 1));

    // actualizar DF con términos únicos
    uniq(tokens).forEach((t) => safeSet(df, t, safeGet(df, t) + 1));

    const doc = {
      id: rd.id ?? String(i),
      title: rd.title || "",
      text: rd.text || "",
      meta: rd.meta || {},
      len: tokens.length,
      tf,
    };
    docs.push(doc);
    totalLen += doc.len;
  });

  const avgLen = docs.length ? totalLen / docs.length : 0;

  return { docs, df, N: docs.length, avgLen };
}

// ---------------- Persistencia ----------------
export function saveIndex(index) {
  // Convertir Maps a arrays de entradas
  const serializable = {
    N: index.N,
    avgLen: index.avgLen,
    df: mapToEntries(index.df),
    docs: index.docs.map((d) => ({
      ...d,
      tf: mapToEntries(d.tf),
    })),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

export function loadIndex() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      N: parsed.N,
      avgLen: parsed.avgLen,
      df: entriesToMap(parsed.df),
      docs: (parsed.docs || []).map((d) => ({
        ...d,
        tf: entriesToMap(d.tf),
      })),
    };
  } catch {
    return null;
  }
}

export function clearIndex() {
  localStorage.removeItem(STORAGE_KEY);
}

// ---------------- Indexado desde archivos ----------------
// Esta función debe llamarse con documentos ya “troceados”/extraídos.
export async function indexDocuments(rawDocs) {
  const idx = buildIndex(rawDocs);
  saveIndex(idx);
  return idx;
}

// ---------------- Consulta BM25 ----------------
export function answerQuery(query, topK = 5) {
  const idx = loadIndex();
  if (!idx || !idx.docs?.length) {
    throw new Error("No hay índice cargado/guardado.");
  }

  const k1 = 1.5;
  const b = 0.75;
  const terms = uniq(tokenize(query));

  const scores = idx.docs.map((doc) => {
    let score = 0;
    terms.forEach((t) => {
      const df = safeGet(idx.df, t);
      if (df === 0) return;

      const idf = Math.log(1 + (idx.N - df + 0.5) / (df + 0.5));
      const tf = safeGet(doc.tf, t);
      if (tf === 0) return;

      const denom = tf + k1 * (1 - b + (b * doc.len) / (idx.avgLen || 1));
      score += idf * ((tf * (k1 + 1)) / (denom || 1e-6));
    });
    return { doc, score };
  });

  scores.sort((a, b2) => b2.score - a.score);
  const hits = scores.slice(0, topK).filter((h) => h.score > 0);

  return {
    hits: hits.map((h) => ({
      id: h.doc.id,
      title: h.doc.title,
      text: h.doc.text,
      meta: h.doc.meta,
      score: Number(h.score.toFixed(5)),
    })),
    totalDocs: idx.N,
  };
}
