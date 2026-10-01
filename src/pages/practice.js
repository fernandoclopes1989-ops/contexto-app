/**
 * practice.js — AI Practice Exercises page
 */

import { getAllVocabulario, getAllRevisao, getSetting } from '../db.js';
import { escapeHtml, showToast } from '../utils.js';
import { generateExercises } from '../ai.js';

let currentExercises = [];
let currentExerciseIndex = 0;

export async function renderPractice(container) {
  const apiKey = await getSetting('gemini_api_key');
  const vocab = await getAllVocabulario();

  if (!apiKey) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🤖 Praticar com IA</h1>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">🔑</div>
        <h3>Chave de API necessária</h3>
        <p>Para usar a Inteligência Artificial e a Metodologia 1+1, configure sua chave do Google Gemini (Gratuita) nas configurações.</p>
        <a href="#/settings" class="btn btn-primary btn-lg">Ir para Configurações</a>
      </div>
    `;
    return;
  }

  if (vocab.length < 3) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🤖 Praticar com IA</h1>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>Vocabulário insuficiente</h3>
        <p>Salve pelo menos 3 palavras para gerar exercícios de prática. Você tem ${vocab.length} palavra${vocab.length !== 1 ? 's' : ''}.</p>
        <a href="#/videos" class="btn btn-primary btn-lg">Estudar vídeos</a>
      </div>
    `;
    return;
  }

  // Show generate button
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🤖 Praticar com IA</h1>
      <p class="page-subtitle">Exercícios personalizados usando seu vocabulário salvo</p>
    </div>

    <div class="practice-container" id="practice-area">
      <div class="card text-center" style="padding: var(--space-10);">
        <div style="font-size: 3rem; margin-bottom: var(--space-4);">🧠</div>
        <h3 style="margin-bottom: var(--space-2);">Pronto para praticar?</h3>
        <p class="text-muted mb-6">A IA vai criar exercícios usando as ${vocab.length} palavras do seu vocabulário.</p>
        <button id="generate-exercises-btn" class="btn btn-primary btn-lg">
          ✨ Gerar exercícios
        </button>
      </div>
    </div>
  `;

  container.querySelector('#generate-exercises-btn').addEventListener('click', () => {
    handleGenerateExercises(container, vocab);
  });
}

async function handleGenerateExercises(container, vocab) {
  const practiceArea = container.querySelector('#practice-area');

  practiceArea.innerHTML = `
    <div class="loading-spinner" style="padding: var(--space-12);">
      <div class="spinner"></div>
      <span class="loading-text">A IA está criando exercícios personalizados...</span>
      <span class="text-muted text-sm">Isso pode levar alguns segundos</span>
    </div>
  `;

  try {
    currentExercises = await generateExercises(vocab);
    currentExerciseIndex = 0;

    if (currentExercises.length === 0) {
      throw new Error('No exercises generated');
    }

    renderExercises(practiceArea);
  } catch (err) {
    console.error('Exercise generation error:', err);

    let errorMsg = 'Erro ao gerar exercícios. Tente novamente.';
    let errorDetail = '';
    if (err.message === 'API_KEY_MISSING') {
      errorMsg = 'Chave de API não configurada.';
    } else if (err.message === 'API_KEY_INVALID') {
      errorMsg = 'Chave de API inválida. Verifique nas configurações.';
    } else if (err.message === 'API_KEY_RESTRICTED') {
      errorMsg = '🔒 Sua chave de API foi rejeitada pelo Google.';
      errorDetail = `
        <div style="text-align: left; margin-top: var(--space-4); padding: var(--space-4); background: var(--bg-primary); border-radius: var(--radius-md); font-size: 0.85rem;">
          <p style="margin-bottom: var(--space-2);"><strong>Desde junho de 2026, o Google exige que chaves de API sejam "restritas".</strong></p>
          <p style="margin-bottom: var(--space-2);">Para corrigir:</p>
          <ol style="padding-left: var(--space-6); margin-bottom: var(--space-2);">
            <li>Acesse <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="color: var(--accent-secondary);">aistudio.google.com/app/apikey</a></li>
            <li>Encontre sua chave (a que começa com AIza...)</li>
            <li>Clique nela e selecione <strong>"Restrict to Gemini API only"</strong></li>
            <li>Salve e tente novamente aqui</li>
          </ol>
          <p style="color: var(--text-muted);">Ou, a forma mais fácil: delete a chave antiga e crie uma nova no AI Studio — novas chaves já vêm restritas automaticamente.</p>
        </div>`;
    } else if (err.message === 'RATE_LIMIT') {
      errorMsg = '⏳ Limite de requisições atingido.';
      errorDetail = '<p class="text-muted mt-2">O plano gratuito tem um limite por minuto. Aguarde 1 minuto e tente novamente.</p>';
    } else if (err.message === 'NOT_ENOUGH_VOCAB') {
      errorMsg = 'Vocabulário insuficiente (mínimo 3 palavras).';
    } else if (err.message === 'AI_PARSE_FAILED' || err.message === 'ALL_MODELS_FAILED') {
      errorMsg = 'Erro ao processar resposta da IA. Tente novamente.';
      errorDetail = '<p class="text-muted mt-2">Se o erro persistir, verifique sua conexão com a internet ou tente criar uma nova chave de API.</p>';
    }

    practiceArea.innerHTML = `
      <div class="card text-center" style="padding: var(--space-8);">
        <div style="font-size: 2.5rem; margin-bottom: var(--space-4);">😕</div>
        <h3 style="margin-bottom: var(--space-2);">${errorMsg}</h3>
        ${errorDetail}
        <button id="retry-generate-btn" class="btn btn-primary btn-lg mt-4">Tentar novamente</button>
      </div>
    `;

    practiceArea.querySelector('#retry-generate-btn').addEventListener('click', () => {
      handleGenerateExercises(container, vocab);
    });
  }
}

function renderExercises(practiceArea) {
  const total = currentExercises.length;

  practiceArea.innerHTML = `
    <div class="review-progress mb-6">
      <span>Exercício ${currentExerciseIndex + 1} de ${total}</span>
      <div class="review-progress-bar">
        <div class="review-progress-fill" style="width: ${((currentExerciseIndex) / total) * 100}%"></div>
      </div>
    </div>
    <div id="exercise-slot"></div>
    <div class="flex justify-between mt-6" id="exercise-nav">
      ${currentExerciseIndex > 0 ? `<button id="prev-exercise" class="btn btn-ghost">← Anterior</button>` : '<div></div>'}
      ${currentExerciseIndex < total - 1 ? `<button id="next-exercise" class="btn btn-primary">Próximo →</button>` : `<button id="finish-exercises" class="btn btn-success">✅ Finalizar</button>`}
    </div>
  `;

  renderSingleExercise(practiceArea.querySelector('#exercise-slot'), currentExercises[currentExerciseIndex]);

  // Nav listeners
  const prevBtn = practiceArea.querySelector('#prev-exercise');
  const nextBtn = practiceArea.querySelector('#next-exercise');
  const finishBtn = practiceArea.querySelector('#finish-exercises');

  if (prevBtn) prevBtn.addEventListener('click', () => {
    currentExerciseIndex--;
    renderExercises(practiceArea);
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    currentExerciseIndex++;
    renderExercises(practiceArea);
  });
  if (finishBtn) finishBtn.addEventListener('click', () => {
    practiceArea.innerHTML = `
      <div class="review-complete">
        <div class="review-complete-icon">🎉</div>
        <h2>Prática concluída!</h2>
        <p>Ótimo treino! Continue salvando vocabulário e praticando regularmente.</p>
        <div class="flex gap-3 justify-center" style="flex-wrap:wrap;">
          <button id="new-session-btn" class="btn btn-primary btn-lg">🔄 Nova sessão</button>
          <a href="#/" class="btn btn-secondary btn-lg">🏠 Início</a>
        </div>
      </div>
    `;
    practiceArea.querySelector('#new-session-btn')?.addEventListener('click', () => {
      renderPractice(practiceArea.closest('.page-container'));
    });
  });
}

function renderSingleExercise(slot, exercise) {
  switch (exercise.type) {
    case 'fill_in_blank':
      renderFillInBlank(slot, exercise);
      break;
    case 'multiple_choice':
      renderMultipleChoice(slot, exercise);
      break;
    case 'context_writing':
      renderContextWriting(slot, exercise);
      break;
    default:
      renderMultipleChoice(slot, exercise);
  }
}

function renderFillInBlank(slot, exercise) {
  slot.innerHTML = `
    <div class="exercise-card">
      <div class="exercise-type">Completar a frase</div>
      <p class="text-muted text-sm mb-4">${escapeHtml(exercise.instruction || 'Complete a frase:')}</p>
      <div class="exercise-question">${escapeHtml(exercise.question)}</div>
      <div class="flex gap-3 mt-4">
        <input type="text" id="fill-input" class="exercise-input" placeholder="Digite a palavra..." autocomplete="off" />
        <button id="check-fill-btn" class="btn btn-primary">Verificar</button>
      </div>
      <div id="fill-feedback" class="hidden"></div>
    </div>
  `;

  const input = slot.querySelector('#fill-input');
  const checkBtn = slot.querySelector('#check-fill-btn');
  const feedback = slot.querySelector('#fill-feedback');

  const checkAnswer = () => {
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = exercise.answer.toLowerCase();
    const isCorrect = userAnswer === correctAnswer ||
                      correctAnswer.includes(userAnswer) ||
                      userAnswer.includes(correctAnswer);

    feedback.classList.remove('hidden');
    if (isCorrect) {
      feedback.className = 'exercise-feedback correct';
      feedback.innerHTML = `✅ Correto! A resposta é: <strong>${escapeHtml(exercise.answer)}</strong>`;
    } else {
      feedback.className = 'exercise-feedback incorrect';
      feedback.innerHTML = `❌ A resposta correta é: <strong>${escapeHtml(exercise.answer)}</strong>${exercise.hint ? `<br>💡 ${escapeHtml(exercise.hint)}` : ''}`;
    }
    input.disabled = true;
    checkBtn.disabled = true;
  };

  checkBtn.addEventListener('click', checkAnswer);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkAnswer(); });
  input.focus();
}

function renderMultipleChoice(slot, exercise) {
  slot.innerHTML = `
    <div class="exercise-card">
      <div class="exercise-type">Múltipla escolha</div>
      <p class="text-muted text-sm mb-4">${escapeHtml(exercise.instruction || 'Escolha a opção correta:')}</p>
      <div class="exercise-question">${formatQuestionBold(exercise.question)}</div>
      <div class="exercise-options" id="mc-options">
        ${exercise.options.map((opt, i) => `
          <button class="exercise-option" data-index="${i}">${escapeHtml(opt)}</button>
        `).join('')}
      </div>
      <div id="mc-feedback" class="hidden"></div>
    </div>
  `;

  const options = slot.querySelectorAll('.exercise-option');
  const feedback = slot.querySelector('#mc-feedback');

  options.forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = Number(btn.dataset.index);
      const correct = exercise.correct_index;

      options.forEach(b => {
        b.classList.add('disabled');
        if (Number(b.dataset.index) === correct) b.classList.add('correct');
        if (Number(b.dataset.index) === selected && selected !== correct) b.classList.add('incorrect');
      });

      feedback.classList.remove('hidden');
      if (selected === correct) {
        feedback.className = 'exercise-feedback correct';
        feedback.innerHTML = `✅ Correto!${exercise.explanation ? ` ${escapeHtml(exercise.explanation)}` : ''}`;
      } else {
        feedback.className = 'exercise-feedback incorrect';
        feedback.innerHTML = `❌ Errado.${exercise.explanation ? ` ${escapeHtml(exercise.explanation)}` : ''}`;
      }
    });
  });
}

function renderContextWriting(slot, exercise) {
  // Render same as multiple choice since it's essentially the same format
  renderMultipleChoice(slot, exercise);
  // Just update the type label
  const typeLabel = slot.querySelector('.exercise-type');
  if (typeLabel) typeLabel.textContent = 'Contexto';
}

function formatQuestionBold(question) {
  // Convert **word** to bold HTML
  return escapeHtml(question).replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--accent-primary);">$1</strong>');
}
