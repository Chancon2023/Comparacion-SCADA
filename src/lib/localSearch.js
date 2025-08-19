import { getDocs } from "./localDocs";

// Segmenta texto y busca por conteo de palabras clave (simple y liviano)
function chunkText(text, size = 1000) {
  const res = [];
  for (let i = 0; i < text.length; i += size) {
    res.push(text.slice(i, i + size));
  }
  return res;
}

export function buildSegments() {
  const docs = getDocs();
  const segments = [];
  docs.forEach((d) => {
    const parts = chunkText(d.text, 1200);
    parts.forEach((p, idx) =>
      segments.push({
        id: `${d.name}-${idx}`,
        source: d.name,
        text: p,
      })
    );
  });
  return segments;
}

export function search(question, limit = 3) {
  const q = (question || "").toLowerCase().trim();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const segs = buildSegments();
  const scored = segs
    .map((s) => {
      const T = s.text.toLowerCase();
      let score = 0;
      terms.forEach((t) => {
        const m = T.match(new RegExp(`\\b${escapeRegex(t)}`, "g"));
        score += m ? m.length : 0;
      });
      return { ...s, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
