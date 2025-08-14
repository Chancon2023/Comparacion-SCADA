// src/pages/Ranking.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { fetchWeights, fetchReviews } from '../lib/supabase.js';
import { scoreValue } from '../components/utils.js';

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

function computeScore(p, features, weights) {
  let total = 0, max = 0;
  features.forEach(f => {
    const w = (weights && Number(weights[f])) || 1;
    const v = scoreValue(p.features?.[f]); // 0..2
    total += v * w;
    max += 2 * w;
  });
  const pct = max ? (total / max) * 100 : 0;
  return { raw: total, max, pct: Math.round(pct * 10) / 10 };
}

export default function Ranking() {
  const [dataset, setDataset] = useState({ platforms: [], features: [] });
  const [weights, setWeights] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    (async () => {
      const ds = await loadDataset();
      setDataset(ds);
      const [w, r] = await Promise.all([fetchWeights(), fetchReviews()]);
      if (w) setWeights(w);
      if (r?.length) setReviews(r);
    })();
  }, []);

  const features = useMemo(() => {
    const f = Array.isArray(dataset.features) && dataset.features.length
      ? dataset.features
      : Object.keys(dataset.platforms?.[0]?.features || {});
    return f || [];
  }, [dataset]);

  const rows = useMemo(() => {
    return dataset.platforms.map(p => {
      const s = computeScore(p, features, weights);
      // merge reviews from DB
      const db = reviews.find(r => r.platform?.toLowerCase() === p.name?.toLowerCase());
      const pros = (p.pros || []).concat(db?.pros || []);
      const cons = (p.cons || []).concat(db?.cons || []);
      return { ...p, score: s, pros, cons, source_url: db?.source_url };
    }).sort((a, b) => b.score.pct - a.score.pct);
  }, [dataset, features, weights, reviews]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold">Ranking de plataformas SCADA</h1>
          <button
            onClick={() => history.back()}
            className="text-sm px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            ← Volver
          </button>
        </div>

        {!rows.length && (
          <div className="text-slate-500">Cargando dataset…</div>
        )}

        <div className="space-y-6">
          {rows.map((p, idx) => (
            <div key={p.name} className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-slate-500">#{idx + 1}</div>
                  <h2 className="text-xl font-semibold">{p.name}</h2>
                </div>
                <div className="text-2xl font-bold">{p.score.pct}</div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <div className="font-medium mb-1">Por qué destaca</div>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {(p.pros || ['(Sin reseñas)']).slice(0, 6).map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <div className="font-medium mb-1">A tener en cuenta</div>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {(p.cons || ['(Sin reseñas)']).slice(0, 6).map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">
                    Puntuación normalizada según pesos {weights ? '(Supabase)' : '(default)'}.
                  </div>
                  {p.source_url && (
                    <a
                      href={p.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-sm text-slate-600 underline"
                    >
                      ver origen
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}