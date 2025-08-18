import React, { useMemo } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { COLORS, scoreValue, computeRadarRow } from "../components/utils";

// …

// (opcional) función compacta para armar filas del radar de forma segura
function buildRadarRows({ data, selected = [], selectedFeatures = [], showAvg = false, onlyCritical = false }) {
  if (!data) return [];

  // Si no hay features seleccionadas, usa las claves conocidas del dataset si existen
  const feats = (selectedFeatures && selectedFeatures.length ? selectedFeatures : Object.keys(data.features || {}))
    .filter(Boolean);

  // Normaliza a 2 softwares como máximo si tu UI permite comparar 2/3
  const softwares = Array.isArray(selected) && selected.length ? selected : Object.keys(data.softwares || {});

  const rows = feats.map((feat) => {
    const row = { feature: feat };
    softwares.forEach((name, idx) => {
      const comment = data?.softwares?.[name]?.features?.[feat] ?? "";
      // usa wrapper computeRadarRow (0..2) – si no está, usa scoreValue
      const val = typeof computeRadarRow === "function" ? computeRadarRow(comment) : scoreValue(comment);
      row[`s${idx}`] = val;
    });
    if (showAvg) {
      const vals = softwares.map((_, idx) => row[`s${idx}`]).filter(v => Number.isFinite(v));
      row.avg = vals.length ? vals.reduce((a,b) => a + b, 0) / vals.length : 0;
    }
    return row;
  });

  // Si alguien activó “solo ítems críticos” y eso vacía el dataset, evita dejar [].
  const filtered = onlyCritical
    ? rows.filter(r =>
        /minería|subestac|redun|ciber|protocolo|iec|61850/i.test(r.feature || ""))
    : rows;

  return filtered.length ? filtered : rows;
}

// …

// en el JSX del gráfico:
<div className="w-full min-h-[380px]">
  <ResponsiveContainer width="100%" height={380}>
    <RadarChart
      data={rows /* el array devuelto por buildRadarRows */}
      outerRadius="70%"
    >
      <PolarGrid stroke="#e5e7eb" />
      <PolarAngleAxis dataKey="feature" tick={{ fontSize: 11 }} />
      <PolarRadiusAxis domain={[0, 2]} tickCount={5} axisLine={false} />
      {softwares.map((name, idx) => (
        <Radar
          key={name}
          name={name}
          dataKey={`s${idx}`}
          stroke={COLORS[idx % COLORS.length]}
          fill={COLORS[idx % COLORS.length]}
          fillOpacity={0.24}
        />
      ))}
      {/* promedio opcional */}
      {showAvg && (
        <Radar
          name="Promedio"
          dataKey="avg"
          stroke="#111827"
          fill="#111827"
          fillOpacity={0.15}
        />
      )}
      <Legend />
      <Tooltip />
    </RadarChart>
  </ResponsiveContainer>

  {/* Mensaje visible si no hay datos */}
  {!rows || rows.length === 0 ? (
    <div className="text-center text-sm text-slate-500 mt-3">
      Sin datos para mostrar. Revisa los filtros/selección o desactiva “solo ítems críticos”.
    </div>
  ) : null}
</div>

