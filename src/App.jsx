import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Ranking from './pages/Ranking.jsx'
import RadarDetail from './pages/RadarDetail.jsx'
import Charts from './pages/Charts.jsx'

export default function App() {
  return (
    <div style={{fontFamily:"Inter, system-ui, Avenir, Helvetica, Arial, sans-serif", padding:"16px"}}>
      <header style={{display:"flex", gap:12, alignItems:"center", marginBottom:16}}>
        <h1 style={{fontWeight:700, fontSize:22, marginRight:16}}>SCADA Comparación Dashboard</h1>
        <nav style={{display:"flex", gap:12}}>
          <Link to="/">Inicio</Link>
          <Link to="/ranking">Ranking</Link>
          <Link to="/radar">Radar detallado</Link>
          <Link to="/charts">Gráficos</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/radar" element={<RadarDetail />} />
        <Route path="/charts" element={<Charts />} />
      </Routes>
    </div>
  )
}
