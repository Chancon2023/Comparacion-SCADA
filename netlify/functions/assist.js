// Netlify Function: assist.js (Gemini version)
// Usage: POST /netlify/functions/assist  with {messages:[{role:'user'|'assistant'|'system', content:'...'}]}
// Reads GEMINI_API_KEY from env. Doesn't expose your key to the client.

const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

// Helper: build Gemini "contents" and optional systemInstruction
function toGeminiPayload(messages = []) {
  const contents = [];
  let systemInstruction = null;

  for (const m of messages) {
    const role = (m.role || "user").toLowerCase();
    if (role === "system") {
      // Use Gemini's systemInstruction
      systemInstruction = { parts: [{ text: String(m.content || "") }] };
      continue;
    }
    const mappedRole = role === "assistant" ? "model" : "user";
    contents.push({
      role: mappedRole,
      parts: [{ text: String(m.content || "") }],
    });
  }

  return { contents, systemInstruction };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    if (!API_KEY) {
      return {
        statusCode: 503,
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY in environment" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid payload: messages[] is required" }) };
    }

    const { contents, systemInstruction } = toGeminiPayload(messages);

    const payload = {
      contents,
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    };
    if (systemInstruction) payload.systemInstruction = systemInstruction;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok) {
      // Pass along a friendly message when possible
      const friendly = data && data.error && data.error.message ? data.error.message : "Gemini API error";
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: friendly, raw: data }),
      };
    }

    const candidate = data.candidates && data.candidates[0];
    const parts = candidate && candidate.content && candidate.content.parts;
    const text = parts && parts[0] && parts[0].text ? parts[0].text : "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: text.trim() }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", detail: String(err && err.message || err) }),
    };
  }
};
