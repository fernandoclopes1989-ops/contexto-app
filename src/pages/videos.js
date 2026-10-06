/**
 * videos.js — Video list page + add video functionality
 */

import { getAllVideos, addVideo, deleteVideo, getClipsByVideo, getVocabularioByVideo } from '../db.js';
import { extractVideoId, fetchVideoTitle, getVideoThumbnail, showToast, escapeHtml } from '../utils.js';
import { navigate } from '../router.js';

let activeClickListener = null;

export async function renderVideos(container) {
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

  const videos = await getAllVideos();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🎬 Meus Vídeos</h1>
      <p class="page-subtitle">Adicione vídeos do YouTube para criar sessões de estudo</p>
    </div>

    <!-- Add/Search Video Card -->
    <div class="card mb-6" id="add-video-section" style="padding: var(--space-5);">
      <div style="display: flex; gap: var(--space-3); margin-bottom: var(--space-4); border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <button id="tab-add-link" class="btn btn-ghost btn-sm active" style="font-weight: 700; border-bottom: 2px solid var(--accent-primary); border-radius: 0; padding: 4px 12px; background: none; color: var(--accent-primary); cursor: pointer;">
          🔗 Colar Link
        </button>
        <button id="tab-search-yt" class="btn btn-ghost btn-sm" style="font-weight: 600; border-radius: 0; padding: 4px 12px; background: none; color: var(--text-muted); cursor: pointer;">
          🔍 Buscar no YouTube (Couch Mode 🛋️)
        </button>
      </div>

      <!-- Add Link Content -->
      <div id="content-add-link">
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

      <!-- Search YT Content -->
      <div id="content-search-yt" class="hidden">
        <div class="input-row">
          <div class="input-group">
            <label class="input-label" for="yt-search-input">Buscar vídeo por título ou assunto</label>
            <input
              type="text"
              id="yt-search-input"
              class="input"
              placeholder="Ex: steve jobs stanford speech, ted talk leadership..."
              autocomplete="off"
            />
          </div>
          <button id="btn-search-yt" class="btn btn-secondary" style="margin-bottom: 0; height: 44px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span>🔍</span> <span>Pesquisar</span>
          </button>
        </div>

        <!-- Search Results Grid -->
        <div id="yt-search-results" class="hidden" style="margin-top: var(--space-4); max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 6px;">
          <!-- Results loaded dynamically -->
        </div>
        <div id="yt-search-loading" class="hidden text-center text-muted text-xs" style="padding: var(--space-4);">
          <div class="spinner" style="margin: 0 auto 8px; width: 24px; height: 24px;"></div>
          Buscando vídeos no YouTube...
        </div>
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
        <p>Cole o link ou pesquise acima para começar a estudar!</p>
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

    const hasTranscriptBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);" title="Pronto para Shadowing e Estudo com IA">🎧 Shadowing OK</span>`;

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
            <a href="#/playlist" class="btn btn-ghost btn-sm" title="Ouvir no Player Spotify" style="padding: 2px 6px; font-size: 13px; text-decoration: none;" onclick="event.stopPropagation()">📻</a>
            <button class="btn btn-ghost btn-sm delete-video-btn" data-video-id="${video.id}" title="Remover vídeo">🗑️</button>
          </div>
        </div>
      </div>
    `);
  }

  return cards.join('');
}

function setupVideoPageListeners(container) {
  // Tabs switching
  const tabLink = container.querySelector('#tab-add-link');
  const tabSearch = container.querySelector('#tab-search-yt');
  const contentLink = container.querySelector('#content-add-link');
  const contentSearch = container.querySelector('#content-search-yt');

  if (tabLink && tabSearch && contentLink && contentSearch) {
    tabLink.addEventListener('click', () => {
      tabLink.classList.add('active');
      tabLink.style.color = 'var(--accent-primary)';
      tabLink.style.borderBottom = '2px solid var(--accent-primary)';
      tabSearch.classList.remove('active');
      tabSearch.style.color = 'var(--text-muted)';
      tabSearch.style.borderBottom = 'none';
      contentLink.classList.remove('hidden');
      contentSearch.classList.add('hidden');
    });

    tabSearch.addEventListener('click', () => {
      tabSearch.classList.add('active');
      tabSearch.style.color = 'var(--accent-primary)';
      tabSearch.style.borderBottom = '2px solid var(--accent-primary)';
      tabLink.classList.remove('active');
      tabLink.style.color = 'var(--text-muted)';
      tabLink.style.borderBottom = 'none';
      contentSearch.classList.remove('hidden');
      contentLink.classList.add('hidden');
      container.querySelector('#yt-search-input')?.focus();
    });
  }

  // Add video button
  const addBtn = container.querySelector('#add-video-btn');
  const urlInput = container.querySelector('#video-url-input');

  if (addBtn && urlInput) {
    addBtn.addEventListener('click', () => handleAddVideo(urlInput));
    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAddVideo(urlInput);
    });
  }

  // Search actions
  const btnSearch = container.querySelector('#btn-search-yt');
  const searchInput = container.querySelector('#yt-search-input');
  const searchLoading = container.querySelector('#yt-search-loading');
  const searchResults = container.querySelector('#yt-search-results');

  const executeSearch = async () => {
    const q = searchInput.value.trim();
    if (!q) {
      showToast('Digite um termo de pesquisa', 'error');
      return;
    }

    btnSearch.disabled = true;
    searchLoading.classList.remove('hidden');
    searchResults.classList.add('hidden');
    searchResults.innerHTML = '';

    try {
      const res = await fetch(`/api/search-youtube?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const videos = await res.json();

      if (!videos || videos.length === 0) {
        searchResults.innerHTML = `<div class="text-center text-muted text-xs" style="padding: var(--space-4);">Nenhum vídeo encontrado no YouTube.</div>`;
      } else {
        searchResults.innerHTML = videos.map(item => `
          <div class="yt-search-result-item" style="display: flex; gap: 12px; align-items: center; background: var(--bg-card); padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); justify-content: space-between; flex-wrap: wrap;">
            <div style="display: flex; gap: 12px; align-items: center; flex: 1; min-width: 250px;">
              <img src="${item.thumbnail}" style="width: 100px; height: auto; aspect-ratio: 16/9; border-radius: var(--radius-sm); object-fit: cover;" />
              <div>
                <div style="font-weight: 600; font-size: 13px; line-height: 1.4; color: var(--text-primary); margin-bottom: 4px;">${escapeHtml(item.title)}</div>
                <div class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted); font-size: 11px;">⏱️ ${item.duration}</div>
              </div>
            </div>
            <button class="btn btn-primary btn-sm btn-add-search-video" data-video-id="${item.id}" data-title="${escapeHtml(item.title)}" style="padding: 6px 12px; font-size: 12px; height: 32px; display: flex; align-items: center; gap: 4px; cursor: pointer;">
              <span>➕</span> <span>Estudar</span>
            </button>
          </div>
        `).join('');
      }
      searchResults.classList.remove('hidden');
    } catch (err) {
      console.error(err);
      searchResults.innerHTML = `<div class="text-center text-muted text-xs" style="padding: var(--space-4); color: var(--danger-color);">Erro ao buscar vídeos. Tente novamente em instantes.</div>`;
      searchResults.classList.remove('hidden');
    } finally {
      btnSearch.disabled = false;
      searchLoading.classList.add('hidden');
    }
  };

  if (btnSearch && searchInput) {
    btnSearch.addEventListener('click', executeSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeSearch();
    });
  }

  // De-duplicate container click event listeners
  if (activeClickListener) {
    container.removeEventListener('click', activeClickListener);
  }

  activeClickListener = async (e) => {
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
      return;
    }

    // Add search video button
    const addSearchBtn = e.target.closest('.btn-add-search-video');
    if (addSearchBtn) {
      addSearchBtn.disabled = true;
      addSearchBtn.textContent = '⏳ ...';
      const ytVideoId = addSearchBtn.dataset.videoId;
      const title = addSearchBtn.dataset.title;

      try {
        const existing = await getAllVideos();
        const found = existing.find(v => v.youtube_video_id === ytVideoId);
        if (found) {
          showToast('Esse vídeo já foi adicionado! Abrindo...', 'info');
          navigate(`/video/${found.id}`);
          return;
        }

        const id = await addVideo({
          youtube_video_id: ytVideoId,
          titulo: title,
          data_adicionado: new Date().toISOString()
        });

        showToast('Vídeo adicionado com sucesso! 🎉', 'success');
        navigate(`/video/${id}`);
      } catch (err) {
        showToast('Erro ao salvar vídeo', 'error');
        addSearchBtn.disabled = false;
        addSearchBtn.textContent = '➕ Estudar';
      }
    }
  };

  container.addEventListener('click', activeClickListener);
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

  // Fetch title
  const addBtn = document.getElementById('add-video-btn');
  addBtn.textContent = 'Adicionando...';
  addBtn.disabled = true;

  try {
    const titulo = await fetchVideoTitle(videoId);

    const id = await addVideo({
      youtube_video_id: videoId,
      titulo: titulo,
      data_adicionado: new Date().toISOString()
    });

    showToast('Vídeo adicionado com sucesso! 🎉', 'success');
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
