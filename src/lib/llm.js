// src/lib/llm.js
// Gemini client for the browser using ESM CDN to avoid bundler issues on Netlify/Vite.
export async function askGemini(prompt, { systemPrompt = "", history = [], temperature = 0.2 } = {}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta VITE_GEMINI_API_KEY en las variables de entorno");
  }

  // Use ESM CDN so we don't need to bundle @google/generative-ai
  const { GoogleGenerativeAI } = await import("https://esm.run/@google/generative-ai");

  const modelId = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId,
    // Optional system instruction to bias the assistant
    systemInstruction: systemPrompt || undefined,
  });

  // Convert local history to Gemini format
  const chat = model.startChat({
    history: (history || []).map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content || "" }],
    })),
    generationConfig: { temperature },
  });

  const result = await chat.sendMessage(prompt);
  const text = result?.response?.text?.() ?? "";
  return text;
}
