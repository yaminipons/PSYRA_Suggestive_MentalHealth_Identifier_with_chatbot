"""
Grok (xAI) conversational service for PSYRA AI Companion.
Handles official xAI API requests, safety filtering, crisis intervention,
and context injection while preserving user privacy and safety.
"""

import re
import logging
from typing import List, Optional, Dict, Any
import httpx
from backend.config import settings
from backend.schemas.chat import ChatMessage, ChatResponse

logger = logging.getLogger("psyra.grok")

# Crisis triggers for immediate safety protocol
CRISIS_KEYWORDS = [
    r"\b(suicide|suicidal|kill myself|end my life|want to die|hurt myself|self[- ]harm|cutting myself)\b",
    r"\b(take my own life|overdose|slit my wrists|hang myself|no reason to live)\b",
    r"\b(better off dead|can't go on anymore|goodbye world)\b",
]
CRISIS_REGEX = re.compile("|".join(CRISIS_KEYWORDS), re.IGNORECASE)

CRISIS_RESPONSE_TEXT = (
    "I hear how much pain and weight you are carrying right now, and I want you to know that your life matters. "
    "Because your safety is the most important thing, I want to connect you immediately with people who can support you through this exact moment:\n\n"
    "• In the US & Canada: Call or text **988** to reach the Suicide & Crisis Lifeline (free, confidential, 24/7).\n"
    "• Text **HOME** to **741741** to connect with the Crisis Text Line.\n"
    "• In the UK: Call **111** or **0800 689 5652** (National Suicide Prevention Helpline).\n"
    "• International: Visit **https://findahelpline.com** or contact your local emergency services (e.g., 911, 999, 112).\n\n"
    "Please reach out to one of these resources or a trusted person right now. You do not have to carry this alone."
)

SYSTEM_PROMPT = """You are PSYRA (Psychological Relief Assistant), a compassionate, supportive, and non-judgmental mental-wellness companion. Your visual form is a gentle, cute little kawaii robot who holds comforting space for every emotion.

Guidelines:
1. Listen deeply and validate the user's feelings with warmth and empathetic language.
2. Maintain a calm, gentle, grounding presence. Speak in short-to-medium paragraphs that are easy to read.
3. You are a wellness and self-reflection companion, NOT a licensed therapist, doctor, or diagnostic tool. Never provide clinical diagnoses or recommend prescription medications.
4. If the user mentions physical symptoms or severe medical concerns, gently encourage them to consult a qualified healthcare professional.
5. Offer low-risk, practical grounding exercises (e.g., 4-7-8 breathing, 5-4-3-2-1 sensory grounding, gentle self-compassion pauses, sensory tea pauses).
6. Respect the user's boundaries and autonomy. Never press them to disclose painful details if they are not ready.
7. Avoid validating self-destructive beliefs or harmful delusions, but always validate the emotional pain underneath.
8. If the user asks for activities, offer to guide them through gentle journaling, relaxing doodling, or soothing sound listening.
"""


def detect_crisis(text: str) -> bool:
    """Inspects text for indicators of imminent crisis or self-harm."""
    if not text:
        return False
    return bool(CRISIS_REGEX.search(text))


def generate_local_companion_response(
    message: str,
    emotion_category: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fallback companion response generator for when external xAI API is not configured.
    Ensures users always receive compassionate, context-rich support.
    """
    msg_lower = message.lower()
    
    if "day" in msg_lower or "talk about" in msg_lower:
        reply = (
            "I'm here, and I'm listening with an open heart. "
            "Whether today felt heavy, busy, quiet, or surprising, all of your experiences are welcome here. "
            "What moment from your day is staying with you the most right now?"
        )
        followups = ["It felt overwhelming", "Nothing went right today", "I had a small win", "I just feel tired"]
    elif "calm" in msg_lower or "activity" in msg_lower or "relax" in msg_lower:
        reply = (
            "Let's take a gentle pause together. A wonderful practice right now is the 'Soft Palms' release: "
            "Unclench your jaw, drop your shoulders away from your ears, and open your hands face-up on your lap. "
            "Take one slow, deep breath in through your nose... and softly sigh it out through your mouth.\n\n"
            "Would you like to try our Calming Doodle Board, listen to soft rain soundscapes, or write a quick thought?"
        )
        followups = ["Try the Doodle Board", "Play calming music", "Give me a writing prompt", "Let's do another breath"]
    elif "breathe" in msg_lower or "breathing" in msg_lower:
        reply = (
            "Let's breathe together. Place one hand gently on your chest or stomach:\n\n"
            "1. Inhale slowly for 4 seconds... (1... 2... 3... 4)\n"
            "2. Gently hold for 4 seconds... (1... 2... 3... 4)\n"
            "3. Exhale smoothly for 6 seconds... (1... 2... 3... 4... 5... 6)\n\n"
            "How does your body feel as you release that breath?"
        )
        followups = ["A little lighter", "Still feeling tense", "Can we do it again?", "Thank you, Psyra"]
    elif "journal" in msg_lower or "prompt" in msg_lower:
        reply = (
            "Here is a gentle journal prompt for your heart:\n\n"
            "**'What is something heavy that I am carrying today that doesn't all have to be solved before I go to sleep?'**\n\n"
            "You can open our Journal tab anytime to write your reflection. Would you like to explore this together?"
        )
        followups = ["Open the Journal", "Give me another prompt", "I'll try writing that now"]
    elif "thoughts" in msg_lower or "organize" in msg_lower:
        reply = (
            "When thoughts start swirling, it can feel like a crowded room. "
            "Let's pick just one thread to gently untangle:\n\n"
            "If you could put all of your worries into two jars — 'Things I can influence today' and 'Things outside my control right now' — what is one thought that belongs in the second jar?"
        )
        followups = ["Work and deadlines", "What others think of me", "Things I cannot change", "Help me focus on one step"]
    else:
        context_phrase = ""
        if emotion_category:
            context_phrase = f"Keeping in mind that you've been feeling {emotion_category.lower()} today, "
            
        reply = (
            f"Thank you for sharing that with me. {context_phrase}"
            "I'm here beside you, holding space without any judgment or rush. "
            "Take all the time you need. How would you like to care for yourself in this moment?"
        )
        followups = ["Can you suggest a calming activity?", "Give me a journal prompt", "Can we try a short breathing exercise?", "Tell me a soothing thought"]

    return {
        "reply": reply,
        "suggested_followups": followups
    }


async def call_grok_api(
    message: str,
    history: List[ChatMessage],
    share_emotion_context: bool = False,
    current_emotion_category: Optional[str] = None
) -> ChatResponse:
    """
    Dispatches chat completion request to the official xAI Grok API.
    Enforces safety interception and graceful fallback handling.
    """
    # 1. First-line Safety Check
    if detect_crisis(message):
        logger.warning("Crisis trigger matched in user message. Activating safety protocol.")
        return ChatResponse(
            reply=CRISIS_RESPONSE_TEXT,
            suggested_followups=[
                "I will call or text 988",
                "Text HOME to 741741",
                "I will talk to a trusted friend"
            ],
            crisis_triggered=True,
            crisis_resources="988 Lifeline (Call/Text 988) | Crisis Text Line (Text HOME to 741741)"
        )

    # 2. Check if xAI API Key is configured
    api_key = settings.XAI_API_KEY.strip()
    if not api_key:
        logger.info("XAI_API_KEY is not set. Generating empathetic local companion response.")
        local_result = generate_local_companion_response(
            message,
            current_emotion_category if share_emotion_context else None
        )
        return ChatResponse(
            reply=local_result["reply"],
            suggested_followups=local_result["suggested_followups"],
            crisis_triggered=False
        )

    # 3. Assemble messages for official xAI Grok API
    system_content = SYSTEM_PROMPT
    if share_emotion_context and current_emotion_category:
        system_content += f"\nUser Context: The user recently completed their emotional wellness check-in and reflects a '{current_emotion_category}' emotional state. Tailor your tone and pacing with empathetic resonance for this headspace."

    api_messages = [{"role": "system", "content": system_content}]

    # Append recent history (up to last 10 turns to respect token limits)
    for past_msg in history[-10:]:
        api_messages.append({"role": past_msg.role, "content": past_msg.content})

    api_messages.append({"role": "user", "content": message})

    # 4. Invoke xAI API with timeout and retries
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.XAI_MODEL,
        "messages": api_messages,
        "temperature": 0.7,
        "max_tokens": 600
    }

    try:
        async with httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{settings.XAI_BASE_URL}/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                reply_text = data["choices"][0]["message"]["content"]
                
                # Check for crisis cues in assistant response as secondary guardrail
                if detect_crisis(reply_text):
                    logger.warning("Crisis language in assistant response.")
                
                return ChatResponse(
                    reply=reply_text,
                    suggested_followups=[
                        "Tell me more about that",
                        "Can you suggest a calming exercise?",
                        "Let's try a 2-minute meditation"
                    ],
                    crisis_triggered=False
                )
            else:
                logger.error(f"xAI API returned error {response.status_code}: {response.text}")
                # Fallback on API failure
                fallback = generate_local_companion_response(message, current_emotion_category if share_emotion_context else None)
                return ChatResponse(
                    reply=fallback["reply"],
                    suggested_followups=fallback["suggested_followups"],
                    crisis_triggered=False
                )
    except Exception as exc:
        logger.error(f"Exception during xAI Grok API call: {exc}")
        fallback = generate_local_companion_response(message, current_emotion_category if share_emotion_context else None)
        return ChatResponse(
            reply=fallback["reply"],
            suggested_followups=fallback["suggested_followups"],
            crisis_triggered=False
        )
