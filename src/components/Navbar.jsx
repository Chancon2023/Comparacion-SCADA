import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const path = typeof window!=='undefined' ? window.location.pathname : '/';
  const Tab = ({to, children}) => <a href={to} className={"nav-tab " + (path===to ? "active" : "")}>{children}</a>;
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <a href="/" className="text-lg font-extrabold tracking-tight">SCADA Comparación Dashboard</a>
        <nav className="ml-auto flex items-center gap-2">
          <Tab to="/">Inicio</Tab>
          <Tab to="/charts">Gráficos</Tab>
          <Tab to="/radar">Radar detallado</Tab>
          <Tab to="/dashboards">Dashboards</Tab>
          <Tab to="/ranking">Ranking</Tab>
        </nav>
      </div>
    </header>
  );
}
