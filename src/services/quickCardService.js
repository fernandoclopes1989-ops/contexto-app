/**
 * quickCardService.js — Instant i+1 Monolingual (English-in-English) Card Generator
 * Combines Free Dictionary API (0 tokens, instant) + Gemini micro-prompt for chunks/idioms.
 * Designed for Stephen Krashen & Mairo Vergara's natural acquisition methodology.
 */

import { callGemini } from '../ai.js';

/**
 * Text-to-speech helper using native browser speech synthesis (100% free, 0 tokens)
 */
export function speakEnglish(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
}

/**
 * Fetch English-English definition and i+1 sentence
 * @param {string} term - The word, phrasal verb, or chunk
 * @param {string} userContext - Optional sentence where user found the term
 */
export async function generateIPlusOneCardData(term, userContext = '') {
  const cleanTerm = (term || '').trim();
  if (!cleanTerm) throw new Error('Termo não fornecido');

  const isSingleWord = !cleanTerm.includes(' ') && !cleanTerm.includes('-');
  let dictResult = null;

  // 1. Try Free Dictionary API first (0 tokens) for single words
  if (isSingleWord) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanTerm.toLowerCase())}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
          const audioUrl = entry.phonetics?.find(p => p.audio && p.audio.length > 0)?.audio || null;

          let definition = '';
          let example = '';

          for (const m of entry.meanings || []) {
            for (const d of m.definitions || []) {
              if (d.definition && !definition) definition = d.definition;
              if (d.example && !example) example = d.example;
              if (definition && example) break;
            }
            if (definition && example) break;
          }

          if (definition) {
            dictResult = {
              term: cleanTerm,
              definition_en: definition,
              sentence_i_plus_one: userContext || example || `I need to ${cleanTerm} before deciding what to do next.`,
              phonetic: phonetic,
              audio_url: audioUrl,
              pt_hint: '',
              source: 'dictionary'
            };
          }
        }
      }
    } catch (e) {
      // Free dictionary failed or timed out, will fall back to Gemini
      console.log('Dictionary API fallback to Gemini:', e.message);
    }
  }

  // 2. If it's a chunk, idiom, phrasal verb, or if dictionary had no complete result or user gave context:
  // Use Gemini micro-prompt (only ~40-60 tokens)
  if (!dictResult || !dictResult.sentence_i_plus_one || cleanTerm.includes(' ')) {
    const prompt = `Target English term or chunk: "${cleanTerm}"
Context provided by user: "${userContext || ''}"

Act as a world-class English language acquisition expert following Stephen Krashen's i+1 principle and Mairo Vergara's flashcard methods.
Generate a high-efficiency monolingual (English-in-English) flashcard.

Requirements:
1. "definition_en": One simple, crystal-clear definition in English (avoid complex academic jargon; use high-frequency words).
2. "sentence_i_plus_one": One natural, modern i+1 example sentence where "${cleanTerm}" is the ONLY unfamiliar item. The rest of the sentence must be simple and easily understood so context illuminates meaning. If context was provided, polish it into an ideal i+1 sentence.
3. "pt_hint": Short 2-4 word Portuguese translation as a safety backup.
4. "phonetic": Simple pronunciation guide or IPA.

Return STRICT JSON only, with no markdown backticks, no code fence:
{
  "definition_en": "...",
  "sentence_i_plus_one": "...",
  "pt_hint": "...",
  "phonetic": "..."
}`;

    const rawResponse = await callGemini(prompt, 'You are an expert linguistics coach. Return strictly raw valid JSON.');
    
    // Parse JSON safely
    const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    let parsed = {};
    try {
      parsed = JSON.parse(cleanJson);
    } catch (err) {
      // Fallback regex extraction if model included any markdown
      const matchDef = cleanJson.match(/"definition_en"\s*:\s*"([^"]+)"/i);
      const matchSent = cleanJson.match(/"sentence_i_plus_one"\s*:\s*"([^"]+)"/i);
      const matchPt = cleanJson.match(/"pt_hint"\s*:\s*"([^"]+)"/i);
      const matchPhon = cleanJson.match(/"phonetic"\s*:\s*"([^"]+)"/i);

      parsed = {
        definition_en: matchDef ? matchDef[1] : (dictResult?.definition_en || 'Meaning in context.'),
        sentence_i_plus_one: matchSent ? matchSent[1] : (userContext || `This is how we use ${cleanTerm}.`),
        pt_hint: matchPt ? matchPt[1] : '',
        phonetic: matchPhon ? matchPhon[1] : ''
      };
    }

    return {
      term: cleanTerm,
      definition_en: parsed.definition_en || dictResult?.definition_en || 'Meaning in English',
      sentence_i_plus_one: parsed.sentence_i_plus_one || userContext || `Example using ${cleanTerm}`,
      pt_hint: parsed.pt_hint || '',
      phonetic: parsed.phonetic || dictResult?.phonetic || '',
      audio_url: dictResult?.audio_url || null,
      source: 'gemini_i_plus_one'
    };
  }

  return dictResult;
}
