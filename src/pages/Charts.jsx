import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { COLORS, prepareData, fetchDataset } from "../components/utils";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis
} from "recharts";

export default function Charts() {
  const [dataset, setDataset] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await fetchDataset();
      if (!data) { setError("Sin dataset en /public/data"); return; }
      const normalized = Array.isArray(data) ? { platforms: data } : data;
      setDataset(normalized);
    })();
  }, []);

  const items = useMemo(()=> dataset ? prepareData(dataset) : [], [dataset]);

  if (error) {
    return <div className="max-w-5xl mx-auto p-6 text-rose-700">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold">Gráficos</h1>

      <div className="rounded-2xl p-6 bg-white shadow border">
        <h2 className="font-medium mb-4">Promedio por plataforma</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={items}>
            <XAxis dataKey="name" hide />
            <YAxis domain={[0,1]} hide />
            <Tooltip formatter={(v)=> (v*100).toFixed(1) + "%"} />
            <Bar dataKey="score" fill={COLORS.bar} radius={[8,8,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}