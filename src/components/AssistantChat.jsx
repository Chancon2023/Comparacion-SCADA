import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * AssistantChat.jsx
 * - UI 100% front-end (sin dependencias externas) pensado para Vite + React v3.7.1.
 * - Si existe /public/data/scada_dataset.json lo usa para recomendar Top-3.
 * - Si no existe, responde igual con recomendaciones generales (no se rompe).
 */
export default function AssistantChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "¡Hola! Soy tu asistente SCADA. Puedo ayudarte a comparar plataformas, revisar normas chilenas (NTSyCS, SITR), IEC 61850/62443 y sugerir opciones para minería. ¿Qué necesitas?",
    },
  ]);
  const [input, setInput] = useState("");
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(false);
  const listEndRef = useRef(null);

  useEffect(() => {
    // Intenta cargar el dataset; si no existe, ignora el error
    const load = async () => {
      try {
        const res = await fetch("/data/scada_dataset.json", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setDataset(data);
        }
      } catch (_) {}
    };
    load();
  }, []);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);

    setLoading(true);
    try {
      const reply = await think(text, dataset);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
        <header className="px-5 py-4 bg-slate-50 border-b border-slate-200">
          <h1 className="text-xl font-semibold">Asistente SCADA</h1>
          <p className="text-slate-600 text-sm mt-1">
            Recomendador de plataformas y guía técnica (NTSyCS, SITR, IEC 61850/62443, PRP/HSR, etc.).
          </p>
        </header>

        <div className="h-[56vh] overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                m.role === "assistant"
                  ? "bg-slate-100 text-slate-900"
                  : "ml-auto bg-indigo-600 text-white"
              }`}
            >
              {m.content}
            </div>
          ))}
          <div ref={listEndRef} />
        </div>

        <form onSubmit={handleSend} className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta… (p. ej., SCADA para minería con IEC 61850 y PRP/HSR)"
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Pensando…" : "Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Motor simple basado en reglas + dataset opcional.
 * Devuelve texto en español con Top-3 (si hay dataset) y consideraciones normativas.
 */
async function think(prompt, dataset) {
  const p = prompt.toLowerCase();

  // Heurística de ámbitos/filtros
  const wantsMining = /mineri|minera|mining/.test(p);
  const wantsIEC61850 = /iec\s*61850|mms|goose|sv\b/.test(p);
  const wantsIEC62443 = /iec\s*62443|ciber|seguridad/.test(p);
  const wantsPRPHSR = /\bprp\b|\bhsr\b|redundan/.test(p);
  const wantsWeb = /web|html5|cliente web|thin client/.test(p);
  const costSensitive = /costo|presupuesto|tco|licencia/.test(p);

  // Reglas de texto normativo local
  const localNotes = [
    "• Considera NTSyCS (Chile) para requisitos de agrupamiento de señales, timestamp y transformación de puntos simples/dobles.",
    "• Para SITR (CNE), valida telemetría IEC 60870-5-104, reporting seguro y trazabilidad.",
    "• Revisa hardening y gestión de identidad según IEC 62443 (AD, TLS, segmentación).",
  ];

  // Si hay dataset: ranking rápido
  let rankingText = "";
  if (Array.isArray(dataset) && dataset.length) {
    const scored = dataset.map((item) => ({
      name: item.name || "Plataforma",
      score: scoreItem(item, { wantsMining, wantsIEC61850, wantsIEC62443, wantsPRPHSR, wantsWeb }),
    }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3);
    rankingText =
      top.length > 0
        ? `\n\n**Top sugerido** (por coincidencia de requisitos):\n${top
            .map((t, i) => `${i + 1}. ${t.name} — score ${t.score}`)
            .join("\n")}`
        : "";
  }

  const general =
    "En general, para minería con fuerte interoperabilidad y continuidad operativa, prioriza: IEC 61850 nativo (MMS/Report), redundancia PRP/HSR, cliente web HTML5, historian/alarms nativos y seguridad IEC 62443.";

  const cost =
    costSensitive
      ? "\n\n**Costo/TCO**: valida licenciamiento escalable, plantillas reutilizables y compatibilidad entre versiones para reducir esfuerzos de migración."
      : "";

  return `${general}${rankingText}\n\n**Notas normativas locales**:\n${localNotes.join("\n")}\n\n¿Quieres que afinemos la recomendación con datos precisos de tu proyecto (subestaciones, protocolos, ciberseguridad, web, etc.)?`;
}

function scoreItem(item, prefs) {
  let s = 0;
  const tags = (item.tags || []).map((x) => String(x).toLowerCase());
  const feats = (item.features || []).map((x) => String(x).toLowerCase());

  const has = (arr, ...keys) => keys.some((k) => arr.includes(k));

  if (prefs.wantsMining && has(tags, "minería", "mineria", "mining")) s += 3;
  if (prefs.wantsIEC61850 && has(tags.concat(feats), "iec 61850", "mms", "goose")) s += 3;
  if (prefs.wantsIEC62443 && has(tags.concat(feats), "iec 62443", "ad", "tls")) s += 2;
  if (prefs.wantsPRPHSR && has(tags.concat(feats), "prp", "hsr", "redundancia")) s += 2;
  if (prefs.wantsWeb && has(feats, "web", "html5", "cliente web")) s += 1;

  return s;
}
