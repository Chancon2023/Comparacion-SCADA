import React, { useEffect, useRef, useState } from "react";

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hola, soy tu asistente SCADA. ¿Qué necesitas?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);

    try {
      // Aquí llamas a TU backend local o a la función de búsqueda/QA local.
      // De momento, hacemos un mock para que compile y renderice:
      const reply =
        "Estoy listo para responder en base a tus documentos locales. Sube la documentación en la sección 'Cargar documentos' (si la habilitaste) o dime qué buscas en NTSyCS / SITR / IEC 62443.";

      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "No pude consultar el motor inteligente en este momento. Reintenta en unos segundos.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-3">Asistente</h1>
      <p className="text-sm text-slate-600 mb-6">
        Pregunta sobre NTSyCS, SITR, IEC 62443 y selección de SCADA para minería.
      </p>

      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
        <div className="space-y-3 max-h-[55vh] overflow-auto">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`${
                  m.role === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-900"
                } rounded-xl px-4 py-2 max-w-[85%] whitespace-pre-wrap`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ej: ¿qué SCADA cumple mejor NTSyCS para subestaciones?"
            className="flex-1 border rounded-xl px-3 py-2 h-12 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <button
            onClick={send}
            disabled={busy}
            className="rounded-xl px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Ícono inline (paper plane) */}
            <span className="inline-flex items-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Enviar
            </span>
          </button>
        </div>

        {/* (Opcional) Zona de carga si más adelante activas el flujo local de documentos */}
        {/* <UploadZone /> */}
      </div>
    </div>
  );
}
