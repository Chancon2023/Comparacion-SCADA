// src/pages/Ranking.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../lib/supabaseClient";
import { useLiveWeights } from "../hooks/useLiveWeights";
import ReviewBadge from "../components/ReviewBadge";
import MiningConclusion from "../components/MiningConclusion";

// Ajusta esta ruta a tu dataset local si difiere:
import baseData from "../data/scada_dataset.json";

const POSITIVE = new Set(["ok", "si", "yes", "true"]);
const NEUTRAL = new Set(["medio", "media", "warn", "?", "parcial"]);
const NEGATIVE = new Set(["no", "false"]);

// heurística simple para mapear un item de feature a score
function statusToScore(status) {
  if (!status && status !== 0) return 0;
  const s = String(status).toLowerCase().trim();
  if (POSITIVE.has(s)) return 1;
  if (NEUTRAL.has(s)) return 0.5;
  if (NEGATIVE.has(s)) return 0;
  // si viene numérico 0..1 lo usamos
  const n = Number(s);
  if (!Number.isNaN(n)) return Math.max(0, Math.min(1, n));
  return 0.5;
}

// clasificador por nombre para aplicar pesos
function classifyWeightKey(featureName) {
  const s = (featureName || "").toLowerCase();
  if (s.includes("seguridad") || s.includes("iec 62443") || s.includes("ciber")) return "seguridad";
  if (s.includes("redund")) return "redundancia";
  if (s.includes("integrac") || s.includes("protocolo") || s.includes("iec 61850") || s.includes("dnp")) return "integracion";
  return null; // sin peso especial
}

function computeScoreForPlatform(p, weights) {
  // Se espera que `p.features` sea [{ name, status }, ...].
  const feats = Array.isArray(p?.features) ? p.features : [];
  if (!feats.length) return 0;
  let total = 0;
  let count = 0;
  for (const f of feats) {
    const base = statusToScore(f.status);
    const key = classifyWeightKey(f.name);
    const w = key ? (weights?.[key] ?? 1) : 1;
    total += base * w;
    count += w;
  }
  return count ? (100 * total) / count : 0;
}

export default function Ranking() {
  const { weights } = useLiveWeights();
  const [reviews, setReviews] = useState({}); // { [software]: { pros, cons, notes } }
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadReviews() {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("software,pros,cons,notes,updated_at");
        if (error) throw error;
        const map = {};
        for (const r of data || []) {
          map[r.software] = { pros: r.pros || "", cons: r.cons || "", notes: r.notes || "" };
        }
        if (mounted) setReviews(map);
      } catch (err) {
        console.warn("[Ranking] No se pudieron cargar reseñas:", err?.message || err);
      } finally {
        if (mounted) setLoadingReviews(false);
      }
    }
    loadReviews();
    return () => { mounted = false; };
  }, []);

  const scored = useMemo(() => {
    return (baseData.platforms || []).map((p) => ({
      ...p,
      score: computeScoreForPlatform(p, weights),
    })).sort((a, b) => b.score - a.score);
  }, [weights]);

  return (
    <div className="px-4 md:px-8 lg:px-10 mx-auto max-w-7xl py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Ranking de plataformas SCADA</h1>
        <Link
          to="/"
          className="rounded-2xl bg-slate-800 text-white px-4 py-2 hover:bg-slate-700 shadow"
        >
          ← Volver
        </Link>
      </div>

      <div className="text-sm text-slate-600 mb-4">
        Pesos en vivo desde Supabase (tabla <code>weights</code>). Si no hay conexión, se usan pesos por defecto.
      </div>

      <ol className="space-y-6">
        {scored.map((p, idx) => {
          const rv = reviews[p.name] || {};
          return (
            <li key={p.name} className="rounded-2xl bg-white shadow p-5">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">
                  <span className="text-slate-400 mr-2">#{idx + 1}</span>
                  {p.name}
                </div>
                <div className="text-2xl font-bold tabular-nums">{p.score.toFixed(1)}</div>
              </div>

              <div className="mt-2 text-sm text-slate-600">{p.description}</div>

              <ReviewBadge pros={rv.pros} cons={rv.cons} notes={rv.notes} />
            </li>
          );
        })}
      </ol>

      <MiningConclusion />
    </div>
  );
}
