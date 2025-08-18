
// src/components/utils.js
export async function loadDataset() {
  const paths = ["/data/scada_dataset.json", "/data/scada_dataset_mining_extended.json", "/data/dataset.json"];
  for (const p of paths) {
    try {
      const res = await fetch(p, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        data.__sourcePath = p;
        return data;
      }
    } catch (e) {
      // ignore and try next
    }
  }
  throw new Error("No se encontró un dataset en /public/data/. Coloca un JSON (p.ej. scada_dataset.json) y vuelve a intentar.");
}

export function computeScore(platform, weights) {
  const scores = platform.scores || {};
  let s = 0; let w = 0;
  Object.entries(weights || {}).forEach(([k, wk]) => {
    const v = typeof scores[k] === "number" ? scores[k] : 0;
    s += v * wk;
    w += wk;
  });
  let base = w > 0 ? (s / w) : 0;

  // penalizaciones por red flags
  const flags = platform.red_flags || [];
  let penalty = 0;
  for (const f of flags) {
    if (!f) continue;
    const sev = (f.severity || "").toLowerCase();
    if (sev === "hard") penalty += 8;
    else if (sev === "medium") penalty += 4;
    else penalty += 1;
  }
  const finalScore = Math.max(0, Math.min(100, base - penalty));
  return { base: Math.round(base), penalty, final: Math.round(finalScore) };
}

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Merge local editable comments stored in localStorage
export function mergeEditableComments(data) {
  try {
    const local = JSON.parse(localStorage.getItem("scada-comments") || "{}");
    if (!local || typeof local !== "object") return data;
    const copy = JSON.parse(JSON.stringify(data));
    for (const p of copy.platforms || []) {
      const edits = local[p.id];
      if (edits?.comments) {
        p.comments = edits.comments;
      }
    }
    return copy;
  } catch {
    return data;
  }
}
