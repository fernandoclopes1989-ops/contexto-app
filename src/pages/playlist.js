/**
 * playlist.js — Continuous listening and shadowing player (Spotify/MP3 style)
 */

import { getAll } from '../db.js';
import { createPlayer, destroyPlayer, seekTo, play, pause, setPlaybackRate, getPlayer } from '../youtube.js';
import { callGemini } from '../ai.js';
import { formatTime } from '../utils.js';

let clipsList = [];
let activeIndex = 0;
let isSingleLoop = true; // Loop current track vs autoplay next
let playSpeed = 1.0;
let checkInterval = null;
let playerReady = false;

export async function renderPlaylist(container) {
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><span class="loading-text">Carregando Player de Shadowing...</span></div>`;

  try {
    const [videos, allClips] = await Promise.all([
      getAll('videos'),
      getAll('clips')
    ]);

    if (allClips.length === 0) {
      container.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">📻 Player Shadowing</h1>
          <p class="page-subtitle">Ouça e treine em modo contínuo</p>
        </div>
        <div class="empty-state" style="padding: var(--space-12);">
          <div class="empty-state-icon">📻</div>
          <h3>Nenhum trecho salvo ainda</h3>
          <p>Para usar o Player, salve alguns trechos (clips) de qualquer vídeo na aba "Meus Vídeos".</p>
          <a href="#/videos" class="btn btn-primary" style="margin-top: 12px;">Ir para Meus Vídeos</a>
        </div>
      `;
      return;
    }

    // Group clips by video
    clipsList = [...allClips];
    const videosMap = new Map(videos.map(v => [v.id, v]));

    // Render elegant layout
    container.innerHTML = `
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4);">
        <div>
          <h1 class="page-title">📻 Player Shadowing</h1>
          <p class="page-subtitle">Sua playlist pessoal de loops e fonação</p>
        </div>
        
        <!-- Video Filter -->
        <div class="input-group" style="margin: 0; min-width: 250px;">
          <select id="playlist-video-filter" class="input" style="background: var(--bg-card); cursor: pointer; height: 42px;">
            <option value="all">📂 Todos os Vídeos (${allClips.length} trechos)</option>
            ${videos.map(v => {
              const count = allClips.filter(c => c.video_id === v.id).length;
              return count > 0 ? `<option value="${v.id}">🎬 ${escapeHtml(v.titulo)} (${count})</option>` : '';
            }).join('')}
          </select>
        </div>
      </div>

      <div class="spotify-layout" style="display: grid; grid-template-columns: 1fr 350px; gap: var(--space-6); margin-top: var(--space-6);">
        
        <!-- Left panel: Spotify-style Player -->
        <div class="spotify-player-card" style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-xl); padding: var(--space-8); display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.4); backdrop-filter: blur(10px); position: relative; min-height: 480px; justify-content: space-between;">
          
          <!-- Hidden/Minimized YouTube Player Container -->
          <div style="width: 100%; max-width: 320px; aspect-ratio: 16/9; border-radius: var(--radius-md); overflow: hidden; border: 1px solid rgba(255,255,255,0.05); margin-bottom: var(--space-4); background: #000; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            <div id="playlist-yt-player" style="width: 100%; height: 100%;"></div>
          </div>

          <!-- Active Clip Info -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; width: 100%; margin-bottom: var(--space-6);">
            <!-- Title/Sentence spoken -->
            <div id="player-sentence" style="font-size: var(--font-lg); font-weight: 700; color: #fff; line-height: 1.4; text-shadow: 0 2px 4px rgba(0,0,0,0.5); padding: 0 var(--space-4); margin-bottom: var(--space-4);">
              "Carregando..."
            </div>

            <!-- Phonetic Box -->
            <div id="player-phonetic-container" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: var(--radius-md); padding: 12px; margin: 0 var(--space-4); position: relative; min-height: 60px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: var(--space-1);">
              <span class="text-xs text-muted" style="position: absolute; top: 4px; left: 8px;">🗣️ Transcrição Fonética e Guia:</span>
              <div id="player-phonetic-ipa" style="font-size: 13px; font-family: monospace; color: var(--accent-secondary); font-weight: 600; margin-top: 8px;"></div>
              <div id="player-phonetic-br" style="font-size: 12px; color: #fbbf24; font-weight: 700; font-style: italic;">[Gerando guia de pronúncia...]</div>
            </div>
          </div>

          <!-- Player Controls -->
          <div style="width: 100%; max-width: 450px;">
            <!-- Speed controls -->
            <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: var(--space-4);">
              <button class="speed-btn btn-sm-playlist" data-speed="0.75" style="padding: 2px 8px; font-size: 11px; border-radius: 4px; background: rgba(255,255,255,0.05); color: #ccc; border: none; cursor: pointer;">0.75x</button>
              <button class="speed-btn btn-sm-playlist active" data-speed="1" style="padding: 2px 8px; font-size: 11px; border-radius: 4px; background: var(--accent-primary); color: #fff; border: none; cursor: pointer; font-weight: bold;">1.0x (Normal)</button>
              <button class="speed-btn btn-sm-playlist" data-speed="1.2" style="padding: 2px 8px; font-size: 11px; border-radius: 4px; background: rgba(255,255,255,0.05); color: #ccc; border: none; cursor: pointer;">1.2x</button>
            </div>

            <!-- Main control row -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-4); margin-bottom: var(--space-4);">
              <!-- Loop Mode Button -->
              <button id="player-toggle-loop" class="btn btn-ghost" style="font-size: 18px; padding: 10px; color: var(--accent-secondary);" title="Alternar entre Repetir Faixa ou Tocar Playlist">
                🔂 Loop Único
              </button>

              <!-- Prev -->
              <button id="player-prev" class="btn btn-ghost" style="font-size: 24px; padding: 10px;" title="Anterior">⏮️</button>

              <!-- Play / Pause -->
              <button id="player-play-toggle" class="btn btn-primary" style="font-size: 28px; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.45); padding: 0;" title="Play / Pause">▶️</button>

              <!-- Next -->
              <button id="player-next" class="btn btn-ghost" style="font-size: 24px; padding: 10px;" title="Próxima">⏭️</button>

              <!-- TTS Speak -->
              <button id="player-speak" class="btn btn-ghost" style="font-size: 18px; padding: 10px; color: var(--accent-primary);" title="Pronunciar texto com áudio limpo">
                🔊 TTS
              </button>
            </div>

            <!-- Progress tracker -->
            <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
              <span id="player-progress-start" class="text-xs text-muted">0:00</span>
              <div style="flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; position: relative;">
                <div id="player-progress-bar" style="width: 0%; height: 100%; background: var(--accent-primary); transition: width 0.1s linear;"></div>
              </div>
              <span id="player-progress-end" class="text-xs text-muted">0:00</span>
            </div>
          </div>

        </div>

        <!-- Right panel: Interactive Tracklist -->
        <div class="spotify-tracklist-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: var(--space-6); display: flex; flex-direction: column; max-height: 480px;">
          <h3 style="margin-bottom: var(--space-4); display: flex; align-items: center; justify-content: space-between; font-size: 16px;">
            <span>🎵 Lista de Reprodução</span>
            <span id="track-count-badge" class="badge" style="background: rgba(99, 102, 241, 0.1); color: var(--accent-primary);">0 de 0</span>
          </h3>

          <div id="player-tracklist" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px;">
            <!-- Render track items -->
          </div>
        </div>

      </div>
    `;

    // Filter selector listener
    const filterEl = document.getElementById('playlist-video-filter');
    filterEl.addEventListener('change', (e) => {
      const videoId = e.target.value;
      if (videoId === 'all') {
        clipsList = [...allClips];
      } else {
        clipsList = allClips.filter(c => c.video_id === parseInt(videoId, 10));
      }
      activeIndex = 0;
      updateTracklist();
      loadActiveClip();
    });

    // Control listeners
    document.getElementById('player-play-toggle').addEventListener('click', togglePlay);
    document.getElementById('player-prev').addEventListener('click', prevTrack);
    document.getElementById('player-next').addEventListener('click', nextTrack);
    document.getElementById('player-toggle-loop').addEventListener('click', toggleLoopMode);
    document.getElementById('player-speak').addEventListener('click', speakCurrentText);

    // Speed listeners
    container.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        playSpeed = parseFloat(e.target.dataset.speed);
        setPlaybackRate(playSpeed);
      });
    });

    // Load initial state
    updateTracklist();
    loadActiveClip();

  } catch (err) {
    console.error('Error rendering playlist:', err);
    container.innerHTML = `<div class="empty-state"><h3>Erro ao inicializar o player</h3><p>${err.message}</p></div>`;
  }
}

function updateTracklist() {
  const tracklistEl = document.getElementById('player-tracklist');
  const countBadge = document.getElementById('track-count-badge');
  if (!tracklistEl) return;

  countBadge.textContent = `${activeIndex + 1} de ${clipsList.length}`;

  tracklistEl.innerHTML = clipsList.map((clip, i) => `
    <div class="playlist-track-item ${i === activeIndex ? 'active' : ''}" data-index="${i}" style="padding: 10px 12px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer; background: ${i === activeIndex ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${i === activeIndex ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.04)'}; hover:background: rgba(255,255,255,0.05); transition: all 0.2s ease;">
      <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left;">
        <span class="track-number" style="font-size: 11px; color: var(--text-muted); margin-right: 6px;">${i + 1}.</span>
        <strong style="font-size: 13px; color: ${i === activeIndex ? 'var(--accent-secondary)' : '#fff'}">${escapeHtml(clip.nome || 'Sem título')}</strong>
      </div>
      <span class="track-duration text-xs text-muted" style="white-space: nowrap;">📍 ${formatTime(clip.tempo_inicio)}</span>
    </div>
  `).join('');

  // Add click listener to track items
  tracklistEl.querySelectorAll('.playlist-track-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      activeIndex = idx;
      updateTracklist();
      loadActiveClip();
    });
  });
}

async function loadActiveClip() {
  const clip = clipsList[activeIndex];
  if (!clip) return;

  playerReady = false;
  document.getElementById('player-sentence').textContent = `"${clip.nome}"`;
  document.getElementById('player-progress-start').textContent = formatTime(clip.tempo_inicio);
  document.getElementById('player-progress-end').textContent = formatTime(clip.tempo_fim);
  document.getElementById('player-progress-bar').style.width = '0%';

  // Update track count badge
  const countBadge = document.getElementById('track-count-badge');
  if (countBadge) countBadge.textContent = `${activeIndex + 1} de ${clipsList.length}`;

  // Reset and fetch phonetics on the fly
  renderPhonetics(clip);

  // Initialize/Load YouTube video for this clip
  const videos = await getAll('videos');
  const matchingVideo = videos.find(v => v.id === clip.video_id);
  
  if (!matchingVideo) {
    showToast('Vídeo correspondente não encontrado!', 'error');
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
        if (event.data === 1) { // PLAYING
          updatePlayToggleButtonState(true);
        } else if (event.data === 2) { // PAUSED
          updatePlayToggleButtonState(false);
        }
      }
    });
  } catch (err) {
    console.error('Error in playlist player creation:', err);
    showToast('Falha ao sincronizar o player de áudio', 'error');
  }
}

async function renderPhonetics(clip) {
  const ipaEl = document.getElementById('player-phonetic-ipa');
  const brEl = document.getElementById('player-phonetic-br');
  if (!ipaEl || !brEl) return;

  const phrase = clip.nome;
  const storageKey = `phonetic_guide_${clip.id}`;
  const cached = localStorage.getItem(storageKey);

  if (cached) {
    try {
      const data = JSON.parse(cached);
      ipaEl.textContent = data.ipa || '';
      brEl.textContent = data.br || '';
      return;
    } catch (e) {}
  }

  // Set loading placeholder
  ipaEl.textContent = '...';
  brEl.textContent = '[Analisando pronúncia com IA...]';

  try {
    const prompt = `Analyze this English phrase: "${phrase}".
Provide TWO pronunciation guides for Brazilians learning English.
1. "ipa": The standard IPA (International Phonetic Alphabet) transcription inside slashes, e.g., /lɛt mi/.
2. "br": A highly simplified, phonetic "pronúncia facilitada" written in Portuguese rules to represent exactly how native speakers connect the sounds in conversational speed, using caps/accents for stress. E.g., [lét mi chóu iú].

Reply ONLY with a valid JSON object:
{
  "ipa": "/.../",
  "br": "[...]"
}`;

    const systemInstruction = `You are a native English voice coach specializing in teaching speech sounds and connected speech to Brazilian learners. Return only valid JSON.`;
    const response = await callGemini(prompt, systemInstruction, false);
    const result = JSON.parse(response.replace(/```json|```/gi, '').trim());

    if (result && result.ipa) {
      ipaEl.textContent = result.ipa;
      brEl.textContent = result.br || '';
      localStorage.setItem(storageKey, JSON.stringify(result));
    } else {
      throw new Error('Invalid output structure');
    }

  } catch (err) {
    console.warn('Failed to load phonetic guide for phrase:', phrase, err.message);
    ipaEl.textContent = '';
    brEl.textContent = '[Visualização de pronúncia indisponível]';
  }
}

function startPlaylistTimer() {
  stopPlaylistTimer();
  
  const clip = clipsList[activeIndex];
  if (!clip) return;

  const duration = clip.tempo_fim - clip.tempo_inicio;

  checkInterval = setInterval(() => {
    const player = getPlayer();
    if (!player || !playerReady) return;

    try {
      const current = player.getCurrentTime();
      
      // Update progress bar
      if (current >= clip.tempo_inicio) {
        const elapsed = current - clip.tempo_inicio;
        const pct = Math.min(100, Math.max(0, (elapsed / duration) * 100));
        document.getElementById('player-progress-bar').style.width = `${pct}%`;
        document.getElementById('player-progress-start').textContent = formatTime(Math.min(clip.tempo_fim, current));
      }

      // Handle loop vs auto-advance
      if (current >= clip.tempo_fim) {
        if (isSingleLoop) {
          seekTo(clip.tempo_inicio);
          play();
        } else {
          nextTrack();
        }
      }
    } catch (e) {
      console.warn('Playlist interval reading error:', e);
    }
  }, 150);
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
    if (state === 1) { // PLAYING
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
    btn.style.width = '64px';
    btn.style.height = '64px';
    btn.style.borderRadius = '50%';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justify = 'center';
    btn.style.padding = '0';
  }
}

function prevTrack() {
  if (clipsList.length === 0) return;
  activeIndex = (activeIndex - 1 + clipsList.length) % clipsList.length;
  updateTracklist();
  loadActiveClip();
}

function nextTrack() {
  if (clipsList.length === 0) return;
  activeIndex = (activeIndex + 1) % clipsList.length;
  updateTracklist();
  loadActiveClip();
}

function toggleLoopMode() {
  isSingleLoop = !isSingleLoop;
  const btn = document.getElementById('player-toggle-loop');
  if (btn) {
    btn.innerHTML = isSingleLoop ? '🔂 Loop Único' : '🔁 Tocar Playlist';
    btn.style.color = isSingleLoop ? 'var(--accent-secondary)' : '#34d399';
    showToast(isSingleLoop ? 'Modo de Loop Único Ativado!' : 'Modo Reprodução de Playlist Ativado!', 'info');
  }
}

function speakCurrentText() {
  const clip = clipsList[activeIndex];
  if (clip && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clip.nome);
    u.lang = 'en-US';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function cleanupPlaylist() {
  stopPlaylistTimer();
  destroyPlayer();
}
