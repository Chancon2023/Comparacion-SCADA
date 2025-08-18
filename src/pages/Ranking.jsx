import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDataset, scoreValue } from "../components/utils.js";

export default function Ranking(){
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetchDataset();
      if (!res.platforms.length){
        setError(true);
      } else {
        const rows = res.platforms.map(p => ({
          ...p,
          total: scoreValue(p.scores)
        }));
        rows.sort((a,b)=>b.total - a.total);
        setItems(rows);
      }
    })();
  }, []);

  if (error){
    return (
      <div className="card" style={{background:"#fff1f2",border:"1px solid #fecdd3"}}>
        <div style={{color:"#9f1239",fontWeight:700}}>No se encontró un dataset en /public/data/.</div>
        <p style={{marginTop:8}}>Rutas probadas: <code>/data/scada_dataset.json</code>, <code>/data/scada_dataset_mining_extended.json</code>, <code>/data/dataset.json</code></p>
        <p>Sube tu archivo JSON a <code>public/data/</code> y vuelve a publicar.</p>
      </div>
    );
  }

  if (!items.length){
    return <div className="card">Cargando ranking…</div>;
  }

  return (
    <div className="row">
      {items.map((p,idx) => (
        <div className="card" key={p.slug} style={{flex:"1 1 420px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <h3 style={{marginTop:0}}>{idx+1}. {p.name}</h3>
            <span className="badge">{Math.round(p.total*100)} / 100</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {Object.entries(p.scores).map(([k,v]) => (
              <span key={k} className="badge">{k}: {Math.round(v*100)}%</span>
            ))}
          </div>
          <div style={{marginTop:12,display:"flex",gap:8}}>
            <Link className="btn" to={`/ranking/${p.slug}`}>Ver radar</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
