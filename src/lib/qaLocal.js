// src/lib/qaLocal.js
// Carga perezosa de modelos locales en el navegador usando @xenova/transformers (CDN ESM).
// Proporciona: embeddings (MiniLM) + QA extractivo (XLM-R SQuAD2).
// Todo corre 100% local (descarga modelos una vez y cachea en IndexedDB).

let _transformers = null;
let _embPipe = null;
let _qaPipe = null;
let _status = { ready: false, loading: false, message: "idle" };

export function getLocalAISatus() {
  return _status;
}

export async function loadLocalAI(options = {}) {
  if (_status.loading || _status.ready) return _status;
  _status.loading = true;
  _status.message = "Descargando modelos… (se guardan en caché)";

  // Carga la librería desde CDN. Vite no la "bundlea" por el @vite-ignore
  const url = "https://cdn.jsdelivr.net/npm/@xenova/transformers@3.1.0";
  // Nota: usamos el entrypoint ESM, la librería gestionará los pesos vía fetch
  // y los toma desde HuggingFace. El navegador los cachea.
  // eslint-disable-next-line
  const mod = await import(/* @vite-ignore */ url);
  _transformers = mod;

  const { env, pipeline } = _transformers;
  env.allowLocalModels = false;          // usamos modelos remotos (caché local del navegador)
  env.allowRemoteModels = true;
  env.backends.onnx.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/";
  // Para GPUs con WebGPU, la lib intentará usarlo automáticamente

  // 1) Embeddings - tamaño contenido para navegadores (≈80MB)
  _status.message = "Cargando modelo de embeddings…";
  _embPipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  // 2) QA extractivo multilingüe (sirve para español) (≈180MB)
  _status.message = "Cargando modelo de QA…";
  _qaPipe = await pipeline("question-answering", "Xenova/deepset/xlm-roberta-base-squad2");

  _status.ready = true;
  _status.loading = false;
  _status.message = "Modelos listos";
  return _status;
}

// Utilidad: normaliza un vector
function normalize(vec) {
  let s = 0;
  for (let i = 0; i < vec.length; i++) s += vec[i] * vec[i];
  s = Math.sqrt(Math.max(s, 1e-12));
  return vec.map((x) => x / s);
}

// Cosine similarity
function cosSim(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export async function embed(text) {
  if (!_embPipe) throw new Error("Embeddings no inicializados. Llama a loadLocalAI() primero.");
  const output = await _embPipe(text, { pooling: "mean", normalize: true });
  // transformers.js retorna un objeto tipo Tensor; usamos .data
  const arr = Array.from(output.data);
  return arr; // ya normalizado
}

// Dado un array de textos, calcula embeddings en serie (para ahorrar RAM)
export async function embedBatch(texts = []) {
  const out = [];
  for (const t of texts) out.push(await embed(t));
  return out;
}

// Pregunta/Respuesta extractiva sobre 'context' (concatenado de chunks)
// Devuelve { answer, score, start, end }.
export async function qa(question, context) {
  if (!_qaPipe) throw new Error("QA no inicializado. Llama a loadLocalAI() primero.");
  const res = await _qaPipe({ question, context });
  return res;
}

// Reranking por similitud de embeddings (y opcionalmente score BM25)
// items: [{ id, text, meta, bm25? }]
// Devuelve topK con campo score combinado
export async function rerankWithEmbeddings(question, items, { wLex = 0.35, wVec = 0.65, topK = 6 } = {}) {
  const qVec = await embed(question);
  const ranked = [];
  for (const it of items) {
    // Si el item ya trae embedding precomputado, úsalo; si no, calcúlalo al vuelo.
    let e = it.embedding;
    if (!e) {
      e = await embed(it.text);
      it.embedding = e;
    }
    const cos = cosSim(qVec, e); // [-1, 1], ya normalizados
    const lex = typeof it.bm25 === "number" ? it.bm25 : 0;
    const score = wLex * lex + wVec * cos;
    ranked.push({ ...it, score });
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, topK);
}

// Selecciona contexto final con MMR para diversidad
export function selectMMR(candidates, { topK = 5, lambda = 0.5 }) {
  if (candidates.length <= topK) return candidates;
  const selected = [candidates[0]];
  const rest = candidates.slice(1);
  while (selected.length < topK && rest.length) {
    let best = null;
    let bestScore = -Infinity;
    for (const cand of rest) {
      const simSelected = Math.max(...selected.map(s => cosineFromMeta(s, cand)));
      const score = lambda * cand.score - (1 - lambda) * simSelected;
      if (score > bestScore) {
        bestScore = score;
        best = cand;
      }
    }
    selected.push(best);
    const idx = rest.findIndex(x => x.id === best.id);
    if (idx >= 0) rest.splice(idx, 1);
  }
  return selected;
}

// Si guardamos embedding en meta, calculamos sim; si no, 0
function cosineFromMeta(a, b) {
  const va = a.embedding;
  const vb = b.embedding;
  if (!va || !vb) return 0;
  let s = 0;
  for (let i = 0; i < va.length; i++) s += va[i] * vb[i];
  return s;
}
