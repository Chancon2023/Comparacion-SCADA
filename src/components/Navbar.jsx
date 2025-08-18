import React from "react";
import { NavLink } from "react-router-dom";

const linkStyle = ({isActive}) => ({
  padding: "10px 14px",
  borderRadius: 999,
  background: isActive ? "#0f172a" : "#e5e7eb",
  color: isActive ? "#fff" : "#0f172a",
  fontWeight: 600
});

export default function Navbar(){
  return (
    <header style={{background:"#fff",boxShadow:"0 6px 20px rgba(0,0,0,.07)"}}>
      <div className="container" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
        <h1 style={{fontSize:26,margin:0,fontWeight:800}}>SCADA Comparación Dashboard</h1>
        <nav style={{display:"flex",gap:10}}>
          <NavLink to="/" style={linkStyle}>Inicio</NavLink>
          <NavLink to="/charts" style={linkStyle}>Gráficos</NavLink>
          <NavLink to="/ranking" style={linkStyle}>Ranking</NavLink>
        </nav>
      </div>
    </header>
  );
}
