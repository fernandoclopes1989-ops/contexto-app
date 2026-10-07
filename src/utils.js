/**
 * utils.js — Helper functions for Contexto App
 */

/**
 * Extract YouTube video ID from a URL.
 * Supports: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/...
 * Returns null if invalid.
 */
export function extractVideoId(url) {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Just the ID itself
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Format seconds to MM:SS or HH:MM:SS.
 */
export function formatTime(totalSeconds) {
  if (totalSeconds == null || isNaN(totalSeconds)) return '0:00';

  const seconds = Math.floor(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Parse a time string (MM:SS or HH:MM:SS or just seconds) to total seconds.
 */
export function parseTime(timeStr) {
  if (!timeStr) return 0;

  // If it's already a number
  if (!isNaN(timeStr)) return Math.max(0, parseFloat(timeStr));

  const parts = timeStr.split(':').map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

/**
 * Parse raw text pasted from YouTube "Mostrar transcrição", SRT, VTT, or timestamps.
 * Handles:
 * - YouTube Brasil accessibility format: 0:000 segundo-, 0:022 segundosJackie, 0:3636 segundos-
 * - Alternating lines (0:01 \n text) and inline (0:01 text)
 * - Brackets [0:04], full HH:MM:SS
 * - Pure text fallback (splits into sentences without error)
 * Returns array of { start: number, duration: number, text: string }.
 */
/**
 * Parse raw transcript text into accurate study segments.
 * Supports:
 * - YouTube standard: "0:00 \n Text" or "0:04 Text" or "01:23:45 Text"
 * - YouTube Brasil / mobile: "0:000 segundo- Text", "0:022 segundos Jackie", "0:3636 segundos- Thank you"
 * - SRT / WebVTT files with "00:00:01,000 --> 00:00:04,500"
 * - Bracketed and dashed formats: "[0:04] Text", "0:14 - 0:20 Text"
 * - Preserves ALL text intact (NEVER drops leading letters like 'S')
 * - Pure text fallback without timestamps
 */
export function parsePastedTranscript(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  // Remove BOM and normalize line breaks
  const cleaned = rawText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const items = [];

  // 1. Check if input is SRT or WebVTT format (contains '-->')
  const isSrtOrVtt = lines.some(l => l.includes('-->'));

  if (isSrtOrVtt) {
    let currentStart = null;
    let currentEnd = null;
    let currentTexts = [];
    const arrowRegex = /((?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d+)?)\s*-->\s*((?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d+)?)/;

    for (const line of lines) {
      if (/^(?:WEBVTT|NOTE|STYLE|\d+)$/i.test(line)) {
        continue; // skip line numbers and headers
      }

      const match = line.match(arrowRegex);
      if (match) {
        if (currentStart !== null && currentTexts.length > 0) {
          const text = currentTexts.join(' ').replace(/<[^>]+>/g, '').trim();
          if (text) {
            const dur = currentEnd !== null && currentEnd > currentStart ? (currentEnd - currentStart) : 4;
            items.push({
              start: Math.round(currentStart * 10) / 10,
              duration: Math.round(Math.max(2, dur) * 10) / 10,
              text
            });
          }
          currentTexts = [];
        }
        currentStart = parseTime(match[1]);
        currentEnd = parseTime(match[2]);
      } else {
        if (currentStart !== null) {
          const stripped = line.replace(/<[^>]+>/g, '').trim();
          if (stripped) currentTexts.push(stripped);
        }
      }
    }

    if (currentStart !== null && currentTexts.length > 0) {
      const text = currentTexts.join(' ').replace(/<[^>]+>/g, '').trim();
      if (text) {
        const dur = currentEnd !== null && currentEnd > currentStart ? (currentEnd - currentStart) : 4;
        items.push({
          start: Math.round(currentStart * 10) / 10,
          duration: Math.round(Math.max(2, dur) * 10) / 10,
          text
        });
      }
    }

    if (items.length > 0) {
      return sanitizeTranscriptItems(items);
    }
  }

  // 2. YouTube standard & YouTube Brasil format parser
  const timeRegex = /^(?:\[)?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\d+)?(?:[.,]\d+)?(?:\])?(?:\s*(?:segundos?|minutos?|horas?|seconds?|mins?)\b)?(?:\s*[-–:])?\s*(.*)$/i;
  const leadTimestampRegex = /^(?:\[)?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\d+)?(?:[.,]\d+)?(?:\])?(?:\s*(?:segundos?|minutos?|horas?|seconds?|mins?)\b)?(?:\s*[-–:])?\s*/i;

  let currentTime = null;
  let currentTexts = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const timeMatch = line.match(timeRegex);

    if (timeMatch && timeMatch[2] !== undefined && timeMatch[3] !== undefined) {
      const h = timeMatch[1] ? parseInt(timeMatch[1], 10) : 0;
      const m = parseInt(timeMatch[2], 10);
      const s = parseInt(timeMatch[3], 10);
      const seconds = h * 3600 + m * 60 + s;

      // Extract text on the same line if present
      let rest = line.replace(leadTimestampRegex, '').trim();
      // Remove second timestamp if it was a range like '0:14 - 0:20 Text'
      rest = rest.replace(/^(?:[-–to\s]*(?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d+)?[-–\s]*)/i, '').trim();

      if (currentTime !== null && currentTexts.length > 0) {
        items.push({
          start: currentTime,
          duration: 4,
          text: currentTexts.join(' ').trim()
        });
        currentTexts = [];
      }

      currentTime = seconds;
      if (rest) currentTexts.push(rest);
    } else {
      if (currentTime !== null) {
        // Strip any YouTube Brasil artifact like standalone "4 segundos-"
        const clean = line.replace(/^\d+\s*(?:segundos?|minutos?|horas?|seconds?|mins?)\s*[-–:]*\s*/i, '').trim();
        if (clean) currentTexts.push(clean);
      }
    }
  }

  if (currentTime !== null && currentTexts.length > 0) {
    items.push({
      start: currentTime,
      duration: 4,
      text: currentTexts.join(' ').trim()
    });
  }

  // 3. Fallback: If no timestamps were found, treat as plain text/lyrics
  if (items.length === 0) {
    const rawSentences = rawText.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(s => s.length > 2);
    let curTime = 0;
    for (const sent of rawSentences) {
      const words = sent.split(/\s+/).length;
      const dur = Math.max(3, Math.min(10, Math.round(words * 0.6 + 1)));
      items.push({
        start: curTime,
        duration: dur,
        text: sent
      });
      curTime += dur;
    }
  } else {
    // Calculate durations from differences between consecutive timestamps
    for (let i = 0; i < items.length; i++) {
      const wordsCount = items[i].text.split(/\s+/).length;
      const estimatedSpoken = Math.max(3, Math.round(wordsCount * 0.55 + 1.5));

      if (i < items.length - 1) {
        const diff = items[i + 1].start - items[i].start;
        if (diff > 0) {
          // If the gap is short (<= 8s), use the exact difference
          // If there is a huge pause (e.g. 30s of silence or music), cap cleanly so the loop doesn't loop silence
          items[i].duration = diff <= 8 ? Math.round(diff * 10) / 10 : Math.min(diff, Math.max(estimatedSpoken, 6));
        } else {
          items[i].duration = estimatedSpoken;
        }
      } else {
        items[i].duration = estimatedSpoken;
      }
    }
  }

  return sanitizeTranscriptItems(items);
}

function sanitizeTranscriptItems(items) {
  return items.map(item => ({
    start: Math.max(0, Math.round(item.start * 10) / 10),
    duration: Math.max(2, Math.round(item.duration * 10) / 10),
    text: (item.text || '')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
  })).filter(item => item.text.length > 0 && !item.text.startsWith('[Music]') && !item.text.startsWith('[Applause]'));
}

/**
 * Format a date string for display.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Get today's date as YYYY-MM-DD in local time with Anki-style 3:00 AM rollover.
 */
export function today() {
  const now = new Date();
  // Rollover at 3:00 AM local time
  now.setHours(now.getHours() - 3);
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to a date string, returns YYYY-MM-DD.
 */
export function addDays(dateStr, days) {
  // Append T12:00:00 to avoid timezone parsing shifts
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Show a toast notification.
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/**
 * Show a modal with custom HTML content.
 * Returns a promise that resolves when the modal is closed.
 */
export function showModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  content.innerHTML = html;
  overlay.classList.remove('hidden');

  return new Promise((resolve) => {
    const closeModal = () => {
      overlay.classList.add('hidden');
      content.innerHTML = '';
      resolve();
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    }, { once: true });

    // Expose close function for buttons inside the modal
    window.__closeModal = closeModal;
  });
}

/**
 * Close the current modal.
 */
export function closeModal() {
  if (window.__closeModal) window.__closeModal();
}

/**
 * Fetch YouTube video title via oEmbed API (free, no key needed).
 */
export async function fetchVideoTitle(videoId) {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    return data.title || 'Vídeo sem título';
  } catch (e) {
    console.warn('Could not fetch video title:', e);
    return 'Vídeo sem título';
  }
}

/**
 * Get YouTube thumbnail URL.
 */
export function getVideoThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Debounce function.
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Shuffle array (Fisher-Yates).
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Escape HTML characters.
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
