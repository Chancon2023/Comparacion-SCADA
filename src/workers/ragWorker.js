
import { buildTfidf, queryTfidf } from "../lib/tfidf";

let INDEX = null;
let DOCS = [];

self.onmessage = async (evt) => {
  const { type, payload } = evt.data || {};
  try {
    if (type === "ingest") {
      const { docs } = payload || {};
      if (Array.isArray(docs) && docs.length) {
        DOCS = [...DOCS, ...docs];
        INDEX = buildTfidf(DOCS);
        postMessage({ type: "indexed" });
      }
      return;
    }
    if (type === "reset") {
      DOCS = [];
      INDEX = null;
      postMessage({ type: "indexed" });
      return;
    }
    if (type === "query") {
      const { query, k = 5 } = payload || {};
      if (!INDEX) {
        postMessage({ type: "error", payload: { message: "No hay índice. Sube documentos primero." } });
        return;
      }
      const hits = queryTfidf(INDEX, query, k);
      if (!hits.length) {
        postMessage({ type: "result", payload: { answer: "No encontré coincidencias en los documentos.", hits: [] } });
        return;
      }
      // síntesis muy simple: unir las 2-3 mejores y truncar
      const topText = hits.slice(0, 3).map(h => h.text).join("\n\n").slice(0, 1200);
      const answer = topText + "\n\n(Sugerencia: verifica las citas indicadas abajo.)";
      postMessage({ type: "result", payload: { answer, hits } });
      return;
    }
  } catch (e) {
    postMessage({ type: "error", payload: { message: e?.message || String(e) } });
  }
};
