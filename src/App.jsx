import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Charts from "./pages/Charts.jsx";
import Ranking from "./pages/Ranking.jsx";
import RadarDetail from "./pages/RadarDetail.jsx";

export default function App(){
  return (
    <div>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/ranking/:slug" element={<RadarDetail />} />
        </Routes>
      </div>
    </div>
  );
}
