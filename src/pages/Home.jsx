import React from 'react'
import data from '../data/scada_dataset.json'
import { prepareData } from '../components/utils'

export default function Home() {
  const ranking = prepareData(data)
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
      {ranking.slice(0,2).map(r => (
        <div key={r.id} style={{borderRadius:14, background:'#fff', padding:16, boxShadow:'0 1px 6px rgba(0,0,0,.08)'}}>
          <div style={{fontWeight:600}}>{data.platforms.find(p=>p.id===r.id)?.name}</div>
          <span style={{marginTop:8, display:'inline-block', background:'rgba(20,184,166,.12)', color:'#065f46', padding:'6px 10px', borderRadius:8}}>
            Ciberseguridad: {Math.round(r.avg*100)}%
          </span>
        </div>
      ))}
    </div>
  )
}
