// App.assistant.patch.jsx
// Reemplazo sugerido para añadir la ruta /assistant y el FAB global.
// Ajusta según tu estructura real (Navbar/Layout).

import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Charts from "./pages/Charts";
import Ranking from "./pages/Ranking";
import AssistantPage from "./pages/Assistant";
import AssistantFab from "./components/AssistantFab";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="font-semibold">SCADA Comparación Dashboard</Link>
            <nav className="flex gap-2 text-sm">
              <Link className="px-3 py-1.5 rounded-full hover:bg-slate-100" to="/charts">Gráficos</Link>
              <Link className="px-3 py-1.5 rounded-full hover:bg-slate-100" to="/ranking">Ranking</Link>
              <Link className="px-3 py-1.5 rounded-full hover:bg-slate-100" to="/assistant">Asistente</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/assistant" element={<AssistantPage />} />
          </Routes>
        </main>

        {/* Botón flotante accesible desde cualquier vista */}
        <AssistantFab />
      </div>
    </BrowserRouter>
  );
}
