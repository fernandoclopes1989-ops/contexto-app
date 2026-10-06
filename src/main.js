/**
 * main.js — Entry point for Contexto App
 * Initializes router, registers all routes, and sets up global UI behavior.
 */

import { registerRoute, initRouter, getCurrentRoute } from './router.js';
import { renderDashboard, updateReviewBadge } from './pages/dashboard.js';
import { renderVideos } from './pages/videos.js';
import { renderVideoPlayer, cleanupVideoPlayer } from './pages/videoPlayer.js';
import { renderReview } from './pages/review.js';
import { renderVocabulary } from './pages/vocabulary.js';
import { renderPractice } from './pages/practice.js';
import { renderSettings } from './pages/settings.js';
import { renderPlaylist, cleanupPlaylist } from './pages/playlist.js';
import { getDueReviewCount, getStudyStreak } from './db.js';
import { destroyPlayer } from './youtube.js';
import { openQuickCaptureModal } from './components/quickCaptureModal.js';

// --- Register Routes ---

registerRoute('/', async (container, params) => {
  cleanupPreviousPage();
  await renderDashboard(container);
});

registerRoute('/videos', async (container, params) => {
  cleanupPreviousPage();
  await renderVideos(container);
});

registerRoute('/video/:id', async (container, params) => {
  cleanupPreviousPage();
  await renderVideoPlayer(container, params);
});

registerRoute('/review', async (container, params) => {
  cleanupPreviousPage();
  await renderReview(container);
});

registerRoute('/vocabulary', async (container, params) => {
  cleanupPreviousPage();
  await renderVocabulary(container);
});

registerRoute('/practice', async (container, params) => {
  cleanupPreviousPage();
  await renderPractice(container);
});

registerRoute('/settings', async (container, params) => {
  cleanupPreviousPage();
  await renderSettings(container);
});

registerRoute('/playlist', async (container, params) => {
  cleanupPreviousPage();
  await renderPlaylist(container);
});

// --- Cleanup helper ---

let previousRoute = null;

function cleanupPreviousPage() {
  // Destroy YouTube player when leaving a video page
  if (previousRoute && previousRoute.startsWith('/video/')) {
    cleanupVideoPlayer();
  }
  if (previousRoute === '/playlist') {
    cleanupPlaylist();
  }
  previousRoute = getCurrentRoute();
}

// --- Mobile Menu ---

function setupMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (!menuBtn) return;

  menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  // Close menu when navigating
  sidebar.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  });
}

// --- Update global UI elements ---

async function updateGlobalUI() {
  try {
    const [dueCount, streak] = await Promise.all([
      getDueReviewCount(),
      getStudyStreak()
    ]);

    // Review badge
    updateReviewBadge(dueCount);

    // Streak display
    const streakCount = document.getElementById('streak-count');
    if (streakCount) streakCount.textContent = streak;
  } catch (err) {
    console.warn('Error updating global UI:', err);
  }
}

// --- Initialize ---

document.addEventListener('DOMContentLoaded', async () => {
  // Migrate stale API keys immediately on startup
  try {
    const { getSetting, setSetting } = await import('./db.js');
    const { DEFAULT_GEMINI_KEY } = await import('./ai.js');
    const currentKey = await getSetting('gemini_api_key');
    const STALE_KEYS = [
      'AQ.Ab8RN6JdUG0itq1fsRvk7iZh5zwIKYehdBJ1WoEXhH67fR9zyg'
    ];
    if (currentKey && STALE_KEYS.includes(currentKey)) {
      await setSetting('gemini_api_key', DEFAULT_GEMINI_KEY);
      console.log('🔑 Chave Gemini antiga migrada automaticamente para a nova.');
    }
  } catch (e) {
    console.warn('Key migration skipped:', e);
  }

  setupMobileMenu();
  updateGlobalUI();
  initRouter();

  // Global Quick Capture buttons (Sidebar & Mobile Header)
  const handleQuickCapture = () => {
    openQuickCaptureModal({
      onSaved: () => {
        updateGlobalUI();
        // If on vocabulary page, re-render
        if (window.location.hash.startsWith('#/vocabulary')) {
          const container = document.getElementById('page-container');
          if (container) renderVocabulary(container);
        }
      }
    });
  };

  const btnGlobalQc = document.getElementById('btn-global-quick-capture');
  const btnMobileQc = document.getElementById('btn-mobile-quick-capture');
  if (btnGlobalQc) btnGlobalQc.addEventListener('click', handleQuickCapture);
  if (btnMobileQc) btnMobileQc.addEventListener('click', handleQuickCapture);

  // Update global UI periodically (every 60 seconds)
  setInterval(updateGlobalUI, 60000);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    updateGlobalUI();
  }
});
