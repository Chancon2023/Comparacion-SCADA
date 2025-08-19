// Persistencia simple en localStorage (navegador)
const KEY = "local_docs_v1";

export function getDocs() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addDocs(docsArray) {
  const current = getDocs();
  const merged = [...current, ...docsArray];
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}

export function clearDocs() {
  localStorage.removeItem(KEY);
}

export function hasDocs() {
  return getDocs().length > 0;
}
