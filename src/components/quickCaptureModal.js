/**
 * quickCaptureModal.js — Floating quick capture modal for instant i+1 cards.
 * Accessible from anywhere in the app (sidebar, video player, vocabulary list).
 * Fills English-in-English definition + i+1 sentence in 1 second.
 */

import { addVocabulario, addRevisao } from '../db.js';
import { createReviewCard } from '../srs.js';
import { generateIPlusOneCardData, speakEnglish } from '../services/quickCardService.js';
import { showToast, escapeHtml } from '../utils.js';

export function openQuickCaptureModal({ initialWord = '', initialContext = '', videoId = null, onSaved = null } = {}) {
  // Remove existing
  const existing = document.getElementById('quick-capture-modal-overlay');
  if (existing) existing.remove();

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'quick-capture-modal-overlay';
  modalOverlay.className = 'modal-overlay';
  modalOverlay.innerHTML = `
    <div class="modal-content" style="max-width: 600px; width: 100%;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.6rem;">⚡</span>
          <div>
            <h3 class="modal-title" style="margin: 0; font-size: 1.25rem;">Captura Rápida i+1</h3>
            <span class="text-xs text-muted">Modelo Monolíngue (Inglês-Inglês) • 0 esforço manual</span>
          </div>
        </div>
        <button id="close-quick-capture-btn" class="btn btn-ghost btn-sm" style="font-size: 1.2rem; padding: 4px 8px;">✕</button>
      </div>

      <div class="modal-body">
        <form id="quick-capture-form" onsubmit="return false;">
          <!-- Term Input -->
          <div class="input-group mb-3">
            <label class="input-label" for="qc-term">
              Palavra, Phrasal Verb ou Expressão (Chunk)
            </label>
            <div style="display: flex; gap: 8px;">
              <input 
                type="text" 
                id="qc-term" 
                class="input" 
                placeholder="Ex: call it a day, stumble upon, figure out..." 
                value="${escapeHtml(initialWord)}" 
                style="font-size: 15px; font-weight: 600;"
                required 
                autocomplete="off"
              />
              <button type="button" id="btn-qc-generate" class="btn btn-primary" style="min-width: 140px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <span>⚡</span> <span>Gerar i+1</span>
              </button>
            </div>
          </div>

          <!-- Context Input (Optional) -->
          <div class="input-group mb-3">
            <label class="input-label" for="qc-context" style="display: flex; justify-content: space-between;">
              <span>Frase onde você viu/ouviu (opcional)</span>
              <span class="text-xs text-muted">Se deixar vazio, a IA cria a frase i+1 ideal</span>
            </label>
            <textarea 
              id="qc-context" 
              class="input" 
              rows="2" 
              placeholder="Ex: We have been talking for two hours, let's call it a day."
              style="font-size: 13px; line-height: 1.4; resize: vertical;"
            >${escapeHtml(initialContext)}</textarea>
          </div>

          <!-- Loading Indicator -->
          <div id="qc-loading" class="hidden text-center my-4" style="padding: var(--space-4); background: rgba(99, 102, 241, 0.08); border-radius: var(--radius-md);">
            <div class="spinner" style="margin: 0 auto 8px; width: 24px; height: 24px;"></div>
            <span class="text-xs" style="color: var(--accent-secondary); font-weight: 500;">
              Consultando dicionário e criando frase contextual i+1...
            </span>
          </div>

          <!-- Result Preview Area -->
          <div id="qc-result-area" class="${initialWord ? '' : 'hidden'}">
            <div style="border-top: 1px solid var(--border-color); padding-top: var(--space-4); margin-top: var(--space-2);">
              
              <!-- Pronunciation bar -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); background: var(--bg-card); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span id="qc-phonetic" style="font-family: monospace; color: var(--accent-secondary); font-size: 13px;"></span>
                  <span id="qc-source-badge" class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 10px;">0 tokens</span>
                </div>
                <button type="button" id="btn-qc-speak" class="btn btn-ghost btn-sm" style="display: flex; align-items: center; gap: 4px; padding: 4px 8px; font-size: 12px;" title="Ouvir pronúncia nativa">
                  <span>🔊</span> <span>Ouvir</span>
                </button>
              </div>

              <!-- English Definition -->
              <div class="input-group mb-3">
                <label class="input-label" for="qc-definition-en" style="color: var(--accent-secondary); font-weight: 600;">
                  📖 Definição em Inglês Simples (EN-EN):
                </label>
                <textarea 
                  id="qc-definition-en" 
                  class="input" 
                  rows="2" 
                  placeholder="Definição clara em inglês..."
                  style="font-size: 13px; line-height: 1.4;"
                ></textarea>
              </div>

              <!-- i+1 Sentence -->
              <div class="input-group mb-3">
                <label class="input-label" for="qc-sentence-i1" style="color: var(--accent-secondary); font-weight: 600;">
                  🎯 Frase de Contexto i+1 (Krashen / Mairo):
                </label>
                <textarea 
                  id="qc-sentence-i1" 
                  class="input" 
                  rows="2" 
                  placeholder="Frase onde o termo é a única dúvida..."
                  style="font-size: 13px; line-height: 1.4;"
                ></textarea>
              </div>

              <!-- PT Hint -->
              <div class="input-group mb-4">
                <label class="input-label" for="qc-pt-hint">
                  💡 Dica rápida em Português (apoio secundário):
                </label>
                <input 
                  type="text" 
                  id="qc-pt-hint" 
                  class="input" 
                  placeholder="Ex: parar por hoje / encerrar o trabalho"
                  style="font-size: 13px;"
                />
              </div>

              <!-- Footer Buttons -->
              <div style="display: flex; justify-content: flex-end; gap: var(--space-3);">
                <button type="button" id="btn-qc-cancel" class="btn btn-ghost">Cancelar</button>
                <button type="button" id="btn-qc-save" class="btn btn-primary btn-lg" style="min-width: 180px;">
                  💾 Salvar no SRS
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const termInput = modalOverlay.querySelector('#qc-term');
  const contextInput = modalOverlay.querySelector('#qc-context');
  const btnGenerate = modalOverlay.querySelector('#btn-qc-generate');
  const loadingDiv = modalOverlay.querySelector('#qc-loading');
  const resultArea = modalOverlay.querySelector('#qc-result-area');
  const defInput = modalOverlay.querySelector('#qc-definition-en');
  const sentInput = modalOverlay.querySelector('#qc-sentence-i1');
  const ptInput = modalOverlay.querySelector('#qc-pt-hint');
  const phoneticSpan = modalOverlay.querySelector('#qc-phonetic');
  const sourceBadge = modalOverlay.querySelector('#qc-source-badge');
  const btnSpeak = modalOverlay.querySelector('#btn-qc-speak');
  const btnSave = modalOverlay.querySelector('#btn-qc-save');
  const btnClose = modalOverlay.querySelector('#close-quick-capture-btn');
  const btnCancel = modalOverlay.querySelector('#btn-qc-cancel');

  let currentAudioUrl = null;

  const closeModal = () => {
    modalOverlay.classList.add('toast-exit');
    setTimeout(() => modalOverlay.remove(), 150);
  };

  btnClose.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Focus term
  setTimeout(() => termInput.focus(), 60);

  // Audio Playback
  btnSpeak.addEventListener('click', () => {
    const textToSpeak = termInput.value.trim() || sentInput.value.trim();
    if (currentAudioUrl) {
      const audio = new Audio(currentAudioUrl);
      audio.play().catch(() => speakEnglish(textToSpeak));
    } else {
      speakEnglish(textToSpeak);
    }
  });

  // Generate i+1 Data
  const runGenerate = async () => {
    const term = termInput.value.trim();
    if (!term) {
      showToast('Digite uma palavra ou expressão!', 'info');
      termInput.focus();
      return;
    }

    btnGenerate.disabled = true;
    btnGenerate.innerHTML = `<span>⏳</span> <span>Gerando...</span>`;
    loadingDiv.classList.remove('hidden');

    try {
      const userContext = contextInput.value.trim();
      const cardData = await generateIPlusOneCardData(term, userContext);

      defInput.value = cardData.definition_en || '';
      sentInput.value = cardData.sentence_i_plus_one || '';
      ptInput.value = cardData.pt_hint || '';
      phoneticSpan.textContent = cardData.phonetic ? `/${cardData.phonetic.replace(/^\/|\/$/g, '')}/` : '';
      currentAudioUrl = cardData.audio_url || null;

      if (cardData.source === 'dictionary') {
        sourceBadge.textContent = 'Dicionário Oficial (0 tokens)';
        sourceBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        sourceBadge.style.color = '#34d399';
      } else {
        sourceBadge.textContent = 'IA i+1 (Krashen)';
        sourceBadge.style.background = 'rgba(99, 102, 241, 0.15)';
        sourceBadge.style.color = '#a5b4fc';
      }

      resultArea.classList.remove('hidden');
      
      // Auto-pronounce once generated
      speakEnglish(term);
    } catch (err) {
      console.error('Error generating i+1 data:', err);
      showToast('Não foi possível gerar automaticamente: ' + (err?.message || ''), 'error');
      resultArea.classList.remove('hidden');
    } finally {
      btnGenerate.disabled = false;
      btnGenerate.innerHTML = `<span>⚡</span> <span>Gerar i+1</span>`;
      loadingDiv.classList.add('hidden');
    }
  };

  btnGenerate.addEventListener('click', runGenerate);
  termInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runGenerate();
    }
  });

  // If initialWord was passed, trigger automatically!
  if (initialWord) {
    runGenerate();
  }

  // Save Card into Supabase / IndexedDB and schedule SRS
  btnSave.addEventListener('click', async () => {
    const word = termInput.value.trim();
    const definition = defInput.value.trim();
    const context = sentInput.value.trim();
    const ptHint = ptInput.value.trim();

    if (!word) {
      showToast('Digite a palavra antes de salvar!', 'error');
      termInput.focus();
      return;
    }

    btnSave.disabled = true;
    btnSave.textContent = '⏳ Salvando...';

    // Format meaning combining English definition + PT Hint
    let meaningFormatted = definition;
    if (ptHint) {
      meaningFormatted = definition ? `${definition}\n\n💡 Dica (PT): ${ptHint}` : ptHint;
    }

    try {
      const vocabId = await addVocabulario({
        video_id: videoId || null,
        clip_id: null,
        timestamp: null,
        palavra_ou_expressao: word,
        frase_contexto: context || null,
        traducao_significado: meaningFormatted || null,
        data_criacao: new Date().toISOString()
      });

      // Auto-schedule SRS review card
      const reviewCard = createReviewCard(vocabId);
      await addRevisao(reviewCard);

      showToast(`🎉 Card "${word}" criado no modelo i+1 e agendado no SRS!`, 'success', 3500);

      if (typeof onSaved === 'function') {
        onSaved({ id: vocabId, palavra_ou_expressao: word, frase_contexto: context, traducao_significado: meaningFormatted });
      }

      closeModal();
    } catch (err) {
      console.error('Error saving quick card:', err);
      showToast('Erro ao salvar no banco: ' + (err?.message || ''), 'error');
      btnSave.disabled = false;
      btnSave.textContent = '💾 Salvar no SRS';
    }
  });
}
