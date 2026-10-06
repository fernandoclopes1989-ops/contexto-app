/**
 * review.js — SRS Review Session page (Anki-style)
 * Shows review cards due today, one at a time.
 * Uses "De Novo" (Again) and "Bom" (Good) as primary buttons per Mairo Vergara.
 */

import { getDueReviews, getRevisao, updateRevisao, getVocabulario, getVideo, logStudyDay, getDueReviewCount } from '../db.js';
import { formatTime, escapeHtml, showToast, today } from '../utils.js';
import { processReview, getNextReviewLabel, getButtonIntervals, getDifficultyBadge } from '../srs.js';

let reviewQueue = [];
let currentIndex = 0;
let answerRevealed = false;

export async function renderReview(container) {
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

  const dueCards = await getDueReviews();

  if (dueCards.length === 0) {
    container.innerHTML = `
      <div class="review-complete">
        <div class="review-complete-icon">🎉</div>
        <h2>Tudo em dia!</h2>
        <p>Não há revisões pendentes para hoje. Volte amanhã ou adicione mais vocabulário.</p>
        <div class="flex gap-3 justify-center">
          <a href="#/videos" class="btn btn-primary btn-lg">Estudar vídeos</a>
          <a href="#/" class="btn btn-secondary btn-lg">Voltar ao início</a>
        </div>
      </div>
    `;
    return;
  }

  // Enrich cards with vocabulary data
  reviewQueue = [];
  for (const card of dueCards) {
    const vocab = await getVocabulario(card.vocabulario_id);
    if (!vocab) continue; // Orphaned card, skip

    let video = null;
    if (vocab.video_id) {
      video = await getVideo(vocab.video_id);
    }

    reviewQueue.push({
      card,
      vocab,
      video
    });
  }

  if (reviewQueue.length === 0) {
    container.innerHTML = `
      <div class="review-complete">
        <div class="review-complete-icon">✅</div>
        <h2>Sem revisões pendentes</h2>
        <a href="#/" class="btn btn-primary">Voltar ao início</a>
      </div>
    `;
    return;
  }

  currentIndex = 0;
  answerRevealed = false;

  renderCurrentCard(container);
}

function renderCurrentCard(container) {
  if (currentIndex >= reviewQueue.length) {
    // All done!
    renderComplete(container);
    return;
  }

  const { card, vocab, video } = reviewQueue[currentIndex];
  const total = reviewQueue.length;
  const progress = ((currentIndex) / total) * 100;
  const badge = getDifficultyBadge(card);

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🔄 Revisão do Dia</h1>
    </div>

    <div class="review-container">
      <div class="review-card">
        <!-- Progress -->
        <div class="review-progress">
          <span>${currentIndex + 1} / ${total}</span>
          <div class="review-progress-bar">
            <div class="review-progress-fill" style="width: ${progress}%"></div>
          </div>
          <span class="badge ${badge.class}" style="font-size: 10px;">${badge.text}</span>
        </div>

        <!-- Context sentence -->
        ${vocab.frase_contexto ? `
          <div class="review-context" style="position: relative; margin-bottom: 24px;">
            ${highlightWord(escapeHtml(vocab.frase_contexto), escapeHtml(vocab.palavra_ou_expressao))}
            <button class="btn btn-ghost btn-sm speak-review-context-btn" data-word="${escapeHtml(vocab.frase_contexto)}" title="Ouvir frase inteira" style="position: absolute; bottom: -28px; right: 0; padding: 2px 8px; font-size: 11px; color: var(--accent-secondary); display: flex; align-items: center; gap: 4px; background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: var(--radius-sm); cursor: pointer;">
              <span>🔊</span> <span>Ouvir Frase</span>
            </button>
          </div>
        ` : `
          <div class="review-context">
            <em style="color: var(--text-muted);">Sem frase de contexto registrada</em>
          </div>
        `}

        <!-- Prompt -->
        <div class="review-prompt" id="review-prompt">
          ${answerRevealed ? '' : '🤔 Qual é o significado desta palavra/expressão?'}
        </div>

        <!-- Reveal button or Answer -->
        <div id="review-action-area">
          ${answerRevealed ? renderAnswer(card, vocab, video) : `
            <button id="reveal-btn" class="btn btn-primary btn-lg w-full">
              Revelar resposta
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  // Event listeners
  if (!answerRevealed) {
    container.querySelector('#reveal-btn').addEventListener('click', () => {
      answerRevealed = true;
      renderCurrentCard(container);
    });

    // Keyboard shortcut: Space to reveal
    const keyHandler = (e) => {
      if (e.code === 'Space' && !answerRevealed) {
        e.preventDefault();
        answerRevealed = true;
        renderCurrentCard(container);
      }
    };
    document.addEventListener('keydown', keyHandler, { once: true });
  } else {
    // Review response buttons
    container.querySelectorAll('.review-response-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        const response = btn.dataset.response;
        try {
          await handleReviewResponse(card, response);
        } catch (err) {
          console.error('Error recording review response:', err);
          showToast('Erro ao gravar revisão', 'error');
        }
        currentIndex++;
        answerRevealed = false;
        renderCurrentCard(container);
      });
    });

    // Video link
    const videoLink = container.querySelector('.review-video-link');
    if (videoLink) {
      videoLink.addEventListener('click', (e) => {
        e.preventDefault();
        const videoId = videoLink.dataset.videoId;
        const ts = videoLink.dataset.timestamp;
        const targetHash = ts && !isNaN(Number(ts)) ? `/video/${videoId}?t=${Math.round(Number(ts))}` : `/video/${videoId}`;
        window.location.hash = targetHash;
      });
    }

    // Keyboard shortcuts: 1=denovo, 2=dificil, 3=bom
    const keyHandler = (e) => {
      const map = { '1': 'denovo', '2': 'dificil', '3': 'bom' };
      if (map[e.key] && answerRevealed) {
        handleReviewResponse(reviewQueue[currentIndex].card, map[e.key]).then(() => {
          currentIndex++;
          answerRevealed = false;
          renderCurrentCard(container);
        });
      }
    };
    document.addEventListener('keydown', keyHandler, { once: true });
  }

  // Speech pronunciation (word or full sentence) - unconditional so they can listen to the context anytime!
  container.querySelectorAll('.speak-review-btn, .speak-review-context-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const word = btn.dataset.word;
      if (word && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word);
        u.lang = 'en-US';
        u.rate = btn.classList.contains('speak-review-context-btn') ? 0.95 : 0.9;
        window.speechSynthesis.speak(u);
      }
    });
  });
}

function renderAnswer(card, vocab, video) {
  const intervals = getButtonIntervals(card);

  return `
    <div class="review-answer">
      <div class="answer-word">
        ${escapeHtml(vocab.palavra_ou_expressao)}
        <button class="btn btn-ghost btn-sm speak-review-btn" data-word="${escapeHtml(vocab.palavra_ou_expressao)}" title="Ouvir pronúncia em inglês" style="padding: 2px 6px; font-size: 16px;">🔊</button>
      </div>
      <div class="answer-translation">${escapeHtml(vocab.traducao_significado || 'Sem tradução registrada')}</div>
    </div>

    ${video ? `
      <div style="margin-top: 14px;">
        <a class="review-video-link btn btn-secondary btn-sm" data-video-id="${video.id}" data-timestamp="${vocab.timestamp || ''}" href="#/video/${video.id}${vocab.timestamp ? `?t=${Math.round(vocab.timestamp)}` : ''}" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; font-weight: 600; text-decoration: none;">
          <span>▶️</span> <span>Reassistir trecho no vídeo original ${vocab.timestamp ? `(${formatTime(vocab.timestamp)})` : ''}</span>
        </a>
      </div>
    ` : ''}

    <div class="review-buttons-anki mt-6">
      <button class="review-btn-anki review-btn-again review-response-btn" data-response="denovo">
        <span class="review-btn-interval">${intervals.denovo}</span>
        <span class="review-btn-label">De Novo</span>
        <span class="review-btn-key">[1]</span>
      </button>
      <button class="review-btn-anki review-btn-hard review-response-btn" data-response="dificil">
        <span class="review-btn-interval">${intervals.dificil}</span>
        <span class="review-btn-label">Difícil</span>
        <span class="review-btn-key">[2]</span>
      </button>
      <button class="review-btn-anki review-btn-good review-response-btn" data-response="bom">
        <span class="review-btn-interval">${intervals.bom}</span>
        <span class="review-btn-label">Bom</span>
        <span class="review-btn-key">[3]</span>
      </button>
    </div>
    <p class="review-tip text-muted text-sm mt-4 text-center">
      💡 <strong>Dica do Mairo:</strong> Use apenas "De Novo" e "Bom". Não use "Fácil" (prejudica o algoritmo).
    </p>
  `;
}

async function handleReviewResponse(card, response) {
  const updatedCard = processReview(card, response);
  await updateRevisao(updatedCard);
  await logStudyDay(today());

  const emoji = response === 'denovo' ? '🔄' : response === 'dificil' ? '💪' : '✅';
  showToast(`${emoji} Próxima revisão: ${getNextReviewLabel(updatedCard)}`, 'info');
}

function renderComplete(container) {
  const totalReviewed = reviewQueue.length;

  container.innerHTML = `
    <div class="review-complete">
      <div class="review-complete-icon">🏆</div>
      <h2>Revisão completa!</h2>
      <p>Você revisou ${totalReviewed} palavra${totalReviewed !== 1 ? 's' : ''} hoje. Continue assim!</p>
      <div class="flex gap-3 justify-center" style="flex-wrap:wrap;">
        <a href="#/videos" class="btn btn-primary btn-lg">📚 Estudar mais</a>
        <a href="#/practice" class="btn btn-secondary btn-lg">🤖 Praticar com IA</a>
        <a href="#/" class="btn btn-ghost btn-lg">🏠 Início</a>
      </div>
    </div>
  `;
}

function highlightWord(contextHtml, wordHtml) {
  if (!wordHtml) return contextHtml;

  // Try to find and highlight the word in the context
  const regex = new RegExp(`(${wordHtml.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return contextHtml.replace(regex, '<span class="highlight-word">$1</span>');
}
