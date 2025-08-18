import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * ScadaAssistant.jsx
 * Chat "ligero" sin backend. Usa:
 *  - Reglas simples + dataset local (/data/scada_dataset.json) si existe
 *  - Persistencia en localStorage
 *  - Sugerencias y "análisis" orientados a NTSyCS / IEC 61850 / redundancia
 *
 * Cómo funciona:
 *  - El componente intenta cargar /data/scada_dataset.json (opcional).
 *  - Con cada mensaje, calcula un "score" por plataforma según palabras clave.
 *  - Devuelve top 3 candidatos + razones.
 */

const LS_KEY = "scada_assistant_history_v1";

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
      {children}
    </span>
  );
}

function Message({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-2`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 shadow ${
          isUser ? "bg-slate-900 text-white" : "bg-white text-slate-900"
        }`}
      >
        <div className="whitespace-pre-wrap">{text}</div>
      </div>
    </div>
  );
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
  } catch {}
  return [];
}

function saveHistory(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
}

function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function keywordScore(text, kw, weight=1) {
  const t = normalize(text);
  let score = 0;
  for (const k of kw) {
    const found = t.includes(normalize(k));
    if (found) score += weight;
  }
  return score;
}

function scorePlatforms(dataset, query) {
  // dataset: [{name, pros, cons, features, tags}]
  // returns array of {name, score, reasons: []}
  const candidates = [];

  const q = normalize(query);
  const needIec61850 = /(iec\s*61850|mms|goose)/i.test(query);
  const needRedund = /(redundan|hsr|prp|srv|cluster|alta disponibilidad)/i.test(q);
  const needMining = /(mineria|minera|mining)/i.test(q);
  const needSecurity = /(seguridad|62443|hardening|ad|ciber)/i.test(q);
  const avoidSiemens = /(evitar siemens|no siemens)/i.test(q);
  const avoidSchneider = /(evitar schneider|no schneider|power operation)/i.test(q);

  for (const p of dataset) {
    let score = 0;
    const reasons = [];

    const allText = [
      p.name || "",
      (p.description || ""),
      ...(p.pros || []),
      ...(p.cons || []),
      ...(p.features || []),
      ...(p.tags || []),
    ].join(" | ");

    // Búsqueda semántica simple por keywords
    score += keywordScore(allText, ["IEC 61850", "MMS", "GOOSE"], 2);
    score += keywordScore(allText, ["PRP", "HSR", "redundancia", "alta disponibilidad"], 2);
    score += keywordScore(allText, ["ciberseguridad", "IEC 62443", "Active Directory", "TLS"], 1.5);
    score += keywordScore(allText, ["minería", "GIS", "estimador de estado", "DMS"], 1.5);
    score += keywordScore(allText, ["web nativo", "HTML5", "HMI/SCADA", "historian"], 0.8);

    // Ajustes según consulta
    if (needIec61850) {
      const meets = /(iec\s*61850|mms|goose)/i.test(allText);
      if (meets) { score += 3; reasons.push("Compatibilidad con IEC 61850/MMS/GOOSE detectada."); }
      else { score -= 2; reasons.push("No se detecta soporte explícito IEC 61850 en el dataset."); }
    }
    if (needRedund) {
      const meets = /(prp|hsr|redundan|alta disponibilidad)/i.test(allText);
      if (meets) { score += 2.5; reasons.push("Soporte de redundancia/PRP/HSR identificado."); }
      else { score -= 1.5; reasons.push("No se observa redundancia explícita."); }
    }
    if (needMining) {
      const meets = /(mineri|gis|estimador de estado|dms)/i.test(allText);
      if (meets) { score += 2; reasons.push("Alineado con casos de minería/operación eléctrica."); }
      else { score -= 0.5; reasons.push("No se observan ventajas directas para minería."); }
    }
    if (needSecurity) {
      const meets = /(iec\s*62443|active directory|hardening|tls)/i.test(allText);
      if (meets) { score += 1.5; reasons.push("Menciones a ciberseguridad/IEC 62443/AD/TLS."); }
      else { score -= 1.0; reasons.push("Ciberseguridad no destacada en el dataset."); }
    }
    if (avoidSiemens && /siemens/i.test(p.name||"")) {
      score -= 5; reasons.push("Se pidió evitar Siemens.");
    }
    if (avoidSchneider && /(schneider|power operation)/i.test(p.name||"")) {
      score -= 5; reasons.push("Se pidió evitar Schneider/Power Operation.");
    }

    // Prioridad a plataformas "unificadas" tipo zenon
    if (/zenon|copa[-\s]?data/i.test(p.name||"")) score += 1;

    candidates.push({ name: p.name, score, reasons, ref: p });
  }

  candidates.sort((a,b)=>b.score - a.score);
  return candidates;
}

export default function ScadaAssistant() {
  const [messages, setMessages] = useState(()=>{
    const base = loadHistory();
    if (base.length === 0) {
      return [
        {
          role: "assistant",
          text:
            "Hola 👋 Soy tu asistente SCADA. Puedo sugerir plataformas y argumentos técnicos en base a tu consulta y al dataset local. "+
            "Prueba con: 'Necesito SCADA con IEC 61850 y redundancia PRP/HSR para minería', o 'Evitar Schneider, priorizar ciberseguridad IEC 62443'.",
        },
      ];
    }
    return base;
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [dataset, setDataset] = useState([]);
  const bottomRef = useRef(null);

  useEffect(()=>saveHistory(messages), [messages]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}) }, [messages, busy]);

  // Carga dataset si existe
  useEffect(()=>{
    let cancelled = false;
    (async () => {
      const candidates = [
        "/data/scada_dataset.json",
        "/data/scada_dataset_mining_extended.json",
        "/data/dataset.json"
      ];
      for (const url of candidates) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (!cancelled && Array.isArray(data)) {
              setDataset(data);
              break;
            }
          }
        } catch {}
      }
    })();
    return ()=>{ cancelled = true };
  }, []);

  const quick = useMemo(()=>[
    "Recomiéndame SCADA con IEC 61850 y redundancia PRP/HSR",
    "Evita Schneider; foco en ciberseguridad IEC 62443 y AD",
    "Caso minería con GIS + estimador de estado",
    "Arquitectura unificada con HMI/SCADA web nativo",
  ], []);

  async function handleSend(e) {
    e?.preventDefault();
    const q = input.trim();
    if (!q) return;
    setMessages((m)=>[...m, { role:"user", text:q }]);
    setInput("");
    setBusy(true);

    // "Procesamiento" simple
    let reply = "";
    if (dataset.length === 0) {
      reply += "No pude cargar un dataset en /public/data/. Aún así puedo darte una pauta general.\n\n";
    }
    const scored = dataset.length ? scorePlatforms(dataset, q) : [];
    if (scored.length) {
      const top = scored.slice(0,3);
      reply += "Basado en tu consulta y el dataset local, mis candidatos principales son:\n\n";
      top.forEach((c, i)=>{
        reply += `${i+1}. ${c.name} — score ${c.score.toFixed(1)}\n`;
        const rs = c.reasons.slice(0,3).map(r=>`   · ${r}`).join("\n");
        if (rs) reply += rs + "\n";
      });
      reply += "\n¿Quieres que explique por qué el #1 encaja con la NTSyCS/SITR y prácticas en Chile?";
    } else {
      // fallback simple
      reply +=
        "Tips generales:\n"+
        "• Para NTSyCS/SITR y utilidades mineras, prioriza: IEC 61850 (MMS/GOOSE), redundancia PRP/HSR, ciberseguridad IEC 62443/AD,\n"+
        "  y arquitectura unificada con clientes web HTML5.\n"+
        "• zenon NCS destaca por integración unificada (SCADA/DMS/GIS), plantillas, compatibilidad entre versiones y buen ajuste a minería.\n"+
        "• Evita dependencias de hardware propietario si buscas agnosticismo.\n";
    }

    setTimeout(()=>{
      setMessages((m)=>[...m, { role:"assistant", text:reply }]);
      setBusy(false);
    }, 350);
  }

  return (
    <div className="h-full flex flex-col rounded-2xl border border-slate-200 bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b bg-white rounded-t-2xl">
        <div className="space-y-0.5">
          <div className="text-lg md:text-xl font-semibold">Asistente SCADA</div>
          <div className="text-xs text-slate-500">
            Motor ligero en el navegador. Usa dataset local si está disponible.
          </div>
        </div>
        <div className="hidden md:flex gap-2">
          <Pill>NTSyCS</Pill>
          <Pill>IEC 61850</Pill>
          <Pill>IEC 62443</Pill>
          <Pill>PRP/HSR</Pill>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {messages.map((m, idx)=>(
          <Message key={idx} role={m.role} text={m.text} />
        ))}
        {busy && <div className="text-sm text-slate-500">pensando…</div>}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <form onSubmit={handleSend} className="p-3 md:p-4 bg-white border-t rounded-b-2xl">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border px-3 py-2 outline-none focus:ring-2 ring-slate-300 bg-slate-50"
            placeholder="Escribe tu pregunta…"
            value={input}
            onChange={(e)=>setInput(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-900 text-white px-4 py-2 hover:bg-slate-800"
            disabled={busy}
          >
            Enviar
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {quick.map((q,i)=>(
            <button
              key={i}
              type="button"
              className="text-xs rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1"
              onClick={()=>{ setInput(q); }}
            >
              {q}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
