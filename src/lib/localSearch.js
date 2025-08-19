// Lightweight local search without external APIs.
// - Accepts knowledge base as array of { id, title, source, text, tags? }
// - Creates simple inverted index + TF-IDF-ish scoring and cosine similarity.
// - Includes sentence chunking to return snippets for citations.

function normalize(s){return (s||"").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]+/gu," ").replace(/\s+/g," ").trim();}
function tokenize(s){return normalize(s).split(" ").filter((w)=>w.length>=2);}
function splitSentences(text){const raw=(text||"").replace(/\n+/g," ").split(/(?<=[.!?])\s+/);return raw.map((s)=>s.trim()).filter(Boolean);}

export function buildIndex(docs){
  const index=new Map(); const df=new Map(); const docLengths=new Map(); const vocabulary=new Set();
  for(const doc of docs){
    const tokens=tokenize(doc.text); docLengths.set(doc.id,tokens.length); const seen=new Set();
    for(const t of tokens){
      vocabulary.add(t); const posting=index.get(t)||new Map(); posting.set(doc.id,(posting.get(doc.id)||0)+1); index.set(t,posting);
      if(!seen.has(t)){ df.set(t,(df.get(t)||0)+1); seen.add(t); }
    }
  }
  const idf=new Map(); const N=docs.length||1;
  for(const t of vocabulary){ const dft=df.get(t)||1; idf.set(t, Math.log((N+1)/(dft+0.5))); }
  return { index, idf, docLengths, docs };
}

export function search(idx, query,{topK=5}={}){
  const qTokens=tokenize(query); const scores=new Map();
  for(const qt of qTokens){
    const posting=idx.index.get(qt); if(!posting) continue; const idf=idx.idf.get(qt)||0;
    for(const [docId, tf] of posting.entries()){
      const len=idx.docLengths.get(docId)||1; const w=(tf/len)*idf;
      scores.set(docId,(scores.get(docId)||0)+w);
    }
  }
  const ranked=[...scores.entries()].sort((a,b)=>b[1]-a[1]).slice(0,topK).map(([docId,score])=>({score, doc: idx.docs.find((d)=>d.id===docId)}));
  return ranked;
}

export function snippetsFor(doc, query, maxSnippets=3){
  const terms=new Set(tokenize(query)); const sentences=splitSentences(doc.text);
  const ranked=sentences.map((s,i)=>{const toks=new Set(tokenize(s)); let hits=0; for(const t of terms) if(toks.has(t)) hits++; return {s,i,hits};})
    .filter((r)=>r.hits>0).sort((a,b)=> b.hits - a.hits || a.i - b.i).slice(0,maxSnippets);
  return ranked.map((r)=>r.s);
}