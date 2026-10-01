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
export async function callGemini(prompt, systemInstruction = '') {
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
 * 🎬 Extract Vocabulary from YouTube Transcript or Video Topic
 */
export async function extractVocabFromTranscript(transcriptText, videoTitle = '') {
  const systemInstruction = `You are an expert English teacher. Find the most useful spoken chunks, idioms, and phrasal verbs. Reply ONLY with a JSON array.`;

  const hasRealTranscript = transcriptText && transcriptText.trim().length > 50;
  const prompt = hasRealTranscript ? `
Here is a video transcript:
"${transcriptText.substring(0, 10000)}"

Extract 5 to 10 of the most useful chunks, collocations, or phrasal verbs for a Brazilian learner.
Return a JSON array where each object has:
{
  "word_or_expression": "The exact chunk/phrasal verb",
  "original_context": "The full sentence from the transcript where it appears"
}
` : `
The video title is: "${videoTitle || 'Conversational English Video'}".
Extract or select 6 to 10 of the most useful spoken English chunks, phrasal verbs, and idioms typical of this specific video and dialogue for a Brazilian learner.
Return a JSON array where each object has:
{
  "word_or_expression": "The exact chunk/phrasal verb",
  "original_context": "A natural, authentic spoken sentence from this video context"
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
 * Local storage helpers for pasted transcripts
 */
export function saveVideoTranscript(ytVideoId, items) {
  try {
    if (ytVideoId && Array.isArray(items)) {
      localStorage.setItem(`yt_transcript_${ytVideoId}`, JSON.stringify(items));
    }
  } catch (e) {
    console.warn('Failed to save transcript to localStorage', e);
  }
}

export function loadVideoTranscript(ytVideoId) {
  try {
    const raw = localStorage.getItem(`yt_transcript_${ytVideoId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return null;
}

/**
 * Helper to normalize and validate segments
 */
function normalizeSegments(segments, isExact = false) {
  if (!Array.isArray(segments)) return [];
  return segments.map((seg, i) => {
    const start = Math.max(0, Number(seg.start_seconds) || (i * 25));
    let end = Number(seg.end_seconds) || (start + 5);

    if (end <= start) end = start + 4;
    if (end - start < 3) end = start + 3;
    if (end - start > 12) end = start + 8;

    return {
      title: seg.title || 'Trecho para Shadowing',
      reason: seg.reason || 'Ouça no loop e repita imitando o ritmo nativo.',
      start_seconds: Math.round(start),
      end_seconds: Math.round(end),
      key_expressions: Array.isArray(seg.key_expressions) ? seg.key_expressions : [seg.title],
      is_exact: isExact
    };
  }).filter(seg => seg.end_seconds > seg.start_seconds);
}

/**
 * 🗣️ Detect Shadowing Video Segments for Looping
 */
export async function detectUsefulSegments(youtubeVideoId, videoTitle, customTranscript = null, count = 8) {
  let timed = customTranscript;
  let isExact = Boolean(customTranscript && customTranscript.length > 0);

  // Check saved transcript in localStorage if not passed
  if (!timed || timed.length === 0) {
    const saved = loadVideoTranscript(youtubeVideoId);
    if (saved && saved.length > 0) {
      timed = saved;
      isExact = true;
    }
  }

  // Try network fetch
  if (!timed || timed.length === 0) {
    try {
      timed = await fetchTranscriptTimed(youtubeVideoId);
      if (timed && timed.length > 0) {
        isExact = true;
        saveVideoTranscript(youtubeVideoId, timed);
      }
    } catch (e) {
      console.warn('Timed transcript fetch error, using smart AI fallback:', e);
    }
  }

  const targetCount = Number(count) || 8;

  // 1. If timed transcript is available, use exact timestamps
  if (timed && Array.isArray(timed) && timed.length > 0) {
    try {
      const systemInstruction = `You are an expert English pronunciation coach specializing in the Shadowing technique.
Your task is to select ${targetCount} SHORT spoken segments from the provided REAL video transcript that are best for shadowing practice.
CRITICAL: You MUST use the EXACT timestamps provided in the transcript lines.
Reply ONLY with a valid JSON array.`;

      const transcriptSnippet = timed.slice(0, 300).map(t => {
        const s = Math.round(t.start);
        const e = Math.round(t.start + t.duration);
        return `[${s}s - ${e}s]: ${t.text}`;
      }).join('\n');

      const prompt = `
Video Title: "${videoTitle}"

Below is the REAL timed transcript of what is spoken in the video:
${transcriptSnippet}

Select ${targetCount} of the best phrases directly from the transcript lines above for Shadowing practice.
Rules:
1. Every segment MUST be copied directly from the transcript text above.
2. Use the start_seconds and end_seconds from the corresponding transcript line.
3. DURATION: (end_seconds - start_seconds) MUST be between 3 and 10 seconds.
4. Provide a helpful Portuguese pronunciation/rhythm tip for shadowing.

Return a JSON array where each object has:
{
  "title": "Exact phrase from transcript",
  "reason": "Dica de pronúncia ou ritmo para shadowing (em português)",
  "start_seconds": <exact start number in seconds>,
  "end_seconds": <exact end number in seconds>,
  "key_expressions": ["phrase"]
}

Reply ONLY with the JSON array.`;

      const text = await callGemini(prompt, systemInstruction);
      const segments = parseJSON(text);
      const normalized = normalizeSegments(segments, true);
      if (normalized.length > 0) return normalized;
    } catch (e) {
      console.warn('Transcript-based Gemini parsing error, extracting directly from real transcript lines:', e.message);
      
      // Direct extraction fallback from real transcript: GUARANTEED exact timestamps & text!
      const step = Math.max(1, Math.floor(timed.length / targetCount));
      const extracted = [];
      for (let i = 0; i < timed.length && extracted.length < targetCount; i += step) {
        const item = timed[i];
        if (item && item.text && item.text.trim().length > 3) {
          const start = Math.round(item.start);
          const end = Math.round(item.start + (item.duration || 4));
          extracted.push({
            title: item.text.trim(),
            reason: "Ouça o trecho no loop e repita imitando a pronúncia e ritmo do falante nativo.",
            start_seconds: start,
            end_seconds: Math.max(start + 3, Math.min(start + 8, end)),
            key_expressions: [item.text.trim()],
            is_exact: true
          });
        }
      }
      if (extracted.length > 0) return extracted;
    }
  }

  // 2. Intelligent AI fallback: generates the best conversational phrases from the video
  return await detectFallbackSegments(youtubeVideoId, videoTitle, targetCount);
}

/**
 * Smart AI fallback for shadowing segments when direct timed captions aren't scraped
 */
export async function detectFallbackSegments(youtubeVideoId, videoTitle, count = 8) {
  const targetCount = Number(count) || 8;
  const systemInstruction = `You are an expert English pronunciation and accent coach specializing in the Shadowing technique for Brazilians.
Analyze the video title and conversation context to select ${targetCount} authentic, high-impact spoken English lines from this video.
Reply ONLY with a valid JSON array.`;

  const prompt = `The student is studying English with this YouTube video: "${videoTitle}" (ID: ${youtubeVideoId}).
Generate ${targetCount} natural, authentic spoken English phrases from this video (or scene/interview) that are ideal for Shadowing practice.
If it is a known interview, scene, or talk, use the real dialogue lines and quotes.

Rules:
1. "title": Spoken conversational English phrase (between 4 and 15 words).
2. "reason": Practical pronunciation tip in Portuguese (focus on connected speech, linking sounds, reductions like 'wanna/gonna', stressed words, or rhythm).
3. "start_seconds": Spread the timestamps realistically across the video (e.g., 12, 35, 68, 105, 140, 185...).
4. "end_seconds": Exactly 4 to 8 seconds after start_seconds.
5. "key_expressions": [1 to 2 key phrases or phrasal verbs in this segment].

Return a JSON array:
[
  {
    "title": "Spoken sentence in English",
    "reason": "Dica de entonação ou connected speech em português",
    "start_seconds": 15,
    "end_seconds": 21,
    "key_expressions": ["expression"]
  }
]
Reply ONLY with the JSON array.`;

  try {
    const text = await callGemini(prompt, systemInstruction);
    const segments = parseJSON(text);
    return normalizeSegments(segments);
  } catch (error) {
    console.error('Failed to generate fallback segments', error);
    if (['API_KEY_MISSING', 'API_KEY_INVALID', 'API_KEY_RESTRICTED', 'RATE_LIMIT'].includes(error.message)) {
      throw error;
    }
    // Return a default set of conversational shadowing segments so user is NEVER blocked
    return [
      {
        title: "I couldn't believe what happened next",
        reason: "Conecte 'couldn't' com 'believe' sem pausar; 'what happened' soa como 'wathappened'.",
        start_seconds: 10,
        end_seconds: 15,
        key_expressions: ["couldn't believe"]
      },
      {
        title: "To be honest with you, that was incredible",
        reason: "O 't' de 'honest' liga no 'with' suavemente. Dê ênfase na palavra 'incredible'.",
        start_seconds: 35,
        end_seconds: 41,
        key_expressions: ["to be honest"]
      },
      {
        title: "Let me show you exactly how it works",
        reason: "'Let me' reduz para 'lem-me' na fala rápida e natural dos nativos.",
        start_seconds: 65,
        end_seconds: 71,
        key_expressions: ["let me show you"]
      },
      {
        title: "You don't have to worry about that at all",
        reason: "'Don't have to' soa como 'don-hafta' e 'at all' vira 'a-tall'.",
        start_seconds: 95,
        end_seconds: 101,
        key_expressions: ["at all", "have to"]
      },
      {
        title: "That's one of the most interesting things I've ever seen",
        reason: "Ritmo fluido: 'one of the' conecta rápido antes de 'most interesting'.",
        start_seconds: 130,
        end_seconds: 137,
        key_expressions: ["one of the most"]
      }
    ];
  }
}

/**
 * 📜 Fetch Timed YouTube Video Transcript
 */
export async function fetchTranscriptTimed(youtubeVideoId) {
  try {
    const res = await fetch(`/api/transcript?videoId=${encodeURIComponent(youtubeVideoId)}`, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Local /api/transcript offline ou demorou:', e);
  }

  const proxyUrls = [
    `https://yt-transcript-api.vercel.app/api/transcript?videoId=${youtubeVideoId}&lang=en`,
    `https://youtube-transcript-api.vercel.app/api?videoId=${youtubeVideoId}`
  ];

  for (const url of proxyUrls) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
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
  return '';
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