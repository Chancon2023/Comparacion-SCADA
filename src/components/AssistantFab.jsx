import React from "react";
import { Link } from "react-router-dom";

/**
 * Botón flotante para abrir el asistente desde cualquier página.
 * Puedes colocarlo en App.jsx dentro del layout principal.
 */
export default function AssistantFab() {
  return (
    <Link
      to="/assistant"
      className="fixed bottom-4 right-4 z-40 rounded-full bg-sky-600 text-white px-5 py-3 shadow-xl hover:bg-sky-700"
      title="Abrir asistente SCADA"
    >
      Asistente
    </Link>
  );
}
