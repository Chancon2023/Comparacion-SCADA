/**
 * Netlify Function: assistant-gemini
 * - Llama al endpoint REST de Gemini 1.5 Flash.
 * - Requiere la variable de entorno GEMINI_API_KEY en Netlify.
 * - No expone la key al cliente.
 */
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

exports.handler = async (event) => {
  // CORS básico
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { messages = [], temperature = 0.4, model = 'gemini-1.5-flash' } = JSON.parse(event.body || '{}');

    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing GEMINI_API_KEY' }),
      };
    }

    // Asegura que el primer mensaje sea 'user' (Gemini lo exige)
    const normalized = [];
    for (const m of messages) {
      if (!m || typeof m.text !== 'string') continue;
      let role = m.role;
      if (role !== 'user' && role !== 'model') {
        role = 'user';
      }
      normalized.push({ role, parts: [{ text: m.text }] });
    }
    if (normalized.length === 0 || normalized[0].role !== 'user') {
      normalized.unshift({ role: 'user', parts: [{ text: 'Inicia conversación' }] });
    }

    // Prompt base del dominio (NTSyCS, SITR, IEC 62443, etc.)
    const domainContext = `
Eres un asistente técnico para selección de plataformas SCADA en Chile. 
Debes considerar NTSyCS, SITR, IEC 61850/IEC 60870/DNP3/Modbus, IEC 62443, 
redundancia, compatibilidad entre versiones, drivers IEC61850, MMS, HMI y requisitos de minería.
Responde breve y accionable. Si el usuario compara marcas, justifica con criterios objetivos 
y advierte sobre "red flags" si corresponde.
`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const payload = {
      contents: normalized,
      // Para v1, el field es systemInstruction (camelCase)
      systemInstruction: { parts: [{ text: domainContext }] },
      generationConfig: { temperature, maxOutputTokens: 1024 }
    };

    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: data.error?.message || 'Gemini request failed', raw: data }),
      };
    }

    // Extrae texto
    const text = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || '')
      ?.join('')
      ?.trim() || '';

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ text, raw: data })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || String(err) }),
    };
  }
};