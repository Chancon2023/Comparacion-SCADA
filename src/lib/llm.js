/**
 * src/lib/llm.js
 * Wrapper para Google Gemini (browser) con modelo configurable.
 * Requiere: npm i @google/generative-ai
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_ID = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

if (!API_KEY) {
  console.warn("[LLM] Falta VITE_GEMINI_API_KEY en variables de entorno.");
}

/**
 * Estructura esperada de messages:
 * [{ role: "system"|"user"|"assistant", content: "texto" }, ...]
 */
export async function askGemini(messages) {
  if (!API_KEY) {
    return { ok: false, text: "Nota: el servicio no está disponible (Missing VITE_GEMINI_API_KEY)." };
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_ID });

    // Convertimos al formato contents de Gemini
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : m.role, // Gemini usa 'model' en vez de 'assistant'
      parts: [{ text: m.content || "" }],
    }));

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    });

    const text = result?.response?.text?.() ?? result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) {
      return { ok: false, text: "No hubo respuesta del modelo." };
    }
    return { ok: true, text };
  } catch (err) {
    console.error("[LLM] Gemini error:", err);
    // Mensaje amigable
    const msg = err?.message || JSON.stringify(err);
    return { ok: false, text: `Nota: el servicio no está disponible (${msg}).` };
  }
}
