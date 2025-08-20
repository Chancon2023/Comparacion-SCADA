import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const link = "px-3 py-2 rounded-full border bg-white hover:bg-slate-50 transition text-sm";
  const active = "bg-slate-900 text-white";
  return (
    <header className="nav">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">SCADA Comparación Dashboard</h1>
          <p className="text-xs text-slate-600">Comparador interactivo basado en tus planillas.</p>
        </div>
        <nav className="flex gap-2">
          <NavLink to="/" end className={({isActive})=>`${link} ${isActive?active:""}`}>Inicio</NavLink>
          <NavLink to="/graficos" className={({isActive})=>`${link} ${isActive?active:""}`}>Gráficos</NavLink>
          <NavLink to="/radar" className={({isActive})=>`${link} ${isActive?active:""}`}>Radar detallado</NavLink>
          <NavLink to="/dashboards" className={({isActive})=>`${link} ${isActive?active:""}`}>Dashboards</NavLink>
          <NavLink to="/ranking" className={({isActive})=>`${link} ${isActive?active:""}`}>Ranking</NavLink>
        </nav>
      </div>
    </header>
  );
}
