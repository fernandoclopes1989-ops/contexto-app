/**
 * playlist.js — Spotify-style continuous Shadowing and Listening Player
 * Organizes clips into "O Geralzão" and individual video albums.
 * Zero token waste: Phonetic transcriptions are permanently cached and offline.
 */

import { getAll, addClip } from '../db.js';
import { createPlayer, destroyPlayer, seekTo, play, pause, setPlaybackRate, getPlayer } from '../youtube.js';
import { getPhrasePhonetics } from '../services/phoneticService.js';
import { formatTime, escapeHtml, showToast } from '../utils.js';

// State
let allVideos = [];
let allClips = [];
let videoPlaylists = [];
let activePlaylist = null; // { id: 'all' | videoId, title: string, clips: [] }
let activeClipsList = [];
let activeTrackIndex = 0;
let playbackMode = 'loop'; // 'loop' (repeat single) | 'playlist' (auto-advance) | 'shuffle'
let playSpeed = 1.0;
let checkInterval = null;
let playerReady = false;
let currentView = 'hub'; // 'hub' | 'player'
let audioOnlyMode = false; // Toggle video vs pure audio album art
let repetitionCount = 0;

export async function renderPlaylist(container) {
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><span class="loading-text">Carregando suas Playlists de Shadowing...</span></div>`;

  try {
    const [videos, clips] = await Promise.all([
      getAll('videos'),
      getAll('clips')
    ]);

    allVideos = videos || [];
    allClips = clips || [];

    // Group clips by video
    rebuildVideoPlaylists();

    if (allClips.length === 0 && allVideos.length === 0) {
      container.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">📻 Playlists de Shadowing</h1>
          <p class="page-subtitle">Ouça seus trechos salvos como em um player de música</p>
        </div>
        <div class="empty-state" style="padding: var(--space-12);">
          <div class="empty-state-icon">📻</div>
          <h3>Nenhum vídeo adicionado ainda</h3>
          <p>Adicione um vídeo do YouTube para criar automaticamente suas playlists de Shadowing estilo Spotify!</p>
          <a href="#/videos" class="btn btn-primary" style="margin-top: 12px;">➕ Adicionar Meu Primeiro Vídeo</a>
        </div>
      `;
      return;
    }

    // Default to hub view unless already playing a playlist
    if (!activePlaylist || currentView === 'hub') {
      renderPlaylistsHub(container);
    } else {
      renderActivePlayerView(container);
    }

  } catch (err) {
    console.error('Error rendering playlist page:', err);
    container.innerHTML = `<div class="empty-state"><h3>Erro ao carregar playlists</h3><p>${err.message}</p></div>`;
  }
}

function rebuildVideoPlaylists() {
  videoPlaylists = allVideos.map(v => {
    const videoClips = allClips.filter(c => String(c.video_id) === String(v.id));
    return {
      video: v,
      clips: videoClips,
      count: videoClips.length
    };
  });
}

/**
 * 🌟 VIEW 1: Playlist Hub (Spotify Library Grid)
 */
function renderPlaylistsHub(container) {
  currentView = 'hub';
  stopPlaylistTimer();

  rebuildVideoPlaylists();

  const albumsWithClips = videoPlaylists.filter(item => item.count > 0);
  const albumsPending = videoPlaylists.filter(item => item.count === 0);

  container.innerHTML = `
    <div class="page-header" style="margin-bottom: var(--space-6);">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <div>
          <h1 class="page-title" style="display: flex; align-items: center; gap: 8px;">
            <span>📻</span> <span>Playlists de Shadowing</span>
          </h1>
          <p class="page-subtitle">Estude em loop contínuo estilo Spotify: ouça o Geralzão ou escolha por vídeo</p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--accent-secondary); font-size: 13px; padding: 6px 12px; font-weight: 700;">
            🎵 ${allClips.length} frases • ${albumsWithClips.length} álbuns
          </div>
        </div>
      </div>
    </div>

    <!-- Search filter bar -->
    <div style="margin-bottom: var(--space-6); display: flex; gap: 12px; align-items: center;">
      <div style="flex: 1; position: relative;">
        <input
          type="text"
          id="playlist-search-input"
          class="input"
          placeholder="🔍 Filtrar vídeos ou assuntos..."
          style="width: 100%; height: 42px; border-radius: var(--radius-full); padding-left: 16px; background: var(--bg-surface); border: 1px solid var(--border-color);"
        />
      </div>
    </div>

    <!-- 🔥 HERO BANNER: O Geralzão de Todos os Trechos -->
    ${allClips.length > 0 ? `
      <div class="hero-playlist-card" id="btn-play-all-hero" style="background: linear-gradient(135deg, rgba(79, 70, 229, 0.35) 0%, rgba(24, 24, 37, 0.9) 100%); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: var(--radius-xl); padding: var(--space-6); display: flex; align-items: center; justify-content: space-between; gap: var(--space-6); margin-bottom: var(--space-8); box-shadow: 0 10px 30px rgba(0,0,0,0.4); cursor: pointer; transition: all 0.25s ease;" title="Tocar todas as frases de todos os vídeos">
        <div style="display: flex; align-items: center; gap: var(--space-6); flex: 1;">
          <div style="width: 88px; height: 88px; border-radius: var(--radius-lg); background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); display: flex; align-items: center; justify-content: center; font-size: 40px; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5); flex-shrink: 0;">
            🌟
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--accent-secondary); font-weight: 800; margin-bottom: 4px;">PLAYLIST PRINCIPAL</div>
            <h2 style="margin: 0; font-size: 1.6rem; color: #fff; font-weight: 800;">O Geralzão de Shadowing</h2>
            <p class="text-sm text-muted" style="margin: 4px 0 0; line-height: 1.4;">Todas as frases salvas de todos os seus vídeos reunidas em uma única playlist contínua com repetição em loop.</p>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
              <span class="badge" style="background: rgba(52, 211, 153, 0.15); color: #34d399; font-weight: 700;">✓ ${allClips.length} frases em rotação</span>
              <span class="badge" style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted);">Áudio original + Fonética IPA</span>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" style="border-radius: 50%; width: 62px; height: 62px; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);">
          ▶️
        </button>
      </div>
    ` : `
      <div style="background: rgba(99, 102, 241, 0.08); border: 1px dashed var(--accent-primary); border-radius: var(--radius-lg); padding: var(--space-6); text-align: center; margin-bottom: var(--space-8);">
        <h3 style="margin-bottom: 8px;">Nenhum trecho de Shadowing salvo ainda</h3>
        <p class="text-muted text-sm" style="max-width: 500px; margin: 0 auto 16px;">Seus vídeos estão prontos! Clique em qualquer um abaixo para gerar os trechos com IA e começar a escutar.</p>
      </div>
    `}

    <!-- 🎬 GRID: Playlists por Vídeo (Estilo Álbuns do Spotify) -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
      <div class="section-title" style="margin: 0; display: flex; align-items: center; gap: 8px;">
        <span>🎬</span> <span>Playlists por Vídeo (${albumsWithClips.length})</span>
      </div>
    </div>

    <div class="spotify-albums-grid" id="spotify-albums-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-5);">
      ${albumsWithClips.map(item => renderAlbumCard(item)).join('')}
    </div>

    <!-- ⚡ Álbuns aguardando geração de trechos -->
    ${albumsPending.length > 0 ? `
      <div style="margin-top: var(--space-10);">
        <div class="section-title" style="margin-bottom: var(--space-3); display: flex; align-items: center; gap: 8px;">
          <span>⚡</span> <span>Vídeos aguardando trechos (${albumsPending.length})</span>
        </div>
        <p class="text-sm text-muted" style="margin-bottom: var(--space-4);">Estes vídeos já estão na sua conta. Clique para criar a playlist de Shadowing automaticamente:</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4);">
          ${albumsPending.map(item => `
            <div class="card" style="padding: var(--space-4); display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
              <div>
                <strong style="font-size: 13px; line-height: 1.4; display: block; margin-bottom: 4px;">${escapeHtml(item.video.titulo)}</strong>
                <span class="text-xs text-muted">0 trechos salvos</span>
              </div>
              <button class="btn btn-secondary btn-sm btn-generate-album-clips" data-video-id="${item.video.id}" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 700;">
                <span>✨</span> <span>Criar Playlist com IA</span>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  // Filter input logic
  const searchInput = container.querySelector('#playlist-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      container.querySelectorAll('.spotify-album-card').forEach(card => {
        const title = card.getAttribute('data-title') || '';
        card.style.display = title.toLowerCase().includes(q) ? 'flex' : 'none';
      });
    });
  }

  // Attach click to Hero "Geralzão"
  const heroCard = container.querySelector('#btn-play-all-hero');
  if (heroCard && allClips.length > 0) {
    heroCard.addEventListener('click', () => {
      startPlayingPlaylist({
        id: 'all',
        title: '🌟 O Geralzão de Shadowing',
        clips: [...allClips]
      }, container);
    });
  }

  // Attach click to Album Cards
  container.querySelectorAll('.spotify-album-card').forEach(card => {
    card.addEventListener('click', () => {
      const vidId = card.dataset.videoId;
      const matched = videoPlaylists.find(item => String(item.video.id) === String(vidId));
      if (matched && matched.clips.length > 0) {
        startPlayingPlaylist({
          id: matched.video.id,
          title: `🎬 ${matched.video.titulo}`,
          clips: matched.clips
        }, container);
      }
    });
  });

  // Attach 1-click auto-generation for pending albums
  container.querySelectorAll('.btn-generate-album-clips').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const vidId = btn.dataset.videoId;
      const matched = allVideos.find(v => String(v.id) === String(vidId));
      if (!matched) return;

      btn.disabled = true;
      btn.textContent = '⏳ Gerando trechos com IA...';

      try {
        const { detectUsefulSegments } = await import('../ai.js');
        const segments = await detectUsefulSegments(matched.youtube_video_id, matched.titulo, null, 8);
        
        if (segments && segments.length > 0) {
          for (const seg of segments) {
            await addClip({
              video_id: matched.id,
              nome: seg.title,
              tempo_inicio: seg.start_seconds,
              tempo_fim: seg.end_seconds
            });
          }
          showToast(`🎉 ${segments.length} trechos gerados para este álbum!`, 'success');
          // Reload
          renderPlaylist(container);
        } else {
          showToast('Não foi possível gerar trechos agora. Tente pelo player.', 'error');
          btn.disabled = false;
          btn.textContent = '✨ Criar Playlist com IA';
        }
      } catch (err) {
        console.error('Error generating album clips:', err);
        showToast('Erro ao gerar trechos com IA', 'error');
        btn.disabled = false;
        btn.textContent = '✨ Criar Playlist com IA';
      }
    });
  });
}

function renderAlbumCard(item) {
  const v = item.video;
  const thumb = `https://img.youtube.com/vi/${v.youtube_video_id}/mqdefault.jpg`;
  return `
    <div class="spotify-album-card" data-video-id="${v.id}" data-title="${escapeHtml(v.titulo)}" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--space-4); display: flex; flex-direction: column; cursor: pointer; transition: all 0.2s ease; position: relative; overflow: hidden;">
      <div style="width: 100%; aspect-ratio: 16/9; border-radius: var(--radius-md); overflow: hidden; margin-bottom: var(--space-3); background: #000; position: relative;">
        <img src="${thumb}" alt="${escapeHtml(v.titulo)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://placehold.co/320x180/1e293b/white?text=Video'" />
        <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); padding: 3px 8px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 4px;">
          <span>🎵</span> <span>${item.count} frases</span>
        </div>
      </div>
      <h4 style="margin: 0 0 6px; font-size: 14px; line-height: 1.4; color: var(--text-primary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 38px;">
        ${escapeHtml(v.titulo)}
      </h4>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);">
        <span class="text-xs text-muted">Álbum de Shadowing</span>
        <span style="color: var(--accent-secondary); font-weight: 700; font-size: 13px;">▶️ Ouvir</span>
      </div>
    </div>
  `;
}

/**
 * 🎵 START A PLAYLIST AND SWITCH TO PLAYER VIEW
 */
function startPlayingPlaylist(playlistData, container) {
  activePlaylist = playlistData;
  activeClipsList = [...playlistData.clips];
  activeTrackIndex = 0;
  repetitionCount = 0;
  renderActivePlayerView(container);
}

/**
 * 🎧 VIEW 2: Player View (Now Playing + Tracklist do Álbum)
 */
function renderActivePlayerView(container) {
  currentView = 'player';
  const clip = activeClipsList[activeTrackIndex] || activeClipsList[0];

  container.innerHTML = `
    <!-- Top Nav: Back button + Playlist Quick Switcher -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: 10px;">
      <button id="btn-back-to-hub" class="btn btn-ghost btn-sm" style="display: flex; align-items: center; gap: 6px; font-weight: 700;">
        <span>←</span> <span>Voltar às Playlists</span>
      </button>

      <!-- Quick Switcher Dropdown -->
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="text-xs text-muted">Playlist:</span>
        <select id="player-playlist-select" class="input" style="height: 34px; font-size: 12px; font-weight: 700; padding: 2px 10px; background: var(--bg-surface); color: var(--text-primary); border-radius: var(--radius-md); border: 1px solid var(--border-color); cursor: pointer;">
          <option value="all" ${activePlaylist.id === 'all' ? 'selected' : ''}>🌟 O Geralzão (${allClips.length} frases)</option>
          ${videoPlaylists.filter(i => i.count > 0).map(item => `
            <option value="${item.video.id}" ${String(activePlaylist.id) === String(item.video.id) ? 'selected' : ''}>
              🎬 ${escapeHtml(item.video.titulo)} (${item.count} frases)
            </option>
          `).join('')}
        </select>
        <span class="badge" style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); font-size: 12px;">
          Faixa <span id="current-track-num">${activeTrackIndex + 1}</span> de ${activeClipsList.length}
        </span>
      </div>
    </div>

    <!-- Spotify Two-Column Layout -->
    <div class="spotify-layout" style="display: grid; grid-template-columns: 1fr 340px; gap: var(--space-6);">

      <!-- Main Column: The Now Playing Stage -->
      <div class="spotify-player-card" style="background: linear-gradient(135deg, rgba(20, 20, 28, 0.95) 0%, rgba(10, 10, 16, 0.98) 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--radius-xl); padding: var(--space-6); display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 15px 40px rgba(0,0,0,0.6); min-height: 540px; justify-content: space-between;">
        
        <!-- Video / Audio Visualizer Box -->
        <div style="width: 100%; max-width: 380px; position: relative;">
          <!-- Audio Mode / Video Mode Toggle -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 6px;">
            <button id="btn-toggle-audio-mode" class="btn btn-ghost btn-sm" style="font-size: 11px; padding: 2px 8px; color: var(--accent-secondary); background: rgba(255,255,255,0.03); border-radius: var(--radius-full);">
              ${audioOnlyMode ? '🎬 Mostrar Vídeo' : '🎧 Modo Só Áudio'}
            </button>
          </div>

          <div id="media-viewport" style="width: 100%; aspect-ratio: 16/9; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid rgba(255,255,255,0.1); background: #000; box-shadow: 0 8px 25px rgba(0,0,0,0.7); position: relative;">
            <!-- Embedded YouTube Player -->
            <div id="playlist-yt-player" style="width: 100%; height: 100%; ${audioOnlyMode ? 'display: none;' : ''}"></div>
            
            <!-- Pure Audio Album Art Fallback -->
            <div id="audio-album-art" style="width: 100%; height: 100%; display: ${audioOnlyMode ? 'flex' : 'none'}; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle, #2d1b69 0%, #0d0c1d 100%); padding: var(--space-4);">
              <div style="font-size: 44px; margin-bottom: 8px; animation: pulse 2s infinite ease-in-out;">🎧</div>
              <div style="font-size: 13px; font-weight: 700; color: #fff;">Modo de Escuta Ativa</div>
              <div style="font-size: 11px; color: var(--accent-secondary); margin-top: 2px;">Foco 100% no ouvido e na fala</div>
            </div>
          </div>
        </div>

        <!-- Now Playing Text Stage (Visual de Letra do Spotify) -->
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; width: 100%; margin: var(--space-4) 0; max-width: 540px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--accent-secondary); font-weight: 800; margin-bottom: 6px;">
            FRASE DE SHADOWING EM REPETIÇÃO
          </div>
          
          <div id="player-sentence" style="font-size: 1.35rem; font-weight: 800; color: #fff; line-height: 1.4; text-shadow: 0 2px 8px rgba(0,0,0,0.6); padding: 0 var(--space-3); margin-bottom: var(--space-3);">
            "${escapeHtml(clip?.nome || 'Carregando...')}"
          </div>

          <!-- Transcrição Fonética Fixa (ZERO TOKENS — Motor 100% Offline) -->
          <div id="player-phonetic-container" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--radius-md); padding: 10px 14px; margin: 0 var(--space-3); display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px;">
            <div id="player-phonetic-ipa" style="font-size: 13px; font-family: monospace; color: var(--accent-secondary); font-weight: 600; letter-spacing: 0.5px;"></div>
            <div id="player-phonetic-br" style="font-size: 12px; color: #fbbf24; font-weight: 700; font-style: italic;"></div>
          </div>

          <!-- Counter badge -->
          <div style="margin-top: 8px;">
            <span id="player-reps-counter" class="badge" style="background: rgba(99, 102, 241, 0.1); color: var(--accent-secondary); font-size: 11px; padding: 2px 8px;">
              🔁 Repetição: 1
            </span>
          </div>
        </div>

        <!-- Controls Section -->
        <div style="width: 100%; max-width: 460px;">
          <!-- Speed control pills -->
          <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: var(--space-3);">
            <button class="speed-btn btn-sm-playlist" data-speed="0.75" style="padding: 2px 10px; font-size: 11px; border-radius: 4px; background: rgba(255,255,255,0.05); color: #ccc; border: none; cursor: pointer;">0.75x (Lento)</button>
            <button class="speed-btn btn-sm-playlist active" data-speed="1" style="padding: 2px 10px; font-size: 11px; border-radius: 4px; background: var(--accent-primary); color: #fff; border: none; cursor: pointer; font-weight: bold;">1.0x (Normal)</button>
            <button class="speed-btn btn-sm-playlist" data-speed="1.25" style="padding: 2px 10px; font-size: 11px; border-radius: 4px; background: rgba(255,255,255,0.05); color: #ccc; border: none; cursor: pointer;">1.25x (Rápido)</button>
          </div>

          <!-- Main Player Action Buttons -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-2); margin-bottom: var(--space-4);">
            <!-- Loop Mode Toggle -->
            <button id="player-toggle-mode" class="btn btn-ghost" style="font-size: 14px; padding: 8px 10px; font-weight: 700; color: var(--accent-secondary);" title="Alternar Modo de Repetição">
              🔂 Repetir Trecho
            </button>

            <!-- Previous -->
            <button id="player-prev" class="btn btn-ghost" style="font-size: 26px; padding: 8px;" title="Faixa Anterior">⏮️</button>

            <!-- Big Play/Pause -->
            <button id="player-play-toggle" class="btn btn-primary" style="font-size: 26px; width: 62px; height: 62px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5); padding: 0;" title="Play / Pause">▶️</button>

            <!-- Next -->
            <button id="player-next" class="btn btn-ghost" style="font-size: 26px; padding: 8px;" title="Próxima Faixa">⏭️</button>

            <!-- TTS Speak -->
            <button id="player-speak" class="btn btn-ghost" style="font-size: 14px; padding: 8px 10px; color: var(--accent-primary); font-weight: 700;" title="Ouvir pronúncia limpa em inglês">
              🔊 TTS
            </button>
          </div>

          <!-- Progress Bar & Scrubber -->
          <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
            <span id="player-progress-start" class="text-xs text-muted" style="min-width: 32px; font-family: monospace;">0:00</span>
            <div id="player-progress-container" style="flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; position: relative; cursor: pointer;">
              <div id="player-progress-bar" style="width: 0%; height: 100%; background: var(--accent-primary); transition: width 0.1s linear;"></div>
            </div>
            <span id="player-progress-end" class="text-xs text-muted" style="min-width: 32px; font-family: monospace;">0:00</span>
          </div>
        </div>

      </div>

      <!-- Right Column: Interactive Spotify Tracklist Queue -->
      <div class="spotify-tracklist-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: var(--space-5); display: flex; flex-direction: column; max-height: 540px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); padding-bottom: var(--space-2); border-bottom: 1px solid rgba(255,255,255,0.05);">
          <strong style="font-size: 14px; color: #fff;">Fila de Faixas</strong>
          <span style="font-size: 11px; color: var(--text-muted);">${activeClipsList.length} faixas</span>
        </div>

        <div id="player-tracklist" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px;">
          <!-- Track items rendered here -->
        </div>
      </div>

    </div>
  `;

  // Attach navigation listeners
  container.querySelector('#btn-back-to-hub').addEventListener('click', () => {
    stopPlaylistTimer();
    destroyPlayer();
    renderPlaylistsHub(container);
  });

  // Attach playlist switcher dropdown
  const playlistSelect = container.querySelector('#player-playlist-select');
  if (playlistSelect) {
    playlistSelect.addEventListener('change', (e) => {
      const selectedVal = e.target.value;
      if (selectedVal === 'all') {
        startPlayingPlaylist({
          id: 'all',
          title: '🌟 O Geralzão de Shadowing',
          clips: [...allClips]
        }, container);
      } else {
        const matched = videoPlaylists.find(item => String(item.video.id) === String(selectedVal));
        if (matched) {
          startPlayingPlaylist({
            id: matched.video.id,
            title: `🎬 ${matched.video.titulo}`,
            clips: matched.clips
          }, container);
        }
      }
    });
  }

  // Audio/Video Mode Toggle
  const btnToggleAudio = container.querySelector('#btn-toggle-audio-mode');
  if (btnToggleAudio) {
    btnToggleAudio.addEventListener('click', () => {
      audioOnlyMode = !audioOnlyMode;
      const ytEl = document.getElementById('playlist-yt-player');
      const artEl = document.getElementById('audio-album-art');
      if (ytEl && artEl) {
        ytEl.style.display = audioOnlyMode ? 'none' : 'block';
        artEl.style.display = audioOnlyMode ? 'flex' : 'none';
        btnToggleAudio.textContent = audioOnlyMode ? '🎬 Mostrar Vídeo' : '🎧 Modo Só Áudio';
      }
    });
  }

  // Attach player controls
  container.querySelector('#player-play-toggle').addEventListener('click', togglePlay);
  container.querySelector('#player-prev').addEventListener('click', prevTrack);
  container.querySelector('#player-next').addEventListener('click', nextTrack);
  container.querySelector('#player-toggle-mode').addEventListener('click', cyclePlaybackMode);
  container.querySelector('#player-speak').addEventListener('click', speakCurrentText);

  // Speed buttons
  container.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      playSpeed = parseFloat(e.target.dataset.speed);
      setPlaybackRate(playSpeed);
    });
  });

  // Render tracklist and start playing active clip
  updateTracklistUI();
  loadAndPlayTrack(activeTrackIndex);
}

function updateTracklistUI() {
  const tracklistEl = document.getElementById('player-tracklist');
  if (!tracklistEl) return;

  const trackNumEl = document.getElementById('current-track-num');
  if (trackNumEl) trackNumEl.textContent = activeTrackIndex + 1;

  tracklistEl.innerHTML = activeClipsList.map((c, i) => {
    const isPlaying = i === activeTrackIndex;
    return `
      <div class="playlist-track-item ${isPlaying ? 'active' : ''}" data-index="${i}" style="padding: 8px 10px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer; background: ${isPlaying ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${isPlaying ? 'rgba(99, 102, 241, 0.4)' : 'transparent'}; transition: all 0.15s ease;">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden; text-align: left;">
          <span style="font-size: 11px; font-weight: 700; color: ${isPlaying ? 'var(--accent-secondary)' : 'var(--text-muted)'}; min-width: 16px;">
            ${isPlaying ? '▶' : `${i + 1}.`}
          </span>
          <span style="font-size: 12px; font-weight: ${isPlaying ? '700' : '500'}; color: ${isPlaying ? '#fff' : 'var(--text-secondary)'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHtml(c.nome || 'Sem título')}
          </span>
        </div>
        <span class="text-xs text-muted" style="font-family: monospace; font-size: 10px;">📍 ${formatTime(c.tempo_inicio)}</span>
      </div>
    `;
  }).join('');

  // Click on track row
  tracklistEl.querySelectorAll('.playlist-track-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      activeTrackIndex = idx;
      repetitionCount = 0;
      updateTracklistUI();
      loadAndPlayTrack(activeTrackIndex);
    });
  });
}

async function loadAndPlayTrack(index) {
  const clip = activeClipsList[index];
  if (!clip) return;

  playerReady = false;
  repetitionCount = 1;

  const sentenceEl = document.getElementById('player-sentence');
  if (sentenceEl) sentenceEl.textContent = `"${clip.nome}"`;

  const progStart = document.getElementById('player-progress-start');
  if (progStart) progStart.textContent = formatTime(clip.tempo_inicio);

  const progEnd = document.getElementById('player-progress-end');
  if (progEnd) progEnd.textContent = formatTime(clip.tempo_fim);

  const progBar = document.getElementById('player-progress-bar');
  if (progBar) progBar.style.width = '0%';

  const repsEl = document.getElementById('player-reps-counter');
  if (repsEl) repsEl.textContent = `🔁 Repetição: ${repetitionCount}`;

  // ZERO TOKEN PHONETICS (Instant offline calculation & permanent cache)
  loadOfflinePhonetics(clip);

  // Find matching video
  const matchingVideo = allVideos.find(v => String(v.id) === String(clip.video_id));
  if (!matchingVideo) {
    showToast('Vídeo do trecho não localizado', 'error');
    return;
  }

  stopPlaylistTimer();

  try {
    await createPlayer('playlist-yt-player', matchingVideo.youtube_video_id, {
      autoplay: 1,
      startSeconds: clip.tempo_inicio,
      onReady: () => {
        playerReady = true;
        setPlaybackRate(playSpeed);
        seekTo(clip.tempo_inicio);
        play();
        startPlaylistTimer();
        updatePlayToggleButtonState(true);
      },
      onStateChange: (event) => {
        if (event.data === 1) updatePlayToggleButtonState(true);
        else if (event.data === 2) updatePlayToggleButtonState(false);
      }
    });
  } catch (err) {
    console.error('Error starting player for track:', err);
  }
}

/**
 * 🔒 ZERO TOKEN WASTE: Instant Offline Phonetic Transcription
 */
function loadOfflinePhonetics(clip) {
  const ipaEl = document.getElementById('player-phonetic-ipa');
  const brEl = document.getElementById('player-phonetic-br');
  if (!ipaEl || !brEl) return;

  const phrase = clip.nome || '';
  const { ipa, br } = getPhrasePhonetics(phrase);

  ipaEl.textContent = ipa || '';
  brEl.textContent = br || '';
}

function startPlaylistTimer() {
  stopPlaylistTimer();
  const clip = activeClipsList[activeTrackIndex];
  if (!clip) return;

  const duration = Math.max(1, clip.tempo_fim - clip.tempo_inicio);

  checkInterval = setInterval(() => {
    const player = getPlayer();
    if (!player || !playerReady) return;

    try {
      const current = player.getCurrentTime();

      // Update progress bar
      if (current >= clip.tempo_inicio) {
        const elapsed = current - clip.tempo_inicio;
        const pct = Math.min(100, Math.max(0, (elapsed / duration) * 100));
        const bar = document.getElementById('player-progress-bar');
        const startSpan = document.getElementById('player-progress-start');
        if (bar) bar.style.width = `${pct}%`;
        if (startSpan) startSpan.textContent = formatTime(Math.min(clip.tempo_fim, current));
      }

      // Check boundary: Loop vs Auto-Advance
      if (current >= clip.tempo_fim) {
        repetitionCount++;
        const repsEl = document.getElementById('player-reps-counter');
        if (repsEl) repsEl.textContent = `🔁 Repetição: ${repetitionCount}`;

        if (playbackMode === 'loop') {
          seekTo(clip.tempo_inicio);
          play();
        } else if (playbackMode === 'playlist') {
          nextTrack();
        } else if (playbackMode === 'shuffle') {
          randomTrack();
        }
      }
    } catch (e) {}
  }, 120);
}

function stopPlaylistTimer() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

function togglePlay() {
  const player = getPlayer();
  if (!player) return;

  try {
    const state = player.getPlayerState();
    if (state === 1) {
      pause();
      updatePlayToggleButtonState(false);
    } else {
      play();
      updatePlayToggleButtonState(true);
    }
  } catch (e) {
    play();
    updatePlayToggleButtonState(true);
  }
}

function updatePlayToggleButtonState(isPlaying) {
  const btn = document.getElementById('player-play-toggle');
  if (btn) {
    btn.innerHTML = isPlaying ? '⏸️' : '▶️';
    btn.className = isPlaying ? 'btn btn-secondary' : 'btn btn-primary';
    btn.style.width = '62px';
    btn.style.height = '62px';
    btn.style.borderRadius = '50%';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justify = 'center';
  }
}

function prevTrack() {
  if (activeClipsList.length === 0) return;
  activeTrackIndex = (activeTrackIndex - 1 + activeClipsList.length) % activeClipsList.length;
  updateTracklistUI();
  loadAndPlayTrack(activeTrackIndex);
}

function nextTrack() {
  if (activeClipsList.length === 0) return;
  activeTrackIndex = (activeTrackIndex + 1) % activeClipsList.length;
  updateTracklistUI();
  loadAndPlayTrack(activeTrackIndex);
}

function randomTrack() {
  if (activeClipsList.length <= 1) return;
  let nextIdx = activeTrackIndex;
  while (nextIdx === activeTrackIndex) {
    nextIdx = Math.floor(Math.random() * activeClipsList.length);
  }
  activeTrackIndex = nextIdx;
  updateTracklistUI();
  loadAndPlayTrack(activeTrackIndex);
}

function cyclePlaybackMode() {
  const btn = document.getElementById('player-toggle-mode');
  if (!btn) return;

  if (playbackMode === 'loop') {
    playbackMode = 'playlist';
    btn.innerHTML = '🔁 Loop Playlist';
    btn.style.color = '#34d399';
    showToast('Modo Playlist: Avança automaticamente pelas faixas!', 'info');
  } else if (playbackMode === 'playlist') {
    playbackMode = 'shuffle';
    btn.innerHTML = '🔀 Aleatório';
    btn.style.color = '#f59e0b';
    showToast('Modo Aleatório Ativado!', 'info');
  } else {
    playbackMode = 'loop';
    btn.innerHTML = '🔂 Repetir Trecho';
    btn.style.color = 'var(--accent-secondary)';
    showToast('Modo Repetir: Fica repetindo a mesma frase em loop!', 'info');
  }
}

function speakCurrentText() {
  const clip = activeClipsList[activeTrackIndex];
  if (clip && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clip.nome);
    u.lang = 'en-US';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }
}

export function cleanupPlaylist() {
  stopPlaylistTimer();
  destroyPlayer();
}
