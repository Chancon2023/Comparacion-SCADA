// Utilidades mínimas seguras. Ajusta/une con tu archivo actual si ya existe.
export const COLORS = [
  "#2563eb","#16a34a","#f59e0b","#ef4444","#8b5cf6","#14b8a6","#e11d48"
];

export function scoreValue(val) {
  if (typeof val !== "number" || isNaN(val)) return 0;
  // clamp 0..100
  return Math.max(0, Math.min(100, val));
}

export function prepareData(raw) {
  // Asegura estructura base
  if (!raw || typeof raw !== "object") return { platforms: [], features: [] };
  const platforms = raw.platforms || [];
  const features = raw.features || [];
  return { platforms, features };
}
