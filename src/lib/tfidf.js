
const tokenize = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9áéíóúñ\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

export function chunkText(text, maxLen = 1000, overlap = 150) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += (maxLen - overlap)) {
    const slice = words.slice(i, i + maxLen);
    if (slice.length === 0) break;
    chunks.push(slice.join(" "));
    if (i + maxLen >= words.length) break;
  }
  return chunks;
}

export function buildTfidf(docs) {
  // docs: [{ id, title, text, meta }]
  const CHUNK = 1200;
  const OVER = 200;
  const vocab = new Map();
  const documents = []; // chunks [{ id, docId, title, text, page? }]
  let chunkId = 0;

  for (const d of docs) {
    const parts = chunkText(d.text || "", CHUNK, OVER);
    let pageGuess = 1;
    for (const part of parts) {
      const tokens = tokenize(part);
      const tf = new Map();
      for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
      documents.push({
        id: chunkId++,
        docId: d.id,
        title: d.title || d.name || "(sin título)",
        text: part,
        tf,
        page: extractPageHint(part) || pageGuess++,
      });
      for (const t of tf.keys()) vocab.set(t, (vocab.get(t) || 0) + 1);
    }
  }

  const N = documents.length || 1;
  const idf = new Map();
  for (const [t, df] of vocab.entries()) {
    idf.set(t, Math.log((N + 1) / (df + 1)) + 1);
  }

  // Pre-compute vector norms for each doc chunk
  for (const doc of documents) {
    let norm = 0;
    for (const [t, freq] of doc.tf.entries()) {
      const w = (freq) * (idf.get(t) || 0);
      norm += w * w;
    }
    doc.norm = Math.sqrt(norm) || 1e-6;
  }

  return { idf, documents };
}

export function queryTfidf(index, query, k = 5) {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];
  const { idf, documents } = index;

  // Build query vector
  const qtf = new Map();
  for (const t of qTokens) qtf.set(t, (qtf.get(t) || 0) + 1);
  let qnorm = 0;
  for (const [t, freq] of qtf.entries()) {
    const w = (freq) * (idf.get(t) || 0);
    qnorm += w * w;
  }
  qnorm = Math.sqrt(qnorm) || 1e-6;

  const scores = [];
  for (const doc of documents) {
    let score = 0;
    for (const [t, freq] of qtf.entries()) {
      const wq = (freq) * (idf.get(t) || 0);
      const wd = (doc.tf.get(t) || 0) * (idf.get(t) || 0);
      score += wq * wd;
    }
    const cos = score / (qnorm * (doc.norm || 1e-6));
    if (cos > 0) {
      scores.push({ cos, doc });
    }
  }

  scores.sort((a, b) => b.cos - a.cos);
  return scores.slice(0, k).map(({ cos, doc }) => ({
    score: cos,
    id: doc.id,
    title: doc.title,
    text: doc.text,
    page: doc.page,
  }));
}

function extractPageHint(text) {
  // busca [página X]
  const m = /\[página\s+(\d+)\]/i.exec(text);
  if (m) return parseInt(m[1], 10);
  return null;
}
