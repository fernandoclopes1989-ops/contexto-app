/**
 * vocabulary.js — Full vocabulary list page with search/filter
 */

import { getAllVocabulario, getVideo, getAllRevisao, deleteVocabulario, deleteRevisao } from '../db.js';
import { formatDate, formatTime, escapeHtml, showToast, debounce } from '../utils.js';
import { getDifficultyBadge, getNextReviewLabel } from '../srs.js';
import { openQuickCaptureModal } from '../components/quickCaptureModal.js';

let activeClickListener = null;

export async function renderVocabulary(container) {
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

  const vocab = await getAllVocabulario();
  const reviews = await getAllRevisao();

  // Build a map of vocab_id -> review card
  const reviewMap = {};
  reviews.forEach(r => { reviewMap[r.vocabulario_id] = r; });

  // Enrich vocab with video titles
  const videoCache = {};
  for (const v of vocab) {
    if (v.video_id && !videoCache[v.video_id]) {
      const video = await getVideo(v.video_id);
      videoCache[v.video_id] = video;
    }
  }

  // Sort by most recent first
  const sorted = [...vocab].sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));

  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div>
        <h1 class="page-title" style="margin: 0;">📝 Vocabulário</h1>
        <p class="page-subtitle">${vocab.length} palavra${vocab.length !== 1 ? 's' : ''} salva${vocab.length !== 1 ? 's' : ''}</p>
      </div>
      <button id="btn-vocab-page-quick-capture" class="btn btn-primary" style="display: flex; align-items: center; gap: 6px;">
        <span>⚡</span> <span>Captura Rápida i+1</span>
      </button>
    </div>

    <!-- Filter -->
    <div class="vocab-filter-bar">
      <input
        type="text"
        id="vocab-search"
        class="input filter-input"
        placeholder="🔍 Buscar palavra, frase ou significado..."
      />
    </div>

    <!-- List -->
    <div class="vocab-list" id="full-vocab-list">
      ${sorted.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h3>Nenhuma palavra salva</h3>
          <p>Assista um vídeo e salve palavras com contexto!</p>
          <a href="#/videos" class="btn btn-primary">Ir para vídeos</a>
        </div>
      ` : sorted.map(v => renderFullVocabItem(v, reviewMap[v.id], videoCache[v.video_id])).join('')}
    </div>
  `;

  // Quick capture button
  const btnQc = container.querySelector('#btn-vocab-page-quick-capture');
  if (btnQc) {
    btnQc.addEventListener('click', () => {
      openQuickCaptureModal({
        onSaved: () => renderVocabulary(container)
      });
    });
  }

  // Search filter
  const searchInput = container.querySelector('#vocab-search');
  const filterFn = debounce((query) => {
    const list = container.querySelector('#full-vocab-list');
    const q = query.toLowerCase();

    if (!q) {
      list.innerHTML = sorted.map(v => renderFullVocabItem(v, reviewMap[v.id], videoCache[v.video_id])).join('');
      return;
    }

    const filtered = sorted.filter(v =>
      (v.palavra_ou_expressao && v.palavra_ou_expressao.toLowerCase().includes(q)) ||
      (v.frase_contexto && v.frase_contexto.toLowerCase().includes(q)) ||
      (v.traducao_significado && v.traducao_significado.toLowerCase().includes(q))
    );

    if (filtered.length === 0) {
      list.innerHTML = `<div class="text-center text-muted" style="padding: var(--space-8);">Nenhum resultado para "${escapeHtml(query)}"</div>`;
    } else {
      list.innerHTML = filtered.map(v => renderFullVocabItem(v, reviewMap[v.id], videoCache[v.video_id])).join('');
    }
  }, 250);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => filterFn(e.target.value));
  }

  // De-duplicate container click event listeners
  if (activeClickListener) {
    container.removeEventListener('click', activeClickListener);
  }

  activeClickListener = async (e) => {
    // Delete handlers
    const deleteBtn = e.target.closest('.delete-full-vocab-btn');
    if (deleteBtn) {
      const vocabId = deleteBtn.dataset.vocabId;
      if (confirm('Remover esta palavra e seu card de revisão?')) {
        await deleteVocabulario(vocabId);
        // Try to delete associated review card
        const reviewCards = await getAllRevisao();
        const reviewCard = reviewCards.find(r => r.vocabulario_id === vocabId);
        if (reviewCard) await deleteRevisao(reviewCard.id);

        showToast('Palavra removida', 'info');
        renderVocabulary(container);
      }
      return;
    }

    // Go to video
    const videoLink = e.target.closest('.vocab-video-link');
    if (videoLink) {
      e.preventDefault();
      window.location.hash = `/video/${videoLink.dataset.videoId}`;
      return;
    }

    // Speech pronunciation
    const speakBtn = e.target.closest('.speak-vocab-btn');
    if (speakBtn) {
      const word = speakBtn.dataset.word;
      if (word && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word);
        u.lang = 'en-US';
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
      }
      return;
    }
  };

  container.addEventListener('click', activeClickListener);
}

function renderFullVocabItem(vocab, reviewCard, video) {
  const badge = reviewCard ? getDifficultyBadge(reviewCard) : { text: 'Novo', class: 'badge-primary' };
  const nextReview = reviewCard ? getNextReviewLabel(reviewCard) : 'Pendente';

  return `
    <div class="vocab-item" data-vocab-id="${vocab.id}">
      <div class="flex justify-between items-center" style="flex-wrap:wrap; gap: var(--space-2);">
        <div class="flex items-center gap-3">
          <span class="vocab-word" style="margin-bottom:0; display: flex; align-items: center; gap: 6px;">
            <strong>${escapeHtml(vocab.palavra_ou_expressao)}</strong>
            <button class="btn btn-ghost btn-sm speak-vocab-btn" data-word="${escapeHtml(vocab.palavra_ou_expressao)}" title="Ouvir palavra" style="padding: 2px 6px; font-size: 13px; cursor: pointer;">🔊</button>
          </span>
          <span class="badge ${badge.class}">${badge.text}</span>
        </div>
        <button class="btn btn-ghost btn-sm delete-full-vocab-btn" data-vocab-id="${vocab.id}" title="Remover">🗑️</button>
      </div>

      ${vocab.frase_contexto ? `
        <div class="vocab-context mt-2" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span>"${escapeHtml(vocab.frase_contexto)}"</span>
          <button class="btn btn-ghost btn-sm speak-vocab-btn" data-word="${escapeHtml(vocab.frase_contexto)}" title="Ouvir frase inteira" style="padding: 2px 6px; font-size: 11px; white-space: nowrap; color: var(--accent-secondary); flex-shrink: 0; display: flex; align-items: center; gap: 2px; cursor: pointer;">
            <span>🔊</span> <span>Ouvir Frase</span>
          </button>
        </div>
      ` : ''}
      ${vocab.traducao_significado ? `<div class="vocab-translation mt-2">→ ${escapeHtml(vocab.traducao_significado)}</div>` : ''}

      <div class="vocab-meta">
        <span>📅 ${formatDate(vocab.data_criacao)}</span>
        <span>🔄 ${nextReview}</span>
        ${video ? `
          <a class="vocab-video-link" data-video-id="${video.id}" href="#/video/${video.id}" style="color: var(--accent-secondary); text-decoration: none; cursor: pointer;">
            🎬 ${escapeHtml(video.titulo).substring(0, 40)}${video.titulo.length > 40 ? '...' : ''}
          </a>
        ` : ''}
        ${vocab.timestamp ? `<span>📍 ${formatTime(vocab.timestamp)}</span>` : ''}
      </div>
    </div>
  `;
}
