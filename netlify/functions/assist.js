// netlify/functions/assist.js
const SYSTEM_PROMPT = `
Eres un asistente técnico para selección de SCADA en Chile.
- Conoces NTSyCS, SITR, normativas chilenas eléctricas y buenas prácticas HMI/SCADA.
- Respondes breve y accionable. Si falta contexto, pide datos mínimos.
- Nunca inventes fuentes; si no tienes certeza, dilo y sugiere cómo validarlo.
`;

const ok = (data, status = 200) => ({
  statusCode: status,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  },
  body: JSON.stringify(data),
});

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return ok({});

  if (event.httpMethod !== "POST") {
    return ok({ error: "Method not allowed" }, 405);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return ok({ error: "OPENAI_API_KEY no configurada en Netlify" }, 500);
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return ok({ error: "JSON inválido" }, 400);
  }

  let { messages, prompt, temperature = 0.3 } = body;

  // Admite también { prompt: "texto" } por si tu UI todavía no arma messages[]
  if ((!Array.isArray(messages) || messages.length === 0) && typeof prompt === "string") {
    messages = [{ role: "user", content: prompt.trim() }];
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return ok({ error: "Faltan mensajes: envía { messages: [...] } o { prompt: \"...\" }" }, 400);
  }

  // Inserta system si no está
  if (messages[0]?.role !== "system") {
    messages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature,
        messages,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return ok({ error: data.error?.message || "Error en OpenAI", raw: data }, res.status);
    }

    const content = data?.choices?.[0]?.message?.content || "";
    return ok({ content, raw: data });
  } catch (e) {
    return ok({ error: "Fallo al contactar OpenAI", detail: String(e) }, 502);
  }
};
