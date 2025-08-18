import React from 'react'
import data from '../data/scada_dataset.json'
import { computeRadarRow } from '../components/utils'

const CRITICAL = ['ciberseguridad','redundancia','protocolos','hardware']

export default function RadarDetail() {
  const featsZenon = data.features['zenon'] || {}
  const featsPOS = data.features['powerop'] || {}
  const z = computeRadarRow(featsZenon, CRITICAL)
  const p = computeRadarRow(featsPOS, CRITICAL)
  const label = ['Ciberseguridad','Redundancia','Protocolos','Compatibilidad HW']

  return (
    <div>
      <h2 style={{fontSize:20, fontWeight:600, marginBottom:10}}>Radar (resumen crítico)</h2>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        <div style={{background:'#fff', padding:12, borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,.08)'}}>
          <div style={{fontWeight:600, marginBottom:6}}>zenon</div>
          <ul>{label.map((n,i)=>(<li key={n}>{n}: {Math.round(z[i]*100)}%</li>))}</ul>
        </div>
        <div style={{background:'#fff', padding:12, borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,.08)'}}>
          <div style={{fontWeight:600, marginBottom:6}}>Power Operation Schneider</div>
          <ul>{label.map((n,i)=>(<li key={n}>{n}: {Math.round(p[i]*100)}%</li>))}</ul>
        </div>
      </div>
      <p style={{marginTop:12, color:'#6b7280'}}>Nota: Radar textual para mantener el build liviano (sin librerías de chart).</p>
    </div>
  )
}
