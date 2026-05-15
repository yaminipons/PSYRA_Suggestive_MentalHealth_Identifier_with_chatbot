# backend/routes/chat_routes.py
from flask import Blueprint, request, jsonify
import re
import random
from datetime import datetime

chat_bp = Blueprint("chat", __name__)

# PSYRA persona (for message prefix)
BOT_NAME = "PSYRA 💚"

# Basic small lexicons for sentiment/intent heuristics (keeps things light)
POS_WORDS = {"good","great","happy","well","fine","better","ok","okay","awesome","love","calm","relaxed","energetic"}
NEG_WORDS = {"sad","down","depressed","unhappy","tired","anxious","angry","hate","bad","stressed","worried","panic","lonely"}
SUPPORT_KEYWORDS = {"help","support","talk","listen","need","someone","advice"}
MUSIC_KEYWORDS = {"music","song","listen","track","play"}
DRAW_KEYWORDS = {"draw","doodle","sketch","paint"}
JOURNAL_KEYWORDS = {"journal","write","diary","note","reflect"}
EMERGENCY_KEYWORDS = {"suicide","kill myself","end my life","hurt myself","die","self-harm"}

# Small helper functions
def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9\s']", " ", text.lower()).strip()

def detect_emergency(text: str) -> bool:
    t = text.lower()
    for kw in EMERGENCY_KEYWORDS:
        if kw in t:
            return True
    return False

def simple_sentiment(text: str) -> str:
    t = normalize(text)
    words = set(t.split())
    pos = len(words & POS_WORDS)
    neg = len(words & NEG_WORDS)
    if pos - neg >= 2:
        return "positive"
    if neg - pos >= 1:
        return "negative"
    return "neutral"

def detect_intents(text: str):
    t = normalize(text)
    words = set(t.split())
    intents = set()
    if words & SUPPORT_KEYWORDS:
        intents.add("support")
    if words & MUSIC_KEYWORDS:
        intents.add("music")
    if words & DRAW_KEYWORDS:
        intents.add("draw")
    if words & JOURNAL_KEYWORDS:
        intents.add("journal")
    # greetings / bye / thanks
    if re.search(r"\b(hi|hello|hey|hiya)\b", t):
        intents.add("greet")
    if re.search(r"\b(thank|thanks|thx)\b", t):
        intents.add("thanks")
    if re.search(r"\b(bye|goodbye|see ya|see you)\b", t):
        intents.add("bye")
    return list(intents)

# canned but varied responses for friendy style
REPLIES = {
    "greet": [
        "Hey there — I'm PSYRA 💚. How are you feeling right now?",
        "Hello! I'm here to listen. How's your day going?"
    ],
    "thanks": [
        "You're welcome — glad I could help.",
        "Anytime. I'm here when you need me."
    ],
    "bye": [
        "Take care — I'm only a message away if you want to talk again.",
        "Goodbye for now. Be kind to yourself 💚"
    ],
    "music": [
        "Music can help a lot. Do you want a calm playlist or something upbeat?",
        "I can suggest a relaxing track — would you like that?"
    ],
    "draw": [
        "Drawing can calm your mind. Grab a pen and doodle whatever comes to mind.",
        "Try drawing a place where you feel safe — even simple shapes help."
    ],
    "journal": [
        "Writing helps clarify thoughts. Want to write about one thing that's on your mind?",
        "Try jotting down three small wins from today — they add up."
    ],
    "support_positive": [
        "That's great to hear — I'm glad you're feeling okay. Want to share what's going well?",
        "Nice! Celebrating small wins matters. Tell me one thing that made today better."
    ],
    "support_negative": [
        "I'm really sorry you're feeling this way — I'm here with you. Would you like a grounding exercise or a breathing tip?",
        "That sounds heavy. If you'd like, tell me a little more and we can think of a tiny step to help."
    ],
    "support_neutral": [
        "Thanks for sharing. Want a quick tip to lift your mood or would you prefer to keep talking?",
        "I hear you. Sometimes small changes help — would you like one simple suggestion?"
    ],
    "fallback": [
        "I might not have caught that — could you share more or try rephrasing?",
        "I'm not sure I understood — tell me a bit more and I'll do my best to help."
    ],
    "emergency": [
        "I'm really sorry— that sounds urgent. If you're in immediate danger, please call your local emergency number now. If you're thinking about harming yourself, please consider contacting your country's suicide hotline or a trusted person nearby. Do you want resources I can list?",
        "I care about your safety. If you might harm yourself, please contact emergency services right away or a crisis hotline. Would you like me to provide local helplines or steps to stay safe?"
    ]
}

def choose_reply(key):
    arr = REPLIES.get(key)
    if not arr:
        return random.choice(REPLIES["fallback"])
    return random.choice(arr)

@chat_bp.route("/message", methods=["POST"])
def message():
    """
    Input: {"user_id": "...", "message": "...", "mode": "friendly" (optional)}
    Output: JSON list like Rasa webhook: [{"recipient_id": "...", "text": "..."}]
    """
    data = request.json or {}
    user_id = data.get("user_id", "anon")
    text = (data.get("message") or "").strip()
    mode = data.get("mode", "friendly")

    if not text:
        return jsonify([{"recipient_id": user_id, "text": f"{BOT_NAME}: Please send a message."}]), 200

    # emergency check first
    if detect_emergency(text):
        reply = choose_reply("emergency")
        return jsonify([{"recipient_id": user_id, "text": f"{BOT_NAME}: {reply}"}]), 200

    # intents + sentiment
    intents = detect_intents(text)
    sentiment = simple_sentiment(text)

    # Build response candidates
    # Priority order: greetings/bye/thanks -> explicit intent categories -> sentiment-driven support -> fallback
    resp_text = None

    if "greet" in intents:
        resp_text = choose_reply("greet")
    elif "thanks" in intents:
        resp_text = choose_reply("thanks")
    elif "bye" in intents:
        resp_text = choose_reply("bye")
    elif "music" in intents:
        resp_text = choose_reply("music")
    elif "draw" in intents:
        resp_text = choose_reply("draw")
    elif "journal" in intents:
        resp_text = choose_reply("journal")
    elif "support" in intents:
        if sentiment == "positive":
            resp_text = choose_reply("support_positive")
        elif sentiment == "negative":
            resp_text = choose_reply("support_negative")
        else:
            resp_text = choose_reply("support_neutral")
    else:
        # If user asked a question (contains '?') prioritize an informative friendly answer
        if "?" in text:
            resp_text = f"I might not know everything, but I'll try: {choose_reply('fallback')}"
        else:
            # sentiment-driven defaults
            if sentiment == "positive":
                resp_text = choose_reply("support_positive")
            elif sentiment == "negative":
                resp_text = choose_reply("support_negative")
            else:
                resp_text = choose_reply("support_neutral")

    # Add a gentle follow-up to keep conversation going
    followups = [
        "Would you like to continue chatting about that?",
        "Do you want a small exercise or tip now?",
        "Would you like to switch to a calming activity (music, drawing, or journaling)?",
        "If you'd prefer, I can just listen — say anything that's on your mind."
    ]
    follow = random.choice(followups)

    final = f"{BOT_NAME}: {resp_text} {follow}"

    # Optional: log simple conversation locally (timestamped) for debugging (no PII)
    try:
        with open("chat_history.log", "a", encoding="utf-8") as fh:
            fh.write(f"{datetime.utcnow().isoformat()} | {user_id} | {text} -> {final}\n")
    except Exception:
        pass

    return jsonify([{"recipient_id": user_id, "text": final}]), 200
