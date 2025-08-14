
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  listFindings,
  insertFinding,
  deleteFinding,
  getWeights,
  upsertWeight,
  listFeatureScores,
  upsertFeatureScore,
  removeFeatureScore,
} from "../api/persistence";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("findings");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  if (!user) return <Guard />;
  if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) return <NotAllowed email={user.email} />;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Panel Admin</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user.email}</span>
            <button
              onClick={() => supabase.auth.signOut().then(() => (window.location = "/login"))}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-white"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <nav className="flex gap-2 mb-4">
          {["findings", "weights", "overrides"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-xl border ${tab === t ? "bg-white shadow" : "bg-slate-100"}`}
            >
              {t}
            </button>
          ))}
        </nav>

        {tab === "findings" && <FindingsPanel />}
        {tab === "weights" && <WeightsPanel />}
        {tab === "overrides" && <OverridesPanel />}
      </div>
    </div>
  );
}

function Guard() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <a
        href="/login"
        className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800"
      >
        Iniciar sesión
      </a>
    </div>
  );
}

function NotAllowed({ email }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="font-medium">Usuario no autorizado</div>
        <div className="text-slate-600 text-sm">({email})</div>
      </div>
    </div>
  );
}

function FindingsPanel() {
  const [list, setList] = useState([]);
  const [platform, setPlatform] = useState("");
  const [type, setType] = useState("alert");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const rows = await listFindings();
    setList(rows);
  };
  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await insertFinding({ platform, type, text });
    setPlatform("");
    setType("alert");
    setText("");
    await load();
    setBusy(false);
  };

  const onDelete = async (id) => {
    if (!confirm("¿Eliminar registro?")) return;
    await deleteFinding(id);
    await load();
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-6 space-y-3">
        <div className="font-medium mb-2">Nueva alerta/pro/contra</div>
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Plataforma (ej: Zenon COPADATA)" value={platform} onChange={(e)=>setPlatform(e.target.value)} required />
        <select className="w-full border rounded-xl px-3 py-2" value={type} onChange={(e)=>setType(e.target.value)}>
          <option value="alert">alert</option>
          <option value="pro">pro</option>
          <option value="con">con</option>
        </select>
        <textarea className="w-full border rounded-xl px-3 py-2" rows={4} placeholder="Texto..." value={text} onChange={(e)=>setText(e.target.value)} required />
        <button disabled={busy} className="px-4 py-2 rounded-xl bg-slate-900 text-white">{busy? "Guardando..." : "Guardar"}</button>
      </form>

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="font-medium mb-2">Registros</div>
        <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
          {list.map((it)=>(
            <div key={it.id} className="border rounded-xl px-3 py-2 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">{it.platform} • {it.type}</div>
                <div>{it.text}</div>
              </div>
              <button onClick={()=>onDelete(it.id)} className="text-red-600 text-sm">Eliminar</button>
            </div>
          ))}
          {!list.length && <div className="text-slate-500 text-sm">Sin registros</div>}
        </div>
      </div>
    </div>
  );
}

function WeightsPanel() {
  const [rows, setRows] = useState([]);
  const [feature, setFeature] = useState("");
  const [weight, setWeight] = useState(1);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const map = await getWeights();
    setRows(Object.entries(map).map(([k,v])=>({ feature:k, weight:v })));
  };
  useEffect(()=>{ load(); },[]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await upsertWeight(feature, Number(weight));
    setFeature("");
    setWeight(1);
    await load();
    setBusy(false);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-6 space-y-3">
        <div className="font-medium mb-2">Peso por característica</div>
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Característica (ej: Seguridad)" value={feature} onChange={(e)=>setFeature(e.target.value)} required />
        <input type="number" step="0.1" className="w-full border rounded-xl px-3 py-2" value={weight} onChange={(e)=>setWeight(e.target.value)} />
        <button disabled={busy} className="px-4 py-2 rounded-xl bg-slate-900 text-white">{busy? "Guardando..." : "Guardar"}</button>
      </form>

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="font-medium mb-2">Pesos actuales</div>
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r)=> (
              <tr key={r.feature} className="border-b">
                <td className="py-2">{r.feature}</td>
                <td className="py-2 text-right">{r.weight}</td>
              </tr>
            ))}
            {!rows.length && <tr><td className="text-slate-500 py-4">Sin pesos definidos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverridesPanel() {
  const [rows, setRows] = useState([]);
  const [platform, setPlatform] = useState("");
  const [feature, setFeature] = useState("");
  const [score, setScore] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const tmp = await listFeatureScores();
    setRows(tmp);
  };
  useEffect(()=>{ load(); },[]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await upsertFeatureScore({ platform, feature, score: Number(score), note });
    setPlatform(""); setFeature(""); setScore(0); setNote("");
    await load();
    setBusy(false);
  };

  const onDelete = async (id) => {
    if (!confirm("¿Eliminar override?")) return;
    await removeFeatureScore(id);
    await load();
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-6 space-y-3">
        <div className="font-medium mb-2">Override por plataforma/feature</div>
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Plataforma" value={platform} onChange={(e)=>setPlatform(e.target.value)} required />
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Característica" value={feature} onChange={(e)=>setFeature(e.target.value)} required />
        <input type="number" min="-1" max="2" className="w-full border rounded-xl px-3 py-2" placeholder="score (-1..2)" value={score} onChange={(e)=>setScore(e.target.value)} />
        <textarea className="w-full border rounded-xl px-3 py-2" rows={3} placeholder="Nota (opcional)" value={note} onChange={(e)=>setNote(e.target.value)} />
        <button disabled={busy} className="px-4 py-2 rounded-xl bg-slate-900 text-white">{busy? "Guardando..." : "Guardar"}</button>
      </form>

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="font-medium mb-2">Overrides</div>
        <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
          {rows.map((r)=>(
            <div key={r.id} className="border rounded-xl px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-slate-500">{r.platform} • {r.feature}</div>
              <div className="text-sm">score: {r.score} {r.note? `• ${r.note}`: ""}</div>
              <div className="mt-1">
                <button onClick={()=>onDelete(r.id)} className="text-red-600 text-xs">Eliminar</button>
              </div>
            </div>
          ))}
          {!rows.length && <div className="text-slate-500 text-sm">Sin overrides</div>}
        </div>
      </div>
    </div>
  );
}
