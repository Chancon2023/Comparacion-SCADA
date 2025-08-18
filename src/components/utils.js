// Utilidades comunes (sin dependencias externas)
export const COLORS = [
  "#0ea5e9", "#22c55e", "#f97316", "#a78bfa", "#14b8a6", "#f43f5e", "#eab308", "#8b5cf6"
];

export function slugify(txt){
  return (txt||"platform").toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,80);
}

// Fallbacks de dataset en /public/data/
const CANDIDATES = [
  "/data/scada_dataset.json",
  "/data/scada_dataset_mining_extended.json",
  "/data/dataset.json"
];

export async function fetchDataset(){
  for (const url of CANDIDATES){
    try{
      const res = await fetch(url, {cache:"no-store"});
      if (res.ok){
        const data = await res.json();
        return normalizeDataset(data);
      }
    }catch(_e){ /* ignore */ }
  }
  return { platforms: [], raw: null, source: null };
}

function normalizeDataset(data){
  // Permite array directo o {platforms:[...]}
  const arr = Array.isArray(data) ? data : (Array.isArray(data?.platforms) ? data.platforms : []);
  const CRITICAL = ["Ciberseguridad","Redundancia","Protocolos","Compatibilidad con hardware"];
  const platforms = arr.map((it, idx) => {
    const name = it.name || it.plataforma || it.Platform || it.title || `Plataforma ${idx+1}`;
    const slug = slugify(name);
    const scores = {};
    for (const k of CRITICAL){
      let v = null;
      if (typeof it?.scores?.[k] === "number") v = it.scores[k];
      else if (typeof it[k] === "number") v = it[k];
      else if (typeof it[k] === "boolean") v = it[k] ? 1 : 0;
      if (v === null){
        // intenta buscar en claves anidadas por nombre
        const key = Object.keys(it).find(kk => kk.toLowerCase().includes(k.toLowerCase()));
        if (key && typeof it[key] === "number") v = it[key];
      }
      if (typeof v !== "number" || !isFinite(v)) v = 0; // default seguro
      // Normaliza 0..1 si parece porcentaje
      if (v > 1) v = Math.min(1, v/100);
      if (v < 0) v = 0;
      scores[k] = v;
    }
    return { name, slug, scores, raw: it };
  });
  return { platforms, raw: data, source: "public/data" };
}

export function scoreValue(scores){
  const vals = Object.values(scores||{});
  if (!vals.length) return 0;
  return vals.reduce((a,b)=>a+b,0)/vals.length;
}

export function classForCell(v){
  if (v >= 0.75) return "badge";
  if (v >= 0.5) return "badge";
  return "badge";
}

export function computeRadarRow(platform){
  // Devuelve pares {feature, value}
  const rows = [];
  for (const [k,v] of Object.entries(platform.scores||{})){
    rows.push({ feature: k, value: Number(v) });
  }
  return rows;
}
