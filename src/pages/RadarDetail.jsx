// src/pages/RadarDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import supabase from "../lib/supabaseClient";
import { useLiveWeights } from "../hooks/useLiveWeights";
import ReviewBadge from "../components/ReviewBadge";

// Ajusta a tu dataset real
import baseData from "../data/scada_dataset.json";

const POSITIVE = new Set(["ok", "si", "yes", "true"]);
const NEUTRAL = new Set(["medio", "media", "warn", "?", "parcial"]);
const NEGATIVE = new Set(["no", "false"]);

function statusToScore(status) {
  if (!status && status !== 0) return 0;
  const s = String(status).toLowerCase().trim();
  if (POSITIVE.has(s)) return 1;
  if (NEUTRAL.has(s)) return 0.5;
  if (NEGATIVE.has(s)) return 0;
  const n = Number(s);
  if (!Number.isNaN(n)) return Math.max(0, Math.min(1, n));
  return 0.5;
}

function classifyWeightKey(featureName) {
  const s = (featureName || "").toLowerCase();
  if (s.includes("seguridad") || s.includes("iec 62443") || s.includes("ciber")) return "seguridad";
  if (s.includes("redund")) return "redundancia";
  if (s.includes("integrac") || s.includes("protocolo") || s.includes("iec 61850") || s.includes("dnp")) return "integracion";
  return null;
}

export default function RadarDetail() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const names = params.get("names")
    ? params.get("names").split(",").map((x) => decodeURIComponent(x))
    : [];

  const { weights } = useLiveWeights();
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    let mounted = true;
    async function loadReviews() {
      try {
        const { data, error } = await supabase.from("reviews").select("software,pros,cons,notes");
        if (error) throw error;
        const m = {};
        for (const r of data || []) m[r.software] = { pros: r.pros || "", cons: r.cons || "", notes: r.notes || "" };
        if (mounted) setReviews(m);
      } catch (e) {
        console.warn("[RadarDetail] Reseñas no disponibles:", e?.message || e);
      }
    }
    loadReviews();
    return () => { mounted = false; };
  }, []);

  const platforms = useMemo(() => {
    const all = baseData.platforms || [];
    if (!names.length) return all.slice(0, 3);
    return all.filter((p) => names.includes(p.name));
  }, [names]);

  // Prepara filas por característica con score por plataforma (0..1)
  const rows = useMemo(() => {
    const allFeatureNames = new Set();
    for (const p of platforms) {
      for (const f of p.features || []) allFeatureNames.add(f.name);
    }
    const list = [];
    for (const fname of allFeatureNames) {
      const key = classifyWeightKey(fname);
      const w = key ? (weights?.[key] ?? 1) : 1;
      const entry = { feature: fname, weight: w, values: {} };
      for (const p of platforms) {
        const f = (p.features || []).find((x) => x.name === fname);
        entry.values[p.name] = f ? statusToScore(f.status) : 0;
      }
      list.push(entry);
    }
    return list;
  }, [platforms, weights]);

  return (
    <div className="px-4 md:px-8 lg:px-10 mx-auto max-w-7xl py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Radar detallado</h1>
        <Link to="/"
          className="rounded-2xl bg-slate-800 text-white px-4 py-2 hover:bg-slate-700 shadow">
          ← Volver
        </Link>
      </div>

      <div className="text-sm text-slate-600 mb-4">
        Pesos en vivo de <code>weights</code> aplicados por característica (seguridad, redundancia, integración).
      </div>

      <div className="grid gap-4">
        {rows.map((row) => (
          <div key={row.feature} className="rounded-2xl bg-white shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{row.feature}</div>
              <div className="text-xs text-slate-500">peso ×{row.weight}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platforms.map((p) => (
                <div key={p.name} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-500">{p.name}</div>
                  <div className="font-semibold">{(row.values[p.name] * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        {platforms.map((p) => {
          const rv = reviews[p.name] || {};
          return (
            <div key={p.name} className="rounded-2xl bg-white shadow p-5 mb-4">
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="text-sm text-slate-600">{p.description}</div>
              <ReviewBadge pros={rv.pros} cons={rv.cons} notes={rv.notes} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
