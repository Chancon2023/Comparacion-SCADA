import React, { useRef, useState, useEffect } from "react";

/**
 * AssistantChat.jsx (ultra‑mínimo y a prueba de errores)
 * - No hace fetch de ningún dataset (para evitar fallos CORS/404)
 * - NO depende de ninguna librería extra
 * - Responde con reglas simples y NO se rompe
 */
export default function AssistantChat() {
  const [msgs, setMsgs] = useState([
    { role: "assistant", text: "Hola 👋 Soy tu asistente SCADA. ¿Qué necesitas evaluar (IEC 61850/62443, PRP/HSR, NTSyCS/SITR, minería, web HTML5)?" }
  ]);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(()=>{
    endRef.current?.scrollIntoView({behavior:"smooth"});
  }, [msgs]);

  function send(e){
    e.preventDefault();
    const q = text.trim();
    if(!q) return;
    setMsgs(m=>[...m, {role:"user", text:q}]);
    setText("");
    setTimeout(()=>{
      const reply = think(q);
      setMsgs(m=>[...m, {role:"assistant", text: reply}]);
    }, 150);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow">
      <div className="h-80 overflow-y-auto p-3 space-y-2">
        {msgs.map((m,i)=>(
          <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.role==="user"?"bg-slate-900 text-white":"bg-slate-100 text-slate-900"}`}>
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="p-3 border-t flex gap-2 bg-slate-50">
        <input
          className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Escribe tu consulta…"
          value={text}
          onChange={e=>setText(e.target.value)}
        />
        <button className="rounded-xl bg-slate-900 text-white px-4 py-2 hover:bg-slate-800">Enviar</button>
      </form>
    </div>
  );
}

/** Respuesta simple a prueba de fallas */
function think(q){
  const t = q.toLowerCase();
  const tips = [];
  if(/61850|mms|goose/.test(t)) tips.push("• Verifica IEC 61850 (MMS/GOOSE) estable con IEDs multi‑marca y RCB/datasets correctos.");
  if(/redundan|prp|hsr/.test(t)) tips.push("• Requiere PRP/HSR y hot‑standby; mide tiempos de failover LAN‑A/LAN‑B.");
  if(/62443|ciber|seguridad|ad/.test(t)) tips.push("• IEC 62443: AD/LDAP, TLS, hardening, roles y auditoría.");
  if(/mineri|minera/.test(t)) tips.push("• En minería: plataforma unificada (SCADA/DMS/GIS/Historian) + web HTML5 + compatibilidad entre versiones.");
  if(/web|html5|cliente/.test(t)) tips.push("• Cliente web HTML5 nativo con SSO y cifrado.");
  if(tips.length===0) tips.push("• Define: protocolos (IEC 61850/60870/DNP3), redundancia (PRP/HSR), ciberseguridad (IEC 62443/AD), cliente web, y requisitos NTSyCS/SITR.");

  const rec = [
    "1) zenon Energy Edition (NCS) — fuerte en minería, web nativo, plataforma unificada.",
    "2) Siemens Spectrum Power — T&D enterprise; revisar costo/licenciamiento.",
    "3) Hitachi Network Manager — gran escala; usualmente requiere personalización.",
    "4) Power Operation Schneider — revisar red flags IEC 61850/MMS y redundancia en FAT/SAT."
  ].join("\n");

  return `Recomendación preliminar:\n${rec}\n\nChecklist:\n${tips.join("\n")}`;
}