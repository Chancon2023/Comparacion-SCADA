import React, { useState, useRef, useEffect } from "react";
import { search } from "../lib/localSearch";
import { hasDocs } from "../lib/localDocs";

export default function AssistantChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hola, soy tu asistente SCADA. Puedo orientarte sobre NTSyCS, SITR, IEC 62443 y selección de plataformas. Usa “Cargar documentos” para subir normativa/plantillas y te respondo en base a eso.",
    },
  ]);
  const [pending, setPending] = useState(false);
  const inputRef = useRef(null);
  const scrollerRef = useRef(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const ask = async (text) => {
    if (!text?.trim()) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setPending(true);

    try {
      // Respuesta local basada en documentos cargados
      if (!hasDocs()) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "Aún no has cargado documentos. Usa el botón “Cargar documentos” y luego pregunta de nuevo. También puedo responder en términos generales si lo indicas.",
          },
        ]);
        setPending(false);
        return;
      }

      const hits = search(text, 3);
      if (!hits.length) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "No encontré coincidencias claras en tus documentos. Prueba con otra redacción o carga más material. Si quieres, te sugiero términos para buscar en la web.",
          },
        ]);
        setPending(false);
        return;
      }

      const bullets = hits
        .map(
          (h) =>
            `• **${h.source}** → “…${h.text.slice(0, 220).replace(/\s+/g, " ")}…”`
        )
        .join("\n");

      const answer =
        `Esto encontré en tus documentos:\n\n${bullets}\n\n` +
        `> Sugerencia: si necesitas una recomendación concreta, dime el contexto (p.ej. subestaciones, ciberseguridad IEC 62443-3-3, telecontrol, etc.).`;

      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Hubo un problema analizando el contenido local. Intenta de nuevo o borra y vuelve a cargar los documentos.",
        },
      ]);
      console.error(e);
    } finally {
      setPending(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const v = inputRef.current?.value || "";
    inputRef.current.value = "";
    ask(v);
  };

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div
        ref={scrollerRef}
        className="max-h-[60vh] overflow-y-auto p-4 space-y-3"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] rounded-2xl bg-slate-900 px-4 py-2 text-white"
                : "max-w-[80%] rounded-2xl bg-slate-50 px-4 py-2"
            }
            dangerouslySetInnerHTML={{ __html: md(m.content) }}
          />
        ))}

        {pending && (
          <div className="max-w-[80%] rounded-2xl bg-slate-50 px-4 py-2 text-slate-600">
            Pensando…
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 p-3">
        <input
          ref={inputRef}
          type="text"
          placeholder="Ej: ¿qué SCADA cumple mejor NTSyCS para subestaciones?"
          className="flex-1 rounded-xl border px-4 py-2 outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-white"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

// Markdown muy básico para **negrita**
function md(s) {
  return (s || "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
