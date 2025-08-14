// src/pages/RadarDetail.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts';
import { COLORS, computeRadarRow } from '../components/utils.js';
import { fetchWeights } from '../lib/supabase.js';

const DATA_URLS = ['/data/scada_dataset.json', '/scada_dataset.json'];

async function loadDataset() {
  for (const url of DATA_URLS) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  console.warn('No dataset JSON found in /data/ or root public.');
  return { platforms: [], features: [] };
}

export default function RadarDetail() {
  const [dataset, setDataset] = useState({ platforms: [], features: [] });
  const [weights, setWeights] = useState(null);
  const [selected, setSelected] = useState([]); // platform names (max 3)
  const [features, setFeatures] = useState([]); // selected features

  useEffect(() => {
    (async () => {
      const ds = await loadDataset();
      setDataset(ds);
      // features from dataset or union of first platform
      const f = Array.isArray(ds.features) && ds.features.length
        ? ds.features
        : Object.keys(ds.platforms?.[0]?.features || {});
      setFeatures(f);

      const w = await fetchWeights();
      if (w) setWeights(w);
    })();
  }, []);

  const allNames = useMemo(() => dataset.platforms.map(p => p.name), [dataset]);
  const selectedPlatforms = useMemo(
    () => dataset.platforms.filter(p => selected.includes(p.name)),
    [dataset, selected]
  );

  // preselect first 2 to help the user
  useEffect(() => {
    if (dataset.platforms.length && selected.length === 0) {
      setSelected(dataset.platforms.slice(0, 2).map(p => p.name));
    }
  }, [dataset, selected.length]);

  const chartData = useMemo(() => {
    if (!selectedPlatforms.length) return [];
    // recharts expects an array of objects { feature: 'Seguridad', 'ZENON': value, 'HITACHI': value ... }
    return features.map(feat => {
      const row = { feature: feat };
      selectedPlatforms.forEach((p, idx) => {
        row[p.name] = computeRadarRow(p, [feat], weights)[0];
      });
      return row;
    });
  }, [selectedPlatforms, features, weights]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between my-6">
          <h1 className="text-2xl md:text-3xl font-semibold">Radar detallado</h1>
          <button
            onClick={() => history.back()}
            className="text-sm px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            ← Volver
          </button>
        </div>

        {/* Selector de plataformas */}
        <div className="mb-6 flex flex-wrap gap-2">
          {allNames.map(n => {
            const active = selected.includes(n);
            const disabled = !active && selected.length >= 3;
            return (
              <button
                key={n}
                onClick={() => {
                  setSelected(prev => {
                    if (prev.includes(n)) return prev.filter(x => x !== n);
                    if (prev.length >= 3) return prev;
                    return [...prev, n];
                  });
                }}
                disabled={disabled}
                className={`px-3 py-2 rounded-2xl border ${active ? 'bg-slate-900 text-white' : 'bg-white'} disabled:opacity-50`}
              >
                {n}
              </button>
            );
          })}
        </div>

        {/* Radar */}
        <div className="bg-white rounded-2xl shadow p-4 md:p-6">
          {chartData.length ? (
            <div style={{ width: '100%', height: 480 }}>
              <ResponsiveContainer>
                <RadarChart data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="feature" />
                  <PolarRadiusAxis angle={30} />
                  {selectedPlatforms.map((p, i) => (
                    <Radar
                      key={p.name}
                      name={p.name}
                      dataKey={p.name}
                      stroke={COLORS[i % COLORS.length]}
                      fill={COLORS[i % COLORS.length]}
                      fillOpacity={0.2}
                    />
                  ))}
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-slate-500">Seleccione hasta 3 plataformas para comparar.</div>
          )}
        </div>
      </main>
    </div>
  );
}