import streamlit as st
import datetime
import json
import os
import google.generativeai as genai
from dotenv import load_dotenv
import random
import re
import pandas as pd
import streamlit.components.v1 as components
from supabase import create_client, Client

# Configurações iniciais
load_dotenv()

# --- BARREIRA DE SEGURANÇA (SENHA MESTRA) ---
if "authenticated" not in st.session_state:
    st.session_state.authenticated = False

if not st.session_state.authenticated:
    st.title("🔒 Acesso Restrito")
    st.markdown("Bem-vinda ao seu cofre de fluência. Digite a senha para entrar.")
    
    with st.form("login_form"):
        pwd = st.text_input("Senha Mestra", type="password")
        submit = st.form_submit_button("Entrar", type="primary")
        
        if submit:
            # A senha padrão é feh123 se você não colocar outra
            correct_pwd = os.getenv("APP_PASSWORD", "feh123")
            if pwd == correct_pwd:
                st.session_state.authenticated = True
                st.rerun()
            else:
                st.error("Senha incorreta! Invasor detectado. 🚨")
    
    # O comando st.stop() mata a execução do código aqui. Nada carrega embaixo.
    st.stop()
# --------------------------------------------

API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    st.error("⚠️ ERRO: Chave GEMINI_API_KEY não encontrada no .env")

# Conexão Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    st.error("⚠️ ERRO: Credenciais do Supabase não encontradas no .env")

# Criação do Motor do Agente
def init_agent(system_instruction):
    # Usando gemini-2.5-flash para garantir cota alta na versão gratuita (1500 req/dia)
    return genai.GenerativeModel(
        model_name='gemini-2.5-flash',
        system_instruction=system_instruction
    )

def tts_buttons(text):
    safe_text = text.replace('"', '\\"').replace("'", "\\'").replace('\n', ' ')
    html_code = f"""
    <div style="display: flex; gap: 10px; width: 100%; flex-wrap: wrap;">
        <button onclick='speak(0.9)' style='flex: 1 1 45%; min-width: 150px; background-color:#0078D7; color:white; font-weight:bold; border:none; padding:12px; border-radius:8px; cursor:pointer;'>
            🔊 Som Claro (0.9x)
        </button>
        <button onclick='speak(1.3)' style='flex: 1 1 45%; min-width: 150px; background-color:#E81123; color:white; font-weight:bold; border:none; padding:12px; border-radius:8px; cursor:pointer;'>
            🚀 Modo Filme (1.3x)
        </button>
    </div>
    <script>
    function speak(speed) {{
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("{safe_text}");
        utterance.lang = "en-US";
        utterance.rate = speed; 
        window.speechSynthesis.speak(utterance);
    }}
    </script>
    """
    components.html(html_code, height=60)

def generate_definition(word, simplify_count=0, mode="word"):
    persona = """You are a STRICT Monolingual English Teacher.
YOUR RULES:
1. 100% ENGLISH: The response MUST be 100% in ENGLISH. No Portuguese allowed anywhere.
2. i+1 PHILOSOPHY: Explain using ONLY ultra-basic A1/A2 English vocabulary. 
3. CONNECTED SPEECH: Explain how native speakers link the sounds. Use intuitive phonetic spelling (e.g., "my-daz-well").
4. NEGRITO (BOLD): You MUST wrap the target word or expression in markdown bold (e.g., "**word**").
Return STRICTLY a JSON: {"definition": "...", "example": "...", "pronunciation": "...", "formula": "...", "trap": "..."}."""
    
    agent = init_agent(persona)

    if mode == "raio_x":
        prompt = f"""The student heard this phrase in a movie and couldn't decode the fast pronunciation: "{word}".
Act as an expert Phonetic Coach.
1. 'definition': Explain the Connected Speech rule happening here in simple English.
2. 'example': Generate 1 brand NEW, different English sentence that uses the EXACT SAME phonetic pattern so they can practice. YOU MUST BOLD the part where the sound connects.
3. 'pronunciation': Show the intuitive phonetic spelling (e.g., "whatcha").
4. 'formula': What is the grammatical or structural formula of this phrase? (e.g., "What + did + you + verb")
5. 'trap': What is the most common mistake a native Portuguese speaker makes when trying to say or listen to this?
Return JSON with 'definition', 'example', 'pronunciation', 'formula', and 'trap'."""
    elif simplify_count > 0:
        idade = max(4, 12 - (simplify_count * 2))
        prompt = f"""Explain "{word}" to a {idade}-year-old child. 
Use EXTREMELY basic English. 
Return the JSON with 1 obvious English example (bold the target word), pronunciation tip, a simple formula, and a trap to avoid."""
    else:
        prompt = f"""Generate the English definition, 1 English example (bold the target word), the English Connected Speech tip, the structural Formula (e.g., [Subject] + {word} + [Verb]), and the 'Brazilian Trap' (the most common mistake Portuguese speakers make with this word) for "{word}"."""

    try:
        response = agent.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
    except Exception as e:
        st.error(f"Erro na IA: {e}")
        return None

def add_word(word, definition, example_sentence):
    today = datetime.date.today().isoformat()
    tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
    try:
        supabase.table('words').insert({
            "word": word,
            "definition": definition,
            "example_sentence": example_sentence,
            "level": 0,
            "next_review": tomorrow,
            "added_date": today
        }).execute()
        st.success(f"✅ Expressão salva com contexto! Ela aparecerá no seu Mix amanhã.")
    except Exception as e:
        st.error(f"Erro ao salvar no banco de dados. Verifique as colunas do Supabase: {e}")

def count_added_today():
    today = datetime.date.today().isoformat()
    try:
        response = supabase.table('words').select('*', count='exact').eq('added_date', today).execute()
        return response.count if response.count is not None else 0
    except:
        return 0

def get_words_for_review(limit=40):
    today = datetime.date.today().isoformat()
    try:
        response = supabase.table('words').select('word, level, definition, example_sentence').lte('next_review', today).order('next_review').limit(limit).execute()
        return [(row['word'], row['level'], row['definition'], row.get('example_sentence', '')) for row in response.data]
    except Exception as e:
        return []

def update_word_progress(word, level, correct):
    if correct:
        new_level = level + 1
    else:
        new_level = max(0, level // 2)
    
    days_to_add = 2 ** new_level
    if new_level == 0:
        days_to_add = 1
        
    next_review = (datetime.date.today() + datetime.timedelta(days=days_to_add)).isoformat()
    
    try:
        supabase.table('words').update({
            "level": new_level,
            "next_review": next_review
        }).eq("word", word).execute()
    except Exception as e:
        st.error(f"Erro ao atualizar: {e}")

# Interface
st.set_page_config(page_title="Contexto App (Nuvem)", layout="centered")

st.sidebar.title("⚙️ Configurações Diárias")
max_add = st.sidebar.number_input("Máximo adicionar/dia", min_value=1, value=10)
max_rev = st.sidebar.number_input("Máximo revisar/dia", min_value=1, value=40)

tab1, tab2, tab3, tab4 = st.tabs(["➕ Adicionar", "▶ Meu Mix Diário", "🎧 Listen Lab", "📚 Memória"])

with tab1:
    st.header("Adicionar nova expressão ou frase")
    added_today = count_added_today()
    st.write(f"**Status Diário:** {added_today} / {max_add} adicionadas hoje.")
    
    if added_today >= max_add:
        st.error("🛑 Limite atingido hoje.")
    else:
        colA, colB = st.columns([3, 1])
        with colA:
            new_word = st.text_input("Inglês (Palavra ou Frase):")
            input_mode = st.radio("Como a IA deve analisar?", ["Tradução/Expressão", "Raio-X Fonético (Frase de Filme)"], horizontal=True)
            
        with colB:
            st.write("") 
            st.write("")
            st.write("")
            buscar_btn = st.button("Buscar Contexto", use_container_width=True)

        if buscar_btn and new_word:
            with st.spinner("Extraindo e formatando..."):
                st.session_state.temp_word = new_word
                st.session_state.simplify_count = 0
                mode_param = "raio_x" if "Raio-X" in input_mode else "word"
                st.session_state.temp_data = generate_definition(new_word, simplify_count=0, mode=mode_param)

        if "temp_data" in st.session_state and st.session_state.temp_data is not None:
            data = st.session_state.temp_data
            st.markdown("---")
            
            if "Raio-X" in input_mode:
                st.info(f"🧠 **Regra Fonética:** {data.get('definition')}")
            else:
                st.info(f"📖 **Significado:** {data.get('definition')}")
                
            if data.get('formula'):
                st.success(f"🧩 **Fórmula Estrutural:** {data.get('formula')}")
                
            if data.get('trap'):
                st.error(f"🪤 **Armadilha para Brasileiros:** {data.get('trap')}")
            
            if data.get('pronunciation'):
                st.warning(f"🗣️ **Som Real:** {data.get('pronunciation')}")
                
            st.info(f"💬 **Frase para Treino:** {data.get('example')}")
            
            tts_buttons(data.get('example').replace('**', ''))
            
            # Compilando tudo para salvar no banco
            def_to_save = data.get('definition')
            if data.get('formula'):
                def_to_save += f"\n\n[Fórmula: {data.get('formula')}]"
            if data.get('trap'):
                def_to_save += f"\n\n[Armadilha: {data.get('trap')}]"
            if data.get('pronunciation'):
                def_to_save += f"\n\n[Dica de Som: {data.get('pronunciation')}]"
            
            st.markdown("### O que fazer com isso?")
            col1, col2, col3 = st.columns(3)
            with col1:
                if st.button("✅ Salvar para Amanhã", type="primary", use_container_width=True):
                    add_word(st.session_state.temp_word, def_to_save, data.get('example'))
                    st.session_state.temp_data = None
                    st.rerun()
            with col2:
                if st.session_state.get('simplify_count', 0) < 4:
                    if st.button("🧩 Simplificar!", use_container_width=True):
                        st.session_state.simplify_count += 1
                        with st.spinner("Deixando ainda mais fácil..."):
                            st.session_state.temp_data = generate_definition(st.session_state.temp_word, simplify_count=st.session_state.simplify_count)
                            st.rerun()
                else:
                    st.error("Limite de simplificação! Se não entendeu, descarte.")
            with col3:
                if st.button("🗑️ Descartar", use_container_width=True):
                    st.session_state.temp_data = None
                    st.rerun()

with tab2:
    st.header("Meu Mix de Hoje (Revisão Ativa)")
    words_to_review = get_words_for_review(limit=max_rev)
    
    if not words_to_review:
        st.success("🎉 Você zerou seu Mix de hoje! (As palavras que você acabou de adicionar só aparecem amanhã).")
    else:
        st.write(f"Faltam **{len(words_to_review)}** estruturas para revisar hoje.")
        
        word, level, definition, example_sentence = words_to_review[0]
        
        if "current_word" not in st.session_state or st.session_state.current_word != word:
            st.session_state.current_word = word
            st.session_state.answered_state = "waiting"
            
            # Se for uma palavra antiga do banco sem frase, gera um fallback
            if not example_sentence:
                st.session_state.review_example = f"I am reviewing the word **{word}**."
            else:
                st.session_state.review_example = example_sentence

        example = st.session_state.review_example
        
        clean_example = example.replace('**', '')
        cloze_sentence = re.sub(re.escape(word), '___', clean_example, flags=re.IGNORECASE)

        st.markdown("---")
        if st.session_state.answered_state == "waiting":
            st.markdown("### 🎧 O que foi dito aqui?")
            st.markdown("Ouça o áudio, e tente decodificar qual é a palavra da lacuna **antes** de ver a resposta. Isso treina seu processamento auditivo de baixo para cima.")
            
            # Áudio no mix Cego
            tts_buttons(clean_example)
            
            st.markdown(f"> *{cloze_sentence}*")
            
            st.write("")
            if st.button("👁️ Revelar Resposta", use_container_width=True):
                st.session_state.answered_state = "revealed"
                st.rerun()
                
        elif st.session_state.answered_state == "revealed":
            st.success("Abaixo está a resposta em destaque. Você lembrou?")
            st.markdown(f"### {example}")
            st.info(f"📖 **Significado Original:** {definition}")
            tts_buttons(clean_example)
            
            st.markdown("---")
            st.write("**Seja honesto com seu cérebro:**")
            col1, col2 = st.columns(2)
            with col1:
                if st.button("🔴 Errei (Esqueci a palavra)", use_container_width=True):
                    update_word_progress(word, level, False)
                    st.rerun()
            with col2:
                if st.button("🟢 Acertei (Lembrei do som e da palavra)", use_container_width=True):
                    update_word_progress(word, level, True)
                    st.rerun()

with tab3:
    st.header("🎧 Listen Lab (Transcription)")
    st.markdown("A aba de Transcrição não precisa de um banco de dados à parte! Ela puxa as pérolas que você já salvou na sua Memória (que possuem áudio) e cria um ginásio para você digitar o que ouvir. Treine a via auditiva sem o apoio dos olhos.")
    
    if "listen_sentence" not in st.session_state:
        st.session_state.listen_sentence = None
        
    if st.button("Gerar Desafio de Escuta Aleatório", type="primary"):
        with st.spinner("Buscando desafio..."):
            try:
                # Puxa sentenças do banco que não sejam nulas
                res = supabase.table('words').select('example_sentence, word').neq('example_sentence', 'null').execute()
                if res.data:
                    items = [r for r in res.data if r.get('example_sentence')]
                    if items:
                        choice = random.choice(items)
                        st.session_state.listen_sentence = choice['example_sentence'].replace('**', '')
                        st.session_state.listen_word = choice['word']
                        st.session_state.listen_answered = False
                else:
                    st.warning("Adicione mais palavras com frases no seu banco primeiro!")
            except Exception as e:
                st.error("Erro ao buscar dados do banco. Lembre-se de adicionar a coluna example_sentence.")
                
    if st.session_state.listen_sentence:
        st.markdown("---")
        st.markdown("### Escute com atenção:")
        tts_buttons(st.session_state.listen_sentence)
        
        if not st.session_state.get('listen_answered', False):
            user_typed = st.text_input("Digite EXATAMENTE o que você ouviu:", key="listen_input")
            if st.button("Verificar"):
                st.session_state.listen_user_typed = user_typed
                st.session_state.listen_answered = True
                st.rerun()
        else:
            user_typed = st.session_state.get('listen_user_typed', '')
            st.markdown(f"**Você digitou:** {user_typed}")
            st.success(f"**Frase Real:** {st.session_state.listen_sentence}")
            st.info(f"O foco sonoro era: **{st.session_state.listen_word}**")

with tab4:
    st.header("Seu Banco de Memória")
    st.info("LEVEL: Quanto maior o Level, mais dias a palavra demora para reaparecer no seu Mix.")
    try:
        response = supabase.table('words').select('*').order('level', desc=True).execute()
        if response.data:
            df = pd.DataFrame(response.data)
            st.dataframe(df, use_container_width=True)
        else:
            st.write("Nenhuma palavra no banco ainda.")
    except Exception as e:
        st.write(f"Erro ao conectar com o banco de dados Supabase: {e}")
