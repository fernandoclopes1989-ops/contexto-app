# 🎯 Contexto — Estudo de Inglês com Vídeos

Transforme qualquer vídeo do YouTube em uma ferramenta de imersão e aprendizado de inglês pelo método de **Comprehensible Input (i+1)** e **Repetição Espaçada (Anki SM-2)** recomendada por **Mairo Vergara**.

---

## ✨ Principais Funcionalidades

### 🎧 1. IA para Detecção Automática de Trechos Úteis (Looping)
- A Inteligência Artificial analisa a transcrição e o conteúdo do vídeo do YouTube e identifica automaticamente **de 4 a 8 trechos ideais** para praticar listening e repetição.
- Cada trecho detectado destaca as expressões-chave, explica a utilidade pedagógica e permite **iniciar o loop imediato** ou **salvar como trecho próprio** com 1 clique.

### ✂️ 2. Edição de Trechos (Tempos de Início e Fim)
- Além de marcar `Início` e `Fim` com o vídeo tocando, você pode **editar o tempo inicial e final** de qualquer trecho salvo a qualquer momento (clicando no botão `✏️ Editar`).
- Suporta formatação `MM:SS` ou `HH:MM:SS` com validação automática.

### 🔄 3. Algoritmo de Repetição Espaçada Anki (SM-2)
- Implementação fiel do algoritmo **SM-2 do Anki**, estruturado exatamente com a recomendação metodológica do Mairo Vergara:
  - 🔴 **De Novo (Errei) [1]**: Reinicia a aprendizagem do card (passos curtos ou volta para 1 dia), reduzindo o Fator de Facilidade sem penalidade excessiva.
  - 🟢 **Bom [3]**: Avança o intervalo pelo Fator de Facilidade de forma natural e consistente.
  - 🟡 **Difícil [2]**: Avanço conservador mantendo a revisão próxima.
  - ⚠️ **Por que não usamos "Fácil"?** Conforme explicado por Mairo Vergara, o botão "Fácil" no Anki inflaciona artificialmente o multiplicador e afasta o card para muito longe antes que ele esteja consolidado na memória de longo prazo. O app foca nos botões corretos para manter sua curva de retenção calibrada.
- Previsão dinâmica dos próximos intervalos exibida diretamente em cada botão (ex: `< 10 min`, `1 dia`, `3 dias`, `6 dias`).

### 💬 5. Legendas no Vídeo (Inglês, Português, Espanhol)
- Seletor de legendas direto na barra de controle do player: escolha **Inglês** (para imersão total com listening), **Português** ou desative quando quiser testar seus ouvidos.

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

### 🔊 8. Pronúncia Nativa (Áudio TTS)
- Botão de áudio `🔊` em cada palavra salva e card de revisão para ouvir a pronúncia em inglês nativo sem custo algum.

### ☁️ 9. Banco Híbrido: Offline (IndexedDB) + Nuvem (Supabase)
- Seus dados ficam salvos localmente no navegador (IndexedDB) de forma rápida e segura.
- Conecte ao **Supabase gratuito** (configurável em ⚙️ Configurações) para sincronizar seu histórico entre o computador e o celular em tempo real.
- Caso ocorra qualquer oscilação de conexão com a nuvem, o app alterna automaticamente para o banco local sem travamentos.

---

## 🚀 Como Iniciar o Aplicativo

### No Computador (PC):
1. Dê um duplo-clique no arquivo **`Contexto.bat`** (ou no atalho da Área de Trabalho).
2. O servidor local multi-threaded iniciará e o app abrirá automaticamente no seu navegador padrão em:
   ```
   http://localhost:5500/index.html
   ```

### No Celular (Mesmo Wi-Fi):
1. Inicie o app no computador pelo `Contexto.bat`.
2. A janela preta do terminal exibirá o endereço de acesso para o celular, por exemplo:
   ```
   📱 No seu Celular: http://192.168.X.X:5500/index.html
   ```
3. Abra o navegador do celular (Chrome ou Safari) conectado na mesma rede Wi-Fi e digite esse endereço.
4. *(Opcional)* No celular, toque no menu do navegador e escolha **"Adicionar à tela inicial"** para criar um ícone de app no celular.

---

## ⚙️ Configurações Recomendadas

### 1. Chave da IA (Google Gemini — Grátis)
- O app já inclui uma chave padrão pré-configurada para uso imediato.
- Se quiser usar sua própria chave pessoal gratuita:
  1. Acesse [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
  2. Crie uma chave de API gratuita.
  3. No app Contexto, acesse **⚙️ Configurações**, cole sua chave e clique em **Salvar chave**.

### 2. Sincronização em Nuvem (Supabase)
- Caso queira manter seus vídeos e revisões sincronizados entre o PC e o celular:
  1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
  2. No SQL Editor do Supabase, execute o script SQL disponível na tela de Configurações do app.
  3. Preencha a URL e a Chave `anon` nas Configurações do app e clique em **Salvar Supabase**.

---

## 📁 Estrutura do Projeto

```text
contexto_app/
├── index.html           # Página principal (Single Page Application)
├── launch.py            # Servidor local multi-threaded para PC e Mobile
├── Contexto.bat         # Inicializador rápido com 1 clique para Windows
├── src/
│   ├── ai.js            # Integração Gemini API (i+1, transcrições e trechos para loop)
│   ├── db.js            # Camada híbrida IndexedDB + Supabase com fallback
│   ├── srs.js           # Algoritmo de Repetição Espaçada SM-2 (Anki / Mairo Vergara)
│   ├── youtube.js       # Player da YouTube IFrame API com A-B Loop contínuo
│   ├── router.js        # Roteamento SPA por hash (#/videos, #/review, etc.)
│   ├── styles.css       # Design System completo (Dark mode, glassmorphism e responsivo)
│   ├── utils.js         # Formatadores de tempo, notificações toast e helpers
│   ├── supabase.js      # Biblioteca cliente Supabase empacotada localmente
│   └── pages/
│       ├── dashboard.js   # Visão geral de progresso e streak
│       ├── videos.js      # Catálogo e cadastro de novos vídeos do YouTube
│       ├── videoPlayer.js # Player com loop, edição de trechos e IA
│       ├── review.js      # Sessão de revisão Anki SM-2
│       ├── vocabulary.js  # Gestão de vocabulário e áudio TTS
│       ├── practice.js    # Quiz gerado por IA
│       └── settings.js    # Gerenciamento de chaves, nuvem e backups
```
