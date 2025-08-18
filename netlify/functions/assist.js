/**
 * Netlify Function: /functions/assist.js
 * - Proxy a OpenAI Chat Completions para hacer el asistente "más inteligente"
 * - Lee OPENAI_API_KEY desde variables de entorno (configurar en Netlify)
 * - Opcional: recibe `dataset` (pequeño) y `prefs` para contextualizar
 */
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Method Not Allowed",
    };
  }

  try {
    const { prompt, dataset, prefs } = JSON.parse(event.body || "{}");
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
      };
    }

    const system = [
      "Eres un asistente técnico para comparación de plataformas SCADA en Chile.",
      "Conoces NTSyCS, SITR, IEC 61850 (MMS/GOOSE/SV), IEC 60870-5-104, DNP3, IEC 62443, PRP/HSR y prácticas de alta disponibilidad.",
      "Da respuestas claras, con listas y pasos prácticos. Evita prosa larga.",
      "Si se provee `dataset`, úsalo para mencionar pros/contras concretos y red flags.",
      "Si el usuario dice 'minería', prioriza plataforma unificada, web HTML5, historian, plantillas, compatibilidad entre versiones, y PRP/HSR.",
      "Si detectas marcas: zenon, Schneider Power Operation, Siemens Spectrum, Hitachi NM, ABB SEE00/ZEE600, comenta puntos fuertes y debilidades.",
      "Incluye checklist de validación FAT/SAT cuando corresponda."
    ].join(" ");

    const user = [
      `Consulta: ${prompt || ""}`,
      dataset && Array.isArray(dataset) ? `\nDataset (resumen): ${dataset.slice(0,6).map(p=>{
        const name = p.name || "Plataforma";
        const pros = (p.pros||[]).slice(0,2).join("; ");
        const cons = (p.cons||[]).slice(0,2).join("; ");
        return `[${name}] pros: ${pros} | cons: ${cons}`;
      }).join(" | ")}` : "",
      prefs ? `\nPreferencias: ${JSON.stringify(prefs)}` : ""
    ].join("");

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "OpenAI error", detail: text })
      };
    }

    const data = await resp.json();
    const answer = data.choices?.[0]?.message?.content || "No hay respuesta";
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ answer })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message || String(err) })
    };
  }
};