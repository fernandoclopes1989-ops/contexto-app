# 🎯 Contexto — Estudo de Inglês com Vídeos

Transforme qualquer vídeo do YouTube em uma ferramenta de imersão e aprendizado de inglês pelo método de **Comprehensible Input (i+1)** e **Repetição Espaçada (Anki SM-2)** recomendada por **Mairo Vergara**.

---

## ✨ Principais Funcionalidades

### 🎧 1. IA para Detecção Automática de Trechos Úteis (Looping)
- A Inteligência Artificial analisa a transcrição e o conteúdo do vídeo do YouTube e identifica automaticamente **de 4 a 8 trechos ideais** para praticar listening e repetição.
- Cada trecho detectado destaca as expressões-chave, explica a utilidade pedagógica e permite **iniciar o loop imediato** ou **salvar como trecho próprio** com 1 clique.

### 🔍 2. Busca Direta do YouTube (Couch Mode 🛋️)
- **Adeus copiar e colar links!** Agora, se você estiver estudando no celular enquanto assiste TV, basta usar a nova barra de busca integrada.
- Digite palavras-chave (ex: *"Steve Jobs Commencement"* ou *"Ted Talk Leadership"*) e o aplicativo busca diretamente no YouTube, permitindo adicionar o vídeo e sua transcrição correspondente com **1 único clique**.

### 🔄 3. Algoritmo de Repetição Espaçada Anki (SM-2) com Virada de Dia às 3:00 AM
- Implementação fiel do algoritmo **SM-2 do Anki**, estruturado exatamente com a recomendação metodológica do Mairo Vergara:
  - 🔴 **De Novo (Errei) [1]**: Reinicia a aprendizagem do card (passos curtos ou volta para 1 dia), reduzindo o Fator de Facilidade sem penalidade excessiva.
  - 🟢 **Bom [3]**: Avança o intervalo pelo Fator de Facilidade de forma natural e consistente.
  - 🟡 **Difícil [2]**: Avanço conservador mantendo a revisão próxima.
  - ⚠️ **Por que não usamos "Fácil"?** Conforme explicado por Mairo Vergara, o botão "Fácil" no Anki inflaciona artificialmente o multiplicador e afasta o card para muito longe antes que ele esteja consolidado na memória de longo prazo. O app foca nos botões corretos para manter sua curva de retenção calibrada.
- **Virada de Dia Anki-Style (3:00 AM local):** Seu dia de estudos não vira no meio da noite UTC ou do Brasil! Se você estuda até tarde de madrugada, o dia de revisão e sua ofensiva/streak continuam mantidos até as 3:00 da manhã do seu fuso horário local. Além disso, cartões programados para amanhã são liberados pontualmente às 3:00 AM, evitando tempos de espera em horas quebradas!

### 🔊 4. Pronúncia Nativa Completa (Áudio TTS de Palavras e Sentenças)
- O aplicativo utiliza síntese de voz nativa (`speechSynthesis` em inglês americano) de forma gratuita e rápida:
  - **Ouvir Palavras:** Escute a palavra isolada clicando no ícone ao lado do termo principal.
  - **Ouvir Sentenças i+1:** Escute a frase completa de exemplo com a entonação correta de orações clicando em **Ouvir Frase**.
  - **Revisão Auditiva:** Durante a revisão do dia, você pode clicar em **Ouvir Frase** na tela da pergunta (antes de revelar a resposta) para tentar adivinhar o significado usando somente os seus ouvidos!

### 📱 5. Instalação como Aplicativo Nativo PWA (Progressive Web App)
- O aplicativo é uma PWA oficial e em conformidade técnica com o Google Chrome, Microsoft Edge e iOS Safari:
  - Inclui um manifesto de instalação oficial (`/manifest.json`) em conformidade técnica, configurando o app em tela cheia e cor de tema escura personalizada.
  - Possui um **Service Worker (`sw.js`)** dedicado que gerencia o cache de arquivos estáticos críticos, acelerando o carregamento do app e garantindo que ele carregue mesmo sem conexão com a internet ou em redes lentas de celular.
  - **Sem Erros 404:** O sistema de roteamento SPA mapeia a entrada de inicialização no diretório `/public` garantindo instalação estável pós-build de produção.

### 🤖 6. Cards de Vocabulário i+1 com IA (Google Gemini 100% Grátis)
- Extração de chunks, phrasal verbs e expressões reais do vídeo.
- Geração de explicações no padrão **i+1**: definição em inglês simples (A1/A2), nova frase de exemplo prática e aviso de "armadilha para brasileiros" (*brazilian trap*).
- Compatível com a geração mais recente do Google Gemini (modelos `gemini-3.5-flash` e `gemini-3.8-flash`), aceitando as novas chaves `AQ...` do Google AI Studio.

### ⌨️ 7. Atalhos Rápidos de Teclado
Tornam o estudo com vídeos instantâneo e sem precisar do mouse toda hora:
- `[` ou `I`: Marcar início do trecho no tempo atual do vídeo
- `]` ou `O`: Marcar fim do trecho no tempo atual do vídeo
- `L`: Ligar / Desligar o Loop do trecho
- `Espaço`: Play / Pause do vídeo
- `←` e `→`: Voltar ou avançar 5 segundos
- `1`, `2`, `3`: Avaliar card na tela de revisão (De Novo, Difícil, Bom)

### ☁️ 8. Banco Híbrido: Offline (IndexedDB) + Nuvem (Supabase)
- Seus dados ficam salvos localmente no navegador (IndexedDB) de forma rápida e segura.
- Conecte ao **Supabase gratuito** (configurável em ⚙️ Configurações) para sincronizar seu histórico entre o computador e o celular em tempo real.
- Caso ocorra qualquer oscilação de conexão com a nuvem, o app alterna automaticamente para o banco local sem travamentos.

---

## 📁 Estrutura do Projeto

```text
contexto_app/
├── index.html           # Página principal (Single Page Application)
├── package.json         # Dependências do NodeJS e scripts de compilação
├── vite.config.js       # Configurações do Vite (servidor, proxies e middlewares de transcrição/pesquisa)
├── public/              # Pasta de arquivos estáticos distribuídos integralmente pós-compilação
│   ├── manifest.json    # Manifesto de instalação da PWA (standalone)
│   └── sw.js            # Service Worker oficial para cache e robustez offline
├── src/
│   ├── ai.js            # Integração Gemini API (i+1, transcrições e trechos para loop)
│   ├── db.js            # Camada híbrida IndexedDB + Supabase com fallback e timezone de 3:00 AM
│   ├── srs.js           # Algoritmo de Repetição Espaçada SM-2 (Anki / Mairo Vergara)
│   ├── youtube.js       # Player da YouTube IFrame API com A-B Loop contínuo
│   ├── router.js        # Roteamento SPA por hash (#/videos, #/review, etc.)
│   ├── styles.css       # Design System completo (Dark mode, glassmorphism e responsivo)
│   ├── utils.js         # Formatadores de tempo com fuso de virada de dia, toasts e helpers
│   ├── supabase.js      # Biblioteca cliente Supabase empacotada localmente
│   └── pages/
│       ├── dashboard.js   # Visão geral de progresso e streak
│       ├── videos.js      # Catálogo e busca direta do YouTube (Couch Mode)
│       ├── videoPlayer.js # Player com loop, edição de trechos, pronúncias e IA
│       ├── review.js      # Sessão de revisão Anki SM-2 com suporte auditivo
│       ├── vocabulary.js  # Gestão de vocabulário, status de cards e pronúncias de frases
│       ├── practice.js    # Quiz gerado por IA
│       └── settings.js    # Gerenciamento de chaves, nuvem e backups
```
