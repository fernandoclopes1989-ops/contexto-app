/**
 * transcriptModal.js — Modal component for pasting raw YouTube transcripts
 * and regex-matching timestamps to automatically generate clips and study segments.
 * Works 100% locally with zero external API dependencies.
 */

import { addClip } from '../db.js';
import { parsePastedTranscript, formatTime, showToast, escapeHtml } from '../utils.js';
import { saveVideoTranscript } from '../ai.js';

export function openTranscriptModal({ videoId, youtubeVideoId, videoTitle, onClipsCreated }) {
  // Remove any existing instance
  const existing = document.getElementById('transcript-modal-overlay');
  if (existing) existing.remove();

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'transcript-modal-overlay';
  modalOverlay.className = 'modal-overlay';
  modalOverlay.innerHTML = `
    <div class="modal-content" style="max-width: 680px; width: 100%;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.5rem;">📋</span>
          <div>
            <h3 class="modal-title" style="margin: 0; font-size: 1.2rem;">Importar Transcrição do YouTube</h3>
            <span class="text-xs text-muted">Regex-match de timestamps com geração automática de trechos (Zero API)</span>
          </div>
        </div>
        <button id="close-transcript-modal-btn" class="btn btn-ghost btn-sm" style="font-size: 1.2rem; padding: 4px 8px;">✕</button>
      </div>

      <div class="modal-body">
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-4);">
          <strong class="text-xs" style="color: var(--accent-secondary); display: block; margin-bottom: 4px;">💡 Como copiar do YouTube em 5 segundos:</strong>
          <ol class="text-xs text-muted" style="margin: 0; padding-left: 1.2rem; line-height: 1.5;">
            <li>Abra o vídeo no YouTube e clique no botão <strong>... (Mais)</strong> abaixo do vídeo.</li>
            <li>Selecione <strong>"Mostrar transcrição"</strong>.</li>
            <li>Selecione o texto com o mouse ou Ctrl+A, copie (Ctrl+C) e cole abaixo:</li>
          </ol>
        </div>

        <div class="input-group" style="margin-bottom: var(--space-4);">
          <label for="raw-transcript-textarea" class="input-label" style="display: flex; justify-content: space-between;">
            <span>Cole o texto bruto aqui:</span>
            <span class="text-xs text-muted">Aceita formato padrão (0:01) e YouTube Brasil (0:3636 segundos-)</span>
          </label>
          <textarea 
            id="raw-transcript-textarea" 
            class="input" 
            rows="9" 
            placeholder="Exemplo copiado do YouTube:&#10;0:000 segundo- Please welcome the legend.&#10;0:022 segundosJackie. Chad,&#10;0:3636 segundos- Thank you. Thank you, thank you. Yeah. Wow.&#10;0:4444 segundos- Thank you. No, man..."
            style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; line-height: 1.5; resize: vertical;"
          ></textarea>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: var(--space-4);">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; user-select: none;">
            <input type="checkbox" id="auto-create-clips-check" checked style="accent-color: var(--accent-primary);" />
            <span>Salvar automaticamente na aba <strong>Meus Trechos (Clips)</strong></span>
          </label>
          <span id="preview-count-badge" class="badge hidden" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">
            0 trechos identificados
          </span>
        </div>

        <div id="parse-preview-container" class="hidden mb-4" style="max-height: 180px; overflow-y: auto; background: var(--bg-card); border-radius: var(--radius-md); padding: var(--space-3); border: 1px solid var(--border-color);">
          <div class="text-xs text-muted mb-2 font-semibold">Prévia dos trechos detectados via Regex:</div>
          <div id="parse-preview-list" style="display: flex; flex-direction: column; gap: 6px;"></div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4);">
          <button id="cancel-transcript-modal-btn" class="btn btn-ghost">Cancelar</button>
          <button id="btn-parse-and-sync" class="btn btn-primary btn-lg" style="min-width: 170px;">
            ⚡ Parse & Sync
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const textarea = modalOverlay.querySelector('#raw-transcript-textarea');
  const btnClose = modalOverlay.querySelector('#close-transcript-modal-btn');
  const btnCancel = modalOverlay.querySelector('#cancel-transcript-modal-btn');
  const btnParseSync = modalOverlay.querySelector('#btn-parse-and-sync');
  const autoCreateCheck = modalOverlay.querySelector('#auto-create-clips-check');
  const previewContainer = modalOverlay.querySelector('#parse-preview-container');
  const previewList = modalOverlay.querySelector('#parse-preview-list');
  const previewBadge = modalOverlay.querySelector('#preview-count-badge');

  // Focus textarea
  setTimeout(() => textarea.focus(), 50);

  const closeModal = () => {
    modalOverlay.classList.add('toast-exit');
    setTimeout(() => modalOverlay.remove(), 150);
  };

  btnClose.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Live input preview
  textarea.addEventListener('input', () => {
    const text = textarea.value.trim();
    if (!text) {
      previewContainer.classList.add('hidden');
      previewBadge.classList.add('hidden');
      return;
    }
    const items = parsePastedTranscript(text);
    if (items.length > 0) {
      previewBadge.textContent = `${items.length} trechos identificados`;
      previewBadge.classList.remove('hidden');
      previewList.innerHTML = items.slice(0, 5).map(item => `
        <div style="font-size: 12px; display: flex; gap: 8px; align-items: baseline; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
          <span style="color: var(--accent-secondary); font-family: monospace; font-weight: 600; min-width: 80px;">
            ${formatTime(item.start)} → ${formatTime(item.start + item.duration)}
          </span>
          <span style="color: var(--text-primary);">${escapeHtml(item.text)}</span>
        </div>
      `).join('') + (items.length > 5 ? `<div class="text-xs text-muted mt-1">+ mais ${items.length - 5} falas...</div>` : '');
      previewContainer.classList.remove('hidden');
    } else {
      previewContainer.classList.add('hidden');
      previewBadge.classList.add('hidden');
    }
  });

  // Parse & Sync Action
  btnParseSync.addEventListener('click', async () => {
    const rawText = textarea.value.trim();
    if (!rawText) {
      showToast('Por favor, cole a transcrição do YouTube na caixa!', 'info');
      textarea.focus();
      return;
    }

    btnParseSync.disabled = true;
    btnParseSync.textContent = '⏳ Sincronizando trechos...';

    try {
      // 1. Client-side regex match (zero API call needed)
      const items = parsePastedTranscript(rawText);

      if (!items || items.length === 0) {
        showToast('Nenhum trecho pôde ser extraído. Verifique o texto colado.', 'error');
        btnParseSync.disabled = false;
        btnParseSync.textContent = '⚡ Parse & Sync';
        return;
      }

      // 2. Persist transcript for Shadowing and 1+1 extraction
      saveVideoTranscript(youtubeVideoId, items);

      // 3. Automatically create clips if requested
      const shouldCreateClips = autoCreateCheck ? autoCreateCheck.checked : true;
      let createdCount = 0;

      if (shouldCreateClips) {
        for (const item of items) {
          const start = Math.max(0, item.start);
          const end = Math.max(start + 2, item.start + item.duration);
          const clipName = (item.text || 'Trecho').slice(0, 70);

          try {
            await addClip({
              video_id: videoId,
              nome: clipName,
              tempo_inicio: start,
              tempo_fim: end
            });
            createdCount++;
          } catch (e) {
            console.warn('Error saving clip:', e);
          }
        }
      }

      // Notify caller
      if (typeof onClipsCreated === 'function') {
        onClipsCreated(items);
      }

      showToast(`🎉 ${items.length} trechos sincronizados com sucesso via Regex! (${createdCount} clips criados)`, 'success', 4000);
      closeModal();
    } catch (err) {
      console.error('Parse & Sync error:', err);
      showToast('Erro ao processar transcrição: ' + (err?.message || ''), 'error');
      btnParseSync.disabled = false;
      btnParseSync.textContent = '⚡ Parse & Sync';
    }
  });
}
