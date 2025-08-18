// netlify/functions/assistant.js
// Serverless function: llama al REST API de Gemini 1.5-flash con fetch nativo.
// Sin dependencias externas.

exports.handler = async (event) => {
  try {
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing GEMINI_API_KEY in environment.",
        }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
    const prompt =
      body.prompt ||
      incomingMessages
        .filter((m) => m && typeof m.text === "string")
        .map((m) => `${m.role || "user"}: ${m.text}`)
        .join("\n\n");

    // Contexto “experto” (NTSyCS, SITR, IEC 62443, normativa chilena)
    const systemContext = `
Eres un asistente técnico SCADA chileno. Conoce NTSyCS, SITR, IEC 62443,
mejores prácticas de ciberseguridad, teleprotección, redundancia (PRP/HSR),
IEC 61850 (MMS/GOOSE/SV), IEC 60870-5-104, DNP3 y experiencias en minería.
Responde en español con claridad, pasos accionables y recomendaciones.
Cuando corresponda, menciona validaciones contra NTSyCS/SITR y riesgos típicos.
Si el usuario compara plataformas (zenon, Power Operation, Spectrum Power, Hitachi NMS, etc.),
explica pros/contras sin sesgos, incluyendo flags conocidos (drivers IEC61850, agrupamiento de señales, logs, redundancia, HMI, etc).
`;

    const userText = `${systemContext}\n\nPregunta del usuario:\n${prompt || "Sin pregunta"}`;

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: userText }],
        },
      ],
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Gemini HTTP ${resp.status}: ${text}`);
    }

    const data = await resp.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text).filter(Boolean).join("\n") || "No hubo respuesta.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: String(err.message || err) }),
    };
  }
};
