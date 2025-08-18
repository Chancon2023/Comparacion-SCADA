import React, { useState, useRef, useEffect } from "react";

/**
 * Asistente con Gemini (client-side).
 * Lee la clave desde import.meta.env.VITE_GEMINI_API_KEY
 * Requiere: habilitar la API "Generative Language" y crear API Key en https://aistudio.google.com/app/apikey
 */
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const MODEL = "gemini-1.5-flash-latest"; // rápido y suficiente para chat UI

const SYSTEM_INTRO = `Eres un asistente técnico especializado en sistemas SCADA y normativas chilenas.
Debes considerar NTSyCS, SITR, normativa eléctrica, ciberseguridad (IEC 62443) y buenas prácticas.
Responde de forma clara, con bullets cuando convenga, y pide más contexto si falta.
Si te preguntan por ranking o dataset, indícale que usa la data cargada en el sitio como insumo y que sus respuestas son orientativas.`;

async function callGemini(prompt, history) {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY in environment");
  }

  // Construimos el "contenido" para Gemini con el historial
  const contents = [];
  if (SYSTEM_INTRO) {
    contents.push({
      role: "user",
      parts: [{ text: `Contexto del sistema: ${SYSTEM_INTRO}` }],
    });
  }
  for (const m of history) {
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    });
  }
  // último mensaje del usuario
  contents.push({ role: "user", parts: [{ text: prompt }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 1024,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const raw = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${raw}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ??
    "(Sin respuesta)";
  return text;
}

export default function AssistantChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hola, soy tu asistente SCADA. Puedo orientarte sobre NTSyCS, SITR, IEC 62443 y mejores prácticas de selección de plataformas. ¿Qué necesitas?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const prompt = input.trim();
    if (!prompt) return;

    const next = [...messages, { role: "user", content: prompt }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const reply = await callGemini(prompt, next);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error(err);
      setError(
        `Nota: el servicio no está disponible (${err?.message ?? "error desconocido"
        }).`,
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "No pude consultar el motor inteligente en este momento. Reintenta en unos segundos.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-3">Asistente</h1>

      {(!GEMINI_API_KEY) && (
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-800 text-sm">
          Nota: el servicio no está disponible (Missing VITE_GEMINI_API_KEY).
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-800 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-sm h-[65vh] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-xs text-slate-500">Pensando…</div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={onSubmit} className="p-3 border-t flex gap-2">
          <input
            className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Haz una pregunta (ej. ¿qué SCADA cumple mejor la NTSyCS para subestaciones?)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Sugerencia: si necesitas que considere documentos o tablas de tu proyecto, resume el punto clave en tu pregunta.
      </p>
    </div>
  );
}
