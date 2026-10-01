/**
 * srs.js — Spaced Repetition System (SM-2 Algorithm, Anki-style) for Contexto App
 * 
 * Implements the exact Anki SM-2 algorithm as recommended by Mairo Vergara:
 * - Primary buttons: "De Novo" (Again) and "Bom" (Good)
 * - Secondary buttons: "Difícil" (Hard) — rarely used
 * - "Fácil" (Easy) is intentionally hidden (bad for the algorithm per Mairo's advice)
 * 
 * Card lifecycle (Anki-style):
 *   New → Learning → Review → (Lapse → Re-learning → Review)
 * 
 * Each card has:
 * - status: "new" | "learning" | "review" | "relearning"
 * - step: current learning step index (for learning/relearning)
 * - intervalo_dias: current interval in days
 * - fator_facilidade: ease factor (starts at 2.5, min 1.3)
 * - proxima_revisao: next review date/time (ISO string)
 * - ultima_resposta: last response
 * - total_revisoes: total number of reviews done
 * - lapses: total number of times card was forgotten
 */

import { today, addDays } from './utils.js';

// Learning steps in minutes (Anki default: 1min, 10min)
const LEARNING_STEPS = [1, 10];
// Re-learning steps in minutes (Anki default: 10min)
const RELEARNING_STEPS = [10];
// Graduating interval (days) — when card graduates from learning to review
const GRADUATING_INTERVAL = 1;
// Easy interval (days) — if user hits Easy on a learning card
const EASY_INTERVAL = 4;
// Minimum ease factor
const MIN_EASE = 1.3;
// Maximum interval (days)
const MAX_INTERVAL = 365;
// New interval after lapse (percentage of old interval, 0 = reset to 1 day)
const LAPSE_NEW_INTERVAL_PERCENT = 0;
// Interval modifier (1.0 = no change, used for global tuning)
const INTERVAL_MODIFIER = 1.0;

/**
 * Create initial review card data for a new vocabulary item.
 */
export function createReviewCard(vocabularioId) {
  return {
    vocabulario_id: vocabularioId,
    status: 'new',
    step: 0,
    intervalo_dias: 0,
    fator_facilidade: 2.5,
    proxima_revisao: today(),
    ultima_resposta: null,
    total_revisoes: 0,
    lapses: 0
  };
}

/**
 * Normalize legacy cards missing status or step fields.
 */
export function normalizeCard(card) {
  if (!card) return card;
  let status = card.status;
  let step = card.step || 0;
  let intervalo_dias = Number(card.intervalo_dias) || 0;
  let fator_facilidade = Number(card.fator_facilidade) || 2.5;
  let total_revisoes = Number(card.total_revisoes) || 0;
  let lapses = Number(card.lapses) || 0;

  if (!status) {
    if (total_revisoes === 0) {
      status = 'new';
    } else if (intervalo_dias >= 1) {
      status = 'review';
    } else {
      status = 'learning';
    }
  }

  return {
    ...card,
    status,
    step,
    intervalo_dias,
    fator_facilidade,
    total_revisoes,
    lapses
  };
}

/**
 * Process a review response and return updated card data.
 * 
 * @param {object} card - Current review card
 * @param {string} response - "denovo" | "dificil" | "bom" | "facil"
 * @returns {object} Updated card data
 */
export function processReview(card, response) {
  const norm = normalizeCard(card);
  let { status, total_revisoes } = norm;
  total_revisoes++;

  // Determine card phase and process accordingly
  if (status === 'new' || status === 'learning') {
    return processLearningResponse(norm, response, total_revisoes);
  } else if (status === 'review') {
    return processReviewResponse(norm, response, total_revisoes);
  } else if (status === 'relearning') {
    return processRelearningResponse(norm, response, total_revisoes);
  }

  // Fallback — treat unknown status as new
  return processLearningResponse(norm, response, total_revisoes);
}

/**
 * Process response for a card in "learning" or "new" status.
 */
function processLearningResponse(card, response, total_revisoes) {
  let { step, fator_facilidade, lapses } = card;

  switch (response) {
    case 'denovo':
      // Reset to first step
      return {
        ...card,
        status: 'learning',
        step: 0,
        intervalo_dias: 0,
        proxima_revisao: addMinutes(LEARNING_STEPS[0]),
        ultima_resposta: response,
        total_revisoes
      };

    case 'dificil':
      // Repeat current step (average between current and next)
      const currentStepMin = LEARNING_STEPS[step] || LEARNING_STEPS[LEARNING_STEPS.length - 1];
      const nextStepMin = LEARNING_STEPS[step + 1] || currentStepMin;
      const avgMin = Math.round((currentStepMin + nextStepMin) / 2);
      return {
        ...card,
        status: 'learning',
        step: step, // Stay on current step
        intervalo_dias: 0,
        proxima_revisao: addMinutes(avgMin),
        ultima_resposta: response,
        total_revisoes
      };

    case 'bom':
      // Move to next step, or graduate
      const nextStep = step + 1;
      if (nextStep >= LEARNING_STEPS.length) {
        // Graduate to review!
        return {
          ...card,
          status: 'review',
          step: 0,
          intervalo_dias: GRADUATING_INTERVAL,
          fator_facilidade,
          proxima_revisao: addDays(today(), GRADUATING_INTERVAL),
          ultima_resposta: response,
          total_revisoes
        };
      }
      return {
        ...card,
        status: 'learning',
        step: nextStep,
        intervalo_dias: 0,
        proxima_revisao: addMinutes(LEARNING_STEPS[nextStep]),
        ultima_resposta: response,
        total_revisoes
      };

    case 'facil':
      // Graduate immediately with easy interval
      return {
        ...card,
        status: 'review',
        step: 0,
        intervalo_dias: EASY_INTERVAL,
        fator_facilidade: Math.min(3.0, fator_facilidade + 0.15),
        proxima_revisao: addDays(today(), EASY_INTERVAL),
        ultima_resposta: response,
        total_revisoes
      };

    default:
      console.warn('Unknown review response:', response);
      return card;
  }
}

/**
 * Process response for a card in "review" status (mature card).
 * This is where the core SM-2 algorithm runs.
 */
function processReviewResponse(card, response, total_revisoes) {
  let { intervalo_dias, fator_facilidade, lapses } = card;

  switch (response) {
    case 'denovo': {
      // Lapse! Card goes to relearning
      lapses++;
      fator_facilidade = Math.max(MIN_EASE, fator_facilidade - 0.20);
      const newInterval = LAPSE_NEW_INTERVAL_PERCENT > 0
        ? Math.max(1, Math.round(intervalo_dias * LAPSE_NEW_INTERVAL_PERCENT))
        : 1;
      return {
        ...card,
        status: 'relearning',
        step: 0,
        intervalo_dias: newInterval,
        fator_facilidade,
        proxima_revisao: addMinutes(RELEARNING_STEPS[0]),
        ultima_resposta: response,
        total_revisoes,
        lapses
      };
    }

    case 'dificil': {
      // Increase interval by 1.2x, decrease ease
      fator_facilidade = Math.max(MIN_EASE, fator_facilidade - 0.15);
      const newInterval = Math.min(MAX_INTERVAL, 
        Math.max(intervalo_dias + 1, Math.round(intervalo_dias * 1.2 * INTERVAL_MODIFIER)));
      return {
        ...card,
        status: 'review',
        intervalo_dias: newInterval,
        fator_facilidade,
        proxima_revisao: addDays(today(), newInterval),
        ultima_resposta: response,
        total_revisoes,
        lapses
      };
    }

    case 'bom': {
      // Standard SM-2: new_interval = old_interval * ease_factor
      const newInterval = Math.min(MAX_INTERVAL,
        Math.max(intervalo_dias + 1, Math.round(intervalo_dias * fator_facilidade * INTERVAL_MODIFIER)));
      return {
        ...card,
        status: 'review',
        intervalo_dias: newInterval,
        fator_facilidade, // No change to ease on "Good"
        proxima_revisao: addDays(today(), newInterval),
        ultima_resposta: response,
        total_revisoes,
        lapses
      };
    }

    case 'facil': {
      // Boost interval significantly, increase ease
      fator_facilidade = Math.min(3.0, fator_facilidade + 0.15);
      const newInterval = Math.min(MAX_INTERVAL,
        Math.max(intervalo_dias + 1, Math.round(intervalo_dias * fator_facilidade * 1.3 * INTERVAL_MODIFIER)));
      return {
        ...card,
        status: 'review',
        intervalo_dias: newInterval,
        fator_facilidade,
        proxima_revisao: addDays(today(), newInterval),
        ultima_resposta: response,
        total_revisoes,
        lapses
      };
    }

    default:
      console.warn('Unknown review response:', response);
      return card;
  }
}

/**
 * Process response for a card in "relearning" status (lapsed card).
 */
function processRelearningResponse(card, response, total_revisoes) {
  let { step, intervalo_dias, fator_facilidade, lapses } = card;

  switch (response) {
    case 'denovo':
      // Reset to first relearning step
      return {
        ...card,
        status: 'relearning',
        step: 0,
        proxima_revisao: addMinutes(RELEARNING_STEPS[0]),
        ultima_resposta: response,
        total_revisoes
      };

    case 'dificil': {
      // Stay on current step
      const currentMin = RELEARNING_STEPS[step] || RELEARNING_STEPS[RELEARNING_STEPS.length - 1];
      return {
        ...card,
        status: 'relearning',
        step: step,
        proxima_revisao: addMinutes(Math.round(currentMin * 1.5)),
        ultima_resposta: response,
        total_revisoes
      };
    }

    case 'bom': {
      // Move to next step, or graduate back to review
      const nextStep = step + 1;
      if (nextStep >= RELEARNING_STEPS.length) {
        // Graduate back to review with the stored interval
        return {
          ...card,
          status: 'review',
          step: 0,
          proxima_revisao: addDays(today(), intervalo_dias),
          ultima_resposta: response,
          total_revisoes
        };
      }
      return {
        ...card,
        status: 'relearning',
        step: nextStep,
        proxima_revisao: addMinutes(RELEARNING_STEPS[nextStep]),
        ultima_resposta: response,
        total_revisoes
      };
    }

    case 'facil': {
      // Graduate immediately back to review
      return {
        ...card,
        status: 'review',
        step: 0,
        proxima_revisao: addDays(today(), intervalo_dias),
        ultima_resposta: response,
        total_revisoes
      };
    }

    default:
      console.warn('Unknown review response:', response);
      return card;
  }
}

/**
 * Add minutes to the current time and return ISO datetime string.
 */
function addMinutes(minutes) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now.toISOString();
}

/**
 * Get a display label for the next review date.
 */
export function getNextReviewLabel(card) {
  if (!card.proxima_revisao) return 'Agora';

  const nextDate = new Date(card.proxima_revisao);
  const now = new Date();
  const diffMs = nextDate - now;
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes <= 0) return 'Agora';
  if (diffMinutes < 60) return `Em ${diffMinutes} min`;
  if (diffMinutes < 1440) return `Em ${Math.round(diffMinutes / 60)}h`;
  if (diffDays === 1) return 'Amanhã';
  if (diffDays < 7) return `Em ${diffDays} dias`;
  if (diffDays < 30) return `Em ${Math.ceil(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Em ${Math.ceil(diffDays / 30)} meses`;
  return `Em ${Math.round(diffDays / 365)} ano(s)`;
}

/**
 * Get preview intervals for each button based on card state.
 * Used to show "1min", "10min", "1d", "4d" on the buttons.
 */
export function getButtonIntervals(card) {
  const norm = normalizeCard(card);
  const { status, step, intervalo_dias, fator_facilidade } = norm;

  if (status === 'new' || status === 'learning') {
    const currentStep = LEARNING_STEPS[step] || LEARNING_STEPS[LEARNING_STEPS.length - 1];
    const nextStep = LEARNING_STEPS[step + 1] || currentStep;
    const isLastStep = (step + 1) >= LEARNING_STEPS.length;

    return {
      denovo: formatInterval(LEARNING_STEPS[0], 'min'),
      dificil: formatInterval(Math.round((currentStep + nextStep) / 2), 'min'),
      bom: isLastStep ? formatInterval(GRADUATING_INTERVAL, 'day') : formatInterval(nextStep, 'min'),
      facil: formatInterval(EASY_INTERVAL, 'day')
    };
  }

  if (status === 'review') {
    const hardInterval = Math.max(intervalo_dias + 1, Math.round(intervalo_dias * 1.2));
    const goodInterval = Math.max(intervalo_dias + 1, Math.round(intervalo_dias * fator_facilidade));
    const easyInterval = Math.max(intervalo_dias + 1, Math.round(intervalo_dias * fator_facilidade * 1.3));

    return {
      denovo: formatInterval(RELEARNING_STEPS[0], 'min'),
      dificil: formatInterval(Math.min(MAX_INTERVAL, hardInterval), 'day'),
      bom: formatInterval(Math.min(MAX_INTERVAL, goodInterval), 'day'),
      facil: formatInterval(Math.min(MAX_INTERVAL, easyInterval), 'day')
    };
  }

  if (status === 'relearning') {
    const currentStep = RELEARNING_STEPS[step] || RELEARNING_STEPS[RELEARNING_STEPS.length - 1];
    const isLastStep = (step + 1) >= RELEARNING_STEPS.length;

    return {
      denovo: formatInterval(RELEARNING_STEPS[0], 'min'),
      dificil: formatInterval(Math.round(currentStep * 1.5), 'min'),
      bom: isLastStep ? formatInterval(intervalo_dias, 'day') : formatInterval(RELEARNING_STEPS[step + 1] || currentStep, 'min'),
      facil: formatInterval(intervalo_dias, 'day')
    };
  }

  return { denovo: '1min', dificil: '?', bom: '?', facil: '?' };
}

/**
 * Format an interval for display on buttons.
 */
function formatInterval(value, unit) {
  if (unit === 'min') {
    return value < 60 ? `${value}min` : `${Math.round(value / 60)}h`;
  }
  if (unit === 'day') {
    if (value === 0) return 'Agora';
    if (value === 1) return '1d';
    if (value < 30) return `${value}d`;
    if (value < 365) return `${Math.round(value / 30)}m`;
    return `${Math.round(value / 365)}a`;
  }
  return `${value}`;
}

/**
 * Get difficulty badge info based on card state.
 */
export function getDifficultyBadge(card) {
  if (card.status === 'new') return { text: 'Novo', class: 'badge-primary' };
  if (card.status === 'learning') return { text: 'Aprendendo', class: 'badge-warning' };
  if (card.status === 'relearning') return { text: 'Re-aprendendo', class: 'badge-error' };

  // Review status
  if (card.intervalo_dias <= 7) return { text: 'Jovem', class: 'badge-warning' };
  if (card.intervalo_dias <= 30) return { text: 'Bom', class: 'badge-primary' };
  if (card.intervalo_dias <= 90) return { text: 'Maduro', class: 'badge-success' };
  return { text: 'Dominado', class: 'badge-success' };
}

/**
 * Calculate days between two date strings.
 */
function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}
