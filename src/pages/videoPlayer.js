/**
 * videoPlayer.js — Single video page with clips, loop, AI segments, and vocabulary saving
 * This is the CORE page of the entire app.
 * 
 * Features:
 * - YouTube player with loop functionality
 * - Manual clip creation with start/end markers
 * - EDIT clip start/end times inline
 * - AI-powered video segment detection (identifies useful listening segments)
 * - AI i+1 vocabulary extraction from transcript
 * - Vocabulary saving with auto-review card creation
 */

import { getVideo, getClipsByVideo, addClip, deleteClip, updateClip, getVocabularioByVideo, addVocabulario, deleteVocabulario, addRevisao, updateVideo } from '../db.js';
import { formatTime, parseTime, parsePastedTranscript, showToast, escapeHtml } from '../utils.js';
import { createPlayer, destroyPlayer, play, pause, seekTo, getCurrentTime, startLoop, stopLoop, isLooping, setPlaybackRate, getPlaybackRate, getLoopConfig, setCaptionsLanguage } from '../youtube.js';
import { createReviewCard } from '../srs.js';
import { openTranscriptModal } from '../components/transcriptModal.js';

let currentVideoData = null;
let activeClipId = null;
let editingClipId = null;
let activeKeydownHandler = null;

export async function renderVideoPlayer(container, params) {
  const videoId = params.id;
  currentVideoData = await getVideo(videoId);

  if (!currentVideoData) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">😕</div>
        <h3>Vídeo não encontrado</h3>
        <a href="#/videos" class="btn btn-primary">Voltar aos vídeos</a>
      </div>
    `;
    return;
  }

  const clips = await getClipsByVideo(videoId);
  const vocab = await getVocabularioByVideo(videoId);

  container.innerHTML = `
    <a href="#/videos" class="back-link">← Voltar aos vídeos</a>

    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <h1 class="page-title" style="font-size: var(--font-xl); margin: 0;">${escapeHtml(currentVideoData.titulo)}</h1>
      <button class="btn btn-secondary btn-sm btn-trigger-transcript-modal" style="display: flex; align-items: center; gap: 6px;" title="Importar Transcrição do YouTube (Parse & Sync)">
        <span>📋</span> <strong>Parse & Sync Transcrição</strong>
      </button>
    </div>

    <!-- Player -->
    <div class="player-layout">
      <div class="player-wrapper">
        <div id="yt-player"></div>
      </div>

      <!-- Player Controls -->
      <div class="player-controls">
        <button id="play-btn" class="btn btn-secondary btn-sm" title="Play">▶️</button>
        <button id="pause-btn" class="btn btn-secondary btn-sm" title="Pause">⏸️</button>
        <span class="timestamp-display" id="current-time-display">0:00</span>
        <button id="mark-start-btn" class="btn btn-secondary btn-sm" title="Marcar início do trecho">🟢 Início</button>
        <button id="mark-end-btn" class="btn btn-secondary btn-sm" title="Marcar fim do trecho">🔴 Fim</button>
        <div id="loop-indicator" class="loop-indicator hidden">
          🔁 Loop ativo
          <button id="stop-loop-btn" class="btn btn-ghost btn-sm" style="padding: 2px 6px; font-size: 11px;">✕</button>
        </div>
        <div class="caption-controls" style="display: inline-flex; align-items: center; gap: 4px;" title="Legendas do Vídeo">
          <span style="font-size: 13px;">💬</span>
          <select id="caption-select" class="input" style="padding: 2px 6px; height: 30px; font-size: 12px; border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); cursor: pointer;" title="Idioma das Legendas">
            <option value="en" selected>🇬🇧 Legenda: Inglês</option>
            <option value="pt">🇧🇷 Legenda: Português</option>
            <option value="off">🚫 Sem Legenda</option>
          </select>
        </div>
        <div class="speed-controls">
          <button class="speed-btn" data-speed="0.5">0.5x</button>
          <button class="speed-btn" data-speed="0.75">0.75x</button>
          <button class="speed-btn active" data-speed="1">1x</button>
          <button class="speed-btn" data-speed="1.25">1.25x</button>
          <button class="speed-btn" data-speed="1.5">1.5x</button>
        </div>
      </div>

      <div class="player-shortcuts-hint text-xs text-muted" style="display:flex; gap: 10px; margin-top: 6px; padding: 4px 8px; flex-wrap: wrap; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm);">
        <span>⌨️ <strong>Atalhos:</strong></span>
        <span><kbd style="background:var(--bg-card); padding:2px 5px; border-radius:3px; border:1px solid var(--border-color);">[</kbd> Início</span>
        <span><kbd style="background:var(--bg-card); padding:2px 5px; border-radius:3px; border:1px solid var(--border-color);">]</kbd> Fim</span>
        <span><kbd style="background:var(--bg-card); padding:2px 5px; border-radius:3px; border:1px solid var(--border-color);">L</kbd> Loop</span>
        <span><kbd style="background:var(--bg-card); padding:2px 5px; border-radius:3px; border:1px solid var(--border-color);">Espaço</kbd> Pause</span>
        <span><kbd style="background:var(--bg-card); padding:2px 5px; border-radius:3px; border:1px solid var(--border-color);">←</kbd> <kbd style="background:var(--bg-card); padding:2px 5px; border-radius:3px; border:1px solid var(--border-color);">→</kbd> ±5s</span>
        <span>💬 <em>Dica: você também pode alternar pelo botão <strong>[CC]</strong> no rodapé do player</em></span>
      </div>
    </div>

    <!-- Tabs: Clips / Vocabulary / AI Segments / AI Cards -->
    <div class="tabs mt-6">
      <button class="tab-btn active" data-tab="clips">✂️ Trechos (${clips.length})</button>
      <button class="tab-btn" data-tab="vocab">📝 Vocabulário (${vocab.length})</button>
      <button class="tab-btn" data-tab="ai-segments" style="color: var(--accent-secondary); font-weight: 600;">🗣️ IA: Shadowing</button>
      <button class="tab-btn" data-tab="ai" style="color: var(--accent-primary); font-weight: 600;">🤖 IA: Cards 1+1</button>
    </div>

    <!-- Clips Tab -->
    <div id="tab-clips" class="tab-content">
      <!-- Add Clip Form -->
      <div class="clip-form" id="clip-form">
        <div class="input-group name-group">
          <label class="input-label" for="clip-name">Nome do trecho (opcional)</label>
          <input type="text" id="clip-name" class="input" placeholder="Ex: Explicação sobre phrasal verbs" />
        </div>
        <div class="input-group time-group">
          <label class="input-label" for="clip-start">Início</label>
          <input type="text" id="clip-start" class="input" placeholder="0:00" />
        </div>
        <div class="input-group time-group">
          <label class="input-label" for="clip-end">Fim</label>
          <input type="text" id="clip-end" class="input" placeholder="0:30" />
        </div>
        <button id="save-clip-btn" class="btn btn-primary" style="height: 44px;">Salvar trecho</button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); margin-top: var(--space-2);">
        <span class="text-xs text-muted">Marque pelo vídeo acima ou importe a legenda completa:</span>
        <button class="btn btn-secondary btn-sm btn-trigger-transcript-modal" style="display: flex; align-items: center; gap: 6px;">
          <span>📋</span> Parse & Sync Transcrição
        </button>
      </div>

      <!-- Clips List -->
      <div class="clip-list" id="clip-list">
        ${clips.length === 0 ? `
          <div class="text-center text-muted text-sm" style="padding: var(--space-6);">
            Nenhum trecho criado ainda. Use os botões "Início" e "Fim" acima para marcar um trecho do vídeo.
          </div>
        ` : clips.map(clip => renderClipItem(clip)).join('')}
      </div>
    </div>

    <!-- Vocabulary Tab -->
    <div id="tab-vocab" class="tab-content hidden">
      <!-- Add Vocab Form -->
      <div class="vocab-form" id="vocab-form">
        <div class="section-title" style="margin-bottom: var(--space-4);">💡 Salvar palavra ou expressão</div>
        <div class="input-group">
          <label class="input-label" for="vocab-word">Palavra / Expressão em inglês</label>
          <input type="text" id="vocab-word" class="input" placeholder="Ex: take off, nevertheless, figure out..." />
        </div>
        <div class="input-group">
          <label class="input-label" for="vocab-context">Frase de contexto (onde ela apareceu)</label>
          <textarea id="vocab-context" class="input" placeholder="Ex: You need to figure out what works best for you."></textarea>
        </div>
        <div class="input-group">
          <label class="input-label" for="vocab-meaning">Tradução / Significado</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="vocab-meaning" class="input" placeholder="Ex: descobrir, resolver, entender" style="flex: 1;" />
            <button type="button" id="btn-ai-translate" class="btn btn-secondary" style="padding: 0 12px; height: 44px; white-space: nowrap;" title="Gerar tradução com IA">✨ Traduzir</button>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button id="save-vocab-btn" class="btn btn-primary">Salvar palavra</button>
          <span class="text-sm text-muted" id="vocab-timestamp-info">
            📍 Timestamp atual: <span id="vocab-current-ts">0:00</span>
          </span>
        </div>
      </div>

      <!-- Vocab List -->
      <div class="vocab-list mt-4" id="vocab-list">
        ${vocab.length === 0 ? `
          <div class="text-center text-muted text-sm" style="padding: var(--space-6);">
            Nenhuma palavra salva deste vídeo. Pause em um trecho interessante e salve a palavra com a frase de contexto.
          </div>
        ` : vocab.map(v => renderVocabItem(v)).join('')}
      </div>
    </div>

    <!-- AI Segments Tab -->
    <div id="tab-ai-segments" class="tab-content hidden">
      <div class="ai-study-container" style="padding: var(--space-6); background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <div class="flex items-center gap-3 mb-4">
          <span style="font-size: 2rem;">🗣️</span>
          <div>
            <h3 style="margin: 0;">Trechos Curtos para Shadowing (3 a 10s)</h3>
            <p class="text-muted text-sm" style="margin: var(--space-1) 0 0;">Frases ideais para ouvir em loop contínuo e repetir em voz alta, imitando o ritmo e entonação nativa.</p>
          </div>
        </div>

        <div id="transcript-saved-status" class="mb-3 hidden">
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; font-size: 12px;">
            ✅ Legenda oficial salva neste vídeo (<span id="transcript-lines-count">0</span> falas sincronizadas)
          </span>
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;" class="mb-3">
          <div style="display: flex; align-items: center; gap: 6px;">
            <label for="segments-count-select" class="text-xs text-muted" style="font-weight: 500;">Qtd:</label>
            <select id="segments-count-select" class="input" style="padding: 4px 8px; height: 38px; font-size: 13px; width: 120px; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
              <option value="5">5 trechos</option>
              <option value="8" selected>8 trechos</option>
              <option value="12">12 trechos</option>
              <option value="16">16 trechos</option>
              <option value="20">20 trechos</option>
            </select>
          </div>

          <button id="btn-detect-segments" class="btn btn-primary" style="height: 38px;">
            🗣️ Detectar trechos com IA
          </button>

          <button id="btn-toggle-paste-transcript" class="btn btn-secondary" style="height: 38px;" title="Colar a transcrição oficial do YouTube para ter sincronia 100% perfeita">
            📋 Colar Legenda do YouTube
          </button>
        </div>

        <!-- Box para colar legenda do YouTube -->
        <div id="paste-transcript-box" class="hidden mt-3" style="background: var(--bg-card); padding: var(--space-4); border-radius: var(--radius-md); border: 1px dashed var(--accent-secondary);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 13px; color: var(--text-primary);">📋 Colar Transcrição do YouTube (Sincronia 100% Exata)</strong>
            <button id="btn-close-paste-box" class="btn btn-ghost btn-sm" style="padding: 2px 8px;">✕</button>
          </div>
          <p class="text-xs text-muted mb-2" style="line-height: 1.4;">
            1. No YouTube, clique em <strong>...</strong> abaixo do vídeo e escolha <strong>"Mostrar transcrição"</strong>.<br>
            2. Selecione e copie o texto e cole abaixo (com ou sem os tempos <em>0:01, 0:04...</em>).<br>
            3. A IA fatiará os loops nos <strong>segundos 100% exatos</strong> da fala!
          </p>
          <textarea id="pasted-transcript-input" class="input" rows="4" placeholder="Cole aqui a transcrição copiada do YouTube...&#10;0:01 Actually, I have a hole in my head&#10;0:04 Wait a minute, let me see&#10;0:08 You can feel it right here..." style="font-family: monospace; font-size: 12px; width: 100%; margin-bottom: 10px;"></textarea>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button id="btn-cancel-paste-transcript" class="btn btn-ghost btn-sm">Cancelar</button>
            <button id="btn-process-pasted-transcript" class="btn btn-primary btn-sm">🚀 Fatiar com Timestamps Exatos</button>
          </div>
        </div>
        
        <div id="segments-loading" class="hidden mt-4 text-sm" style="color: var(--accent-secondary);">
          ⏳ A IA está analisando a fala e separando os trechos ideais... (3-7s)
        </div>
      </div>
      
      <div id="ai-segments-list" class="clip-list mt-4 hidden"></div>
    </div>

    <!-- AI Study Tab (Cards 1+1) -->
    <div id="tab-ai" class="tab-content hidden">
      <div class="ai-study-container text-center" style="padding: var(--space-6); background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <div style="font-size: 3rem; margin-bottom: var(--space-2);">🤖</div>
        <h3 style="margin-bottom: var(--space-2);">Estudo Mágico 1+1</h3>
        <p class="text-muted text-sm" style="margin-bottom: var(--space-6);">A IA vai ler a transcrição deste vídeo, extrair as melhores expressões, e gerar cards no nível 1+1 (definições fáceis e novos exemplos).</p>
        
        <button id="btn-generate-ai-study" class="btn btn-primary btn-lg" style="width: 100%; max-width: 300px; margin: 0 auto;">
          ✨ Extrair e Gerar com IA
        </button>
        
        <div id="ai-loading-indicator" class="hidden mt-4 text-sm" style="color: var(--accent-primary);">
          ⏳ A IA está assistindo o vídeo e separando o material... (pode levar 10-15s)
        </div>
      </div>
      
      <div id="ai-results-container" class="mt-4 hidden">
        <h4 style="margin-bottom: var(--space-4);">Vocabulário Extraído:</h4>
        <div id="ai-results-list" class="vocab-list"></div>
      </div>
    </div>
  `;

  // Initialize YouTube player
  await initPlayer(currentVideoData.youtube_video_id);

  // Setup all event listeners
  setupVideoPlayerListeners(container, videoId);
}

async function initPlayer(ytVideoId) {
  try {
    await createPlayer('yt-player', ytVideoId, {
      onReady: () => {
        updateTimeDisplay();
      },
      onStateChange: (event) => {
        // Update time display periodically when playing
        if (event.data === 1) { // PLAYING
          startTimeUpdater();
        }
      }
    });
  } catch (err) {
    console.error('Error creating player:', err);
    showToast('Erro ao carregar o player', 'error');
  }
}

let timeUpdater = null;

function startTimeUpdater() {
  stopTimeUpdater();
  timeUpdater = setInterval(updateTimeDisplay, 250);
}

function stopTimeUpdater() {
  if (timeUpdater) {
    clearInterval(timeUpdater);
    timeUpdater = null;
  }
}

function updateTimeDisplay() {
  const time = getCurrentTime();
  const display = document.getElementById('current-time-display');
  if (display) display.textContent = formatTime(time);

  const vocabTs = document.getElementById('vocab-current-ts');
  if (vocabTs) vocabTs.textContent = formatTime(time);
}

function renderClipItem(clip) {
  const isActive = clip.id === activeClipId;
  const isEditing = clip.id === editingClipId;

  if (isEditing) {
    return `
      <div class="clip-item editing-clip" data-clip-id="${clip.id}">
        <div class="clip-edit-form" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; width: 100%;">
          <input type="text" class="input edit-clip-name" value="${escapeHtml(clip.nome || '')}" placeholder="Nome..." style="flex: 2; min-width: 120px; padding: 6px 10px; font-size: 13px;" />
          <input type="text" class="input edit-clip-start" value="${formatTime(clip.tempo_inicio)}" placeholder="Início" style="width: 70px; padding: 6px 10px; font-size: 13px; text-align: center;" />
          <span style="color: var(--text-muted);">→</span>
          <input type="text" class="input edit-clip-end" value="${formatTime(clip.tempo_fim)}" placeholder="Fim" style="width: 70px; padding: 6px 10px; font-size: 13px; text-align: center;" />
          <button class="btn btn-primary btn-sm save-edit-clip-btn" data-clip-id="${clip.id}" title="Salvar">✅</button>
          <button class="btn btn-ghost btn-sm cancel-edit-clip-btn" data-clip-id="${clip.id}" title="Cancelar">❌</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="clip-item ${isActive ? 'active-clip' : ''}" data-clip-id="${clip.id}">
      <span class="clip-name">${escapeHtml(clip.nome || 'Trecho sem nome')}</span>
      <span class="clip-time">${formatTime(clip.tempo_inicio)} → ${formatTime(clip.tempo_fim)}</span>
      <div class="clip-actions">
        <button class="btn btn-secondary btn-sm loop-clip-btn" data-clip-id="${clip.id}" data-start="${clip.tempo_inicio}" data-end="${clip.tempo_fim}" title="Loop">🔁</button>
        <button class="btn btn-ghost btn-sm play-clip-btn" data-start="${clip.tempo_inicio}" title="Ir para">▶️</button>
        <button class="btn btn-ghost btn-sm edit-clip-btn" data-clip-id="${clip.id}" title="Editar tempos">✏️</button>
        <button class="btn btn-ghost btn-sm delete-clip-btn" data-clip-id="${clip.id}" title="Remover">🗑️</button>
      </div>
    </div>
  `;
}

function renderVocabItem(vocab) {
  return `
    <div class="vocab-item" data-vocab-id="${vocab.id}">
      <div class="flex justify-between items-center">
        <div class="vocab-word">
          ${escapeHtml(vocab.palavra_ou_expressao)}
          <button class="btn btn-ghost btn-sm speak-vocab-btn" data-word="${escapeHtml(vocab.palavra_ou_expressao)}" title="Ouvir pronúncia" style="padding: 2px 6px; font-size: 14px;">🔊</button>
        </div>
        <div class="flex gap-2">
          ${vocab.timestamp ? `
            <button class="btn btn-ghost btn-sm go-to-ts-btn" data-timestamp="${vocab.timestamp}" title="Ir para o momento no vídeo">📍 ${formatTime(vocab.timestamp)}</button>
          ` : ''}
          <button class="btn btn-ghost btn-sm delete-vocab-btn" data-vocab-id="${vocab.id}" title="Remover">🗑️</button>
        </div>
      </div>
      ${vocab.frase_contexto ? `<div class="vocab-context">"${escapeHtml(vocab.frase_contexto)}"</div>` : ''}
      ${vocab.traducao_significado ? `<div class="vocab-translation">→ ${escapeHtml(vocab.traducao_significado)}</div>` : ''}
    </div>
  `;
}

function renderAISegmentItem(segment, index) {
  const syncBadge = segment.is_exact 
    ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; padding: 2px 6px; border: 1px solid rgba(16, 185, 129, 0.3);" title="Extraído diretamente da legenda oficial do YouTube com timestamps exatos">🎯 Sincronizado</span>`
    : `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; font-size: 11px; padding: 2px 6px; border: 1px solid rgba(245, 158, 11, 0.3);" title="Timestamps estimados por IA">✨ Sugerido por IA</span>`;

  return `
    <div class="clip-item ai-segment-item" data-segment-index="${index}">
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="clip-name" style="color: var(--accent-secondary); font-weight: 600;">🎧 ${escapeHtml(segment.title)}</span>
          ${syncBadge}
        </div>
        <div class="text-sm text-muted mt-1">${escapeHtml(segment.reason)}</div>
        <div class="clip-time mt-1">${formatTime(segment.start_seconds)} → ${formatTime(segment.end_seconds)}</div>
      </div>
      <div class="clip-actions">
        <button class="btn btn-secondary btn-sm loop-ai-segment-btn" data-start="${segment.start_seconds}" data-end="${segment.end_seconds}" title="Loop">🔁 Loop</button>
        <button class="btn btn-ghost btn-sm play-ai-segment-btn" data-start="${segment.start_seconds}" title="Ir para">▶️</button>
        <button class="btn btn-primary btn-sm save-ai-segment-btn" data-index="${index}" title="Salvar como trecho">💾 Salvar</button>
      </div>
    </div>
  `;
}

function setupVideoPlayerListeners(container, videoId) {
  // Play / Pause
  container.querySelector('#play-btn').addEventListener('click', () => play());
  container.querySelector('#pause-btn').addEventListener('click', () => {
    pause();
    stopTimeUpdater();
    updateTimeDisplay();
  });

  // Mark start / end
  container.querySelector('#mark-start-btn').addEventListener('click', () => {
    const time = getCurrentTime();
    document.getElementById('clip-start').value = formatTime(time);
    showToast(`Início marcado: ${formatTime(time)}`, 'info');
  });

  container.querySelector('#mark-end-btn').addEventListener('click', () => {
    const time = getCurrentTime();
    document.getElementById('clip-end').value = formatTime(time);
    showToast(`Fim marcado: ${formatTime(time)}`, 'info');
  });

  // Stop loop
  container.querySelector('#stop-loop-btn').addEventListener('click', () => {
    stopLoop();
    activeClipId = null;
    document.getElementById('loop-indicator').classList.add('hidden');
    refreshClipList(videoId);
    showToast('Loop parado', 'info');
  });

  // Speed controls
  container.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.dataset.speed);
      setPlaybackRate(speed);
      container.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Caption language change
  const captionSelect = container.querySelector('#caption-select');
  if (captionSelect) {
    captionSelect.addEventListener('change', (e) => {
      const lang = e.target.value;
      setCaptionsLanguage(lang);
      if (lang === 'off') {
        showToast('Legendas desativadas', 'info');
      } else {
        const labels = { en: 'Inglês', pt: 'Português', es: 'Espanhol' };
        showToast(`Legenda: ${labels[lang] || lang}`, 'success');
      }
    });
  }

  // Save clip
  container.querySelector('#save-clip-btn').addEventListener('click', async () => {
    const nome = document.getElementById('clip-name').value.trim();
    const startStr = document.getElementById('clip-start').value.trim();
    const endStr = document.getElementById('clip-end').value.trim();

    const tempoInicio = parseTime(startStr);
    const tempoFim = parseTime(endStr);

    if (tempoFim <= tempoInicio) {
      showToast('O tempo final deve ser maior que o inicial!', 'error');
      return;
    }

    try {
      await addClip({
        video_id: videoId,
        nome: nome || null,
        tempo_inicio: tempoInicio,
        tempo_fim: tempoFim
      });

      showToast('Trecho salvo! 🎬', 'success');
      document.getElementById('clip-name').value = '';
      document.getElementById('clip-start').value = '';
      document.getElementById('clip-end').value = '';

      refreshClipList(videoId);
      refreshTabCounts(videoId);
    } catch (err) {
      showToast('Erro ao salvar trecho', 'error');
    }
  });

  // AI Translation button
  const aiTranslateBtn = container.querySelector('#btn-ai-translate');
  if (aiTranslateBtn) {
    aiTranslateBtn.addEventListener('click', async () => {
      const word = document.getElementById('vocab-word').value.trim();
      const context = document.getElementById('vocab-context').value.trim();
      
      if (!word) {
        showToast('Digite a palavra ou expressão em inglês primeiro!', 'info');
        return;
      }
      
      aiTranslateBtn.disabled = true;
      aiTranslateBtn.textContent = '⏳';
      
      try {
        const { generateTranslation } = await import('../ai.js');
        const translation = await generateTranslation(word, context);
        document.getElementById('vocab-meaning').value = translation;
        showToast('Tradução gerada com sucesso!', 'success');
      } catch (err) {
        if (err.message === 'API_KEY_MISSING') {
          showToast('Configure a chave da API (Google Gemini) nas Configurações!', 'error');
        } else {
          showToast('Erro ao gerar tradução', 'error');
        }
      } finally {
        aiTranslateBtn.disabled = false;
        aiTranslateBtn.textContent = '✨ Traduzir';
      }
    });
  }

  // Save vocabulary
  container.querySelector('#save-vocab-btn').addEventListener('click', async () => {
    const word = document.getElementById('vocab-word').value.trim();
    const context = document.getElementById('vocab-context').value.trim();
    const meaning = document.getElementById('vocab-meaning').value.trim();

    if (!word) {
      showToast('Digite a palavra ou expressão', 'error');
      return;
    }

    const timestamp = getCurrentTime();

    try {
      const vocabId = await addVocabulario({
        video_id: videoId,
        clip_id: activeClipId || null,
        timestamp: timestamp,
        palavra_ou_expressao: word,
        frase_contexto: context || null,
        traducao_significado: meaning || null,
        data_criacao: new Date().toISOString()
      });

      // Auto-create review card
      const reviewCard = createReviewCard(vocabId);
      await addRevisao(reviewCard);

      showToast('Palavra salva + card de revisão criado! 📝', 'success');
      document.getElementById('vocab-word').value = '';
      document.getElementById('vocab-context').value = '';
      document.getElementById('vocab-meaning').value = '';

      refreshVocabList(videoId);
      refreshTabCounts(videoId);
    } catch (err) {
      console.error('Error saving vocab:', err);
      showToast('Erro ao salvar palavra', 'error');
    }
  });

  // Tab switching
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const tab = btn.dataset.tab;
      document.getElementById('tab-clips').classList.toggle('hidden', tab !== 'clips');
      document.getElementById('tab-vocab').classList.toggle('hidden', tab !== 'vocab');
      document.getElementById('tab-ai-segments').classList.toggle('hidden', tab !== 'ai-segments');
      document.getElementById('tab-ai').classList.toggle('hidden', tab !== 'ai');
    });
  });

  // AI Detect Segments Button
  const btnDetectSegments = container.querySelector('#btn-detect-segments');
  if (btnDetectSegments) {
    btnDetectSegments.addEventListener('click', async () => {
      btnDetectSegments.disabled = true;
      document.getElementById('segments-loading').classList.remove('hidden');
      document.getElementById('ai-segments-list').classList.add('hidden');
      
      try {
        const countSelect = document.getElementById('segments-count-select');
        const count = countSelect ? parseInt(countSelect.value, 10) : 8;

        const { detectUsefulSegments } = await import('../ai.js');
        const segments = await detectUsefulSegments(currentVideoData.youtube_video_id, currentVideoData.titulo, null, count);
        
        currentVideoData.has_transcript = true;
        try { await updateVideo(currentVideoData); } catch (e) {}
        
        const segmentsList = document.getElementById('ai-segments-list');
        
        if (!segments || segments.length === 0) {
          segmentsList.innerHTML = `<div class="text-center text-muted text-sm" style="padding: var(--space-6);">
            Nenhum trecho gerado. Tente novamente em instantes.
          </div>`;
        } else {
          segmentsList.innerHTML = segments.map((seg, i) => renderAISegmentItem(seg, i)).join('');
          
          // Store segments for reference
          segmentsList._segments = segments;
        }
        
        segmentsList.classList.remove('hidden');
        showToast(`${segments.length} trechos prontos para Shadowing! 🎧`, 'success');
        
      } catch (err) {
        console.error('Shadowing detection error:', err);
        handleAIError(err);
      } finally {
        btnDetectSegments.disabled = false;
        document.getElementById('segments-loading').classList.add('hidden');
      }
    });
  }

  // Update transcript saved status UI
  const updateTranscriptStatusUI = async () => {
    try {
      const { loadVideoTranscript } = await import('../ai.js');
      const saved = loadVideoTranscript(currentVideoData.youtube_video_id);
      const statusDiv = document.getElementById('transcript-saved-status');
      const countSpan = document.getElementById('transcript-lines-count');
      if (statusDiv && countSpan) {
        if (saved && saved.length > 0) {
          countSpan.textContent = saved.length;
          statusDiv.classList.remove('hidden');
        } else {
          statusDiv.classList.add('hidden');
        }
      }
    } catch (e) {}
  };
  updateTranscriptStatusUI();

  // Modal Component for Parse & Sync Transcripts
  const handleOpenTranscriptModal = () => {
    openTranscriptModal({
      videoId,
      youtubeVideoId: currentVideoData.youtube_video_id,
      videoTitle: currentVideoData.titulo,
      onClipsCreated: async (items) => {
        currentVideoData.has_transcript = true;
        try { await updateVideo(currentVideoData); } catch (e) {}

        await refreshClipList(videoId);
        await refreshTabCounts(videoId);
        updateTranscriptStatusUI();

        // Populate Shadowing list with exact items
        const segmentsList = document.getElementById('ai-segments-list');
        if (segmentsList && Array.isArray(items)) {
          const segments = items.map((item) => ({
            title: item.text,
            reason: 'Trecho sincronizado via transcrição oficial do YouTube.',
            start_seconds: item.start,
            end_seconds: item.start + item.duration,
            is_exact: true
          }));
          segmentsList.innerHTML = segments.map((seg, i) => renderAISegmentItem(seg, i)).join('');
          segmentsList._segments = segments;
          segmentsList.classList.remove('hidden');
        }
      }
    });
  };

  container.querySelectorAll('.btn-trigger-transcript-modal').forEach(btn => {
    btn.addEventListener('click', handleOpenTranscriptModal);
  });

  // Paste Transcript Box Actions
  const btnTogglePaste = container.querySelector('#btn-toggle-paste-transcript');
  const pasteBox = container.querySelector('#paste-transcript-box');
  const btnClosePaste = container.querySelector('#btn-close-paste-box');
  const btnCancelPaste = container.querySelector('#btn-cancel-paste-transcript');
  const btnProcessPaste = container.querySelector('#btn-process-pasted-transcript');
  const pastedInput = container.querySelector('#pasted-transcript-input');

  if (btnTogglePaste && pasteBox) {
    btnTogglePaste.addEventListener('click', () => {
      pasteBox.classList.toggle('hidden');
      if (!pasteBox.classList.contains('hidden') && pastedInput) {
        pastedInput.focus();
      }
    });
  }
  if (btnClosePaste && pasteBox) {
    btnClosePaste.addEventListener('click', () => pasteBox.classList.add('hidden'));
  }
  if (btnCancelPaste && pasteBox) {
    btnCancelPaste.addEventListener('click', () => pasteBox.classList.add('hidden'));
  }

  if (btnProcessPaste && pastedInput) {
    btnProcessPaste.addEventListener('click', async () => {
      const rawText = pastedInput.value.trim();
      if (!rawText) {
        showToast('Cole o texto da transcrição na caixa antes de continuar!', 'info');
        return;
      }

      btnProcessPaste.disabled = true;
      btnProcessPaste.textContent = '⏳ Fatiando falas...';
      document.getElementById('segments-loading').classList.remove('hidden');
      document.getElementById('ai-segments-list').classList.add('hidden');

      try {
        const parsed = parsePastedTranscript(rawText);
        const { saveVideoTranscript, detectUsefulSegments } = await import('../ai.js');
        if (parsed && parsed.length > 0) {
          saveVideoTranscript(currentVideoData.youtube_video_id, parsed);
          updateTranscriptStatusUI();
        }
        pasteBox.classList.add('hidden');

        const countSelect = document.getElementById('segments-count-select');
        const count = countSelect ? parseInt(countSelect.value, 10) : 8;

        const segments = await detectUsefulSegments(currentVideoData.youtube_video_id, currentVideoData.titulo, parsed, count);

        currentVideoData.has_transcript = true;
        try { await updateVideo(currentVideoData); } catch (e) {}

        const segmentsList = document.getElementById('ai-segments-list');
        if (!segments || segments.length === 0) {
          segmentsList.innerHTML = `<div class="text-center text-muted text-sm" style="padding: var(--space-6);">Nenhum trecho gerado. Tente novamente.</div>`;
        } else {
          segmentsList.innerHTML = segments.map((seg, i) => renderAISegmentItem(seg, i)).join('');
          segmentsList._segments = segments;
        }

        segmentsList.classList.remove('hidden');
        showToast(`🎉 ${segments.length} trechos fatiados com sincronia 100% exata da legenda!`, 'success');
      } catch (err) {
        console.error('Error processing pasted transcript:', err);
        handleAIError(err);
      } finally {
        btnProcessPaste.disabled = false;
        btnProcessPaste.textContent = '🚀 Fatiar com Timestamps Exatos';
        document.getElementById('segments-loading').classList.add('hidden');
      }
    });
  }

  // AI Generate Study Button (Cards 1+1)
  const btnGenerateAi = container.querySelector('#btn-generate-ai-study');
  if (btnGenerateAi) {
    btnGenerateAi.addEventListener('click', async () => {
      btnGenerateAi.disabled = true;
      document.getElementById('ai-loading-indicator').classList.remove('hidden');
      document.getElementById('ai-results-container').classList.add('hidden');
      
      try {
        const { extractVocabFromTranscript, generateIPlusOneAnalysis, fetchTranscriptText } = await import('../ai.js');
        
        // Try to get a real transcript or use video title
        let transcript = '';
        try {
          transcript = await fetchTranscriptText(currentVideoData.youtube_video_id);
        } catch (e) {
          transcript = '';
        }
        
        const extracted = await extractVocabFromTranscript(transcript, currentVideoData.titulo);
        
        const resultsList = document.getElementById('ai-results-list');
        resultsList.innerHTML = ''; // clear
        
        // Para cada palavra extraída, geramos o card 1+1 e já salvamos
        for (const item of extracted) {
           const analysis = await generateIPlusOneAnalysis(item.word_or_expression, item.original_context);
           
           // Criar o HTML para mostrar o resultado
           const itemHtml = document.createElement('div');
           itemHtml.className = 'vocab-item';
           itemHtml.innerHTML = `
             <div class="vocab-word">✨ ${escapeHtml(item.word_or_expression)} <span class="text-xs" style="color: var(--accent-secondary);">(${escapeHtml(analysis.type || 'chunk')})</span></div>
             <div class="vocab-context mt-2"><strong>🎬 Do vídeo:</strong> "${escapeHtml(item.original_context)}"</div>
             <div class="vocab-context mt-1"><strong>📖 Significado (i+1):</strong> ${escapeHtml(analysis.definition_en || '')}</div>
             <div class="vocab-context mt-1"><strong>🧠 Exemplo (i+1):</strong> "${escapeHtml(analysis.i_plus_one_example || '')}"</div>
             <div class="vocab-context mt-1 text-xs">⚠️ <strong>Dica Br:</strong> ${escapeHtml(analysis.brazilian_trap || '')}</div>
             <button class="btn btn-secondary btn-sm mt-3 w-100 btn-save-ai-item">✅ Salvar no meu Deck</button>
           `;
           
           // Lógica para o botão "Salvar no Deck"
           const saveBtn = itemHtml.querySelector('.btn-save-ai-item');
           saveBtn.addEventListener('click', async () => {
             saveBtn.disabled = true;
             saveBtn.textContent = '⏳ Salvando...';
             
             // Salvar no BD
             const vocabId = await addVocabulario({
                video_id: videoId,
                clip_id: null,
                timestamp: 0,
                palavra_ou_expressao: item.word_or_expression,
                frase_contexto: analysis.i_plus_one_example,
                traducao_significado: analysis.definition_en,
                data_criacao: new Date().toISOString()
              });

              // Criar card de revisão
              const reviewCard = createReviewCard(vocabId);
              await addRevisao(reviewCard);
              
              saveBtn.textContent = 'Salvo! 🎉';
              refreshVocabList(videoId);
              refreshTabCounts(videoId);
              showToast('Expressão salva no seu deck 1+1!', 'success');
           });
           
           resultsList.appendChild(itemHtml);
        }
        
        document.getElementById('ai-results-container').classList.remove('hidden');
        showToast('Análise de IA concluída!', 'success');
        
      } catch (err) {
        console.error('AI Study generation error:', err);
        handleAIError(err);
      } finally {
        btnGenerateAi.disabled = false;
        document.getElementById('ai-loading-indicator').classList.add('hidden');
      }
    });
  }

  // Delegated click handlers for clip list, vocab list, and AI segments
  container.addEventListener('click', async (e) => {
    // Loop clip
    const loopBtn = e.target.closest('.loop-clip-btn');
    if (loopBtn) {
      const clipId = loopBtn.dataset.clipId;
      const start = parseFloat(loopBtn.dataset.start);
      const end = parseFloat(loopBtn.dataset.end);
      activeClipId = clipId;
      startLoop(start, end);
      document.getElementById('loop-indicator').classList.remove('hidden');
      refreshClipList(videoId);
      startTimeUpdater();
      showToast(`Loop: ${formatTime(start)} → ${formatTime(end)}`, 'info');
      return;
    }

    // Play from timestamp (clip)
    const playBtn = e.target.closest('.play-clip-btn');
    if (playBtn) {
      seekTo(parseFloat(playBtn.dataset.start));
      play();
      startTimeUpdater();
      return;
    }

    // Edit clip button
    const editBtn = e.target.closest('.edit-clip-btn');
    if (editBtn) {
      editingClipId = editBtn.dataset.clipId;
      refreshClipList(videoId);
      return;
    }

    // Save edited clip
    const saveEditBtn = e.target.closest('.save-edit-clip-btn');
    if (saveEditBtn) {
      const clipId = saveEditBtn.dataset.clipId;
      const clipItem = saveEditBtn.closest('.clip-item');
      const newName = clipItem.querySelector('.edit-clip-name').value.trim();
      const newStartStr = clipItem.querySelector('.edit-clip-start').value.trim();
      const newEndStr = clipItem.querySelector('.edit-clip-end').value.trim();
      
      const newStart = parseTime(newStartStr);
      const newEnd = parseTime(newEndStr);
      
      if (newEnd <= newStart) {
        showToast('O tempo final deve ser maior que o inicial!', 'error');
        return;
      }
      
      try {
        const existingClip = await import('../db.js').then(db => db.getClip(clipId));
        await updateClip({
          ...existingClip,
          id: clipId,
          nome: newName || null,
          tempo_inicio: newStart,
          tempo_fim: newEnd
        });
        editingClipId = null;
        refreshClipList(videoId);
        showToast('Trecho atualizado! ✅', 'success');
      } catch (err) {
        console.error('Error updating clip:', err);
        showToast('Erro ao atualizar trecho', 'error');
      }
      return;
    }

    // Cancel edit
    const cancelEditBtn = e.target.closest('.cancel-edit-clip-btn');
    if (cancelEditBtn) {
      editingClipId = null;
      refreshClipList(videoId);
      return;
    }

    // Delete clip
    const deleteClipBtn = e.target.closest('.delete-clip-btn');
    if (deleteClipBtn) {
      const clipId = deleteClipBtn.dataset.clipId;
      if (confirm('Remover este trecho?')) {
        await deleteClip(clipId);
        if (activeClipId === clipId) {
          stopLoop();
          activeClipId = null;
          document.getElementById('loop-indicator').classList.add('hidden');
        }
        refreshClipList(videoId);
        refreshTabCounts(videoId);
        showToast('Trecho removido', 'info');
      }
      return;
    }

    // Go to timestamp (vocab)
    const goBtn = e.target.closest('.go-to-ts-btn');
    if (goBtn) {
      seekTo(parseFloat(goBtn.dataset.timestamp));
      play();
      startTimeUpdater();
      return;
    }

    // Delete vocab
    const deleteVocabBtn = e.target.closest('.delete-vocab-btn');
    if (deleteVocabBtn) {
      const vocabId = deleteVocabBtn.dataset.vocabId;
      if (confirm('Remover esta palavra? O card de revisão também será removido.')) {
        await deleteVocabulario(vocabId);
        refreshVocabList(videoId);
        refreshTabCounts(videoId);
        showToast('Palavra removida', 'info');
      }
      return;
    }

    // AI Segment: Loop
    const loopSegBtn = e.target.closest('.loop-ai-segment-btn');
    if (loopSegBtn) {
      const start = parseFloat(loopSegBtn.dataset.start);
      const end = parseFloat(loopSegBtn.dataset.end);
      startLoop(start, end);
      document.getElementById('loop-indicator').classList.remove('hidden');
      startTimeUpdater();
      showToast(`Loop: ${formatTime(start)} → ${formatTime(end)}`, 'info');
      return;
    }

    // AI Segment: Play
    const playSegBtn = e.target.closest('.play-ai-segment-btn');
    if (playSegBtn) {
      seekTo(parseFloat(playSegBtn.dataset.start));
      play();
      startTimeUpdater();
      return;
    }

    // AI Segment: Save as clip
    const saveSegBtn = e.target.closest('.save-ai-segment-btn');
    if (saveSegBtn) {
      const index = parseInt(saveSegBtn.dataset.index);
      const segmentsList = document.getElementById('ai-segments-list');
      const segments = segmentsList._segments;
      
      if (segments && segments[index]) {
        const seg = segments[index];
        try {
          await addClip({
            video_id: videoId,
            nome: seg.title,
            tempo_inicio: seg.start_seconds,
            tempo_fim: seg.end_seconds
          });
          saveSegBtn.textContent = 'Salvo! ✅';
          saveSegBtn.disabled = true;
          refreshClipList(videoId);
          refreshTabCounts(videoId);
          showToast(`Trecho "${seg.title}" salvo! 🎬`, 'success');
        } catch (err) {
          showToast('Erro ao salvar trecho', 'error');
        }
      }
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
  });

  // Global keyboard shortcuts for video controls
  if (activeKeydownHandler) {
    document.removeEventListener('keydown', activeKeydownHandler);
  }

  activeKeydownHandler = (e) => {
    // If typing in input or textarea, do not trigger player shortcuts
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) {
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      const playBtn = document.getElementById('play-btn');
      const pauseBtn = document.getElementById('pause-btn');
      if (isLooping()) {
        stopLoop();
        pause();
      } else {
        // Toggle play/pause
        try {
          play();
        } catch (err) {}
      }
    } else if (e.key === '[' || e.key === 'i' || e.key === 'I') {
      e.preventDefault();
      const markStartBtn = document.getElementById('mark-start-btn');
      if (markStartBtn) markStartBtn.click();
    } else if (e.key === ']' || e.key === 'o' || e.key === 'O') {
      e.preventDefault();
      const markEndBtn = document.getElementById('mark-end-btn');
      if (markEndBtn) markEndBtn.click();
    } else if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      const loopIndicator = document.getElementById('loop-indicator');
      const stopLoopBtn = document.getElementById('stop-loop-btn');
      if (loopIndicator && !loopIndicator.classList.contains('hidden') && stopLoopBtn) {
        stopLoopBtn.click();
      } else {
        const startVal = parseTime(document.getElementById('clip-start')?.value);
        const endVal = parseTime(document.getElementById('clip-end')?.value);
        if (endVal > startVal) {
          startLoop(startVal, endVal);
          loopIndicator?.classList.remove('hidden');
          showToast(`Loop: ${formatTime(startVal)} → ${formatTime(endVal)}`, 'info');
        } else {
          showToast('Defina início e fim para ativar o loop [ e ]', 'info');
        }
      }
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      const time = Math.max(0, getCurrentTime() - 5);
      seekTo(time);
      updateTimeDisplay();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      const time = getCurrentTime() + 5;
      seekTo(time);
      updateTimeDisplay();
    }
  };

  document.addEventListener('keydown', activeKeydownHandler);
}

function handleAIError(err) {
  let errorMsg = '⚠️ Erro ao consultar a IA. Tente novamente.';
  const msg = (err?.message || '').toLowerCase();

  if (err?.message === 'RATE_LIMIT' || msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted')) {
    errorMsg = '⏳ Limite de Cota Excedido (Erro 429): Você atingiu a cota gratuita do Gemini (limite por minuto ou diário). Aguarde 1 minuto ou use uma nova chave.';
  } else if (err?.message === 'API_KEY_INVALID' || msg.includes('401') || msg.includes('unauthenticated')) {
    errorMsg = '🔑 Chave Inválida ou Expirada (Erro 401): Esta chave foi desativada ou não confere. Atualize-a nas Configurações.';
  } else if (err?.message === 'API_KEY_RESTRICTED' || msg.includes('403')) {
    errorMsg = '🔒 Chave com restrição ou bloqueada (Erro 403). Verifique no AI Studio se a chave está ativa.';
  } else if (err?.message === 'API_KEY_MISSING') {
    errorMsg = '🔑 Configure sua chave do Gemini nas Configurações!';
  } else if (err?.message === 'SERVER_OVERLOADED' || msg.includes('503')) {
    errorMsg = '⚡ Servidores do Gemini momentaneamente sobrecarregados (Erro 503). Tente novamente em alguns segundos.';
  } else if (err?.message) {
    errorMsg = `⚠️ Erro na IA: ${err.message}`;
  }
  showToast(errorMsg, 'error');
}

async function refreshClipList(videoId) {
  const clips = await getClipsByVideo(videoId);
  const list = document.getElementById('clip-list');
  if (!list) return;

  if (clips.length === 0) {
    list.innerHTML = `<div class="text-center text-muted text-sm" style="padding: var(--space-6);">
      Nenhum trecho criado ainda. Use os botões "Início" e "Fim" acima.
    </div>`;
  } else {
    list.innerHTML = clips.map(clip => renderClipItem(clip)).join('');
  }
}

async function refreshVocabList(videoId) {
  const vocab = await getVocabularioByVideo(videoId);
  const list = document.getElementById('vocab-list');
  if (!list) return;

  if (vocab.length === 0) {
    list.innerHTML = `<div class="text-center text-muted text-sm" style="padding: var(--space-6);">
      Nenhuma palavra salva deste vídeo.
    </div>`;
  } else {
    list.innerHTML = vocab.map(v => renderVocabItem(v)).join('');
  }
}

async function refreshTabCounts(videoId) {
  const [clips, vocab] = await Promise.all([
    getClipsByVideo(videoId),
    getVocabularioByVideo(videoId)
  ]);

  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    if (btn.dataset.tab === 'clips') {
      btn.textContent = `✂️ Trechos (${clips.length})`;
    } else if (btn.dataset.tab === 'vocab') {
      btn.textContent = `📝 Vocabulário (${vocab.length})`;
    }
  });
}

/**
 * Cleanup when leaving the page.
 */
export function cleanupVideoPlayer() {
  if (activeKeydownHandler) {
    document.removeEventListener('keydown', activeKeydownHandler);
    activeKeydownHandler = null;
  }
  stopTimeUpdater();
  destroyPlayer();
  activeClipId = null;
  editingClipId = null;
  currentVideoData = null;
}
