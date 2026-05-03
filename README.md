# Contexto App 🧠

The ultimate Monolingual English Learning Engine. Built for intermediate learners to break the "subtitles barrier" using Comprehensible Input (i+1), Connected Speech secrets, and mathematically optimized Spaced Repetition (SRS).

## 🚀 Features

- **100% Monolingual English Input**: No Portuguese allowed. Ultra-basic definitions forced via Gemini AI.
- **Phonetic X-Ray (Raio-X Fonético)**: Paste a confusing movie sentence, and the AI will break down the phonetic linking (Connected Speech) and generate a brand new practice sentence.
- **Blind Mix (Active Recall)**: The daily review hides the text and plays audio first. You must decode the sound *before* revealing the answer, training your Bottom-Up auditory processing.
- **Listen Lab (Transcription)**: A dedicated "gym" tab that pulls your saved phrases, plays them blindly, and challenges you to transcribe them perfectly.
- **Structural Formula & Brazilian Traps**: AI automatically warns you about the most common mistakes Portuguese speakers make for every new word.
- **Dual Speed Audio Training**: Listen at 0.9x for clarity or 1.3x for real-world "movie" speed to train your ear.

## 🛠️ Architecture
- **Frontend**: Streamlit
- **AI Brain**: Google Gemini 3 Flash Preview (Free Tier Optimized)
- **Database**: Supabase (PostgreSQL) in the Cloud

### Supabase Table Schema (`words`)
- `id` (int8/uuid, primary key)
- `word` (text)
- `definition` (text)
- `example_sentence` (text)
- `level` (int4, default 0)
- `next_review` (text)
- `added_date` (text)

## 📱 How to Deploy (Streamlit Cloud)

1. Upload these files to a Private GitHub Repository:
   - `app.py`
   - `requirements.txt`
   - `.streamlit/config.toml` (for Dark Mode)

2. Go to **share.streamlit.io** and click "New app".
3. Select your GitHub repository and point to `app.py`.
4. Click on **Advanced Settings** before deploying and paste your Secrets:
   ```toml
   GEMINI_API_KEY="your-gemini-key"
   SUPABASE_URL="your-supabase-url"
   SUPABASE_KEY="your-supabase-anon-key"
   APP_PASSWORD="your-master-password"
   ```
5. Deploy! Open the URL on your mobile phone, click "Add to Home Screen" and use it as a native app.
