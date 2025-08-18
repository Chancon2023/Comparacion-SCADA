import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/index.css";

// Layout
import Navbar from "./components/Navbar.jsx";

// Pages
import Home from "./pages/Home.jsx";
import Charts from "./pages/Charts.jsx";
import RadarDetail from "./pages/RadarDetail.jsx";
import Dashboards from "./pages/Dashboards.jsx";
import Ranking from "./pages/Ranking.jsx";
import AssistantPage from "./pages/Assistant.jsx"; // ⬅️ nueva ruta

function Root() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/graficos" element={<Charts />} />
        <Route path="/radar" element={<RadarDetail />} />
        <Route path="/dashboards" element={<Dashboards />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/assistant" element={<AssistantPage />} /> {/* ⬅️ aquí */}
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
