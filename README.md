# 🌿 PSYRA – AI Mental Wellness Companion

PSYRA is a full-stack mental wellness web application designed to support users through mood tracking, journaling, AI-powered chat, doodling therapy, and mood-based music recommendations.


## 🚀 Features

### 🧠 Mood Quiz
- 5-question mood detection system
- Scores user responses (A–D)
- Classifies mood into:
  - Happy
  - Neutral
  - Stressed
  - Low
- Provides:
  - Mood score
  - Activities
  - Music recommendations

### 💬 AI Chat Support
- Integrated with **Rasa**
- Stores chat history in MongoDB
- Aggregates multiple Rasa responses
- Friendly fallback message if Rasa is unreachable


### 📓 Journal System
- Users can write journal entries
- Entries stored securely in MongoDB
- Timestamped logs

---

### 🎨 Doodle Therapy
- Users can draw freely
- Saves doodle as Base64 image
- Stored in MongoDB

---

### 🎵 Mood-Based Music Recommendation
Supports:

#### ✅ Offline Mode
- Local MP3 playback from:

## Backend Setup
cd backend
python -m venv psyra_venv
psyra_venv\Scripts\activate   # Windows
source psyra_venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
python app.py

The backend will run on
http://127.0.0.1:5000

## Start MongoDB
mongodb://localhost:27017/

## Run Rasa (if using chat)
rasa run --enable-api
 
## Frontend Setup
Open in Server
frontend/index.html


