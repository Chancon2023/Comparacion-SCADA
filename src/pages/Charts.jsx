import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { fetchDataset } from "../components/utils.js";

export default function Charts(){
  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      const { platforms } = await fetchDataset();
      const rows = platforms.map(p => ({
        name: p.name,
        Ciberseguridad: Math.round(p.scores["Ciberseguridad"]*100),
        Redundancia: Math.round(p.scores["Redundancia"]*100),
        Protocolos: Math.round(p.scores["Protocolos"]*100),
        Hardware: Math.round(p.scores["Compatibilidad con hardware"]*100),
      }));
      setData(rows);
    })();
  }, []);

  if (!data.length){
    return <div className="card">No hay datos de /public/data/. Sube un JSON como <code>/data/scada_dataset.json</code> y vuelve a intentar.</div>;
  }

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>Barras: promedio por plataforma</h2>
      <div style={{width:"100%",height:420}}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{left:10,right:20,top:10,bottom:10}}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis domain={[0,100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Ciberseguridad" fill="#0ea5e9" />
            <Bar dataKey="Redundancia" fill="#22c55e" />
            <Bar dataKey="Protocolos" fill="#f97316" />
            <Bar dataKey="Hardware" fill="#a78bfa" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
