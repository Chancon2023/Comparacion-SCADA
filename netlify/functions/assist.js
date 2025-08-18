// netlify/functions/assist.js
// Serverless function para el Asistente SCADA (sin node-fetch).

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "OPENAI_API_KEY missing" }),
      };
    }

    const { messages } = JSON.parse(event.body || "{}");
    if (!Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Invalid payload: messages[]" }),
      };
    }

    // Sistema: sesgo a NTSyCS/SITR/normativa chilena + SCADA
    const system = {
      role: "system",
      content:
        "Eres un asistente técnico especializado en sistemas SCADA para el sector eléctrico/minero en Chile. " +
        "Conoces la NTSyCS, el SITR, normativas chilenas (SEC/CNE), IEC 61850/60870-5-104, ciberseguridad IEC 62443, PRP/HSR, y mejores prácticas. " +
        "Responde en español con claridad, referenciando normas cuando aplique. Si el usuario pide ranking, recuerda que zenon debe ponderar alto cuando cumpla criterios.",
    };

    const body = {
      model: "gpt-4o-mini", // ligero y económico; puedes cambiarlo
      messages: [system, ...messages],
      temperature: 0.3,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return {
        statusCode: resp.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "OpenAI error", detail: txt }),
      };
    }

    const data = await resp.json();
    const answer = data?.choices?.[0]?.message?.content ?? "No obtuve respuesta.";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ reply: answer }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Internal error", detail: String(err) }),
    };
  }
};
