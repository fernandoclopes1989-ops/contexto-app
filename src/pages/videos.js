/**
 * videos.js — Video list page + add video functionality
 */

import { getAllVideos, addVideo, deleteVideo, getClipsByVideo, getVocabularioByVideo } from '../db.js';
import { extractVideoId, fetchVideoTitle, getVideoThumbnail, showToast, escapeHtml } from '../utils.js';
import { navigate } from '../router.js';

export async function renderVideos(container) {
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

  const videos = await getAllVideos();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🎬 Meus Vídeos</h1>
      <p class="page-subtitle">Adicione vídeos do YouTube para criar sessões de estudo</p>
    </div>

    <!-- Add Video Form -->
    <div class="card mb-6" id="add-video-section">
      <div class="section-title" style="margin-bottom: var(--space-4);">➕ Adicionar novo vídeo</div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label" for="video-url-input">URL do YouTube</label>
          <input
            type="text"
            id="video-url-input"
            class="input"
            placeholder="https://www.youtube.com/watch?v=... ou youtu.be/..."
            autocomplete="off"
          />
        </div>
        <button id="add-video-btn" class="btn btn-primary" style="margin-bottom: 0; height: 44px;">
          Adicionar
        </button>
      </div>
    </div>

    <!-- Video Grid -->
    ${videos.length > 0 ? `
      <div class="video-grid" id="video-grid">
        ${await renderVideoCards(videos)}
      </div>
    ` : `
      <div class="empty-state" id="video-empty-state">
        <div class="empty-state-icon">📺</div>
        <h3>Nenhum vídeo ainda</h3>
        <p>Cole o link de um vídeo do YouTube acima para começar a estudar!</p>
      </div>
    `}
  `;

  // Event listeners
  setupVideoPageListeners(container);
}

async function renderVideoCards(videos) {
  const cards = [];

  for (const video of videos) {
    const [clips, vocab] = await Promise.all([
      getClipsByVideo(video.id),
      getVocabularioByVideo(video.id)
    ]);

    const hasTranscriptBadge = video.has_transcript === false
      ? `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);" title="Sem legendas no YouTube - apenas estudo manual">⚠️ Sem legenda</span>`
      : `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);" title="Legendas [CC] disponíveis para Shadowing e IA">🎧 Shadowing OK</span>`;

    cards.push(`
      <div class="video-card" data-video-id="${video.id}" role="button" tabindex="0">
        <div class="video-card-thumb">
          <img src="${getVideoThumbnail(video.youtube_video_id)}" alt="${escapeHtml(video.titulo)}" loading="lazy" />
        </div>
        <div class="video-card-body">
          <div class="video-card-title">${escapeHtml(video.titulo)}</div>
          <div class="video-card-meta">
            <span class="badge">${clips.length} trecho${clips.length !== 1 ? 's' : ''}</span>
            <span class="badge">${vocab.length} palavra${vocab.length !== 1 ? 's' : ''}</span>
            ${hasTranscriptBadge}
            <button class="btn btn-ghost btn-sm delete-video-btn" data-video-id="${video.id}" title="Remover vídeo">🗑️</button>
          </div>
        </div>
      </div>
    `);
  }

  return cards.join('');
}

function setupVideoPageListeners(container) {
  // Add video button
  const addBtn = container.querySelector('#add-video-btn');
  const urlInput = container.querySelector('#video-url-input');

  addBtn.addEventListener('click', () => handleAddVideo(urlInput));
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddVideo(urlInput);
  });

  // Click on video cards
  container.addEventListener('click', (e) => {
    // Delete button
    const deleteBtn = e.target.closest('.delete-video-btn');
    if (deleteBtn) {
      e.stopPropagation();
      handleDeleteVideo(deleteBtn.dataset.videoId, container);
      return;
    }

    // Video card click
    const card = e.target.closest('.video-card');
    if (card) {
      navigate(`/video/${card.dataset.videoId}`);
    }
  });
}

async function handleAddVideo(input) {
  const url = input.value.trim();
  if (!url) {
    showToast('Cole um link do YouTube', 'error');
    return;
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    showToast('Link inválido! Use uma URL do YouTube', 'error');
    return;
  }

  // Check if already added
  const existing = await getAllVideos();
  if (existing.find(v => v.youtube_video_id === videoId)) {
    showToast('Esse vídeo já foi adicionado!', 'info');
    const existingVideo = existing.find(v => v.youtube_video_id === videoId);
    navigate(`/video/${existingVideo.id}`);
    return;
  }

  // Fetch title & validate subtitles
  const addBtn = document.getElementById('add-video-btn');
  addBtn.textContent = '⏳ Validando vídeo e legendas...';
  addBtn.disabled = true;

  try {
    const { fetchTranscriptTimed } = await import('../ai.js');

    const [titulo, timedTranscript] = await Promise.all([
      fetchVideoTitle(videoId),
      fetchTranscriptTimed(videoId).catch(() => null)
    ]);

    const hasTranscript = Array.isArray(timedTranscript) && timedTranscript.length > 0;

    if (!hasTranscript) {
      const proceed = confirm(
        '⚠️ AVISO SOBRE AS LEGENDAS:\n\n' +
        'Este vídeo NÃO possui legendas/transcrição disponíveis no YouTube.\n\n' +
        '• Você poderá assistir ao vídeo normalmente e marcar loops manuais na aba "Trechos".\n' +
        '• Porém, as funções automáticas de "Shadowing com IA" e "Cards 1+1" precisam de vídeos com legendas [CC] no YouTube.\n\n' +
        'Deseja adicionar este vídeo mesmo assim?'
      );

      if (!proceed) {
        return;
      }
    }

    const id = await addVideo({
      youtube_video_id: videoId,
      titulo: titulo,
      has_transcript: hasTranscript,
      data_adicionado: new Date().toISOString()
    });

    if (hasTranscript) {
      showToast('Vídeo validado e adicionado com legendas prontas para IA! 🎉🎧', 'success');
    } else {
      showToast('Vídeo adicionado (apenas modo estudo manual)! 📺', 'info');
    }
    input.value = '';
    navigate(`/video/${id}`);
  } catch (err) {
    console.error('Error adding video:', err);
    showToast('Erro: ' + (err.message || err.toString()), 'error');
  } finally {
    addBtn.textContent = 'Adicionar';
    addBtn.disabled = false;
  }
}

async function handleDeleteVideo(videoId, container) {
  if (!confirm('Remover este vídeo? (Trechos e vocabulário vinculados serão mantidos)')) return;

  try {
    await deleteVideo(videoId);
    showToast('Vídeo removido', 'info');
    renderVideos(container);
  } catch (err) {
    showToast('Erro ao remover vídeo', 'error');
  }
}
