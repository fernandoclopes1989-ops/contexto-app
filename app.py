import streamlit as st
import datetime
import json
import os
import google.generativeai as genai
from dotenv import load_dotenv
import random
import streamlit.components.v1 as components
from supabase import create_client, Client

# Configurações iniciais
load_dotenv()
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

# Criação do Motor do Agente (Igual ao seu Explora Brasil)
def init_agent(system_instruction):
    return genai.GenerativeModel(
        model_name='gemini-3-flash-preview',
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

def generate_definition(word, simplify_count=0):
    persona = """You are a STRICT Monolingual English Teacher.
YOUR RULES:
1. 100% ENGLISH: The 'definition', 'example', and 'pronunciation' MUST be 100% in ENGLISH. No Portuguese allowed anywhere.
2. i+1 PHILOSOPHY: Explain using ONLY ultra-basic A1/A2 English vocabulary. 
3. CONNECTED SPEECH: In the 'pronunciation' field, explain how native speakers link the sounds. Use intuitive phonetic spelling (e.g., "the 't' connects to 'a' and sounds like a soft 'r': my-daz-well").
Return STRICTLY a JSON: {"definition": "...", "example": "...", "pronunciation": "..."}."""
    
    agent = init_agent(persona)

    if simplify_count > 0:
        idade = max(4, 12 - (simplify_count * 2))
        prompt = f"""Explain "{word}" to a {idade}-year-old child. 
Use EXTREMELY basic English. 
Return the JSON with 1 obvious English example, and the English pronunciation tip."""
    else:
        prompt = f"""Generate the English definition, 1 English example, and the English Connected Speech tip for "{word}"."""

    try:
        response = agent.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
    except Exception as e:
        st.error(f"Erro na IA: {e}")
        return None

def generate_quiz(word, level, mature_words=None):
    persona = """You are the Active Recall Master.
YOUR RULES:
1. 100% ENGLISH: The sentence and all options MUST be in English. No Portuguese.
2. OBVIOUS CONTEXT: The sentence context MUST give obvious clues to guess the blank.
3. VISCERAL EMOTION: Use strong emotional tones (urgency, irony, anger, shock). Boring sentences are forbidden.
Return STRICTLY a JSON: {"sentence": "sentence with ___", "correct": "correct answer", "wrong1": "...", "wrong2": "..."}."""

    agent = init_agent(persona)

    if level <= 1:
        difficulty = "A1/A2 basic English vocabulary. Keep it very short but add a dramatic or daily-life emotional tone."
    elif level <= 3:
        difficulty = "B1 vocabulary. Conversational with an ironic or urgent tone."
    else:
        difficulty = "B2 vocabulary. Strong context, workplace conflict, or passionate debate."

    prompt = f"""Target expression: "{word}".
Create ONE sentence using level: {difficulty}.
Replace the target expression with "___".
Generate 2 wrong options."""

    if mature_words:
        prompt += f"\nPEDAGOGICAL CHALLENGE: Organically include these expressions the student already knows in the same sentence: {', '.join(mature_words)}."

    try:
        response = agent.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
    except Exception as e:
        return None

def add_word(word, definition):
    today = datetime.date.today().isoformat()
    tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
    try:
        supabase.table('words').insert({
            "word": word,
            "definition": definition,
            "level": 0,
            "next_review": tomorrow,
            "added_date": today
        }).execute()
        st.success(f"✅ Expressão salva! Ela aparecerá no seu Mix amanhã.")
    except Exception as e:
        st.warning(f"Erro ou Palavra já existe no banco: {e}")

def count_added_today():
    today = datetime.date.today().isoformat()
    try:
        response = supabase.table('words').select('*', count='exact').eq('added_date', today).execute()
        return response.count if response.count else 0
    except:
        return 0

def get_mature_words(limit=3):
    try:
        response = supabase.table('words').select('word').gte('level', 4).limit(50).execute()
        words = [row['word'] for row in response.data]
        if words:
            random.shuffle(words)
            return words[:limit]
        return []
    except:
        return []

def get_words_for_review(limit=40):
    today = datetime.date.today().isoformat()
    try:
        response = supabase.table('words').select('word, level, definition').lte('next_review', today).order('next_review').limit(limit).execute()
        return [(row['word'], row['level'], row['definition']) for row in response.data]
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

tab1, tab2, tab3 = st.tabs(["➕ Adicionar", "▶ Meu Mix Diário", "📚 Memória"])

with tab1:
    st.header("Adicionar nova expressão")
    added_today = count_added_today()
    st.write(f"**Status Diário:** {added_today} / {max_add} adicionadas hoje.")
    
    if added_today >= max_add:
        st.error("🛑 Limite de palavras novas atingido hoje.")
    else:
        colA, colB = st.columns([3, 1])
        with colA:
            new_word = st.text_input("Expressão em Inglês:")
        with colB:
            st.write("") 
            st.write("")
            buscar_btn = st.button("Buscar Contexto", use_container_width=True)

        if buscar_btn and new_word:
            with st.spinner("Extraindo definição 100% em inglês..."):
                st.session_state.temp_word = new_word
                st.session_state.simplify_count = 0
                st.session_state.temp_data = generate_definition(new_word, simplify_count=0)

        if "temp_data" in st.session_state and st.session_state.temp_data is not None:
            data = st.session_state.temp_data
            st.markdown("---")
            st.info(f"📖 **Significado:** {data.get('definition')}")
            
            if data.get('pronunciation'):
                st.warning(f"🗣️ **Como os Nativos Falam:** {data.get('pronunciation')}")
                
            st.success(f"💬 **Exemplo Prático:** {data.get('example')}")
            
            tts_buttons(data.get('example'))
            
            # Para não perdermos a dica de pronúncia na hora da revisão, nós juntamos ela à definição antes de salvar:
            def_to_save = data.get('definition')
            if data.get('pronunciation'):
                def_to_save += f"\n\n[Dica de Som: {data.get('pronunciation')}]"
            
            st.markdown("### O que fazer com essa palavra?")
            col1, col2, col3 = st.columns(3)
            with col1:
                if st.button("✅ Salvar para Amanhã", type="primary", use_container_width=True):
                    add_word(st.session_state.temp_word, def_to_save)
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
    st.header("Meu Mix de Hoje")
    words_to_review = get_words_for_review(limit=max_rev)
    
    if not words_to_review:
        st.success("🎉 Você zerou seu Mix de hoje! (As palavras que você acabou de adicionar só aparecem amanhã).")
    else:
        st.write(f"Faltam **{len(words_to_review)}** estruturas para revisar hoje.")
        
        word, level, definition = words_to_review[0]
        
        if "current_word" not in st.session_state or st.session_state.current_word != word:
            st.session_state.current_word = word
            st.session_state.quiz_data = None
            st.session_state.shuffled_opts = None
            st.session_state.answered_state = "waiting"

        if st.session_state.quiz_data is None:
            with st.spinner(f"A IA está gerando um contexto Nível {level} para sua revisão..."):
                mature_words = get_mature_words(3)
                quiz = generate_quiz(word, level, mature_words)
                if quiz:
                    st.session_state.quiz_data = quiz
                    opts = [quiz.get('correct'), quiz.get('wrong1'), quiz.get('wrong2')]
                    random.shuffle(opts)
                    st.session_state.shuffled_opts = opts
                else:
                    st.error("Erro ao gerar quiz.")

        if st.session_state.quiz_data:
            q = st.session_state.quiz_data
            
            st.markdown("---")
            if st.session_state.answered_state == "waiting":
                st.markdown(f"### {q.get('sentence')}")
                st.markdown("---")
                st.write("Qual estrutura se encaixa no contexto acima?")
                
                opts = st.session_state.shuffled_opts
                
                cols = st.columns(3)
                for i, opt in enumerate(opts):
                    with cols[i]:
                        if st.button(opt, use_container_width=True, key=f"btn_{opt}"):
                            if opt == q.get('correct'):
                                update_word_progress(word, level, True)
                                st.session_state.answered_state = "correct"
                                st.rerun()
                            else:
                                update_word_progress(word, level, False)
                                st.session_state.answered_state = "wrong"
                                st.rerun()
                
            elif st.session_state.answered_state == "correct":
                full_sentence = q.get('sentence').replace('___', q.get('correct'))
                st.success("✅ Acertou! O seu cérebro preencheu a lacuna corretamente.")
                st.markdown(f"### {full_sentence}")
                tts_buttons(full_sentence)
                
                st.write("")
                if st.button("➡️ Próxima Palavra", type="primary", use_container_width=True):
                    st.session_state.quiz_data = None
                    st.rerun()
                    
            elif st.session_state.answered_state == "wrong":
                st.error(f"❌ Ops! O correto seria '{q.get('correct')}'.")
                st.warning(f"**Lembrando o significado:** {definition}")
                
                full_sentence = q.get('sentence').replace('___', q.get('correct'))
                st.markdown(f"### {full_sentence}")
                tts_buttons(full_sentence)
                
                st.write("")
                if st.button("➡️ Entendi, Próxima Palavra", type="primary", use_container_width=True):
                    st.session_state.quiz_data = None
                    st.rerun()

with tab3:
    st.header("Seu Banco de Memória")
    st.info("LEVEL: Quanto maior o Level, mais dias a palavra demora para reaparecer no seu Mix. É a prova de que ela está virando 'Fluência' e saindo do estágio de 'Tradução'. Nível 0 = Amanhã. Nível 5 = Daqui a 32 dias.")
    try:
        response = supabase.table('words').select('*').order('level', desc=True).execute()
        import pandas as pd
        if response.data:
            df = pd.DataFrame(response.data)
            st.dataframe(df, use_container_width=True)
        else:
            st.write("Nenhuma palavra no banco ainda.")
    except Exception as e:
        st.write(f"Erro ao conectar com o banco de dados Supabase: {e}")
