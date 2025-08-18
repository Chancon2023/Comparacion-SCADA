import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { fetchDataset, computeRadarRow } from "../components/utils.js";

export default function RadarDetail(){
  const { slug } = useParams();
  const nav = useNavigate();
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    (async () => {
      const { platforms } = await fetchDataset();
      const p = platforms.find(x => x.slug === slug) || null;
      setPlatform(p);
    })();
  }, [slug]);

  if (!platform){
    return <div className="card">Cargando…</div>;
  }

  const rows = computeRadarRow(platform).map(r => ({...r, valuePct: Math.round(r.value*100)}));

  return (
    <div className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2 style={{marginTop:0}}>Ficha: {platform.name}</h2>
        <button className="btn secondary" onClick={() => nav(-1)}>← Volver</button>
      </div>

      <div style={{width:"100%",height:420}}>
        <ResponsiveContainer>
          <RadarChart data={rows}>
            <PolarGrid />
            <PolarAngleAxis dataKey="feature" />
            <PolarRadiusAxis angle={30} domain={[0, 1]} />
            <Tooltip />
            <Legend />
            <Radar name="Score" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
