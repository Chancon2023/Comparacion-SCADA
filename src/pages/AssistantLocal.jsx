
import React, { useEffect, useMemo, useRef, useState } from "react";
import DocDropzone from "../components/DocDropzone";
import ChatBubble from "../components/ChatBubble";

// Worker (empaquetado por Vite)
const RagWorker = new URL("../workers/ragWorker.js", import.meta.url);

const LS_KEY = "localRAG_docs_v1";

export default function AssistantLocal() {
  const [docs, setDocs] = useState([]);
  const [messages, setMessages] = useState([{
    role: "system",
    text: "Hola 👋 Soy tu asistente local. Sube PDF/Excel/TXT/MD y pregunta. Buscaré coincidencias y citaré fuentes.",
  }]);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(RagWorker, { type: "module" });

    workerRef.current.onmessage = (evt) => {
      const { type, payload } = evt.data || {};
      if (type === "indexed") {
        // listo el índice
        setPending(false);
      }
      if (type === "result") {
        setPending(false);
        const { answer, hits } = payload;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: answer, hits },
        ]);
      }
      if (type === "error") {
        setPending(false);
        const { message } = payload || { message: "Error desconocido" };
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: `⚠️ ${message}` },
        ]);
      }
    };

    // Rehidrata documentos (si existen)
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length) {
          setDocs(saved);
          setPending(true);
          workerRef.current.postMessage({ type: "ingest", payload: { docs: saved } });
        }
      } catch {}
    }

    return () => {
      workerRef.current && workerRef.current.terminate();
    };
  }, []);

  const onNewDocs = (newDocs) => {
    const merged = [...docs, ...newDocs];
    setDocs(merged);
    localStorage.setItem(LS_KEY, JSON.stringify(merged));
    setPending(true);
    workerRef.current.postMessage({ type: "ingest", payload: { docs: newDocs } });
  };

  const send = (e) => {
    e?.preventDefault?.();
    const q = input.trim();
    if (!q) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setPending(true);
    workerRef.current.postMessage({ type: "query", payload: { query: q, k: 5 } });
    setInput(""); // limpia
  };

  const clearAll = () => {
    if (!confirm("¿Borrar documentos locales y el chat?")) return;
    localStorage.removeItem(LS_KEY);
    setDocs([]);
    setMessages([{ role: "system", text: "Listo. Puedes volver a subir documentos." }]);
    setPending(false);
    workerRef.current.postMessage({ type: "reset" });
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">Asistente (local)</h1>
        <div className="flex gap-2">
          <button
            onClick={clearAll}
            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"
          >
            Borrar todo
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-semibold mb-2">Documentos</h2>
          <DocDropzone onParsed={onNewDocs} />
          {docs.length === 0 ? (
            <p className="text-sm text-gray-600 mt-3">
              Aún no hay documentos. Sube PDF, Excel, CSV, TXT o Markdown.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 max-h-64 overflow-auto text-sm">
              {docs.map((d, i) => (
                <li key={d.id} className="border rounded p-2">
                  <div className="font-medium">{d.title || d.name}</div>
                  <div className="text-gray-500 break-all">{d.meta?.path || d.name}</div>
                  <div className="text-xs text-gray-400">{Math.round((d.text || "").length / 1000)}k caracteres</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-4 flex flex-col">
          <h2 className="font-semibold mb-2">Chat</h2>
          <div className="flex-1 overflow-auto space-y-3 border rounded-lg p-3">
            {messages.map((m, idx) => (
              <ChatBubble key={idx} role={m.role} text={m.text} hits={m.hits} />
            ))}
            {pending && <div className="text-xs text-gray-500">Procesando…</div>}
          </div>
          <form onSubmit={send} className="flex gap-2 mt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Haz tu pregunta… (ej. ¿Qué SCADA cumple mejor IEC 62443?)"
              className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-800"
            >
              Enviar
            </button>
          </form>
        </section>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        * El análisis y el índice se ejecutan en tu navegador. No se usan APIs externas.
      </p>
    </main>
  );
}
