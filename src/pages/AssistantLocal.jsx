import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildIndex, search, snippetsFor } from "../lib/localSearch";

const KB_URL = "/data/knowledge.json";

function useKnowledge(){
  const [data,setData]=useState([]);
  const [status,setStatus]=useState("idle");
  const [err,setErr]=useState(null);
  useEffect(()=>{
    let mounted=true;
    (async()=>{
      setStatus("loading");
      try{
        const override=localStorage.getItem("kb_override_json");
        if(override){
          const parsed=JSON.parse(override);
          if(Array.isArray(parsed)){ if(mounted){ setData(parsed); setStatus("ready"); } return; }
        }
        const res=await fetch(KB_URL,{cache:"no-store"});
        if(!res.ok) throw new Error(`KB fetch failed: ${res.status}`);
        const json=await res.json();
        if(!Array.isArray(json)) throw new Error("KB must be an array");
        if(mounted){ setData(json); setStatus("ready"); }
      }catch(e){ console.error(e); if(mounted){ setErr(String(e)); setStatus("error"); } }
    })();
    return ()=>{mounted=false};
  },[]);
  return {data,status,err,setData};
}

export default function AssistantLocal(){
  const {data,status,err,setData}=useKnowledge();
  const idx=useMemo(()=> (status==="ready" ? buildIndex(data) : null), [status,data]);
  const [q,setQ]=useState("");
  const [messages,setMessages]=useState([
    { role:"assistant", text:"Hola, soy tu asistente local. Puedo buscar en /public/data/knowledge.json o en lo que subas (JSON/TXT/MD)." }
  ]);
  const inputRef=useRef(null);

  const ask=(question)=>{
    if(!question.trim()) return;
    setMessages(m=>[...m,{role:"user", text:question}]);
    setQ("");
    if(!idx){ setMessages(m=>[...m,{role:"assistant", text:"Aún no tengo índice cargado. Sube un JSON o añade knowledge.json."}]); return; }
    const results=search(idx, question, {topK:5});
    if(!results.length){ setMessages(m=>[...m,{role:"assistant", text:"No encontré respuesta directa. Amplía la consulta o sube más fuentes."}]); return; }
    const bullets = results.map(({doc,score})=>{
      const snips = snippetsFor(doc, question, 2);
      const cite = doc.source ? ` (${doc.source})` : "";
      return `• ${doc.title || "Documento"}${cite}\n   ${snips.map(s=> "“"+s+"”").join(" ")}`;
    });
    const answer = ["Esto es lo más relevante que encontré:", "", ...bullets, "", "Puedo priorizar por NTSyCS / SITR / IEC 62443 si aparecen en los textos."].join("\n");
    setMessages(m=>[...m,{role:"assistant", text:answer}]);
  };

  const onUploadJSON=async(ev)=>{
    const file=ev.target.files?.[0]; if(!file) return;
    const text=await file.text();
    try{
      const json=JSON.parse(text);
      if(!Array.isArray(json)) throw new Error("El JSON debe ser un array de objetos {id,title,source,text}.");
      localStorage.setItem("kb_override_json", JSON.stringify(json));
      setData(json);
      setMessages(m=>[...m,{role:"assistant", text:`Cargué ${json.length} documentos del JSON.`}]);
    }catch(e){ alert("JSON inválido: "+e.message); }
    finally{ ev.target.value=""; }
  };

  const onUploadTXT=async(ev)=>{
    const file=ev.target.files?.[0]; if(!file) return;
    const text=await file.text();
    const doc={id:`local_${Date.now()}`, title:file.name, source:file.name, text};
    const merged=[doc, ...(data||[])];
    localStorage.setItem("kb_override_json", JSON.stringify(merged));
    setData(merged);
    setMessages(m=>[...m,{role:"assistant", text:`Añadí "${file.name}" al índice local.`}]);
    ev.target.value="";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Asistente (Local)</h1>
      <p className="text-sm text-slate-600 mb-4">
        Usa <code>/public/data/knowledge.json</code> en producción o sube JSON/TXT/MD en vivo (se guarda en <code>localStorage</code>).
      </p>

      <div className="flex flex-wrap gap-2 items-center mb-4">
        <label className="text-sm border rounded-xl px-3 py-2 bg-white hover:bg-slate-50 cursor-pointer">Cargar JSON
          <input type="file" accept="application/json" className="hidden" onChange={onUploadJSON} />
        </label>
        <label className="text-sm border rounded-xl px-3 py-2 bg-white hover:bg-slate-50 cursor-pointer">Cargar TXT/MD
          <input type="file" accept=".txt,.md,text/plain" className="hidden" onChange={onUploadTXT} />
        </label>
        <button className="text-sm border rounded-xl px-3 py-2 bg-white hover:bg-slate-50" onClick={()=>{localStorage.removeItem("kb_override_json"); window.location.reload();}}>Restablecer</button>
      </div>

      <div className="rounded-2xl border bg-white p-4 md:p-6 min-h-[320px] flex flex-col gap-3">
        <div className="flex-1 space-y-3 overflow-auto">
          {messages.map((m,i)=> (
            <div key={i} className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${m.role==="user" ? "ml-auto bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
              {m.text}
            </div>
          ))}
        </div>
        <form className="flex gap-2 mt-2" onSubmit={(e)=>{e.preventDefault(); ask(q);}}>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Pregunta aquí..." className="flex-1 rounded-xl border px-3 py-2" />
          <button className="rounded-xl bg-slate-900 text-white px-4 py-2 hover:bg-slate-800">Enviar</button>
        </form>
        {status!=="ready" && (
          <div className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
            {status==="loading" && "Cargando índice local..."}
            {status==="error" && `No pude leer /data/knowledge.json (${err}).`}
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-slate-500">
        <p><strong>Nota:</strong> Para PDF/Excel, preprocesa y exporta texto a JSON en <code>public/data/knowledge.json</code>.</p>
      </div>
    </div>
  );
}