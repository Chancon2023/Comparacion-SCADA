import React from 'react'
import data from '../data/scada_dataset.json'
import { prepareData } from '../components/utils'
import MiningConclusion from '../components/MiningConclusion'

export default function Ranking() {
  const ranking = prepareData(data)
  return (
    <div>
      <h2 style={{fontSize:20, fontWeight:600, marginBottom:10}}>Ranking general</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:12}}>
        {ranking.map((r,idx)=>{
          const name = data.platforms.find(p=>p.id===r.id)?.name
          return (
            <div key={r.id} style={{background:'#fff', borderRadius:14, padding:12, boxShadow:'0 1px 6px rgba(0,0,0,.08)'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div style={{fontWeight:600}}>#{idx+1} — {name}</div>
                <div style={{fontWeight:700}}>{Math.round(r.avg*100)}</div>
              </div>
              <div style={{height:8, background:'#eee', borderRadius:8, marginTop:8}}>
                <div style={{height:8, width:`${r.avg*100}%`, background:'#14b8a6', borderRadius:8}}></div>
              </div>
            </div>
          )
        })}
      </div>

      <MiningConclusion />
    </div>
  )
}
