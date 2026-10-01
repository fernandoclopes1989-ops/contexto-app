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
export function parsePastedTranscript(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items = [];

  // Match: [0:04], 0:04, 0:022 segundos, 0:3636 segundos-, 01:23:45, 0:000 segundo-
  const timeRegex = /^(?:\[)?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\d+)?(?:[.,]\d+)?(?:\])?(?:\s*(?:segundos?|minutos?|horas?|seconds?|mins?|s)\b)?(?:\s*[-–:])?\s*(.*)$/i;

  let lastTime = null;
  let accumulatedText = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(timeRegex);

    if (m) {
      const h = m[1] ? parseInt(m[1], 10) : 0;
      const min = parseInt(m[2], 10);
      const s = parseInt(m[3], 10);
      const seconds = h * 3600 + min * 60 + s;
      
      let rest = (m[4] || '').trim();
      // Remove any lingering "segundos", "segundo-", etc. from front of rest
      rest = rest.replace(/^(?:segundos?|minutos?|horas?|seconds?|mins?|s)[-–:\s]*/i, '').trim();

      if (lastTime !== null && accumulatedText.length > 0) {
        items.push({ start: lastTime, duration: 4, text: accumulatedText.join(' ') });
        accumulatedText = [];
      }
      lastTime = seconds;
      if (rest) accumulatedText.push(rest);
    } else {
      let cleaned = line.replace(/^(?:segundos?|minutos?|horas?|seconds?|mins?|s)[-–:\s]*/i, '').trim();
      if (cleaned) accumulatedText.push(cleaned);
    }
  }

  if (lastTime !== null && accumulatedText.length > 0) {
    items.push({ start: lastTime, duration: 4, text: accumulatedText.join(' ') });
  }

  // Fallback: If no timestamps could be parsed from any line, chunk the raw text into sentences
  if (items.length === 0) {
    const sentences = rawText.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(s => s.length > 5);
    let curTime = 5;
    for (const sent of sentences) {
      items.push({ start: curTime, duration: 5, text: sent });
      curTime += 8;
    }
  }

  // Calculate durations from difference between timestamps
  for (let i = 0; i < items.length; i++) {
    if (i < items.length - 1) {
      const diff = items[i + 1].start - items[i].start;
      items[i].duration = diff > 0 && diff < 30 ? diff : 4;
    } else {
      items[i].duration = 4;
    }
  }

  return items;
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
 * Get today's date as YYYY-MM-DD.
 */
export function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Add days to a date string, returns YYYY-MM-DD.
 */
export function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
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
