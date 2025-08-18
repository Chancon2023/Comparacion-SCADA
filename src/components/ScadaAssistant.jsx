// src/components/ScadaAssistant.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SAMPLE_DATASET, RED_FLAGS, RED_FLAG_PENALTY, normalizeWeights } from "../lib/assistant/rules";

const bubble = "rounded-2xl px-4 py-2 shadow";

export default function ScadaAssistant() {
  const [dataset, setDataset] = useState(SAMPLE_DATASET);
  const [loadingData, setLoadingData] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "¡Hola! Soy tu asistente SCADA. Cuéntame los requisitos: ciberseguridad/IEC 62443, IEC 61850, redundancia (HSR/PRP), minería, dashboards web, etc. Con eso te recomiendo plataformas y explico el porqué."
    }
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        // si existe /data/scada_dataset.json lo usamos
        const res = await fetch("/data/scada_dataset.json", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // esperamos un array con objetos {name, features:{seguridad, ...}, comentarios[]}
          if (Array.isArray(data) && data.length > 0) {
            setDataset(data);
          }
        }
      } catch(e) {
        // fallback al SAMPLE_DATASET
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    // autoscroll
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const onSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    const reply = computeReply(text, dataset);
    setMessages((prev) => [...prev, reply]);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200">
      <div className="h-80 overflow-y-auto p-4 space-y-3" ref={listRef}>
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`${bubble} ${m.role === "user" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-800"}`} style={{maxWidth:"80%"}}>
              {m.text.split("\n").map((line,i)=>(<p key={i} className="whitespace-pre-wrap">{line}</p>))}
            </div>
          </div>
        ))}
        {loadingData && (
          <div className="text-sm text-slate-500">Cargando dataset…</div>
        )}
      </div>
      <form onSubmit={onSend} className="p-3 border-t border-slate-200 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          placeholder="Escribe tus requisitos… (Enter para enviar)"
        />
        <button className="rounded-xl bg-slate-900 text-white px-4 py-2 hover:bg-slate-800" type="submit">
          Enviar
        </button>
      </form>
    </div>
  );
}

function computeReply(text, dataset) {
  const weights = normalizeWeights(text);
  const scored = dataset.map(p => scorePlatform(p, weights));
  scored.sort((a,b)=>b.total - a.total);

  const top = scored.slice(0,3);
  const lines = [];
  lines.push("Recomendación (ponderada por tus requisitos):");
  top.forEach((t, i) => {
    const rank = i+1;
    const redCount = t.redFlagsTriggered.length;
    lines.push(` ${rank}. ${t.name} — Puntaje ${t.total.toFixed(1)}/100` + (redCount>0 ? `  ⚠️ ${redCount} alertas` : ""));
    lines.push(`    • Seguridad: ${t.features.seguridad}  • Redundancia: ${t.features.redundancia}  • Protocolos: ${t.features.protocolos}`);
    if (t.explain.length) lines.push(`    • Motivos: ${t.explain.join("; ")}`);
    if (redCount>0) {
      lines.push(`    • Red flags: ${t.redFlagsTriggered.join(" | ")}`);
    }
  });

  lines.push("");
  lines.push("Nota: si subes tu dataset real en /public/data/scada_dataset.json, el asistente lo usará automáticamente.");
  return { role: "assistant", text: lines.join("\n") };
}

function scorePlatform(p, weights) {
  const features = p.features || {};
  const base =
    (features.seguridad || 0) * (weights.seguridad || 0) +
    (features.redundancia || 0) * (weights.redundancia || 0) +
    (features.protocolos || 0) * (weights.protocolos || 0) +
    (features.mantenimiento || 0) * (weights.mantenimiento || 0) +
    (features.web || 0) * (weights.web || 0);

  const name = p.name || "";
  const flags = RED_FLAGS[name] || [];
  const triggered = flags.filter(f => true); // si existen, se consideran
  const penalty = triggered.length * RED_FLAG_PENALTY;
  const total = Math.max(0, Math.min(100, base - penalty));

  // explicación simple
  const explain = [];
  const pick = (k, label)=>{ if ((p.features?.[k]||0) >= 85) explain.push(`${label} alto`); };
  pick("seguridad","Seguridad");
  pick("redundancia","Redundancia");
  pick("protocolos","Protocolos");
  pick("web","Web");
  pick("mantenimiento","Mantenimiento");

  return { ...p, total, explain, redFlagsTriggered: triggered };
}