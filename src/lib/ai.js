// Cliente minimal que llama a la Function de Netlify (Gemini)
export async function askAssistant(messages, opts = {}) {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, ...opts }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Assistant request failed");
  }
  return data.text;
}
