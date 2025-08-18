import React, { useState } from "react";
import ScadaAssistant from "./ScadaAssistant";

export default function AssistantFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={()=>setOpen(true)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-slate-900 text-white px-4 py-3 shadow-xl hover:bg-slate-800"
        aria-label="Abrir asistente"
      >
        Asistente
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end md:items-center md:justify-center">
          <div className="bg-transparent w-full md:w-[780px] md:h-[75vh] p-4">
            <div className="bg-white rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="font-semibold">Asistente SCADA</div>
                <button
                  onClick={()=>setOpen(false)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Cerrar ✕
                </button>
              </div>
              <div className="p-3 md:p-4 h-full">
                <ScadaAssistant />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
