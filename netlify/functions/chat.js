// netlify/functions/chat.js
import OpenAI from "openai";

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
      };
    }

    const { messages = [] } = JSON.parse(event.body || "{}");

    const client = new OpenAI({ apiKey });

    // Ajusta el modelo si quieres otro
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente experto en SCADA para Chile. Conoces NTSyCS (SEC), SITR/CNE, IEC 61850/60870, ciberseguridad IEC 62443, y prácticas de integración. Responde concreto y profesional.",
        },
        ...messages,
      ],
    });

    const reply = completion.choices?.[0]?.message?.content ?? "Sin respuesta.";

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("OpenAI error:", err);
    return {
      statusCode: 502,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Upstream error",
        detail: err?.message ?? String(err),
      }),
    };
  }
}
