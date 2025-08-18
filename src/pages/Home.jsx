import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { classForCell, prepareData } from "../components/utils";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">SCADA Comparación Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/charts" className="rounded-xl px-4 py-2 bg-white border hover:bg-slate-50">Gráficos</Link>
          <Link to="/ranking" className="rounded-xl px-4 py-2 bg-slate-900 text-white hover:bg-slate-800">Ranking</Link>
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-white shadow border">
        <div className="text-slate-600">
          Comparador interactivo basado en tus planillas. Explora plataformas, mira pros/contras con origen y navega a los dashboards/radar.
        </div>
      </div>
    </div>
  );
}