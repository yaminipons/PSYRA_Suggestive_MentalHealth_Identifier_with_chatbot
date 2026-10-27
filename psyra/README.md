# PSYRA — The Chatbot That Holds Space for Every Emotion

**PSYRA (Psychological Relief Assistant)** is a compassionate, supportive mental-wellness web application that helps users reflect on their emotional state and discover calming activities that nurture their well-being.

PSYRA is designed as a self-reflection and wellness companion, **not** a diagnostic or clinical mental-health service.

---

## 🌟 Key Features

1. **5-Question Emotional Wellness Check-in**:
   - Exactly five multiple-choice questions assessing energy, calm, connection, mood, and immediate needs.
   - Transparent scoring algorithm classifying reflections into four categories: **Happy**, **Neutral**, **Stressed**, and **Low**.
   - Clear confidence alignment and non-clinical disclaimer.

2. **Personalized Emotion Results Dashboard**:
   - Greeting with the user's display name.
   - Empathetic, non-judgmental category overview.
   - Tailored activity recommendations:
     - **Happy**: Gratitude journaling, uplifting acoustic music, vibrant doodling, celebrating small wins.
     - **Neutral**: Mindful pauses, exploratory hobby prompts, nature soundscapes.
     - **Stressed**: 4-7-8 box breathing, brain dumps, soothing rain on glass, gentle drawing.
     - **Low**: Cozy rest, zero-demand self-care, comforting chords, supportive conversation with Psyra.

3. **Grok-Powered AI Companion (`/chat.html`)**:
   - Conversational AI powered by official xAI Grok API (`XAI_API_KEY`, configurable `XAI_MODEL`).
   - Context-aware responses that gently respect the user's checked-in emotion (with clear user consent).
   - Multi-layer safety protection: immediate crisis keyword detection (interception routing to **988 Lifeline** and **Crisis Text Line**).
   - Compassionate offline fallback that ensures zero crashes when external keys are not provided.
   - Suggested conversation starters, new-chat, and clear-chat confirmation.

4. **Interactive Doodle Board (`/doodle.html`)**:
   - Smooth HTML5 Canvas drawing engine with mouse, touch, and stylus support.
   - Calming earth & pastel color palette (Warm Sand, Soft Sage, Earthy Clay, Terracotta, Lavender).
   - Adjustable stroke slider, eraser tool, undo history stack, clear canvas with modal confirmation, and PNG download.

5. **Personal Reflection Journal (`/journal.html`)**:
   - Full CRUD operations: Create, read, edit, and delete reflections.
   - Dynamic prompt generator tailored to the current emotional headspace.
   - Chronological reflection feed with date filtering and privacy assurance.
   - Zero unauthorized transmission to AI models.

6. **Sound Therapy & Music Recommendations (`/music.html`)**:
   - Categorized into Uplifting, Calming, Focus, and Relaxation.
   - Authentic Web Audio API ambient sound generator (Ocean Swells, Gentle Rain, Forest Stream, 432 Hz Singing Bowl).
   - Direct links to verified ambient relaxation playlists.

7. **Authentication & Privacy (`/login.html`, `/register.html`)**:
   - Secure bcrypt password hashing.
   - Signed JWT access tokens with secure cookie options.
   - Optional Guest Mode for instant exploration.

---

## 🏗 Architecture & Technology Stack

```
psyra/
├── frontend/                     # Pure HTML5, CSS3 & Vanilla JavaScript
│   ├── index.html                # Welcome & Landing Page
│   ├── dashboard.html            # Personalized Wellness Dashboard
│   ├── assessment.html           # 5-Question Wellness Questionnaire
│   ├── chat.html                 # Grok xAI Companion Chat
│   ├── doodle.html               # Calming Interactive Canvas
│   ├── journal.html              # Private Journaling Module
│   ├── music.html                # Web Audio Therapy & Playlists
│   ├── login.html                # Secure Sign-in
│   ├── register.html             # Account Registration
│   ├── css/
│   │   └── style.css             # Responsive Theme (Warm Cream, Earthy Pastels, Dark Mode)
│   └── js/
│       ├── api.js                # Unified Client API & State Management
│       ├── app.js                # Top Bar Contract, Theme Toggle & Navigation
│       ├── assessment.js         # Assessment Logic & Scoring Engine
│       ├── chat.js               # Grok Chat Controller & Safety Interceptor
│       ├── doodle.js             # Canvas Drawing & Undo Stack
│       ├── journal.js            # Journal CRUD & Prompt Generator
│       └── music.js              # Web Audio Synthesizer & Track Playlists
├── backend/                      # Python FastAPI REST Backend
│   ├── main.py                   # FastAPI Application Entry Point
│   ├── config.py                 # Pydantic Settings & Environment Loader
│   ├── database.py               # Motor MongoDB Async Driver
│   ├── requirements.txt          # Python Dependencies
│   ├── .env.example              # Environment Configuration Template
│   ├── routers/                  # Modular Route Controllers
│   │   ├── auth.py
│   │   ├── assessment.py
│   │   ├── chat.py
│   │   ├── journal.py
│   │   ├── profile.py
│   │   └── music.py
│   ├── schemas/                  # Pydantic Input/Output Schemas
│   ├── services/                 # Business Logic & External Integrations
│   │   ├── auth_service.py       # Password Hashing & JWT Management
│   │   ├── scoring_service.py    # 5-Question Category Weighting Engine
│   │   └── grok_service.py       # Official xAI API Client & Crisis Routing
│   └── tests/                    # Automated Pytest Suite
│       ├── test_auth.py
│       ├── test_scoring.py
│       ├── test_chat.py
│       └── test_journal.py
└── server.ts                     # Live AI Studio Dev Server (Express + Port 3000)
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and configure the values:

```bash
# Grok xAI API Configuration
XAI_API_KEY="your-xai-api-key-here"
XAI_MODEL="grok-beta"

# MongoDB Database Connection
MONGODB_URI="mongodb://localhost:27017"
DATABASE_NAME="psyra_db"

# JWT Authentication
JWT_SECRET="your-secure-random-secret-key-at-least-32-chars"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="1440"

# Server Settings
PORT="3000"
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
ENVIRONMENT="development"
```

### External API Credentials:
- **xAI Grok API**: Requires `XAI_API_KEY`. If omitted, the app safely falls back to its built-in rule-based empathetic companion.

---

## 🚀 Running the Project

### Option A: AI Studio / Node Full-Stack Environment (Live Preview)
```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```
Open `http://localhost:3000` in your browser.

### Option B: Python FastAPI Backend + MongoDB
```bash
# 1. Start MongoDB instance
mongod --dbpath /data/db

# 2. Setup Python virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate

# 3. Install Python requirements
pip install -r requirements.txt

# 4. Start FastAPI server with Uvicorn
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
View FastAPI interactive documentation at `http://localhost:8000/docs`.

---

## 🧪 Automated Testing

Run the automated test suite for scoring algorithms, authentication, crisis safety, and journal schemas:

```bash
pytest backend/tests/
```

---

## 🛡️ Safety & Disclaimer

PSYRA is not a substitute for professional mental healthcare, therapy, or emergency medical response. If you or someone you know is struggling or in crisis, help is available:
- **United States & Canada**: Call or text **988**
- **Crisis Text Line**: Text **HOME** to **741741**
- **International Resources**: [https://findahelpline.com](https://findahelpline.com)
