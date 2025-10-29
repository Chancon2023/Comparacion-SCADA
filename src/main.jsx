import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/index.css";
import Home from "./pages/Home.jsx";
import Charts from "./pages/Charts.jsx";
import RadarDetail from "./pages/RadarDetail.jsx";
import Dashboards from "./pages/Dashboards.jsx";
import Ranking from "./pages/Ranking.jsx";
import NeuralComparator from "./pages/NeuralComparator.jsx";

function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/graficos" element={<Charts />} />
        <Route path="/radar" element={<RadarDetail />} />
        <Route path="/dashboards" element={<Dashboards />} />
        <Route path="/neural" element={<NeuralComparator />} />
        <Route path="/ranking" element={<Ranking />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
