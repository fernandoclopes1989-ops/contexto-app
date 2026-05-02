# Contexto App 🧠

The ultimate Monolingual English Learning Engine. Built for intermediate learners to break the "subtitles barrier" using Comprehensible Input (i+1), Connected Speech secrets, and mathematically optimized Spaced Repetition (SRS).

## 🚀 Features

- **100% Monolingual English Input**: No Portuguese allowed. ultra-basic definitions forced via Gemini AI.
- **Progressive Difficulty (i+1)**: As you learn a word, the quiz sentences become more complex (from A1 up to B2 context).
- **Connected Speech Insights**: AI explicitely breaks down phonetic links for natural listening skills.
- **Smart Snowball Effect**: The AI organically injects "mature" words (Level 4+) into new quizzes so you review old vocabulary passively.
- **Dual Speed Audio Training**: Listen at 0.9x for clarity or 1.3x for real-world "movie" speed to train your ear.
- **Soft Penalty SRS**: Forgetting a word doesn't reset it to zero. It cuts the level in half, preventing Anki burnout.

## 🛠️ Architecture
- **Frontend**: Streamlit
- **AI Brain**: Google Gemini 2.5 Flash
- **Database**: Supabase (PostgreSQL) in the Cloud

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
   ```
5. Deploy! Open the URL on your mobile phone, click "Add to Home Screen" and use it as a native app.
