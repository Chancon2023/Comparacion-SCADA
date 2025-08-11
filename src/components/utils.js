export const COLORS = [
  "#2563EB","#16A34A","#F59E0B","#DB2777","#0EA5E9","#10B981",
  "#8B5CF6","#EF4444","#F97316","#22D3EE","#84CC16","#A855F7"
];

// ASCII-safe helpers (no literal emojis in source)
const OK_SIGNS = ["\u2714", "\u2705"];          // ✔, ✅
const WARN_SIGNS = ["\u26A0"];                  // ⚠
const NO_SIGNS = ["\u2716", "\u274C", "\u26D4"]; // ✖, ❌, ⛔

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[áàâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[íìîï]/g, "i")
    .replace(/[óòôö]/g, "o")
    .replace(/[úùûü]/g, "u");
}

function hasAnyChar(s, arr) {
  const str = String(s || "");
  return arr.some((ch) => str.indexOf(ch) >= 0);
}

export function scoreValue(v) {
  const t = normalize(v);
  if (hasAnyChar(v, OK_SIGNS) || /\b(alta|yes|si)\b/.test(t)) return 2;
  if (hasAnyChar(v, WARN_SIGNS) || /\bmedia\b/.test(t)) return 1;
  if (hasAnyChar(v, NO_SIGNS) || /\bno\b/.test(t)) return 0;
  return 1;
}

export function classForCell(v) {
  const t = normalize(v);
  if (hasAnyChar(v, OK_SIGNS) || /\b(alta|yes|si)\b/.test(t)) return "cell ok";
  if (hasAnyChar(v, WARN_SIGNS) || /\bmedia\b/.test(t)) return "cell warn";
  if (hasAnyChar(v, NO_SIGNS) || /\bno\b/.test(t)) return "cell no";
  return "cell";
}
