import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * ScadaAssistant.jsx
 * Chat sencillo en el navegador (sin backend) orientado a recomendar SCADA
 * basado en reglas y en el dataset /data/scada_dataset.json (si existe).
 *
 * - No necesita dependencias adicionales
 * - Seguro para Netlify (funciona con history fallback)
 */

// Reglas/ponderaciones editables
const RULES = {
  criticalWeights: {
    Ciberseguridad: 0.35,
    Redundancia: 0.25,
    Protocolos: 0.2,
    "Compatibilidad con hardware": 0.2,
  },
  redFlags: [
    /IEC\s*61850.*(no\s+soportado|driver.*falla|inestable)/i,
    /redundancia.*(no\s+funciona|deficiente)/i,
    /herramienta.*HMI.*(deficiente|pobre)/i,
    /actualizaciones.*(problemas|no\s+funcionan|engorroso)/i,
  ],
  preferredForMining: [/zenon/i, /energy\s*edition/i],
};

function cls(...xs){return xs.filter(Boolean).join(" ");}

export default function ScadaAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hola 👋 Soy tu asistente para seleccionar SCADA. Cuéntame tu contexto (minería, subestaciones, integración IEC 61850, NTSyCS/SITR, etc.) y lo analizamos.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const datasetRef = useRef(null);

  // Carga opcional del dataset público
  useEffect(() => {
    const tryLoad = async () => {
      const urls = [
        "/data/scada_dataset.json",
        "/data/scada_dataset_mining_extended.json",
        "/data/dataset.json",
      ];
      for (const u of urls) {
        try {
          const r = await fetch(u, { cache: "no-store" });
          if (r.ok) {
            const json = await r.json();
            datasetRef.current = json;
            break;
          }
        } catch {}
      }
    };
    tryLoad();
  }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const answer = await answerQuestion(userMsg.content, datasetRef.current);
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Ups, tuve un problema procesando la consulta. Intenta de nuevo, por favor.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="rounded-2xl border bg-white shadow p-4 md:p-6 min-h-[60vh] flex flex-col">
        <div className="flex items-center gap-2 pb-3 border-b">
          <div className="h-9 w-9 rounded-full bg-sky-600 text-white grid place-items-center font-bold">AI</div>
          <div>
            <div className="font-semibold">Asistente SCADA</div>
            <div className="text-sm text-slate-500">
              Basado en reglas + dataset local (si existe). Sin backend.
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto py-4 space-y-3">
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.content} />
          ))}
          {loading && <Bubble role="assistant" text="Pensando..." />}
        </div>

        <form onSubmit={send} className="pt-3 border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: Necesito SCADA para minería con IEC 61850 y NTSyCS..."
            className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            disabled={loading}
            className="rounded-xl bg-sky-600 text-white px-4 py-2 hover:bg-sky-700 disabled:opacity-60"
          >
            Enviar
          </button>
        </form>
      </div>

      <div className="text-xs text-slate-500 mt-3">
        Nota: Este asistente usa heurísticas y tu dataset local. Para consultas normativas,
        valida siempre con NTSyCS (SEC), SITR/Coordinador y normas IEC aplicables.
      </div>
    </div>
  );
}

function Bubble({ role, text }) {
  const mine = role === "user";
  return (
    <div className={cls("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cls(
          "max-w-[85%] rounded-2xl px-4 py-2 whitespace-pre-wrap",
          mine ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-900"
        )}
      >
        {text}
      </div>
    </div>
  );
}

// Motor de respuesta súper simple (reglas + dataset si existe)
async function answerQuestion(q, dataset) {
  const qLower = q.toLowerCase();
  let hints = [];

  // Preferencias por minería
  if (/min(ería|eria)/i.test(q)) {
    hints.push("Para minería, prioriza plataformas unificadas (SCADA+DMS+GIS+Historian) y alta escalabilidad.");
  }
  // IEC 61850
  if (/61850|iec\s*61850/i.test(q)) {
    hints.push("Verifica soporte IEC 61850 MMS/GOOSE/SV. Revisa estabilidad del driver y pruebas de interoperabilidad multi-marca.");
  }
  // NTSyCS / SITR
  if (/ntsycs|sitr|normativa|sec|coordinador/i.test(qLower)) {
    hints.push("Valida cumplimiento NTSyCS/SEC y requisitos SITR/Coordinador (trazabilidad, sincronización, time-stamp por agrupamiento).");
  }

  // Si existe dataset, tratamos de proponer candidatos
  let candidatesText = "";
  if (dataset && Array.isArray(dataset.platforms)) {
    const scored = scoreWithDataset(dataset, qLower).slice(0, 3);
    if (scored.length) {
      candidatesText =
        "Candidatos sugeridos (top 3):\n" +
        scored
          .map(
            (x, i) =>
              `${i + 1}. ${x.name} — score ${Math.round(x.score * 100) / 100}`
          )
          .join("\n");
    }
  }

  const base =
    "Resumen:\n" +
    (hints.length ? "- " + hints.join("\n- ") + "\n" : "") +
    (candidatesText || "Sin dataset cargado, así que doy recomendaciones generales.") +
    "\n\n" +
    "Checklist mínimo:\n" +
    "1) Ciberseguridad (IEC 62443), hardening, gestión de parches.\n" +
    "2) Redundancia (servidores/medios/red), RTO/RPO.\n" +
    "3) Protocolos (IEC 61850, 60870-5-101/104, DNP3, Modbus) con drivers estables.\n" +
    "4) Integración con GIS/Historians/IMS, y compatibilidad entre versiones.\n" +
    "5) Soporte local y SLA claros; documentación y capacitación.\n";

  return base;
}

function scoreWithDataset(dataset, qLower) {
  const crit = RULES.criticalWeights;
  const platforms = dataset.platforms || [];
  const arr = [];

  for (const p of platforms) {
    const name = p.name || p.platform || "Desconocido";
    const f = p.features || p.characteristics || {};
    const comments = (p.comments || []).join(" ");
    const pros = (p.pros || []).join(" ");
    const cons = (p.cons || []).join(" ");
    const textBlob = [name, comments, pros, cons].join(" ").toLowerCase();

    // Puntuación base por criterios críticos (si el dataset trae 0..100 o true/false)
    let score = 0;
    const ciber = numLike(f["Ciberseguridad"]);
    const redund = numLike(f["Redundancia"]);
    const prot = numLike(f["Protocolos"]);
    const hw = numLike(f["Compatibilidad con hardware"]);

    score += ciber * (crit.Ciberseguridad || 0);
    score += redund * (crit.Redundancia || 0);
    score += prot * (crit.Protocolos || 0);
    score += hw * (crit["Compatibilidad con hardware"] || 0);

    // Penaliza red flags
    for (const re of RULES.redFlags) {
      if (re.test(textBlob)) score -= 20;
    }

    // Bonus si pregunta menciona minería y el nombre encaja
    if (/min(ería|eria)/i.test(qLower)) {
      if (RULES.preferredForMining.some((re) => re.test(name))) score += 10;
    }

    arr.push({ name, score, raw: p });
  }

  // Plus si coincide con keywords en la pregunta
  for (const x of arr) {
    const nameLower = x.name.toLowerCase();
    if (qLower.includes("zenon") && nameLower.includes("zenon")) x.score += 5;
    if (qLower.includes("schneider") && nameLower.includes("schneider")) x.score += 2;
  }

  arr.sort((a, b) => b.score - a.score);
  return arr;
}

function numLike(v) {
  if (v == null) return 0;
  if (typeof v === "boolean") return v ? 100 : 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const m = v.match(/(\d+(\.\d+)?)\s*%?/);
    if (m) return parseFloat(m[1]);
    if (/alto|alta|yes|si|true/i.test(v)) return 100;
    if (/medio/i.test(v)) return 60;
    if (/bajo|baja|no|false/i.test(v)) return 20;
  }
  return 0;
}
