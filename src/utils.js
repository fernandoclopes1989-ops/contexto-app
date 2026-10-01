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
 * Handles both alternating lines (0:01 \n text) and inline (0:01 text).
 * Returns array of { start: number, duration: number, text: string }.
 */
export function parsePastedTranscript(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items = [];
  const timeRegex = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,]\d+)?$/;
  const lineWithTimeRegex = /^(?:\[)?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,]\d+)?(?:\])?\s+(.+)$/;

  let lastTime = null;
  let accumulatedText = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is just a timestamp
    const matchJustTime = line.match(timeRegex);
    if (matchJustTime) {
      if (lastTime !== null && accumulatedText.length > 0) {
        items.push({ start: lastTime, duration: 0, text: accumulatedText.join(' ') });
        accumulatedText = [];
      }
      lastTime = parseTime(line);
      continue;
    }

    // Check if line starts with timestamp: "0:04 Text here"
    const matchLineTime = line.match(lineWithTimeRegex);
    if (matchLineTime) {
      if (lastTime !== null && accumulatedText.length > 0) {
        items.push({ start: lastTime, duration: 0, text: accumulatedText.join(' ') });
        accumulatedText = [];
      }
      const textContent = matchLineTime[matchLineTime.length - 1];
      const timePart = line.replace(textContent, '').trim().replace(/[\[\]]/g, '');
      lastTime = parseTime(timePart);
      accumulatedText.push(textContent);
      continue;
    }

    accumulatedText.push(line);
  }

  if (lastTime !== null && accumulatedText.length > 0) {
    items.push({ start: lastTime, duration: 0, text: accumulatedText.join(' ') });
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
