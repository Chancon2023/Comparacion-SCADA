import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * AssistantChat.jsx
 * Chat sin backend que recomienda plataformas SCADA y responde
 * sobre NTSyCS, SITR, IEC-61850/62443, PRP/HSR, etc.
 * - Lee opcionalmente /data/scada_dataset.json si existe
 * - No usa librerías externas (apto Netlify/Vite)
 */

const KB = [
  {
    tag: "normativa_ntsycs",
    keys: ["ntsycs", "norma técnica", "coordinador", "cdec", "agrupamientos", "dobles", "estampa de tiempo", "señales"],
    answer:
      "La NTSyCS exige, entre otros puntos, consistencia de estampa de tiempo y capacidad de **agrupamiento de señales** manteniendo su marca temporal. Verifica que el SCADA soporte: (1) transformación de puntos simples↔dobles; (2) agrupaciones con retención de timestamp; (3) trazabilidad en logs. Muchos incumplimientos vienen de mapeos IEC‑60870 o drivers IEC‑61850 mal configurados."
  },
  {
    tag: "sitr",
    keys: ["sitr", "regulador", "coordinador eléctrico", "reportes", "telemedición"],
    answer:
      "Para el SITR (Coordinador Eléctrico de Chile), prioriza: disponibilidad de datos, historización segura, exportes consistentes y control de calidad de mediciones. Asegura IEC‑61850/60870 interoperable y validaciones de integridad antes de publicar los datos al Coordinador."
  },
  {
    tag: "iec_61850",
    keys: ["iec 61850", "mms", "ied", "interop", "goose", "report control block", "datasets"],
    answer:
      "En IEC‑61850, revisa: (1) interoperabilidad real con IEDs multi‑marca vía MMS; (2) soporte para RCBs, datasets y buffer; (3) mapeo correcto de calidad/topicalidad; (4) diagnóstico detallado de enlace. Red flags típicas: driver que no integra IEDs de distintas marcas o falla MMS en carga."
  },
  {
    tag: "iec_62443",
    keys: ["iec 62443", "ciberseguridad", "ad", "hardening"],
    answer:
      "Ciberseguridad IEC‑62443: autenticación/ autorización por rol, integración con **Active Directory**, cifrado TLS de clientes web, hardening del servidor, logging centrado y segmentación de redes. Verifica perfiles de usuario por rol de operación y registro de auditoría."
  },
  {
    tag: "redundancia",
    keys: ["redundancia", "prp", "hsr", "lan a", "lan b", "hot standby", "failover"],
    answer:
      "Para alta disponibilidad: PRP/HSR en subestación, hot‑standby a nivel de servidor, sincronización NTP/PTP y conmutación determinista de clientes. Si el proveedor declara PRP/HSR, exige pruebas de failover con **LAN‑A/LAN‑B** y tiempos medidos."
  },
  {
    tag: "zenon",
    keys: ["zenon", "copa-data", "ncs", "energy edition"],
    answer:
      "zenon (COPA‑DATA) destaca por plataforma unificada SCADA/DMS/GIS/Historian, cliente web HTML5, plantillas y compatibilidad fuerte entre versiones. Suele ser idóneo en minería y utilidades con múltiples centros. Soporta IEC‑61850/60870/DNP3 nativos y buenas prácticas de ciberseguridad (IEC‑62443/AD)."
  },
  {
    tag: "power_operation_schneider",
    keys: ["power operation", "schneider", "ecostruxure"],
    answer:
      "Power Operation (Schneider) es robusto en utilities, pero considera red flags reportadas: (1) problemas de driver IEC‑61850 MMS con IEDs multi‑marca, (2) redundancia que requiere tuning específico, (3) actualizaciones orientadas a corrección que pueden requerir procedimientos extensos. Valida en FAT/SAT."
  },
  {
    tag: "hitachi_nm",
    keys: ["hitachi network manager", "hnm"],
    answer:
      "Hitachi Network Manager se orienta a T&D a gran escala. Suele requerir personalización e ingeniería especializada; verifica compatibilidad con antivirus, costo de web client y roadmap de versiones."
  },
  {
    tag: "siemens_spectrum",
    keys: ["siemens spectrum power"],
    answer:
      "Spectrum Power es clase enterprise para T&D. Revisa dependencias de hardware, licenciamiento y que los módulos nativos cubran tus casos (GIS/Estimador/Flujos) sin integraciones costosas."
  },
  {
    tag: "abb_zee600",
    keys: ["zee600", "see00", "abb"],
    answer:
      "ABB ZEE600/SEE00 suele operar una versión por detrás respecto de zenon (p.ej. si zenon está en v15, ABB en v14). Confirma compatibilidad de ingeniería/destinos y roadmap del proveedor."
  }
];

// util simple de similitud por palabras clave
function scoreText(text, keys) {
  const t = (text || "").toLowerCase();
  let s = 0;
  keys.forEach(k => { if (t.includes(k.toLowerCase())) s += 1; });
  return s;
}

function rankKB(question) {
  const scored = KB.map(k => ({ ...k, s: scoreText(question, k.keys) }));
  return scored.sort((a, b) => b.s - a.s);
}

function rankFromDataset(question, dataset) {
  const t = (question || "").toLowerCase();
  return (dataset || [])
    .map(p => {
      const hay = [p.name, ...(p.tags || []), ...(p.features || [])].join(" ").toLowerCase();
      let s = 0;
      // pesos simples
      ["minería","iec 61850","redundancia","prp","hsr","iec 62443","ciberseguridad","histori","web","html"].forEach(k=>{
        if (hay.includes(k)) s += 2;
        if (t.includes(k)) s += 1;
      });
      // bonus por nombre
      if (t.includes((p.name||"").toLowerCase())) s += 3;
      return { item: p, s };
    })
    .sort((a,b)=>b.s-a.s);
}

export default function AssistantChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hola 👋 Soy tu asistente SCADA. Pregúntame por NTSyCS/SITR, IEC‑61850/62443, PRP/HSR o pídeme una recomendación según tu proyecto. Ej: “Necesito SCADA para minería con IEC‑61850 y redundancia PRP/HSR”. "}
  ]);
  const dsRef = useRef({ loaded: false, data: [] });

  useEffect(() => {
    // intenta leer dataset público (opcional)
    fetch("/data/scada_dataset.json", { cache: "no-store" })
      .then(r => r.ok ? r.json() : [])
      .then(j => { dsRef.current = { loaded: true, data: Array.isArray(j) ? j : [] }; })
      .catch(()=>{ dsRef.current = { loaded: false, data: [] }; });
  }, []);

  const send = () => {
    const q = question.trim();
    if (!q) return;
    setMessages(m => [...m, { role: "user", content: q }]);
    setQuestion("");

    // 1) respuesta normativa/guía
    const best = rankKB(q);
    const normResp = best[0]?.s > 0 ? best.slice(0,2).map(x=>`• ${x.answer}`).join("\n") :
      "Puedo ayudarte con NTSyCS/SITR, IEC‑61850/62443, PRP/HSR y prácticas de arquitectura SCADA. Escribe tu caso de uso (industria, protocolos, redundancia requerida, web, etc.).";

    // 2) recomendación desde dataset si existe
    let recText = "";
    if (dsRef.current.data && dsRef.current.data.length) {
      const ranked = rankFromDataset(q, dsRef.current.data).slice(0,3);
      if (ranked.length) {
        recText = "\n\n**Top sugerencias (dataset):**\n" + ranked.map((r,i)=>{
          const p = r.item;
          const pros = (p.pros||[]).slice(0,2).join(" · ");
          const cons = (p.cons||[]).slice(0,1).join(" · ");
          return `${i+1}. **${p.name}** — Pros: ${pros || "n/a"}${cons ? ` — Contras: ${cons}` : ""}`;
        }).join("\n");
      }
    }

    const final =
`### Análisis
${normResp}
${recText}

> Nota: resultados orientativos. Valida en FAT/SAT: IEC‑61850 MMS con multi‑marca, tiempos de failover PRP/HSR, y cumplimiento NTSyCS (agrupamientos y timestamp).`;

    setTimeout(()=>{
      setMessages(m => [...m, { role: "assistant", content: final }]);
    }, 200);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b bg-gray-50 rounded-t-2xl">
          <h2 className="font-semibold">Asistente SCADA</h2>
          <p className="text-sm text-gray-600">Basado en mejores prácticas (NTSyCS/SITR, IEC‑61850/62443, PRP/HSR). Lee tu dataset si existe.</p>
        </div>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {messages.map((m, idx)=>(
            <div key={idx} className={`text-sm leading-relaxed ${m.role==="assistant"?"text-gray-900":"text-gray-800"}`}>
              <div className={`inline-block px-3 py-2 rounded-2xl ${m.role==="assistant"?"bg-gray-100":"bg-blue-50"}`}>
                <div className="whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t flex items-center gap-2">
          <input
            value={question}
            onChange={e=>setQuestion(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") send(); }}
            className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Escribe tu consulta…"
          />
          <button onClick={send} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
