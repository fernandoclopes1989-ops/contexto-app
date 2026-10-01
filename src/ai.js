/**
 * ai.js — AI Practice module using Google Gemini API (Free Tier)
 * Generates contextual exercises, i+1 vocabulary analysis, and video segment detection.
 * 
 * Models hierarchy (September 2026):
 *   - gemini-2.5-flash  → Stable, widely available on free tier (retires Oct 2026)
 *   - gemini-3.5-flash  → GA, current gen, recommended
 *   - gemini-3.8-flash  → Newest flagship
 * 
 * NOTE: Since June 19, 2026, Google REJECTS unrestricted API keys.
 *       Users must restrict their key to "Generative Language API" in AI Studio.
 */

import { getSetting } from './db.js';
import { shuffle } from './utils.js';

export const DEFAULT_GEMINI_KEY = 'AQ.Ab8RN6I_gh7GFTPCcdBch9qK7f5h6ExghJN1I9NFyTLV29CIQQ';

// Modelos da geração 3.x recomendados oficialmente pelo Google
const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',  // Recomendação oficial para novos projetos (leve, ultra-rápido, sem fila)
  'gemini-3.5-flash',       // O mais equilibrado da geração 3
  'gemini-3.8-flash',       // Flagship mais novo (lançado em setembro/2026)
  'gemini-3.7-flash',       // Fallback estável
  'gemini-flash-latest'     // Rota automática
];

/**
 * Pega a chave da API com segurança (sem vazar no GitHub)
 */
async function getApiKeySegura() {
  // 1. Tenta pegar do banco de dados local ou do celular
  let apiKey = localStorage.getItem('minha_chave_gemini');

  if (!apiKey) {
    try {
      apiKey = await getSetting('gemini_api_key');
    } catch (e) { }
  }

  // 2. Se for a primeira vez e não tiver chave salva, pergunta na tela
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('gh7GFTPCcdBch')) {
    apiKey = prompt("🔑 Bem-vindo! Cole a sua Chave de API do Gemini aqui:");
    if (apiKey && apiKey.trim() !== '') {
      apiKey = apiKey.trim();
      localStorage.setItem('minha_chave_gemini', apiKey);
      try {
        await setSetting('gemini_api_key', apiKey);
      } catch (e) { }
    }
  }

  return apiKey;
}

/**
 * Helper to call Gemini REST API with automatic model fallback
 */
async function callGemini(prompt, systemInstruction = '') {
  let apiKey = await getApiKeySegura();

  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.3
    }
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  let lastError = null;

  // Try each model in order until one works
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || '';

        // 401 = Invalid credentials / Unauthenticated / Expired key
        if (response.status === 401) {
          localStorage.removeItem('minha_chave_gemini'); // Limpa a chave inválida para pedir outra
          throw new Error('API_KEY_INVALID');
        }

        // 403 = Likely unrestricted API key or permission denied
        if (response.status === 403) {
          throw new Error('API_KEY_RESTRICTED');
        }

        // 400 with API key message = Invalid key
        if (response.status === 400 && (errorMsg.toLowerCase().includes('api key') || errorMsg.toLowerCase().includes('key not valid'))) {
          localStorage.removeItem('minha_chave_gemini');
          throw new Error('API_KEY_INVALID');
        }

        // 429 or RESOURCE_EXHAUSTED = Quota / Rate limit reached
        if (response.status === 429 || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('resource_exhausted')) {
          throw new Error('RATE_LIMIT');
        }

        // 404 = Model not found, try next model
        if (response.status === 404) {
          console.warn(`Model ${model} not found (404), trying next...`);
          lastError = new Error(`Model ${model} not available`);
          continue;
        }

        // 503 = Temporary overload spike, try next model
        if (response.status === 503) {
          console.warn(`Model ${model} overloaded (503), trying next...`);
          lastError = new Error('SERVER_OVERLOADED');
          continue;
        }

        throw new Error(`API Error: ${response.status} - ${errorMsg || 'Unknown error'}`);
      }

      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        const blockReason = data.promptFeedback?.blockReason;
        if (blockReason) {
          throw new Error(`BLOCKED: ${blockReason}`);
        }
        throw new Error('No response from Gemini');
      }

      console.log(`✅ Gemini responded using model: ${model}`);
      return data.candidates[0].content.parts[0].text;

    } catch (error) {
      if (['API_KEY_MISSING', 'API_KEY_INVALID', 'API_KEY_RESTRICTED', 'RATE_LIMIT'].includes(error.message) ||
        error.message.startsWith('BLOCKED:')) {
        throw error;
      }
      lastError = error;
      console.warn(`Model ${model} failed:`, error.message);
    }
  }

  throw lastError || new Error('ALL_MODELS_FAILED');
}

/**
 * 🚀 THE MAGIC: Generate i+1 Analysis for a word in context
 */
export async function generateIPlusOneAnalysis(word, context) {
  const systemInstruction = `You are Mairo Vergara, an expert English teacher using the i+1 methodology (Comprehensible Input).
You must analyze an English expression/word and return ONLY a valid JSON object.`;

  const prompt = `
Analyze the expression/word "${word}" as it appears in this context: "${context}".
I am a Brazilian learning English. I need an i+1 analysis. 
The explanation must be simple, using basic English (A1/A2 level) so I understand it without Portuguese.

Generate a JSON object with this exact structure:
{
  "definition_en": "Very simple definition in English (A1/A2).",
  "type": "linguistic type (e.g. phrasal verb, chunk, idiom, noun)",
  "formula": "The grammatical structure (e.g. [Subject] + ${word} + [something])",
  "i_plus_one_example": "A NEW, extremely simple example sentence using the word.",
  "connected_speech": "How a native says it fast (e.g. 'gonna', 'figger-owt')",
  "brazilian_trap": "A short warning in Portuguese about a common mistake Brazilians make with this word.",
  "i_plus_one_tip": "A quick tip in Portuguese on how to use it today."
}
Reply ONLY with the JSON object.`;

  try {
    const text = await callGemini(prompt, systemInstruction);
    return parseJSON(text);
  } catch (error) {
    console.error('Failed to generate i+1 analysis', error);
    if (['API_KEY_MISSING', 'API_KEY_INVALID', 'API_KEY_RESTRICTED', 'RATE_LIMIT'].includes(error.message)) {
      throw error;
    }
    throw new Error('AI_ANALYSIS_FAILED');
  }
}

/**
 * 🎬 Extract Vocabulary from YouTube Transcript
 */
export async function extractVocabFromTranscript(transcriptText) {
  const systemInstruction = `You are an expert English teacher. Find the most useful chunks, idioms, and phrasal verbs from the transcript. Reply ONLY with a JSON array.`;

  const prompt = `
Here is a video transcript:
"${transcriptText.substring(0, 10000)}"

Extract 5 to 10 of the most useful chunks, collocations, or phrasal verbs for a Brazilian learner.
Return a JSON array where each object has:
{
  "word_or_expression": "The exact chunk/phrasal verb",
  "original_context": "The full sentence from the transcript where it appears"
}
`;

  try {
    const text = await callGemini(prompt, systemInstruction);
    return parseJSON(text);
  } catch (error) {
    console.error('Failed to extract vocab from transcript', error);
    if (['API_KEY_MISSING', 'API_KEY_INVALID', 'API_KEY_RESTRICTED', 'RATE_LIMIT'].includes(error.message)) {
      throw error;
    }
    throw new Error('AI_EXTRACTION_FAILED');
  }
}

/**
 * 🗣️ Detect Shadowing Video Segments for Looping
 */
export async function detectUsefulSegments(youtubeVideoId, videoTitle) {
  const systemInstruction = `You are an expert English pronunciation coach specializing in the Shadowing technique.
Your task is to select 5 to 8 SHORT spoken segments from the provided REAL video transcript that are best for shadowing practice.
CRITICAL: You MUST use the EXACT timestamps provided in the transcript lines. Do NOT invent timestamps.
Reply ONLY with a valid JSON array.`;

  let timed = await fetchTranscriptTimed(youtubeVideoId);
  let transcriptSnippet = '';

  if (timed && timed.length > 0) {
    transcriptSnippet = timed.slice(0, 200).map(t => {
      const s = Math.round(t.start);
      const e = Math.round(t.start + t.duration);
      return `[${s}s - ${e}s]: ${t.text}`;
    }).join('\n');
  }

  const prompt = `
Video Title: "${videoTitle}"

${transcriptSnippet ? `Below is the EXACT timed transcript of what is spoken in the video:
${transcriptSnippet}

Select 5 to 8 of the best phrases directly from the transcript lines above for Shadowing practice.
Rules:
1. Every segment MUST be copied directly from the transcript text above.
2. Use the EXACT start_seconds and end_seconds from the corresponding transcript line! If a phrase spans 2 consecutive transcript lines, combine them and use the start of the first line and end of the second line.
3. DURATION: (end_seconds - start_seconds) MUST be between 3 and 10 seconds.
4. Provide a helpful Portuguese pronunciation/rhythm tip for shadowing.` : `Suggest 5 short shadowing phrases (3 to 8 seconds) relevant to "${videoTitle}".`}

Return a JSON array where each object has:
{
  "title": "Exact phrase from transcript",
  "reason": "Dica de pronúncia ou ritmo para shadowing (em português)",
  "start_seconds": <exact start number in seconds>,
  "end_seconds": <exact end number in seconds>,
  "key_expressions": ["phrase"]
}

STRICT REQUIREMENT: (end_seconds - start_seconds) MUST be between 3 and 10 seconds.
Reply ONLY with the JSON array.`;

  try {
    const text = await callGemini(prompt, systemInstruction);
    const segments = parseJSON(text);

    return segments.map(seg => {
      const start = Math.max(0, Number(seg.start_seconds) || 0);
      let end = Number(seg.end_seconds) || (start + 5);

      if (end <= start) end = start + 4;
      if (end - start < 3) end = start + 3;
      if (end - start > 10) end = start + 8;

      return {
        title: seg.title || 'Trecho para Shadowing',
        reason: seg.reason || 'Ouça no loop e repita imitando o ritmo nativo.',
        start_seconds: start,
        end_seconds: end,
        key_expressions: seg.key_expressions || []
      };
    }).filter(seg => seg.end_seconds > seg.start_seconds);

  } catch (error) {
    console.error('Failed to detect segments', error);
    throw error;
  }
}

/**
 * 📜 Fetch Timed YouTube Video Transcript
 */
export async function fetchTranscriptTimed(youtubeVideoId) {
  try {
    const res = await fetch(`/api/transcript?videoId=${encodeURIComponent(youtubeVideoId)}`, { signal: AbortSignal.timeout(7000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Local /api/transcript offline, tentando proxies...');
  }

  const proxyUrls = [
    `https://yt-transcript-api.vercel.app/api/transcript?videoId=${youtubeVideoId}&lang=en`,
    `https://youtube-transcript-api.vercel.app/api?videoId=${youtubeVideoId}`
  ];

  for (const url of proxyUrls) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (e) { }
  }

  return null;
}

/**
 * 📜 Fetch YouTube Video Transcript as plain text
 */
export async function fetchTranscriptText(youtubeVideoId) {
  const timed = await fetchTranscriptTimed(youtubeVideoId);
  if (timed && timed.length > 0) {
    return timed.map(item => item.text || '').join(' ');
  }
  throw new Error('TRANSCRIPT_UNAVAILABLE');
}

/**
 * Generate practice exercises
 */
export async function generateExercises(vocabItems) {
  const selected = selectVocabForPractice(vocabItems, 10);
  if (selected.length < 3) throw new Error('NOT_ENOUGH_VOCAB');

  const vocabList = selected.map((item, i) => {
    return `${i + 1}. Word: "${item.palavra_ou_expressao}" | Meaning: "${item.traducao_significado || 'N/A'}"`;
  }).join('\n');

  const prompt = `You are an English teacher. Generate EXACTLY 5 exercises for a Brazilian student using ONLY these words:
${vocabList}

Mix these types:
1. fill_in_blank (question has ___, answer is the word)
2. multiple_choice (question asks meaning, 4 options, correct_index 0-3)

Reply ONLY with a JSON array like this:
[
  {
    "type": "fill_in_blank",
    "instruction": "Complete...",
    "question": "Sentence with ___",
    "answer": "word",
    "hint": "hint in PT"
  }
]`;

  try {
    const text = await callGemini(prompt);
    return parseJSON(text);
  } catch (error) {
    if (error.message.startsWith('API_KEY') || error.message === 'RATE_LIMIT') throw error;
    throw new Error('AI_REQUEST_FAILED');
  }
}

/**
 * Generate a quick translation
 */
export async function generateTranslation(word, context) {
  const prompt = `Traduza ou explique em português a expressão "${word}" no contexto: "${context}". Máximo de 10 palavras, sem introduções.`;
  try {
    const text = await callGemini(prompt);
    return text.trim().replace(/^['"]|['"]$/g, '');
  } catch (err) {
    throw new Error('Falha ao gerar tradução');
  }
}

function selectVocabForPractice(items, count) {
  const shuffled = shuffle(items);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function parseJSON(text) {
  try {
    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse JSON:', e, text);
    throw new Error('AI_PARSE_FAILED');
  }
}