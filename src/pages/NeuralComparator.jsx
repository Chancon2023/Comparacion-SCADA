import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { motion } from "framer-motion";

const HIDDEN_LAYER = [
  { weights: [1.25, 0, 0, 0], bias: 0.05 },
  { weights: [0, 1.25, 0, 0], bias: 0.05 },
  { weights: [0, 0, 1.25, 0], bias: 0.05 },
  { weights: [0, 0, 0, 1.25], bias: 0.05 },
  { weights: [-1.6, 0, 0, 0], bias: 0.1 },
  { weights: [0, -1.45, 0, 0], bias: 0.1 },
  { weights: [0, 0, -1.4, 0], bias: 0.1 },
  { weights: [0, 0, 0, -1.35], bias: 0.1 },
];

const OUTPUT_LAYER = {
  weights: [1.7, 1.65, 1.6, 1.5, -1.25, -1.2, -1.2, -1.1],
  bias: 0.25,
};

const SCENARIOS = [
  {
    id: "mineria_247",
    name: "Minería 24/7 crítica",
    description: "Operación continua con altos estándares de ciberseguridad y redundancia.",
    values: {
      "Ciberseguridad": 92,
      "Redundancia": 95,
      "Protocolos": 92,
      "Compatibilidad con hardware": 88,
    },
  },
  {
    id: "utility_iec",
    name: "Utility con IEC 61850",
    description: "Empresa eléctrica tradicional con foco en interoperabilidad IEC/DNP.",
    values: {
      "Ciberseguridad": 88,
      "Redundancia": 92,
      "Protocolos": 95,
      "Compatibilidad con hardware": 82,
    },
  },
  {
    id: "laboratorio_piloto",
    name: "Piloto / laboratorio",
    description: "Pruebas de integración con hardware mixto y menor criticidad operativa.",
    values: {
      "Ciberseguridad": 78,
      "Redundancia": 75,
      "Protocolos": 85,
      "Compatibilidad con hardware": 72,
    },
  },
  {
    id: "personalizado",
    name: "Ajustar manualmente",
    description: "Define tus propios umbrales moviendo los controles inferiores.",
    values: null,
  },
];

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const relu = (x) => Math.max(0, x);
const dot = (a, b) => a.reduce((acc, v, i) => acc + v * (b[i] ?? 0), 0);

const RESERVED_KEYS = new Set([
  "id",
  "name",
  "vendor",
  "scores",
  "pros",
  "cons",
  "comments",
  "red_flags",
  "description",
]);

const clampScore = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

const cloneDataset = (dataset) => JSON.parse(JSON.stringify(dataset));

const normalizePlatform = (platform, fallbackId) => {
  if (!platform || typeof platform !== "object") return null;
  const scores = {};

  if (platform.scores && typeof platform.scores === "object") {
    for (const [key, value] of Object.entries(platform.scores)) {
      const num = Number(value);
      if (Number.isFinite(num)) {
        scores[key] = clampScore(num);
      }
    }
  }

  for (const [key, value] of Object.entries(platform)) {
    if (RESERVED_KEYS.has(key)) continue;
    const num = Number(value);
    if (Number.isFinite(num)) {
      scores[key] = clampScore(num);
    }
  }

  const rawId = platform.id ?? fallbackId ?? `platform-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const normalized = {
    id: String(rawId),
    name: String(platform.name ?? `Plataforma sin nombre`),
    vendor: String(platform.vendor ?? "Proveedor no especificado"),
    scores,
    pros: Array.isArray(platform.pros) ? platform.pros : [],
    cons: Array.isArray(platform.cons) ? platform.cons : [],
    red_flags: Array.isArray(platform.red_flags) ? platform.red_flags : [],
    comments: Array.isArray(platform.comments) ? platform.comments : [],
  };

  return normalized;
};

const detectDelimiter = (line) => {
  if (line.includes(";")) return ";";
  if (line.includes("\t")) return "\t";
  return ",";
};

const parseCsv = (text) => {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!rows.length) return [];

  const delimiter = detectDelimiter(rows[0]);
  const headers = rows[0].split(delimiter).map((h) => h.trim());

  return rows.slice(1).map((row) => {
    const values = row.split(delimiter).map((value) => value.trim());
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });
    return record;
  });
};

const normalizeUpload = (raw, idFactory) => {
  if (!raw) return { platforms: [], weights: {} };

  if (Array.isArray(raw)) {
    return {
      platforms: raw
        .map((item, index) => normalizePlatform(item, idFactory(index)))
        .filter(Boolean),
      weights: {},
    };
  }

  const sourcePlatforms = Array.isArray(raw.platforms)
    ? raw.platforms
    : Array.isArray(raw.data)
    ? raw.data
    : [];

  return {
    platforms: sourcePlatforms
      .map((item, index) => normalizePlatform(item, idFactory(index)))
      .filter(Boolean),
    weights: raw.weights && typeof raw.weights === "object" ? raw.weights : {},
  };
};

const DEFAULT_FEATURE_HINTS = [
  "Ciberseguridad",
  "Redundancia",
  "Protocolos",
  "Compatibilidad con hardware",
  "Disponibilidad",
  "Escalabilidad",
  "Integración OT/IT",
  "Monitoreo en tiempo real",
];

let pdfjsLoaderPromise = null;

const ensurePdfjs = async () => {
  if (typeof window === "undefined") {
    throw new Error("La extracción de PDF solo está disponible en el navegador.");
  }

  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  if (!pdfjsLoaderPromise) {
    pdfjsLoaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.js";
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib?.GlobalWorkerOptions) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js";
        }
        resolve(window.pdfjsLib);
      };
      script.onerror = () => {
        reject(new Error("No se pudo cargar PDF.js desde la CDN pública."));
      };
      document.head.appendChild(script);
    });
  }

  return pdfjsLoaderPromise;
};

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado."));
    reader.onload = () => resolve(reader.result || "");
    reader.readAsText(file);
  });

const readFileAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado."));
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });

const extractTextFromPdf = async (arrayBuffer) => {
  const pdfjsLib = await ensurePdfjs();
  const typedArray =
    arrayBuffer instanceof ArrayBuffer ? new Uint8Array(arrayBuffer) : new Uint8Array(arrayBuffer.buffer);
  const task = pdfjsLib.getDocument({ data: typedArray });
  const pdf = await task.promise;

  let text = "";
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    // eslint-disable-next-line no-await-in-loop
    const page = await pdf.getPage(pageNumber);
    // eslint-disable-next-line no-await-in-loop
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    text += `\n${pageText}`;
  }

  return text;
};

const parsePlatformsFromText = (text, features) => {
  const catalog = (features && features.length ? features : DEFAULT_FEATURE_HINTS).map((feat) => ({
    name: feat,
    tokens: feat.toLowerCase().split(/[^a-záéíóúüñ0-9]+/i).filter(Boolean),
  }));

  const lines = text
    .split(/\r?\n|\s{2,}/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const results = [];
  let current = null;
  let currentList = null;

  const flushCurrent = () => {
    if (!current) return;
    const scoreCount = Object.keys(current.scores || {}).length;
    if (scoreCount || current.vendor) {
      if (!current.name) {
        current.name = `Plataforma ${results.length + 1}`;
      }
      results.push(current);
    }
    current = null;
    currentList = null;
  };

  const startPlatform = (nameHint) => {
    flushCurrent();
    current = {
      name: nameHint?.trim() || "",
      vendor: "",
      scores: {},
      pros: [],
      cons: [],
      red_flags: [],
      comments: [],
    };
    currentList = null;
  };

  const ensureCurrent = () => {
    if (!current) {
      startPlatform(`Plataforma ${results.length + 1}`);
    }
    return current;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const platformMatch = line.match(/(?:plataforma|platforma|platform|nombre)\s*[:：-]\s*(.+)/i);
    if (platformMatch) {
      startPlatform(platformMatch[1]);
      return;
    }

    if (/^(plataforma|platform)\b/i.test(line) && !line.includes(":")) {
      const inferred = line.replace(/^(plataforma|platform)\b\s*/i, "");
      startPlatform(inferred);
      return;
    }

    const vendorMatch = line.match(/(?:proveedor|vendor)\s*[:：-]\s*(.+)/i);
    if (vendorMatch) {
      const entry = ensureCurrent();
      entry.vendor = vendorMatch[1].trim();
      return;
    }

    if (/ventajas|fortalezas|beneficios|pros?/i.test(line)) {
      ensureCurrent();
      currentList = "pros";
      return;
    }

    if (/desventajas|contras|limitaciones|riesgos/i.test(line)) {
      ensureCurrent();
      currentList = "cons";
      return;
    }

    if (/alertas|banderas|red\s*flags?/i.test(line)) {
      ensureCurrent();
      currentList = "red_flags";
      return;
    }

    if (/comentarios|notas|observaciones/i.test(line)) {
      ensureCurrent();
      currentList = "comments";
      return;
    }

    if (currentList && /^[•·\-*‒–—]/.test(line)) {
      const entry = ensureCurrent();
      const cleaned = line.replace(/^[•·\-*‒–—\s]+/, "").trim();
      if (cleaned) {
        entry[currentList] = Array.isArray(entry[currentList]) ? entry[currentList] : [];
        entry[currentList].push(cleaned);
      }
      return;
    }

    const numericMatch = line.match(/([A-Za-zÁÉÍÓÚÜÑ0-9\s\/\-]{3,})\s*[:：-]\s*(\d{1,3})(?:\s*\/\s*100)?/);
    if (numericMatch) {
      const label = numericMatch[1].trim();
      const rawValue = Number(numericMatch[2]);
      if (Number.isFinite(rawValue)) {
        const lower = label.toLowerCase();
        const target = catalog.find((feat) => feat.tokens.every((token) => lower.includes(token)));
        if (target) {
          const entry = ensureCurrent();
          entry.scores[target.name] = clampScore(rawValue);
          return;
        }
      }
    }

    if (currentList) {
      const entry = ensureCurrent();
      entry.comments = Array.isArray(entry.comments) ? entry.comments : [];
      entry.comments.push(line);
      currentList = null;
      return;
    }
  });

  flushCurrent();
  return results;
};

const extractPlatformsFromPdf = async (arrayBuffer, features) => {
  const text = await extractTextFromPdf(arrayBuffer);
  return parsePlatformsFromText(text, features);
};

const fetchExternalScadaInsight = async (query) => {
  if (typeof fetch !== "function") {
    return { success: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    const extractFromTopics = (topics) => {
      if (!Array.isArray(topics)) return null;
      for (const topic of topics) {
        if (topic.Text) {
          return { summary: topic.Text, url: topic.FirstURL || "" };
        }
        if (Array.isArray(topic.Topics)) {
          const nested = extractFromTopics(topic.Topics);
          if (nested) return nested;
        }
      }
      return null;
    };

    const summary = data.AbstractText || data.Abstract || "";
    if (summary) {
      return {
        success: true,
        summary,
        url: data.AbstractURL || data.AbstractSource || data.RelatedTopics?.[0]?.FirstURL || "",
      };
    }

    const related = extractFromTopics(data.RelatedTopics);
    if (related) {
      return { success: true, ...related };
    }

    return { success: false };
  } catch (error) {
    console.warn("No se pudo obtener información externa", error);
    return { success: false, error: error.message };
  } finally {
    clearTimeout(timeout);
  }
};

const mergeDataset = (current, incoming, idFactory) => {
  if (!current) {
    const dataset = {
      version: incoming.version ?? "custom",
      weights: incoming.weights ?? {},
      platforms: [],
    };
    incoming.platforms.forEach((platform, index) => {
      const normalized = normalizePlatform(platform, idFactory(index));
      if (normalized) {
        dataset.platforms.push(normalized);
      }
    });
    return { dataset, added: dataset.platforms.length, replaced: 0 };
  }

  const weights = {
    ...(current.weights || {}),
    ...(incoming.weights || {}),
  };

  const platforms = current.platforms ? [...current.platforms] : [];
  const indexById = new Map(platforms.map((platform, index) => [platform.id, index]));
  let added = 0;
  let replaced = 0;

  incoming.platforms.forEach((platform, index) => {
    const normalized = normalizePlatform(platform, idFactory(index));
    if (!normalized) return;

    if (indexById.has(normalized.id)) {
      const existingIndex = indexById.get(normalized.id);
      const existing = platforms[existingIndex];
      platforms[existingIndex] = {
        ...existing,
        ...normalized,
        scores: {
          ...(existing?.scores || {}),
          ...(normalized.scores || {}),
        },
      };
      replaced += 1;
    } else {
      const newId = normalized.id || idFactory(index);
      const ensured = { ...normalized, id: newId };
      platforms.push(ensured);
      indexById.set(ensured.id, platforms.length - 1);
      added += 1;
    }
  });

  return {
    dataset: {
      ...current,
      weights,
      platforms,
    },
    added,
    replaced,
  };
};

function evaluatePlatform(platform, requirements, features, weightMap) {
  const diffVector = features.map((feat) => {
    const score = platform.scores?.[feat] ?? 0;
    const required = requirements[feat] ?? 0;
    const weight = weightMap?.[feat] ?? 1;
    return ((score - required) / 100) * weight;
  });

  const hidden = HIDDEN_LAYER.map((neuron) =>
    relu(neuron.bias + dot(diffVector, neuron.weights))
  );

  const logit = OUTPUT_LAYER.bias + dot(hidden, OUTPUT_LAYER.weights);
  const score = sigmoid(logit);

  const coverage = features.map((feat, index) => {
    const currentScore = platform.scores?.[feat] ?? 0;
    const requiredScore = requirements[feat] ?? 0;
    const gap = currentScore - requiredScore;
    return {
      feature: feat,
      score: currentScore,
      required: requiredScore,
      gap,
      normalizedScore: currentScore / 100,
      deficit: Math.max(0, requiredScore - currentScore),
    };
  });

  const positiveCoverage = coverage.reduce((acc, item) => acc + Math.max(0, item.gap), 0);
  const negativeCoverage = coverage.reduce((acc, item) => acc + item.deficit, 0);
  const balance = coverage.length ? positiveCoverage / (coverage.length * 100) : 0;
  const stress = coverage.length ? negativeCoverage / (coverage.length * 100) : 0;
  const confidence = Math.max(0, Math.min(1, 0.7 * (1 - stress) + 0.3 * balance));

  const strengths = coverage.filter((item) => item.gap >= 5).map((item) => item.feature);
  const improvements = coverage.filter((item) => item.gap <= -5).map((item) => item.feature);
  const borderline = coverage.filter((item) => Math.abs(item.gap) < 5).map((item) => item.feature);

  return {
    id: platform.id,
    name: platform.name,
    vendor: platform.vendor,
    score,
    confidence,
    coverage,
    strengths,
    improvements,
    borderline,
  };
}

function formatPct(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

function badgeClass(gap) {
  if (gap >= 5) return "badge pro";
  if (gap <= -5) return "badge con";
  return "badge neutral";
}

export default function NeuralComparator() {
  const [baseDataset, setBaseDataset] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [requirements, setRequirements] = useState({});
  const [selectedScenario, setSelectedScenario] = useState("mineria_247");
  const [uploadFeedback, setUploadFeedback] = useState(null);
  const [manualFeedback, setManualFeedback] = useState(null);
  const [manualPlatform, setManualPlatform] = useState({
    name: "",
    vendor: "",
    scores: {},
  });
  const [chatMessages, setChatMessages] = useState(() => [
    {
      role: "assistant",
      text:
        "Hola, soy tu asistente SCADA conectado. Puedo analizar las brechas actuales, interpretar PDFs técnicos que subas y consultar fuentes públicas en internet para darte más contexto. ¿En qué te ayudo?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const initialRequirementsRef = useRef(false);

  useEffect(() => {
    fetch("/scada_dataset.json")
      .then((r) => r.json())
      .then((json) => {
        const normalized = normalizeUpload(json, (index) => `seed-${index}`);
        const datasetPayload = {
          version: json.version ?? "seed",
          weights:
            normalized.weights && Object.keys(normalized.weights).length
              ? normalized.weights
              : json.weights || {},
          platforms: normalized.platforms.filter(Boolean),
        };
        setBaseDataset(cloneDataset(datasetPayload));
        setDataset(cloneDataset(datasetPayload));
      })
      .catch((error) => {
        console.error("No se pudo cargar el dataset base", error);
      });
  }, []);

  const features = useMemo(() => {
    if (!dataset) return [];
    const weightedKeys = Object.keys(dataset.weights || {});
    const featureSet = new Set(weightedKeys);
    (dataset.platforms || []).forEach((platform) => {
      Object.keys(platform.scores || {}).forEach((feat) => featureSet.add(feat));
    });

    const extras = Array.from(featureSet).filter((feat) => !weightedKeys.includes(feat));
    extras.sort((a, b) => a.localeCompare(b));
    return [...weightedKeys, ...extras];
  }, [dataset]);

  useEffect(() => {
    if (!dataset || !features.length) return;
    const scenario = SCENARIOS.find((s) => s.id === "mineria_247");
    const averages = {};

    features.forEach((feat) => {
      const sum = (dataset.platforms || []).reduce(
        (acc, platform) => acc + (platform.scores?.[feat] ?? 0),
        0
      );
      const avg = (dataset.platforms || []).length
        ? sum / (dataset.platforms || []).length
        : 80;
      const scenarioValue = scenario?.values?.[feat];
      averages[feat] = Math.round(
        scenarioValue != null ? scenarioValue : avg
      );
    });

    let shouldResetScenario = false;

    setRequirements((prev) => {
      const prevKeys = Object.keys(prev || {});
      if (!initialRequirementsRef.current || prevKeys.length === 0) {
        initialRequirementsRef.current = true;
        shouldResetScenario = true;
        return { ...averages };
      }

      const next = { ...prev };
      let changed = false;

      features.forEach((feat) => {
        if (next[feat] == null) {
          next[feat] = averages[feat];
          changed = true;
        }
      });

      Object.keys(next).forEach((feat) => {
        if (!features.includes(feat)) {
          delete next[feat];
          changed = true;
        }
      });

      return changed ? next : prev;
    });

    if (shouldResetScenario) {
      setSelectedScenario(scenario?.id ?? "personalizado");
    }
  }, [dataset, features]);

  useEffect(() => {
    setManualPlatform((prev) => {
      const nextScores = { ...(prev.scores || {}) };
      let changed = false;

      features.forEach((feat) => {
        if (nextScores[feat] == null) {
          nextScores[feat] = requirements[feat] ?? 80;
          changed = true;
        }
      });

      Object.keys(nextScores).forEach((feat) => {
        if (!features.includes(feat)) {
          delete nextScores[feat];
          changed = true;
        }
      });

      if (!changed) return prev;
      return {
        ...prev,
        scores: nextScores,
      };
    });
  }, [features, requirements]);

  const createIdFactory = useCallback(() => {
    const batch = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return (index) => `custom-${batch}-${index}`;
  }, []);

  const handleDatasetUpload = useCallback(
    async (event) => {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;

      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const idFactory = createIdFactory();
      const featureHints = features && features.length ? features : DEFAULT_FEATURE_HINTS;

      try {
        setUploadFeedback({ type: "info", message: `Analizando ${file.name}…` });

        let normalized;
        let sourceLabel = extension.toUpperCase();

        if (extension === "json" || file.type === "application/json") {
          const text = await readFileAsText(file);
          const parsed = JSON.parse(text);
          normalized = normalizeUpload(parsed, idFactory);
          sourceLabel = "JSON";
        } else if (extension === "csv" || file.type === "text/csv") {
          const text = await readFileAsText(file);
          const parsed = parseCsv(text);
          normalized = normalizeUpload(parsed, idFactory);
          sourceLabel = "CSV";
        } else if (extension === "pdf" || file.type === "application/pdf") {
          const arrayBuffer = await readFileAsArrayBuffer(file);
          const extracted = await extractPlatformsFromPdf(arrayBuffer, featureHints);
          normalized = { platforms: extracted, weights: {} };
          sourceLabel = "PDF";
        } else {
          throw new Error("Formato no soportado. Sube un archivo JSON, CSV o PDF.");
        }

        const candidateCount = normalized.platforms.length;
        if (!candidateCount) {
          throw new Error("El archivo no contiene plataformas válidas.");
        }

        const attributeCount = normalized.platforms.reduce(
          (acc, platform) => acc + Object.keys(platform.scores || {}).length,
          0
        );

        setDataset((prev) => {
          const { dataset: merged, added, replaced } = mergeDataset(prev, normalized, idFactory);
          setUploadFeedback({
            type: "success",
            message: `${sourceLabel} procesado (${candidateCount} plataformas, ${attributeCount} atributos). Se integraron ${added} y se actualizaron ${replaced}.`,
          });
          setManualFeedback(null);
          setSelectedScenario("personalizado");
          return merged;
        });
      } catch (error) {
        console.error("Error al procesar el archivo SCADA", error);
        setUploadFeedback({
          type: "error",
          message:
            error.message ||
            "No se pudo interpretar el archivo proporcionado. Intenta con JSON, CSV o PDF estructurado.",
        });
      } finally {
        input.value = "";
      }
    },
    [createIdFactory, features]
  );

  const handleManualFieldChange = useCallback((field, value) => {
    setManualPlatform((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleManualScoreChange = useCallback((feature, value) => {
    setManualPlatform((prev) => ({
      ...prev,
      scores: {
        ...(prev.scores || {}),
        [feature]: value,
      },
    }));
  }, []);

  const handleManualSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setManualFeedback(null);

      if (!dataset) {
        setManualFeedback({
          type: "error",
          message: "Carga primero el dataset base antes de agregar plataformas manuales.",
        });
        return;
      }

      const trimmedName = manualPlatform.name.trim();
      if (!trimmedName) {
        setManualFeedback({
          type: "error",
          message: "Indica el nombre de la plataforma para registrarla.",
        });
        return;
      }

      const trimmedVendor = manualPlatform.vendor.trim();
      const nextScores = {};
      let hasExplicitScore = false;

      features.forEach((feat) => {
        const rawValue = manualPlatform.scores?.[feat];
        if (rawValue === "" || rawValue == null) {
          nextScores[feat] = clampScore(requirements[feat] ?? 80);
          return;
        }

        const numeric = Number(rawValue);
        if (Number.isFinite(numeric)) {
          nextScores[feat] = clampScore(numeric);
          hasExplicitScore = true;
        } else {
          nextScores[feat] = clampScore(requirements[feat] ?? 80);
        }
      });

      if (!hasExplicitScore) {
        setManualFeedback({
          type: "error",
          message: "Ingresa al menos un puntaje numérico para comparar la plataforma.",
        });
        return;
      }

      const newPlatform = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmedName,
        vendor: trimmedVendor || "Proveedor no especificado",
        scores: nextScores,
        pros: [],
        cons: [],
        red_flags: [],
        comments: [],
      };

      setDataset((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          platforms: [...(prev.platforms || []), newPlatform],
        };
        return next;
      });

      setManualFeedback({
        type: "success",
        message: "Plataforma agregada correctamente al análisis.",
      });
      setUploadFeedback(null);
      setSelectedScenario("personalizado");

      const resetScores = {};
      features.forEach((feat) => {
        resetScores[feat] = requirements[feat] ?? 80;
      });

      setManualPlatform({
        name: "",
        vendor: "",
        scores: resetScores,
      });
    },
    [dataset, features, manualPlatform, requirements]
  );

  const handleResetDataset = useCallback(() => {
    if (!baseDataset) return;
    setDataset(cloneDataset(baseDataset));
    setUploadFeedback({
      type: "success",
      message: "Se restauró el dataset base original.",
    });
    setManualFeedback(null);
    setSelectedScenario("mineria_247");
    initialRequirementsRef.current = false;
    setRequirements({});
    setManualPlatform({
      name: "",
      vendor: "",
      scores: {},
    });
  }, [baseDataset]);

  const results = useMemo(() => {
    if (!dataset) return [];
    return dataset.platforms
      .map((platform) =>
        evaluatePlatform(platform, requirements, features, dataset.weights)
      )
      .sort((a, b) => b.score - a.score);
  }, [dataset, requirements, features]);

  const top = results[0];

  const chartData = useMemo(
    () =>
      results.map((item) => ({
        name: item.name,
        score: Number((item.score * 100).toFixed(2)),
        confidence: Number((item.confidence * 100).toFixed(1)),
      })),
    [results]
  );

  const applyScenario = (scenario) => {
    setSelectedScenario(scenario.id);
    if (!scenario.values) return;
    setRequirements((prev) => {
      const next = { ...prev };
      for (const feat of features) {
        if (scenario.values[feat] != null) {
          next[feat] = scenario.values[feat];
        }
      }
      return next;
    });
  };

  const handleSlider = (feat, value) => {
    setSelectedScenario("personalizado");
    setRequirements((prev) => ({
      ...prev,
      [feat]: Number(value),
    }));
  };

  const answerQuestion = useCallback(
    async (question) => {
      const text = question.toLowerCase();
      const currentPlatforms = dataset?.platforms?.length ?? 0;
      const hasResults = results.length > 0;
      const isPdfQuestion = text.includes("pdf");
      const triggeredSearch = /internet|externa|actualiz|tendenc|mercado|notici|normativ|investigaci|panorama|benchmark/.test(
        text
      );

      let baseAnswer = "";
      let shouldSearch = triggeredSearch;

      if (isPdfQuestion) {
        baseAnswer =
          "Sí. Usa la sección ‘Trae tus datos SCADA’, selecciona tu PDF y extraeré valores numéricos asociados a atributos como ciberseguridad o redundancia para crear nuevas plataformas. También etiqueto ventajas, riesgos y comentarios presentes en el documento.";
      } else if (text.includes("dataset") || text.includes("cargar") || text.includes("subir")) {
        baseAnswer =
          "Puedes subir archivos JSON, CSV o PDF desde la sección ‘Trae tus datos SCADA’. Normalizaré los registros y los fusionaré con el dataset activo sin perder tus datos actuales.";
      } else if (text.includes("manual")) {
        baseAnswer =
          "Completa el formulario de ‘Agregar plataforma manual’ con nombre, proveedor y calificaciones (0 a 100) y presiona el botón. Se agregará al ranking inmediatamente.";
      } else if (!hasResults) {
        baseAnswer =
          "Aún no he calculado resultados. Ajusta los umbrales o carga un dataset para que pueda analizarlo. Si necesitas contexto general, también puedo buscar referencias públicas.";
        shouldSearch = true;
      } else if (text.includes("recom") || text.includes("mejor") || text.includes("top")) {
        if (top) {
          baseAnswer = `Actualmente ${top.name} de ${top.vendor} lidera la afinidad con ${formatPct(
            top.score
          )} y confianza ${formatPct(top.confidence, 0)}. Ajusta los umbrales para ver cómo cambian las recomendaciones.`;
        } else {
          baseAnswer = "Necesito al menos una plataforma evaluada para recomendar.";
        }
      } else if (text.includes("confianza")) {
        const confidences = results
          .slice(0, 3)
          .map((item) => `${item.name} (${formatPct(item.confidence)})`)
          .join(", ");
        baseAnswer = `La confianza penaliza brechas severas. Los tres primeros actualmente son: ${confidences}.`;
      } else {
        const matchedFeature = features.find((feat) => text.includes(feat.toLowerCase()));
        if (matchedFeature) {
          const ranking = results
            .map((item) => {
              const coverage = item.coverage.find(
                (cov) => cov.feature.toLowerCase() === matchedFeature.toLowerCase()
              );
              if (!coverage) return null;
              return { item, coverage };
            })
            .filter(Boolean)
            .sort((a, b) => b.coverage.score - a.coverage.score);

          if (ranking.length) {
            const best = ranking[0];
            const requirement = requirements[matchedFeature] ?? 0;
            const status =
              best.coverage.gap >= 0
                ? `supera el umbral por ${Math.abs(Math.round(best.coverage.gap))} puntos`
                : `queda corto por ${Math.abs(Math.round(best.coverage.gap))} puntos`;
            baseAnswer = `${best.item.name} destaca en ${matchedFeature} con ${Math.round(
              best.coverage.score
            )} frente al mínimo de ${Math.round(requirement)}; ${status}.`;
          }
        }

        if (!baseAnswer && (text.includes("brecha") || text.includes("gap"))) {
          const focus = top?.improvements?.slice(0, 3) ?? [];
          baseAnswer = focus.length
            ? `${top.name} necesita reforzar ${focus.join(", ")} para cerrar las brechas más visibles.`
            : "Ninguna brecha crítica destaca con los umbrales actuales. Puedes elevarlos para forzar un análisis más estricto.";
        }
      }

      if (!baseAnswer && hasResults) {
        const requirementFocus = Object.entries(requirements || {})
          .sort((a, b) => (b[1] || 0) - (a[1] || 0))
          .slice(0, 3)
          .map(([feat, value]) => `${feat} (${Math.round(value)})`);
        const strengths = top?.strengths?.slice(0, 3) ?? [];
        baseAnswer = `Actualmente analizo ${currentPlatforms} plataformas. ${
          requirementFocus.length
            ? `Tus umbrales más exigentes son ${requirementFocus.join(", ")}.`
            : "Tus umbrales siguen moderados."
        } ${
          strengths.length ? `El líder (${top.name}) destaca en ${strengths.join(", ")}.` : ""
        } Pregúntame por un atributo específico o por nuevas fuentes para ampliar el análisis.`.trim();
      } else if (!baseAnswer) {
        baseAnswer = `Actualmente analizo ${currentPlatforms} plataformas. Pregunta por un atributo específico (ciberseguridad, redundancia) o por las recomendaciones para guiarte.`;
      }

      if (!triggeredSearch && (text.includes("dataset") || text.includes("manual") || isPdfQuestion)) {
        shouldSearch = false;
      }

      if (!shouldSearch && (!hasResults || baseAnswer.startsWith("Actualmente analizo"))) {
        shouldSearch = true;
      }

      let searchAppendix = "";
      if (shouldSearch) {
        const query = /scada/i.test(question) ? question : `${question} sistemas SCADA`;
        const searchResult = await fetchExternalScadaInsight(query);
        if (searchResult.success && searchResult.summary) {
          searchAppendix = `🔎 Búsqueda externa: ${searchResult.summary}${
            searchResult.url ? ` (${searchResult.url})` : ""
          }`;
        } else if (triggeredSearch || !hasResults) {
          searchAppendix = "🔌 Intenté consultar fuentes abiertas pero no obtuve respuesta en este momento.";
        }
      }

      if (searchAppendix) {
        return baseAnswer ? `${baseAnswer}\n\n${searchAppendix}` : searchAppendix;
      }

      return baseAnswer;
    },
    [dataset?.platforms?.length, features, requirements, results, top]
  );

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  const handleChatSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const question = chatInput.trim();
      if (!question || chatLoading) return;

      setChatLoading(true);
      setChatMessages((prev) => [...prev, { role: "user", text: question }]);
      setChatInput("");

      try {
        const reply = await answerQuestion(question);
        setChatMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      } catch (error) {
        console.error("Error en el asistente SCADA", error);
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text:
              "Ocurrió un inconveniente al consultar la información externa. Intenta nuevamente o reformula tu pregunta para que pueda ayudarte.",
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [answerQuestion, chatInput, chatLoading]
  );

  if (!dataset) {
    return <div className="p-6">Cargando modelo inteligente…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="card p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Laboratorio neural de comparación SCADA</h2>
              <p className="text-sm text-slate-600 mt-1">
                Este laboratorio utiliza una red neuronal (4 entradas → 8 neuronas ReLU → salida sigmoidal) calibrada con el
                dataset energético para estimar la compatibilidad de cada plataforma frente a tus requisitos.
              </p>
            </div>
            <div className="text-xs text-slate-500 max-w-sm">
              <p>
                La red evalúa brechas de ciberseguridad, redundancia, protocolos y compatibilidad hardware, generando un puntaje
                de afinidad y un índice de confianza basado en tensiones detectadas.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => applyScenario(scenario)}
                className={`btn ${selectedScenario === scenario.id ? "active" : ""}`}
              >
                <div className="text-left">
                  <div className="font-medium text-sm">{scenario.name}</div>
                  <div className="text-[11px] text-slate-500 max-w-[220px]">{scenario.description}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="card p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">Trae tus datos SCADA</h3>
              <p className="text-sm text-slate-600">
                Sube un archivo JSON, CSV o PDF con plataformas adicionales (columnas o valores numéricos entre 0 y 100).
                También puedes registrar rápidamente una plataforma manual con los campos siguientes.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Los archivos JSON aceptan la estructura <code>{"{ \"platforms\": [] }"}</code>. Al subir PDFs se descargará
              dinámicamente PDF.js desde la CDN pública para extraer texto y puntuaciones.
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Carga de archivo
              </label>
              <input
                type="file"
                accept=".json,.csv,.pdf"
                onChange={handleDatasetUpload}
                className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:bg-slate-900 file:text-white hover:file:bg-slate-800"
              />
              {uploadFeedback ? (
                <div
                  className={`text-xs px-3 py-2 rounded-lg ${
                    uploadFeedback.type === "error"
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : uploadFeedback.type === "info"
                      ? "bg-sky-50 text-sky-600 border border-sky-200"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  }`}
                >
                  {uploadFeedback.message}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Se fusionarán las plataformas con el dataset actual respetando las existentes. Las puntuaciones extraídas de
                  PDFs se asociarán automáticamente a los atributos detectados.
                </p>
              )}
              <button
                type="button"
                onClick={handleResetDataset}
                disabled={!baseDataset}
                className="btn"
              >
                Restaurar dataset original
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Nombre de la plataforma</label>
                  <input
                    type="text"
                    value={manualPlatform.name}
                    onChange={(e) => handleManualFieldChange("name", e.target.value)}
                    placeholder="Ej. SCADA personalizado"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Proveedor / Área</label>
                  <input
                    type="text"
                    value={manualPlatform.vendor}
                    onChange={(e) => handleManualFieldChange("vendor", e.target.value)}
                    placeholder="Nombre del proveedor"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feat) => (
                  <div key={feat} className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">{feat}</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={manualPlatform.scores?.[feat] ?? ""}
                      onChange={(e) => handleManualScoreChange(feat, e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                ))}
              </div>
              {manualFeedback && (
                <div
                  className={`text-xs px-3 py-2 rounded-lg ${
                    manualFeedback.type === "error"
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  }`}
                >
                  {manualFeedback.message}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className="btn primary">
                  Agregar plataforma manual
                </button>
                <p className="text-xs text-slate-500">
                  Los valores ingresados se compararán en tiempo real con los umbrales configurados.
                </p>
              </div>
            </form>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="card p-6 xl:col-span-2 space-y-4">
            <h3 className="font-semibold text-lg">Define los umbrales mínimos</h3>
            <p className="text-sm text-slate-600">
              Ajusta los sliders para establecer el nivel mínimo aceptable por atributo. El modelo detectará brechas negativas
              y fortalezas para cada plataforma.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feat) => (
                <div key={feat} className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{feat}</span>
                    <span>{requirements[feat] ?? 0}</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    step="1"
                    value={requirements[feat] ?? 80}
                    onChange={(e) => handleSlider(feat, e.target.value)}
                    className="w-full accent-slate-900"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Básico</span>
                    <span>Excelente</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-lg">Recomendación inteligente</h3>
            {top ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div>
                  <div className="text-sm text-slate-500">Mayor afinidad neural</div>
                  <div className="text-xl font-semibold leading-tight">{top.name}</div>
                  <div className="text-xs text-slate-500">Proveedor: {top.vendor}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="border border-slate-200 rounded-xl p-3">
                    <div className="text-xs text-slate-500">Puntaje NN</div>
                    <div className="text-lg font-semibold">{formatPct(top.score)}</div>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-3">
                    <div className="text-xs text-slate-500">Confianza</div>
                    <div className="text-lg font-semibold">{formatPct(top.confidence, 0)}</div>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">Fortalezas detectadas:</span>
                    <span className="ml-1 text-slate-600">
                      {top.strengths.length ? top.strengths.join(", ") : "Sin excedentes marcados"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Brechas prioritarias:</span>
                    <span className="ml-1 text-slate-600">
                      {top.improvements.length ? top.improvements.join(", ") : "Ninguna relevante"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Atributos ajustados:</span>
                    <span className="ml-1 text-slate-600">
                      {top.borderline.length ? top.borderline.join(", ") : "Todos superan el umbral"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <p className="text-sm text-slate-600">Ajusta los umbrales para obtener una recomendación.</p>
            )}
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="font-semibold text-lg">Resultados de la red neuronal</h3>
              <p className="text-sm text-slate-600">
                El puntaje refleja la afinidad modelada; la confianza penaliza brechas severas detectadas en los requisitos.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Ajusta los umbrales para observar cómo cambia el ranking en tiempo real.
            </div>
          </div>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="score" name="Afinidad NN">
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill="#2563EB" />
                  ))}
                </Bar>
                <Bar dataKey="confidence" name="Confianza" fill="#16A34A" opacity={0.35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.slice(0, 3).map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-white space-y-2 text-sm">
                <div className="font-semibold text-slate-700">{item.name}</div>
                <div className="text-xs text-slate-500 mb-1">Afinidad: {formatPct(item.score)} · Confianza: {formatPct(item.confidence)}</div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Fortalezas</div>
                  <p className="text-xs text-slate-600">
                    {item.strengths.length ? item.strengths.join(", ") : "Sin excedentes"}
                  </p>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Brechas</div>
                  <p className="text-xs text-slate-600">
                    {item.improvements.length ? item.improvements.join(", ") : "No se detectan brechas"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">Asistente SCADA</h3>
              <p className="text-sm text-slate-600">
                Consulta sobre plataformas recomendadas, brechas por atributo o cómo cargar nuevos datos. El asistente combina
                el análisis actual con búsquedas en línea y los datos que cargues (incluyendo PDFs) para responder.
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-wide text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
              Beta · Online
            </span>
          </div>
          <div
            ref={chatContainerRef}
            className="border border-slate-200 rounded-xl bg-white h-72 overflow-y-auto p-4 space-y-3"
          >
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    message.role === "user"
                      ? "bg-slate-900 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-700 rounded-bl-sm"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {chatLoading ? (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm bg-slate-100 text-slate-600 rounded-bl-sm animate-pulse">
                  Buscando información y verificando fuentes…
                </div>
              </div>
            ) : null}
          </div>
          <form onSubmit={handleChatSubmit} className="flex gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Pregúntame sobre ciberseguridad, brechas, PDF o solicita que busque en internet…"
              className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            <button
              type="submit"
              className="btn primary whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={chatLoading}
            >
              Enviar
            </button>
          </form>
        </section>

        <section className="card p-6 space-y-4">
          <h3 className="font-semibold text-lg">Detalle por plataforma y atributo</h3>
          <div className="overflow-auto">
            <table>
              <thead>
                <tr>
                  <th>Plataforma</th>
                  <th>Puntaje NN</th>
                  <th>Confianza</th>
                  {features.map((feat) => (
                    <th key={feat}>Gap {feat}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.vendor}</div>
                    </td>
                    <td>{formatPct(item.score)}</td>
                    <td>{formatPct(item.confidence)}</td>
                    {item.coverage.map((cov) => (
                      <td key={cov.feature}>
                        <div className={badgeClass(cov.gap)}>
                          {cov.gap > 0 ? "+" : ""}{Math.round(cov.gap)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {Math.round(cov.score)} / {Math.round(cov.required)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
