export const COLORS = {
  ok: '#14b8a6',
  mid: '#f59e0b',
  bad: '#ef4444'
};

export function scoreValue(state) {
  if (state === 'ok') return 1;
  if (state === 'mid') return 0.5;
  return 0;
}

export function prepareData(dataset) {
  // compute average score per platform
  return dataset.platforms.map(p => {
    const feats = dataset.features[p.id] || {};
    const vals = Object.values(feats).map(scoreValue);
    const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
    return { id: p.id, name: p.name, avg };
  }).sort((a,b)=> b.avg - a.avg);
}

export function computeRadarRow(feats, criticalKeys) {
  const out = [];
  for (const key of criticalKeys) {
    const v = scoreValue(feats[key]);
    out.push(v);
  }
  return out;
}
