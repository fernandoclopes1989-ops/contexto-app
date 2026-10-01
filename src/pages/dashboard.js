/**
 * dashboard.js — Home page with stats and quick actions
 */

import { getAllVideos, getAllVocabulario, getAllRevisao, getDueReviewCount, getStudyStreak } from '../db.js';
import { formatDate } from '../utils.js';

export async function renderDashboard(container) {
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><span class="loading-text">Carregando...</span></div>`;

  const [videos, vocab, reviews, dueCount, streak] = await Promise.all([
    getAllVideos(),
    getAllVocabulario(),
    getAllRevisao(),
    getDueReviewCount(),
    getStudyStreak()
  ]);

  // Update streak display in sidebar
  const streakCountEl = document.getElementById('streak-count');
  if (streakCountEl) streakCountEl.textContent = streak;

  // Update review badge
  updateReviewBadge(dueCount);

  // Calculate mastered count (interval > 21 days)
  const masteredCount = reviews.filter(r => r.intervalo_dias > 21).length;

  // Recent vocabulary (last 5)
  const recentVocab = [...vocab].sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao)).slice(0, 5);

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Bem-vindo de volta! 👋</h1>
      <p class="page-subtitle">Continue seu progresso no inglês</p>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-icon">🎬</span>
        <div class="stat-value">${videos.length}</div>
        <div class="stat-label">Vídeos salvos</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📝</span>
        <div class="stat-value">${vocab.length}</div>
        <div class="stat-label">Palavras salvas</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🔄</span>
        <div class="stat-value">${dueCount}</div>
        <div class="stat-label">Revisões pendentes</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🏆</span>
        <div class="stat-value">${masteredCount}</div>
        <div class="stat-label">Palavras dominadas</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="section-title">⚡ Ações rápidas</div>
    <div class="flex gap-3 mb-6" style="flex-wrap: wrap;">
      ${dueCount > 0 ? `
        <a href="#/review" class="btn btn-primary btn-lg">
          🔄 Revisar agora (${dueCount} pendentes)
        </a>
      ` : ''}
      <a href="#/videos" class="btn btn-secondary btn-lg">
        ➕ Adicionar vídeo
      </a>
      ${vocab.length >= 3 ? `
        <a href="#/practice" class="btn btn-secondary btn-lg">
          🤖 Praticar com IA
        </a>
      ` : ''}
    </div>

    <!-- Recent Vocabulary -->
    ${recentVocab.length > 0 ? `
      <div class="section-title mt-6">📚 Vocabulário recente</div>
      <div class="vocab-list">
        ${recentVocab.map(v => `
          <div class="vocab-item">
            <div class="vocab-word">${escapeForHTML(v.palavra_ou_expressao)}</div>
            ${v.frase_contexto ? `<div class="vocab-context">"${escapeForHTML(v.frase_contexto)}"</div>` : ''}
            ${v.traducao_significado ? `<div class="vocab-translation">→ ${escapeForHTML(v.traducao_significado)}</div>` : ''}
            <div class="vocab-meta">
              <span>${formatDate(v.data_criacao)}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="mt-4">
        <a href="#/vocabulary" class="btn btn-ghost btn-sm">Ver todo vocabulário →</a>
      </div>
    ` : `
      <div class="empty-state" style="padding: var(--space-8);">
        <div class="empty-state-icon">🎯</div>
        <h3>Comece sua jornada!</h3>
        <p>Adicione um vídeo do YouTube, marque trechos para repetir e salve vocabulário em contexto.</p>
        <a href="#/videos" class="btn btn-primary btn-lg">Adicionar primeiro vídeo</a>
      </div>
    `}
  `;
}

function updateReviewBadge(count) {
  const badge = document.getElementById('review-badge');
  const badgeMobile = document.getElementById('review-badge-mobile');

  [badge, badgeMobile].forEach(b => {
    if (!b) return;
    if (count > 0) {
      b.textContent = count;
      b.classList.remove('hidden');
    } else {
      b.classList.add('hidden');
    }
  });
}

function escapeForHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export { updateReviewBadge };
