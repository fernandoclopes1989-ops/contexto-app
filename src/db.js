/**
 * db.js — Hybrid Database wrapper for Contexto App
 * Supports both Local IndexedDB and Cloud Supabase based on settings.
 */

const DB_NAME = 'contexto_db';
const DB_VERSION = 1;

let dbInstance = null;
let supabaseClient = null;
let supabaseInitialized = false;

// --- Local IndexedDB Setup ---
function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos', { keyPath: 'id', autoIncrement: true }).createIndex('youtube_video_id', 'youtube_video_id', { unique: true });
      }
      if (!db.objectStoreNames.contains('clips')) {
        db.createObjectStore('clips', { keyPath: 'id', autoIncrement: true }).createIndex('video_id', 'video_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('vocabulario')) {
        const vocabStore = db.createObjectStore('vocabulario', { keyPath: 'id', autoIncrement: true });
        vocabStore.createIndex('video_id', 'video_id', { unique: false });
        vocabStore.createIndex('clip_id', 'clip_id', { unique: false });
        vocabStore.createIndex('data_criacao', 'data_criacao', { unique: false });
      }
      if (!db.objectStoreNames.contains('revisao')) {
        const reviewStore = db.createObjectStore('revisao', { keyPath: 'id', autoIncrement: true });
        reviewStore.createIndex('vocabulario_id', 'vocabulario_id', { unique: true });
        reviewStore.createIndex('proxima_revisao', 'proxima_revisao', { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('study_log')) {
        db.createObjectStore('study_log', { keyPath: 'date' });
      }
    };
    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

// Local read for settings
async function getSettingLocal(key) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ? request.result.value : null);
    request.onerror = () => resolve(null);
  });
}

export const DEFAULT_SUPABASE_URL = 'https://hgoawmblyqymoxjwiohh.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_S6bd_yGFLw3YXFgWjt9Gjw_oXaB6BQ_';
export const DEFAULT_GEMINI_KEY = 'AQ.Ab8RN6I_gh7GFTPCcdBch9qK7f5h6ExghJN1I9NFyTLV29CIQQ';

async function waitForSupabase(timeout = 3000) {
  const start = Date.now();
  while (!window.supabase && Date.now() - start < timeout) {
    await new Promise(r => setTimeout(r, 50));
  }
  return window.supabase;
}

let initPromise = null;

export async function initSupabase() {
  if (supabaseInitialized && supabaseClient) return supabaseClient;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await waitForSupabase();

    let url = await getSettingLocal('supabase_url');
    let key = await getSettingLocal('supabase_key');

    if (!url || !key) {
      url = DEFAULT_SUPABASE_URL;
      key = DEFAULT_SUPABASE_KEY;
      try {
        await setSetting('supabase_url', url);
        await setSetting('supabase_key', key);
      } catch (e) {
        // Ignore if local storage init isn't complete yet
      }
    }

    if (url && key && window.supabase) {
      try {
        supabaseClient = window.supabase.createClient(url, key);
        console.log('✅ Supabase conectado:', url);
      } catch (e) {
        console.error('Invalid Supabase credentials:', e);
        supabaseClient = null;
      }
    } else {
      console.warn('⚠️ Supabase não configurado ou window.supabase indisponível');
      supabaseClient = null;
    }
    supabaseInitialized = true;
    return supabaseClient;
  })();

  return initPromise;
}

/**
 * Reset Supabase client so next operation re-reads credentials.
 */
export function reinitSupabase() {
  supabaseClient = null;
  supabaseInitialized = false;
  initPromise = null;
}

// --- Generic CRUD Operations (Hybrid) ---

function decodeRevisaoCard(card) {
  if (!card) return card;
  let status = card.status;
  let step = card.step || 0;
  let lapses = card.lapses || 0;
  let proxima_revisao = card.proxima_revisao;
  let ultima_resposta = card.ultima_resposta;

  if (ultima_resposta && typeof ultima_resposta === 'string' && ultima_resposta.includes('|')) {
    const parts = ultima_resposta.split('|');
    ultima_resposta = parts[0] === 'null' ? null : (parts[0] || null);
    status = parts[1] || 'new';
    step = parseInt(parts[2], 10) || 0;
    lapses = parseInt(parts[3], 10) || 0;
    if (parts[4]) {
      proxima_revisao = parts[4];
    }
  }

  return {
    ...card,
    status,
    step,
    lapses,
    proxima_revisao,
    ultima_resposta
  };
}

export async function getAll(storeName) {
  const sb = await initSupabase();
  if (sb && storeName !== 'settings') {
    try {
      const { data, error } = await sb.from(storeName).select('*');
      if (error) throw error;
      if (storeName === 'revisao' && Array.isArray(data)) {
        return data.map(decodeRevisaoCard);
      }
      return data || [];
    } catch (e) {
      console.warn(`Supabase getAll failed on ${storeName}, falling back to IndexedDB:`, e);
      // Fall through to local IndexedDB fallback below
    }
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getById(storeName, id) {
  const sb = await initSupabase();
  if (sb && storeName !== 'settings') {
    const pk = storeName === 'study_log' ? 'date' : 'id';
    try {
      const { data, error } = await sb.from(storeName).select('*').eq(pk, id).single();
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }
      if (storeName === 'revisao' && data) {
        return decodeRevisaoCard(data);
      }
      return data;
    } catch (e) {
      console.warn(`Supabase getById failed on ${storeName}, falling back to IndexedDB:`, e);
      // Fall through to local IndexedDB fallback below
    }
  }
  const db = await openDB();
  const parsedId = isNaN(Number(id)) ? id : Number(id);
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).get(parsedId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getByIndex(storeName, indexName, value) {
  const sb = await initSupabase();
  if (sb && storeName !== 'settings') {
    try {
      const { data, error } = await sb.from(storeName).select('*').eq(indexName, value);
      if (error) throw error;
      if (storeName === 'revisao' && Array.isArray(data)) {
        return data.map(decodeRevisaoCard);
      }
      return data || [];
    } catch (e) {
      console.warn(`Supabase getByIndex failed on ${storeName}, falling back to IndexedDB:`, e);
      // Fall through to local IndexedDB fallback below
    }
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).index(indexName).getAll(value);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function add(storeName, data) {
  const sb = await initSupabase();
  if (sb && storeName !== 'settings') {
    let payload = { ...data };
    if (!payload.id) delete payload.id;
    if (storeName === 'revisao') {
      const allowed = ['vocabulario_id', 'intervalo_dias', 'fator_facilidade', 'proxima_revisao', 'ultima_resposta', 'total_revisoes'];
      const filtered = {};
      allowed.forEach(k => {
        if (payload[k] !== undefined) filtered[k] = payload[k];
      });

      // Pack additional state into the ultima_resposta string
      const response = payload.ultima_resposta || 'null';
      const status = payload.status || 'new';
      const step = payload.step || 0;
      const lapses = payload.lapses || 0;
      const proxima_revisao = payload.proxima_revisao || '';
      filtered.ultima_resposta = `${response}|${status}|${step}|${lapses}|${proxima_revisao}`;

      if (filtered.proxima_revisao && filtered.proxima_revisao.includes('T')) {
        filtered.proxima_revisao = filtered.proxima_revisao.split('T')[0];
      }
      payload = filtered;
    }
    const { data: inserted, error } = await sb.from(storeName).insert([payload]).select().single();
    if (error) throw error;
    if (storeName === 'revisao' && inserted) {
      return decodeRevisaoCard(inserted).id;
    }
    return storeName === 'study_log' ? inserted.date : inserted.id;
  }
  const db = await openDB();
  
  // Se estivermos usando o IndexedDB e não tiver um ID, geramos manualmente 
  // para evitar problemas caso o banco antigo não tenha autoIncrement.
  if (!data.id && storeName !== 'settings' && storeName !== 'study_log') {
    data.id = crypto.randomUUID ? crypto.randomUUID() : Date.now();
  }

  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readwrite').objectStore(storeName).add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function update(storeName, data) {
  const pk = storeName === 'study_log' ? 'date' : 'id';
  const sb = await initSupabase();
  if (sb && storeName !== 'settings') {
    const idVal = data[pk];
    let payload = { ...data };
    delete payload[pk];

    // For revisao table, only send columns present in Supabase schema
    if (storeName === 'revisao') {
      const allowed = ['vocabulario_id', 'intervalo_dias', 'fator_facilidade', 'proxima_revisao', 'ultima_resposta', 'total_revisoes'];
      const filtered = {};
      allowed.forEach(k => {
        if (payload[k] !== undefined) filtered[k] = payload[k];
      });

      // Pack additional state into the ultima_resposta string
      const response = payload.ultima_resposta || 'null';
      const status = payload.status || 'new';
      const step = payload.step || 0;
      const lapses = payload.lapses || 0;
      const proxima_revisao = payload.proxima_revisao || '';
      filtered.ultima_resposta = `${response}|${status}|${step}|${lapses}|${proxima_revisao}`;

      // Ensure date only for PostgreSQL DATE column
      if (filtered.proxima_revisao && filtered.proxima_revisao.includes('T')) {
        filtered.proxima_revisao = filtered.proxima_revisao.split('T')[0];
      }
      payload = filtered;
    }

    const { data: updated, error } = await sb.from(storeName).update(payload).eq(pk, idVal).select().single();
    if (error) throw error;
    if (storeName === 'revisao' && updated) {
      return decodeRevisaoCard(updated);
    }
    return updated;
  }
  const db = await openDB();
  const idVal = data[pk];
  const parsedId = isNaN(Number(idVal)) ? idVal : Number(idVal);
  data[pk] = parsedId;
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readwrite').objectStore(storeName).put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function remove(storeName, id) {
  const sb = await initSupabase();
  if (sb && storeName !== 'settings') {
    const pk = storeName === 'study_log' ? 'date' : 'id';
    const { error } = await sb.from(storeName).delete().eq(pk, id);
    if (error) throw error;
    return;
  }
  const db = await openDB();
  const parsedId = isNaN(Number(id)) ? id : Number(id);
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(parsedId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// --- Convenience functions for specific stores ---

// Videos
export const addVideo = (video) => add('videos', video);
export const getAllVideos = () => getAll('videos');
export const getVideo = (id) => getById('videos', id);
export const deleteVideo = (id) => remove('videos', id);
export const updateVideo = (video) => update('videos', video);

// Clips
export const addClip = (clip) => add('clips', clip);
export const getClipsByVideo = (videoId) => getByIndex('clips', 'video_id', videoId);
export const getClip = (id) => getById('clips', id);
export const deleteClip = (id) => remove('clips', id);
export const updateClip = (clip) => update('clips', clip);

// Vocabulary
export const addVocabulario = (vocab) => add('vocabulario', vocab);
export const getAllVocabulario = () => getAll('vocabulario');
export const getVocabularioByVideo = (videoId) => getByIndex('vocabulario', 'video_id', videoId);
export const getVocabulario = (id) => getById('vocabulario', id);
export const deleteVocabulario = (id) => remove('vocabulario', id);
export const updateVocabulario = (vocab) => update('vocabulario', vocab);

// Review cards
export const addRevisao = (card) => add('revisao', card);
export const getAllRevisao = () => getAll('revisao');
export const getRevisao = (id) => getById('revisao', id);
export const updateRevisao = (card) => update('revisao', card);
export const deleteRevisao = (id) => remove('revisao', id);
export const getRevisaoByVocab = (vocabId) => {
  return getByIndex('revisao', 'vocabulario_id', vocabId).then(res => res.length ? res[0] : null);
};

// Settings (Always Local)
export async function getSetting(key) {
  return getSettingLocal(key);
}

export async function setSetting(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction('settings', 'readwrite').objectStore('settings').put({ key, value });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Study log
export async function logStudyDay(date) {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  try {
    await add('study_log', { date: dateStr });
  } catch (e) {
    // Already logged today, that's fine
  }
}

export async function getStudyLog() {
  return getAll('study_log');
}

/**
 * Calculate current study streak (consecutive days).
 */
export async function getStudyStreak() {
  const logs = await getStudyLog();
  if (!logs || logs.length === 0) return 0;

  const dates = logs.map(l => l.date).sort().reverse();
  const today = new Date().toISOString().split('T')[0];

  let streak = 0;
  let checkDate = new Date();

  if (dates[0] !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (dates[0] !== yesterdayStr) return 0;
    checkDate = yesterday;
  }

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get count of review cards due today.
 */
export async function getDueReviewCount() {
  const allCards = await getAllRevisao();
  if (!allCards || allCards.length === 0) return 0;
  const nowIso = new Date().toISOString();
  const todayStr = nowIso.split('T')[0];
  return allCards.filter(c => {
    if (!c.proxima_revisao) return true;
    if (c.proxima_revisao.length === 10) {
      return c.proxima_revisao <= todayStr;
    }
    return c.proxima_revisao <= nowIso;
  }).length;
}

/**
 * Get review cards due today.
 */
export async function getDueReviews() {
  const allCards = await getAllRevisao();
  if (!allCards || allCards.length === 0) return [];
  const nowIso = new Date().toISOString();
  const todayStr = nowIso.split('T')[0];
  return allCards.filter(c => {
    if (!c.proxima_revisao) return true;
    if (c.proxima_revisao.length === 10) {
      return c.proxima_revisao <= todayStr;
    }
    return c.proxima_revisao <= nowIso;
  });
}
