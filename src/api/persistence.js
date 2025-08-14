
import { supabase } from "../lib/supabaseClient";

/** Findings: pros / cons / alertas
 * table: findings
 * columns: id, platform, type ('pro'|'con'|'alert'), text, created_at
 */
export async function listFindings() {
  const { data, error } = await supabase
    .from("findings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function insertFinding({ platform, type, text }) {
  const { data, error } = await supabase
    .from("findings")
    .insert([{ platform, type, text }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFinding(id) {
  const { error } = await supabase.from("findings").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/** Pesos por feature
 * table: weights
 * columns: id, feature, weight (numeric)
 */
export async function getWeights() {
  const { data, error } = await supabase.from("weights").select("*");
  if (error) throw error;
  const map = {};
  (data || []).forEach((r) => (map[r.feature] = Number(r.weight)));
  return map;
}

export async function upsertWeight(feature, weight) {
  const { data, error } = await supabase
    .from("weights")
    .upsert({ feature, weight })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Overrides por plataforma/feature
 * table: feature_scores
 * columns: id, platform, feature, score (int), note
 */
export async function listFeatureScores() {
  const { data, error } = await supabase.from("feature_scores").select("*");
  if (error) throw error;
  return data || [];
}

export async function upsertFeatureScore({ platform, feature, score, note }) {
  const { data, error } = await supabase
    .from("feature_scores")
    .upsert({ platform, feature, score, note })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeFeatureScore(id) {
  const { error } = await supabase.from("feature_scores").delete().eq("id", id);
  if (error) throw error;
  return true;
}
