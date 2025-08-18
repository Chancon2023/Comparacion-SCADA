// src/lib/ai.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Escoge el modelo vigente de Gemini
const MODEL_NAME = "gemini-2.0-flash";

// Instrucciones del asistente (contexto SCADA y Chile)
const SYSTEM_PROMPT = `
Eres un asistente técnico para selección y evaluación de plataformas SCADA,
con foco en minería en Chile. Conoces NTSyCS, SITR, IEC 62443 y buenas prácticas
(arquitectura, redundancia, protocolos, ciberseguridad). Responde claro y corto,
en español. Si el usuario te pide comparación, usa criterios objetivos y,
cuando aplique, menciona banderas rojas reportadas (p. ej. IEC61850 inestable,
agrupamiento de señales con timestamp, drivers MMS, etc.). Si no tienes certeza,
pide más contexto. No inventes.
`;

function toGeminiHistory(appHistory = []) {
  // Mapea nuestro historial [{role:'user'|'assistant', content}] a Gemini:
  //  - 'assistant' => 'model'
  //  - El primero DEBE ser 'user'; si no, se omite lo que aparezca antes del primer 'user'
  const out = [];
  let firstUserSeen = false;

  for (const m of appHistory) {
    const text = (m?.content || "").trim();
    if (!text) continue;

    if (m.role === "user") {
      firstUserSeen = true;
      out.push({ role: "user", parts: [{ text }] });
    } else {
      // assistant/model
      if (!firstUserSeen) {
        // Saltar mensajes del asistente previos a que aparezca el primer user
        continue;
      }
      out.push({ role: "model", parts: [{ text }] });
    }
  }
  return out;
}

/**
 * Envía un prompt a Gemini teniendo en cuenta el historial
 * @param {Array<{role:'user'|'assistant', content:string}>} history
 * @param {string} userInput
 * @returns {Promise<string>}
 */
export async function askGemini(history, userInput) {
  if (!API_KEY) throw new Error("Missing VITE_GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_PROMPT,
  });

  // Convertimos historial para Gemini y agregamos el turno actual del usuario
  const gemHistory = toGeminiHistory(history);
  const contents = [
    ...gemHistory,
    { role: "user", parts: [{ text: (userInput || "").trim() }] },
  ];

  const result = await model.generateContent({ contents });
  return result?.response?.text?.() || "";
}
