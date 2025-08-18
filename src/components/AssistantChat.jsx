import React, { useEffect, useRef, useState } from "react";

/**
 * AssistantChat.jsx (smart, con serverless opcional)
 * - Si configuras OPENAI_API_KEY en Netlify y copias /netlify/functions/assist.js,
 *   el chat llamará a `/.netlify/functions/assist` para respuestas "tipo GPT".
 * - Además, mezcla un ranking local simple usando /data/scada_dataset.json si existe.
 */
export default function AssistantChat() {
  const [msgs, setMsgs] = useState([
    { role: "assistant", text: "Hola 👋 Soy tu Asistente SCADA. Puedo analizar NTSyCS/SITR, IEC 61850/62443, PRP/HSR, minería, y recomendar plataformas. ¿Qué necesitas?" }
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [dataset, setDataset] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  useEffect(() => {
    // Carga dataset si existe (no es obligatorio)
    (async () => {
      try {
        const r = await fetch("/data/scada_dataset.json", { cache: "no-store" });
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data)) setDataset(data);
        }
      } catch {}
    })();
  }, []);

  async function onSend(e) {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    setText("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setBusy(true);

    // 1) Local ranking rápido (si hay dataset)
    let local = "";
    if (Array.isArray(dataset) && dataset.length) {
      const ranked = rank(q, dataset).slice(0, 3);
      if (ranked.length) {
        local = "**Top sugerido (dataset local):**\n" + ranked.map((r, i) => {
          const p = r.item;
          return `${i + 1}. ${p.name} — score ${r.s} ${p.pros?.length ? "· Pros: " + p.pros.slice(0,2).join(" · ") : ""}${p.cons?.length ? " · Contras: " + p.cons.slice(0,1).join(" · ") : ""}`;
        }).join("\n");
      }
    }

    // 2) Llamada al serverless (si está configurado)
    let ai = "";
    try {
      const res = await fetch("/.netlify/functions/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, dataset: (dataset||[]).slice(0, 8), prefs: { miningHint: /mineri|minera/i.test(q) } })
      });
      if (res.ok) {
        const j = await res.json();
        ai = j.answer || "";
      } else {
        const err = await res.text();
        ai = `Nota: el servicio inteligente no está disponible (${err.trim()}).`;
      }
    } catch (e) {
      ai = "Nota: no se pudo contactar el servicio inteligente (revisa OPENAI_API_KEY en Netlify).";
    }

    const final = [ai, local].filter(Boolean).join("\n\n");
    setMsgs((m) => [...m, { role: "assistant", text: final || "Listo ✅" }]);
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow">
      <div className="h-80 overflow-y-auto p-3 space-y-2">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.role === "user" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}
        {busy && <div className="text-xs text-slate-500">pensando…</div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSend} className="p-3 border-t flex gap-2 bg-slate-50">
        <input
          className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Escribe tu consulta… (p. ej., SCADA para minería con IEC 61850 y PRP/HSR)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="rounded-xl bg-slate-900 text-white px-4 py-2 hover:bg-slate-800" disabled={busy}>
          Enviar
        </button>
      </form>
    </div>
  );
}

// Ranking local básico por palabras clave
function rank(q, data) {
  const t = (q || "").toLowerCase();
  return data.map((p) => {
    const hay = [p.name, ...(p.tags || []), ...(p.features || [])].join(" ").toLowerCase();
    let s = 0;
    if (/\bmineri|minera\b/.test(t) && /mineri|mining/.test(hay)) s += 3;
    if (/iec\s*61850|mms|goose/.test(t) && /iec 61850|mms|goose/.test(hay)) s += 3;
    if (/\bprp\b|\bhsr\b|redundan/.test(t) && /prp|hsr|redundan/.test(hay)) s += 2;
    if (/62443|ciber|ad|tls/.test(t) && /62443|ciber|ad|tls/.test(hay)) s += 2;
    if (/web|html5|cliente/.test(t) && /web|html5|cliente/.test(hay)) s += 1;
    // bonus por zenon como preferencia típica en minería
    if (/zenon/.test(hay)) s += 1;
    return { item: p, s };
  }).sort((a, b) => b.s - a.s);
}