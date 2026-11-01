/**
 * settings.js — Settings page (API key, data management)
 */

import { getSetting, setSetting, getAllVideos, getAllVocabulario, getAllRevisao, getAll, reinitSupabase, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY } from '../db.js';
import { showToast, escapeHtml } from '../utils.js';
import { getPhrasePhonetics, analyzeConnectedSpeech } from '../services/phoneticService.js';

export async function renderSettings(container) {
  const apiKey = await getSetting('gemini_api_key') || '';
  
  let videos = [], vocab = [], reviews = [];
  try {
    videos = await getAllVideos();
    vocab = await getAllVocabulario();
    reviews = await getAllRevisao();
  } catch (err) {
    console.error('Failed to load data for settings summary:', err);
  }
  
  const supabaseUrl = await getSetting('supabase_url') || DEFAULT_SUPABASE_URL;
  const supabaseKey = await getSetting('supabase_key') || DEFAULT_SUPABASE_KEY;
  const isSupabaseEnabled = Boolean(supabaseUrl && supabaseKey);

  const maskedKey = apiKey ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4) : '';
  const maskedSupabaseKey = supabaseKey ? supabaseKey.substring(0, 10) + '...' + supabaseKey.substring(supabaseKey.length - 4) : '';

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">⚙️ Configurações</h1>
    </div>

    <!-- API Key -->
    <div class="settings-section">
      <div class="settings-section-title">🔑 Chave de API (Google Gemini 100% Grátis)</div>
      <div class="settings-card">
        <p class="text-sm text-muted mb-4">
          Necessária apenas para o módulo "Praticar com IA". Os demais módulos funcionam sem chave.
          A chave fica salva apenas localmente no seu navegador.
        </p>
        <div class="input-group">
          <label class="input-label" for="api-key-input">API Key</label>
          <input
            type="password"
            id="api-key-input"
            class="input api-key-input"
            placeholder="AIza..."
            value="${escapeHtml(apiKey)}"
          />
        </div>
        <div class="flex gap-3">
          <button id="save-api-key" class="btn btn-primary">Salvar chave</button>
          <button id="toggle-key-visibility" class="btn btn-ghost">👁️ Mostrar/Ocultar</button>
        </div>
        ${apiKey ? `<p class="settings-note mt-2">✅ Chave configurada: ${escapeHtml(maskedKey)}</p>` : `<p class="settings-note mt-2">⚠️ Nenhuma chave configurada</p>`}
        <hr class="divider" />
        <p class="settings-note">
          <strong>Como obter sua chave GRATUITA (Leva 1 minuto):</strong><br>
          1. Acesse <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="color: var(--accent-secondary);">aistudio.google.com/app/apikey</a><br>
          2. Faça login com sua conta Google<br>
          3. Clique no botão azul "Create API key"<br>
          4. Copie a chave (ela começa com AIza...) e cole acima.<br>
          <br>
          <strong>Custo estimado:</strong> R$ 0,00 (100% Gratuito). O plano gratuito permite milhares de análises por mês, mais que suficiente para seu uso pessoal.
        </p>
      </div>
    </div>

    <!-- Supabase Sync -->
    <div class="settings-section">
      <div class="settings-section-title">☁️ Sincronização em Nuvem (Supabase)</div>
      <div class="settings-card">
        <p class="text-sm text-muted mb-4">
          Conecte o seu banco de dados gratuito do Supabase para ter os seus dados sincronizados entre o PC e o celular em tempo real.
        </p>
        <div class="input-group">
          <label class="input-label" for="supabase-url-input">Supabase URL</label>
          <input type="text" id="supabase-url-input" class="input api-key-input" placeholder="https://xxxx.supabase.co" value="${escapeHtml(supabaseUrl)}" />
        </div>
        <div class="input-group">
          <label class="input-label" for="supabase-key-input">Supabase Key (anon)</label>
          <input type="password" id="supabase-key-input" class="input api-key-input" placeholder="eyJhbG..." value="${escapeHtml(supabaseKey)}" />
        </div>
        <div class="flex gap-3">
          <button id="save-supabase-keys" class="btn btn-primary">Salvar Supabase</button>
        </div>
        ${isSupabaseEnabled ? `<p class="settings-note mt-2" style="color: var(--success);">✅ Nuvem Ativada! Todos os dados serão salvos no Supabase.</p>` : `<p class="settings-note mt-2">⚠️ Nuvem Desativada (Modo Offline)</p>`}
        
        <hr class="divider" />
        <p class="settings-note">
          <strong>Como configurar as tabelas no Supabase:</strong><br>
          Antes de ativar, vá no SQL Editor do seu Supabase e rode o código abaixo para criar as tabelas necessárias:
        </p>
        <div style="background: var(--bg-primary); padding: var(--space-4); border-radius: var(--radius-md); font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto; margin-top: var(--space-2); white-space: pre-wrap; color: var(--text-secondary);">
CREATE TABLE videos ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), youtube_video_id TEXT UNIQUE NOT NULL, titulo TEXT NOT NULL, data_adicionado TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
CREATE TABLE clips ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), video_id UUID REFERENCES videos(id) ON DELETE CASCADE, nome TEXT, tempo_inicio NUMERIC NOT NULL, tempo_fim NUMERIC NOT NULL );
CREATE TABLE vocabulario ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), video_id UUID REFERENCES videos(id) ON DELETE CASCADE, clip_id UUID REFERENCES clips(id) ON DELETE CASCADE, timestamp NUMERIC, palavra_ou_expressao TEXT NOT NULL, frase_contexto TEXT, traducao_significado TEXT, data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
CREATE TABLE revisao ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), vocabulario_id UUID REFERENCES vocabulario(id) ON DELETE CASCADE UNIQUE, intervalo_dias NUMERIC DEFAULT 1, fator_facilidade NUMERIC DEFAULT 2.5, proxima_revisao DATE, ultima_resposta TEXT, total_revisoes NUMERIC DEFAULT 0 );
CREATE TABLE study_log ( date DATE PRIMARY KEY );
        </div>
    </div>

    <!-- Phonetic Conversion Matrix (Transparency & Governance) -->
    <div class="settings-section">
      <div class="settings-section-title">🛡️ Matriz de Conversão Fonética Obrigatória (Regras Ativas)</div>
      <div class="settings-card">
        <p class="text-sm text-muted mb-3" style="line-height: 1.5;">
          Esta matriz define as <strong>regras rígidas de fonologia do inglês americano</strong> aplicadas tanto no motor offline quanto no sincronizador da nuvem. O objetivo é eliminar o "abrasileiramento" literal de letras e guiar a memória muscular para o som nativo real.
        </p>

        <!-- Rules Matrix Grid: 6 Grandes Fenômenos do Connected Speech & Fonética Obrigatória -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-bottom: var(--space-4);">
          
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(239,68,68,0.25); border-radius: var(--radius-md); padding: 12px;">
            <div style="font-weight: 700; color: #f87171; font-size: 13px; margin-bottom: 4px;">1. Flap T & Flap D (/ɾ/ ➔ R Brando)</div>
            <p class="text-xs text-muted" style="line-height: 1.4; margin-bottom: 6px;">T ou D entre sons de vogal viram o <strong>'R' fraco brasileiro</strong> (como em 'cara/barata'). <em>Proibição de manter T ou D!</em></p>
            <div style="font-size: 11px; font-family: monospace; color: #38bdf8; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">
              • made a ➔ MÊIra (NUNCA "mêida")<br>
              • water ➔ uórer | better ➔ bérer<br>
              • put it ➔ PÚrit | but I ➔ BÂRai<br>
              • had a ➔ RÉra | about it ➔ aBAUrit
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(245,158,11,0.25); border-radius: var(--radius-md); padding: 12px;">
            <div style="font-weight: 700; color: #fbbf24; font-size: 13px; margin-bottom: 4px;">2. Elision (Omissão de Sons)</div>
            <p class="text-xs text-muted" style="line-height: 1.4; margin-bottom: 6px;">H mudo em pronomes átonos (him, her, his) e desaparecimento de T/D em encontros consonantais.</p>
            <div style="font-size: 11px; font-family: monospace; color: #38bdf8; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">
              • tell him ➔ TÉlim (some o H)<br>
              • with her ➔ UÍZâr (some o H)<br>
              • and I ➔ eNAI (some o D)<br>
              • just as ➔ DJÂSaz (some o T)
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(168,85,247,0.25); border-radius: var(--radius-md); padding: 12px;">
            <div style="font-weight: 700; color: #c084fc; font-size: 13px; margin-bottom: 4px;">3. Assimilation (Fusão em TCH / DJ)</div>
            <p class="text-xs text-muted" style="line-height: 1.4; margin-bottom: 6px;">T final fundido com Y vira <strong>/tʃ/ ("tch")</strong>; D final com Y vira <strong>/dʒ/ ("dj")</strong>.</p>
            <div style="font-size: 11px; font-family: monospace; color: #38bdf8; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">
              • did you ➔ DIdju<br>
              • would you ➔ uúDJU<br>
              • don't you ➔ DÔNTchu<br>
              • meet you ➔ MÍTchu
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(59,130,246,0.25); border-radius: var(--radius-md); padding: 12px;">
            <div style="font-weight: 700; color: #60a5fa; font-size: 13px; margin-bottom: 4px;">4. Glottal Stop / T Preso (ʔ)</div>
            <p class="text-xs text-muted" style="line-height: 1.4; margin-bottom: 6px;">Antes de N silábico ou consoante, o T é interrompido na garganta (corte seco sem soltar o ar).</p>
            <div style="font-size: 11px; font-family: monospace; color: #38bdf8; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">
              • mountain ➔ máun'n<br>
              • button ➔ bâ'n<br>
              • cotton ➔ kó'n | written ➔ rí'n<br>
              • exactly ➔ igzák'li
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(16,185,129,0.25); border-radius: var(--radius-md); padding: 12px;">
            <div style="font-weight: 700; color: #34d399; font-size: 13px; margin-bottom: 4px;">5. Schwa & Reduções (/ə/ e /ʌ/)</div>
            <p class="text-xs text-muted" style="line-height: 1.4; margin-bottom: 6px;">Palavras gramaticais átonas se reduzem a <strong>"â"</strong> ou <strong>"e"</strong> curto, nunca vogal cheia.</p>
            <div style="font-size: 11px; font-family: monospace; color: #38bdf8; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">
              • to do ➔ tâ DU | for me ➔ fâr MÍ<br>
              • can go ➔ kên GOU | a man ➔ a MÊN<br>
              • money ➔ mâni (não "monêi")<br>
              • welcome ➔ uélkâm (não "uelkôum")
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(236,72,153,0.25); border-radius: var(--radius-md); padding: 12px;">
            <div style="font-weight: 700; color: #f472b6; font-size: 13px; margin-bottom: 4px;">6. Catenation (Linking C-V Contínuo)</div>
            <p class="text-xs text-muted" style="line-height: 1.4; margin-bottom: 6px;">Consoante desliza suavemente para a vogal seguinte. Bloco único em MAIÚSCULAS na tônica, ZERO hífens.</p>
            <div style="font-size: 11px; font-family: monospace; color: #38bdf8; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">
              • eyes of ➔ ÁIzov (eyes = áiz)<br>
              • showed up ➔ CHOUDâp<br>
              • welcome in ➔ uélkâMIN<br>
              • girlfriend ➔ gârlfrend (G duro)
            </div>
          </div>

        </div>

        <!-- Interactive Phonetic Tester -->
        <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: var(--space-4);">
          <strong style="font-size: 13px; color: #fff; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span>🔬</span> <span>Testador ao Vivo da Matriz Fonética:</span>
          </strong>
          <p class="text-xs text-muted mb-3">Digite qualquer frase em inglês para auditar instantaneamente o resultado do motor com as regras ativas:</p>
          <div style="display: flex; gap: 8px; margin-bottom: 10px;">
            <input type="text" id="phonetic-test-input" class="input" placeholder="Ex: If I showed up here with my new girlfriend..." value="If I showed up here with my new girlfriend, she wouldn't be welcome in" style="flex: 1;" />
            <button id="btn-test-phonetics" class="btn btn-primary" style="white-space: nowrap;">⚡ Auditar Frase</button>
          </div>
          <div id="phonetic-test-output" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; font-size: 12px; display: none;">
            <!-- Output dynamically generated -->
          </div>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">📊 Seus dados</div>
      <div class="settings-card">
        <div class="stats-grid" style="margin-bottom: 0;">
          <div class="stat-card">
            <span class="stat-icon">🎬</span>
            <div class="stat-value">${videos.length}</div>
            <div class="stat-label">Vídeos</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📝</span>
            <div class="stat-value">${vocab.length}</div>
            <div class="stat-label">Palavras</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🔄</span>
            <div class="stat-value">${reviews.length}</div>
            <div class="stat-label">Cards de revisão</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export / Import -->
    <div class="settings-section">
      <div class="settings-section-title">💾 Backup</div>
      <div class="settings-card">
        <p class="text-sm text-muted mb-4">
          Exporte seus dados para um arquivo JSON para backup. Você pode importar depois se precisar.
        </p>
        <div class="flex gap-3">
          <button id="export-data" class="btn btn-secondary">📥 Exportar dados</button>
          <label class="btn btn-secondary" style="cursor: pointer;">
            📤 Importar dados
            <input type="file" id="import-data" accept=".json" style="display: none;" />
          </label>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="settings-section">
      <div class="settings-section-title" style="color: var(--error);">⚠️ Zona de perigo</div>
      <div class="settings-card" style="border-color: var(--error-dim);">
        <p class="text-sm text-muted mb-4">Ações irreversíveis. Use com cautela.</p>
        <button id="clear-all-data" class="btn btn-danger">🗑️ Apagar todos os dados</button>
      </div>
    </div>
  `;

  // Event listeners
  setupSettingsListeners(container);
}

function setupSettingsListeners(container) {
  // Save API key
  container.querySelector('#save-api-key').addEventListener('click', async () => {
    const input = container.querySelector('#api-key-input');
    const key = input.value.trim();
    await setSetting('gemini_api_key', key);
    showToast(key ? 'Chave de API salva! ✅' : 'Chave de API removida', key ? 'success' : 'info');
    renderSettings(container);
  });

  // Save Supabase keys
  container.querySelector('#save-supabase-keys').addEventListener('click', async () => {
    const url = container.querySelector('#supabase-url-input').value.trim();
    const key = container.querySelector('#supabase-key-input').value.trim();
    
    // Save to IndexedDB regardless (since settings are local)
    await setSetting('supabase_url', url);
    await setSetting('supabase_key', key);
    
    if (url && key) {
      showToast('Chaves do Supabase salvas. O app agora vai usar a nuvem!', 'success');
    } else {
      showToast('Desconectado do Supabase. O app voltou pro modo Local (Offline).', 'info');
    }
    
    // Reset Supabase client to pick up new credentials
    reinitSupabase();
    renderSettings(container);
  });

  // Toggle key visibility
  container.querySelector('#toggle-key-visibility').addEventListener('click', () => {
    const input = container.querySelector('#api-key-input');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Test Phonetic Conversion Matrix live
  const btnTestPhonetics = container.querySelector('#btn-test-phonetics');
  const testInput = container.querySelector('#phonetic-test-input');
  const testOutput = container.querySelector('#phonetic-test-output');
  if (btnTestPhonetics && testInput && testOutput) {
    const runPhoneticTest = () => {
      const phrase = testInput.value.trim();
      if (!phrase) {
        testOutput.style.display = 'none';
        return;
      }
      const p = getPhrasePhonetics(phrase);
      const cs = analyzeConnectedSpeech(phrase);
      testOutput.style.display = 'block';
      testOutput.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div>
            <span style="font-size: 10px; font-weight: 800; color: var(--accent-secondary); text-transform: uppercase;">1. Transcrição IPA Oficial:</span>
            <div style="font-family: monospace; font-size: 13px; color: var(--accent-secondary); margin-top: 2px;">${escapeHtml(p.ipa || '—')}</div>
          </div>
          <div>
            <span style="font-size: 10px; font-weight: 800; color: #fbbf24; text-transform: uppercase;">2. Palavra a Palavra (Regras da Matriz):</span>
            <div style="font-size: 13px; color: #fbbf24; font-style: italic; margin-top: 2px;">${escapeHtml(p.br || '—')}</div>
          </div>
          <div>
            <span style="font-size: 10px; font-weight: 800; color: #67e8f9; text-transform: uppercase;">3. Como Soa na Fala Real (Connected Speech):</span>
            <div style="font-size: 14px; font-weight: 800; color: #67e8f9; margin-top: 2px;">${escapeHtml(p.connectedBr || '—')}</div>
          </div>
          ${cs.soundGuide && cs.soundGuide.length > 0 ? `
            <div style="margin-top: 4px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
              <span style="font-size: 10px; font-weight: 800; color: #34d399; text-transform: uppercase;">4. Junções e Atalhos Sonoros Detectados (${cs.soundGuide.length}):</span>
              <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                ${cs.soundGuide.map(g => `
                  <div style="font-size: 11px; color: #e2e8f0; background: rgba(255,255,255,0.03); padding: 4px 8px; border-radius: 4px;">
                    <strong style="color: #fbbf24;">${escapeHtml(g.words)}</strong> ➔ <span style="color: #38bdf8; font-weight: 700;">"${escapeHtml(g.sound)}"</span>
                    <span style="color: var(--text-muted); font-size: 10px;"> (${escapeHtml(g.detail)})</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Nenhuma emenda complexa nesta frase isolada.</div>
          `}
        </div>
      `;
    };

    btnTestPhonetics.addEventListener('click', runPhoneticTest);
    testInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runPhoneticTest();
    });
  }

  // Export data
  container.querySelector('#export-data').addEventListener('click', async () => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        version: 1,
        videos: await getAllVideos(),
        clips: await getAll('clips'),
        vocabulario: await getAllVocabulario(),
        revisao: await getAllRevisao(),
        study_log: await getAll('study_log')
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contexto-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showToast('Dados exportados com sucesso! 📥', 'success');
    } catch (err) {
      showToast('Erro ao exportar dados', 'error');
    }
  });

  // Import data
  container.querySelector('#import-data').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !data.videos) {
        throw new Error('Invalid backup file');
      }

      if (!confirm(`Importar dados? Isso vai SUBSTITUIR todos os dados atuais.\n\nArquivo contém:\n- ${data.videos?.length || 0} vídeos\n- ${data.vocabulario?.length || 0} palavras\n- ${data.revisao?.length || 0} cards de revisão`)) {
        return;
      }

      // Clear existing data and import
      const { add } = await import('../db.js');
      const stores = ['videos', 'clips', 'vocabulario', 'revisao', 'study_log'];

      // We need to clear stores first - using a workaround
      for (const storeName of stores) {
        const items = await getAll(storeName);
        const { remove } = await import('../db.js');
        for (const item of items) {
          await remove(storeName, item.id || item.key || item.date);
        }
      }

      // Import each store
      if (data.videos) for (const item of data.videos) await add('videos', item);
      if (data.clips) for (const item of data.clips) await add('clips', item);
      if (data.vocabulario) for (const item of data.vocabulario) await add('vocabulario', item);
      if (data.revisao) for (const item of data.revisao) await add('revisao', item);
      if (data.study_log) for (const item of data.study_log) await add('study_log', item);

      showToast('Dados importados com sucesso! 📤', 'success');
      renderSettings(container);
    } catch (err) {
      console.error('Import error:', err);
      showToast('Erro ao importar arquivo. Verifique se é um backup válido.', 'error');
    }
  });

  // Clear all data
  container.querySelector('#clear-all-data').addEventListener('click', async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso vai apagar TODOS os seus dados (vídeos, vocabulário, revisões). Essa ação é irreversível!\n\nTem certeza?')) return;
    if (!confirm('Última chance! Tem certeza MESMO que quer apagar tudo?')) return;

    try {
      const stores = ['videos', 'clips', 'vocabulario', 'revisao', 'study_log', 'settings'];
      const { remove } = await import('../db.js');

      for (const storeName of stores) {
        const items = await getAll(storeName);
        for (const item of items) {
          await remove(storeName, item.id || item.key || item.date);
        }
      }

      showToast('Todos os dados foram apagados', 'info');
      renderSettings(container);
    } catch (err) {
      showToast('Erro ao apagar dados', 'error');
    }
  });
}
