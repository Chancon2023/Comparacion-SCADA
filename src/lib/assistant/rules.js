// src/lib/assistant/rules.js
// Pesos/heurísticas y dataset base de ejemplo.

export const DEFAULT_WEIGHTS = {
  seguridad: 0.35,
  redundancia: 0.25,
  protocolos: 0.20,
  mantenimiento: 0.10,
  web: 0.10
};

// Palabras clave → aumentos de peso
export const KEYWORD_WEIGHT_BOOSTS = [
  { keys: ["iec61850", "iec 61850", "61850", "dnp3", "modbus", "iec 60870"], field: "protocolos", boost: 0.15 },
  { keys: ["redundancia", "hsr", "prp", "alta disponibilidad", "hot standby"], field: "redundancia", boost: 0.15 },
  { keys: ["seguridad", "iec 62443", "ciberseguridad", "active directory"], field: "seguridad", boost: 0.15 },
  { keys: ["web", "cliente web", "html5", "moviles", "móviles", "remoto"], field: "web", boost: 0.10 },
  { keys: ["mantenimiento", "operación", "facilidad", "plantillas"], field: "mantenimiento", boost: 0.10 },
  { keys: ["minería", "minera"], field: "seguridad", boost: 0.05 },
];

// Penalizaciones por red flags (se aplican si el nombre de la plataforma coincide)
export const RED_FLAGS = {
  "Power Operation Schneider": [
    "No cumple con NTSyCS (agrupamiento de señales con timestamp y conversiones simple→doble)",
    "Falla de driver IEC61850 (MMS) entre IEDs y SCADA",
    "Logs incontrolados que llenan discos de servidores",
    "La redundancia no funciona de forma confiable",
    "Herramienta de pantallas HMI deficiente",
    "IEC61850 no soportado adecuadamente (IEDs de distintas marcas)",
    "Herramientas de configuración tediosas",
    "Actualizaciones correctivas extensas y con fricción"
  ],
  "Siemens Spectrum Power": [],
  "Hitachi Network Manager": [],
  "zenon Energy Edition (NCS)": []
};

// Penalización en puntos por cada red flag (por defecto)
export const RED_FLAG_PENALTY = 8;

// Dataset mínimo de ejemplo (si no existe public/data/scada_dataset.json)
export const SAMPLE_DATASET = [
  {
    name: "zenon Energy Edition (NCS)",
    vendor: "COPA-DATA",
    features: {
      seguridad: 95,
      redundancia: 92,
      protocolos: 90,
      mantenimiento: 88,
      web: 90
    },
    comentarios: [
      "Plataforma unificada: SCADA/DMS/GIS/Historian/Comms.",
      "Web nativo HTML5, multilenguaje, multitáctil.",
      "Compatibilidad entre versiones asegurada.",
      "Soporte local en Chile (partners certificados)."
    ]
  },
  {
    name: "Siemens Spectrum Power",
    vendor: "Siemens",
    features: {
      seguridad: 90,
      redundancia: 90,
      protocolos: 88,
      mantenimiento: 70,
      web: 70
    },
    comentarios: [
      "Orientado a utilities. Módulos separados para GIS/SE.",
      "Licenciamiento y costo elevados (enterprise)."
    ]
  },
  {
    name: "Hitachi Network Manager",
    vendor: "Hitachi",
    features: {
      seguridad: 88,
      redundancia: 88,
      protocolos: 85,
      mantenimiento: 72,
      web: 72
    },
    comentarios: [
      "Gestión avanzada de redes T&D.",
      "Algunas funciones requieren desarrollo adicional."
    ]
  },
  {
    name: "Power Operation Schneider",
    vendor: "Schneider",
    features: {
      seguridad: 70,
      redundancia: 65,
      protocolos: 70,
      mantenimiento: 60,
      web: 65
    },
    comentarios: [
      "Verificar implementaciones de IEC61850.",
      "Revisar roadmap de correcciones/actualizaciones."
    ]
  }
];

export function normalizeWeights(inputText) {
  const weights = { ...DEFAULT_WEIGHTS };
  const txt = (inputText || "").toLowerCase();
  KEYWORD_WEIGHT_BOOSTS.forEach(({keys, field, boost}) => {
    if (keys.some(k => txt.includes(k))) {
      weights[field] = Math.min(weights[field] + boost, 0.60); // límite por categoría
    }
  });
  // Re-normaliza a 1.0
  const sum = Object.values(weights).reduce((a,b)=>a+b,0);
  Object.keys(weights).forEach(k => weights[k] = weights[k] / sum);
  return weights;
}