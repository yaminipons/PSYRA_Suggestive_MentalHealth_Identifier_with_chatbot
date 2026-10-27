"""
Transparent assessment scoring algorithm and recommendation engine for PSYRA.
Evaluates 5 multiple-choice questions to determine the suggested emotional category:
- Happy
- Neutral
- Stressed
- Low
"""

from typing import List, Dict, Any
from backend.schemas.assessment import AssessmentAnswer, AssessmentResultResponse, ActivityRecommendation


QUESTION_WEIGHTS = {
    # Question 1: Energy
    1: {
        0: {"Happy": 3, "Neutral": 1, "Stressed": 0, "Low": 0},
        1: {"Happy": 2, "Neutral": 2, "Stressed": 0, "Low": 0},
        2: {"Happy": 1, "Neutral": 3, "Stressed": 1, "Low": 0},
        3: {"Happy": 0, "Neutral": 1, "Stressed": 2, "Low": 2},
        4: {"Happy": 0, "Neutral": 0, "Stressed": 2, "Low": 4},
    },
    # Question 2: Calm / Stress
    2: {
        0: {"Happy": 3, "Neutral": 2, "Stressed": 0, "Low": 0},
        1: {"Happy": 2, "Neutral": 3, "Stressed": 0, "Low": 0},
        2: {"Happy": 1, "Neutral": 3, "Stressed": 1, "Low": 1},
        3: {"Happy": 0, "Neutral": 1, "Stressed": 3, "Low": 1},
        4: {"Happy": 0, "Neutral": 0, "Stressed": 4, "Low": 2},
    },
    # Question 3: Connection
    3: {
        0: {"Happy": 3, "Neutral": 1, "Stressed": 0, "Low": 0},
        1: {"Happy": 2, "Neutral": 2, "Stressed": 0, "Low": 0},
        2: {"Happy": 1, "Neutral": 3, "Stressed": 1, "Low": 1},
        3: {"Happy": 0, "Neutral": 1, "Stressed": 1, "Low": 3},
        4: {"Happy": 0, "Neutral": 0, "Stressed": 1, "Low": 4},
    },
    # Question 4: Mood
    4: {
        0: {"Happy": 4, "Neutral": 0, "Stressed": 0, "Low": 0},
        1: {"Happy": 2, "Neutral": 3, "Stressed": 0, "Low": 0},
        2: {"Happy": 0, "Neutral": 2, "Stressed": 2, "Low": 1},
        3: {"Happy": 0, "Neutral": 0, "Stressed": 4, "Low": 1},
        4: {"Happy": 0, "Neutral": 0, "Stressed": 1, "Low": 4},
    },
    # Question 5: What would help right now?
    5: {
        0: {"Happy": 3, "Neutral": 1, "Stressed": 0, "Low": 0},  # Fun and uplifting
        1: {"Happy": 1, "Neutral": 3, "Stressed": 1, "Low": 0},  # Quiet moment to relax
        2: {"Happy": 0, "Neutral": 2, "Stressed": 3, "Low": 1},  # Help organizing thoughts
        3: {"Happy": 0, "Neutral": 0, "Stressed": 4, "Low": 1},  # A way to release stress
        4: {"Happy": 0, "Neutral": 0, "Stressed": 1, "Low": 4},  # Someone supportive to talk to
    },
}

CATEGORY_DESCRIPTIONS = {
    "Happy": {
        "summary": "You're experiencing a bright, uplifting, and energized emotional space today.",
        "supportive_message": "It's wonderful to feel this wave of vitality. Cherishing these moments creates emotional reservoirs that anchor you through life's rhythms.",
    },
    "Neutral": {
        "summary": "You are in an even, steady, and balanced headspace today.",
        "supportive_message": "Neutrality is a peaceful, grounded foundation. It gives you the space to pause, reflect gently, and move through the day at your own pace.",
    },
    "Stressed": {
        "summary": "Your responses suggest you may be navigating tension, pressure, or a racing mind.",
        "supportive_message": "It is completely valid to feel overwhelmed. You don't have to carry everything all at once; let's slow things down one breath at a time.",
    },
    "Low": {
        "summary": "You appear to be experiencing low energy, fatigue, or a quiet, tender mood.",
        "supportive_message": "Be extra gentle with yourself today. You are doing enough simply by being here, and taking quiet time to rest is an act of care.",
    },
}

CATEGORY_RECOMMENDATIONS = {
    "Happy": [
        ActivityRecommendation(
            id="act_gratitude",
            title="Gratitude Reflection",
            category="Journaling",
            description="Write down 3 moments or people that brought warmth to your heart today.",
            duration="5 mins",
            action_type="journal",
            action_url="/journal.html?prompt=gratitude"
        ),
        ActivityRecommendation(
            id="act_uplifting_music",
            title="Uplifting Soundscapes",
            category="Music",
            description="Play energetic acoustic and gentle sunlit lofi melodies to match your vibrant mood.",
            duration="15 mins",
            action_type="music",
            action_url="/music.html?category=uplifting"
        ),
        ActivityRecommendation(
            id="act_creative_doodle",
            title="Vibrant Doodle Session",
            category="Doodle",
            description="Unleash your creativity with bright colors on Psyra's canvas board.",
            duration="10 mins",
            action_type="doodle",
            action_url="/doodle.html"
        ),
        ActivityRecommendation(
            id="act_celebrate",
            title="Celebrate Small Wins",
            category="Self-Care",
            description="Acknowledge one personal milestone or kind act you completed recently.",
            duration="3 mins",
            action_type="chat",
            action_url="/chat.html?starter=celebrate"
        ),
    ],
    "Neutral": [
        ActivityRecommendation(
            id="act_mindfulness",
            title="Gentle Mindfulness Walk",
            category="Self-Care",
            description="Take a 5-minute pause to notice 5 things you can see, 4 you can touch, and 3 you can hear.",
            duration="5 mins",
            action_type="chat",
            action_url="/chat.html?starter=mindfulness"
        ),
        ActivityRecommendation(
            id="act_calming_music",
            title="Serene Ambient Tones",
            category="Music",
            description="Listen to balanced, meditative piano and natural ocean stream rhythms.",
            duration="20 mins",
            action_type="music",
            action_url="/music.html?category=calming"
        ),
        ActivityRecommendation(
            id="act_neutral_journal",
            title="Curiosity Journaling",
            category="Journaling",
            description="Explore what you'd like to cultivate or learn more about this week.",
            duration="10 mins",
            action_type="journal",
            action_url="/journal.html?prompt=curiosity"
        ),
        ActivityRecommendation(
            id="act_free_doodle",
            title="Abstract Pattern Drawing",
            category="Doodle",
            description="Draw continuous curves and soothing concentric waves without overthinking.",
            duration="8 mins",
            action_type="doodle",
            action_url="/doodle.html"
        ),
    ],
    "Stressed": [
        ActivityRecommendation(
            id="act_breathing",
            title="4-7-8 Box Breathing",
            category="Self-Care",
            description="Inhale for 4 seconds, hold for 7, and release softly for 8 to signal calm to your nervous system.",
            duration="4 mins",
            action_type="chat",
            action_url="/chat.html?starter=breathing"
        ),
        ActivityRecommendation(
            id="act_concern_dump",
            title="Unload Current Concerns",
            category="Journaling",
            description="Put everything buzzing in your head onto the page so your mind can rest.",
            duration="8 mins",
            action_type="journal",
            action_url="/journal.html?prompt=brain_dump"
        ),
        ActivityRecommendation(
            id="act_calming_rain",
            title="Soft Rain & Singing Bowls",
            category="Music",
            description="Deep resonance audio designed to decelerate heart rate and loosen tense shoulders.",
            duration="15 mins",
            action_type="music",
            action_url="/music.html?category=relaxation"
        ),
        ActivityRecommendation(
            id="act_sensory_doodle",
            title="Slow Stroke Sand Doodling",
            category="Doodle",
            description="Use soft earthy tones to trace slow, deliberate strokes across the canvas.",
            duration="5 mins",
            action_type="doodle",
            action_url="/doodle.html"
        ),
    ],
    "Low": [
        ActivityRecommendation(
            id="act_gentle_rest",
            title="Cozy Blanket Rest",
            category="Self-Care",
            description="Drink a cup of warm herbal tea, wrap yourself in softness, and let your body relax.",
            duration="10 mins",
            action_type="selfcare",
            action_url="#"
        ),
        ActivityRecommendation(
            id="act_comfort_music",
            title="Comforting Lullaby & Ambient",
            category="Music",
            description="Soft, non-demanding warm ambient chords that hold comforting space.",
            duration="20 mins",
            action_type="music",
            action_url="/music.html?category=relaxation"
        ),
        ActivityRecommendation(
            id="act_supportive_chat",
            title="Talk with Psyra",
            category="AI Companion",
            description="Share what's on your heart with a compassionate, non-judgmental presence.",
            duration="Open",
            action_type="chat",
            action_url="/chat.html?starter=support"
        ),
        ActivityRecommendation(
            id="act_tiny_step",
            title="One Micro-Kindness",
            category="Journaling",
            description="Write one sentence offering kindness to yourself right as you are.",
            duration="3 mins",
            action_type="journal",
            action_url="/journal.html?prompt=self_compassion"
        ),
    ],
}


def calculate_assessment_result(answers: List[AssessmentAnswer]) -> AssessmentResultResponse:
    """
    Computes category scores from the 5 answers, detects the dominant category,
    computes confidence alignment, and generates personalized recommendations.
    """
    totals = {"Happy": 0, "Neutral": 0, "Stressed": 0, "Low": 0}
    
    for ans in answers:
        q_idx = ans.question_index
        opt_idx = ans.option_index
        if q_idx in QUESTION_WEIGHTS and opt_idx in QUESTION_WEIGHTS[q_idx]:
            for cat, weight in QUESTION_WEIGHTS[q_idx][opt_idx].items():
                totals[cat] += weight

    # Find highest scoring category
    # Handle ties with sensible fallback
    dominant_category = max(totals, key=totals.get)
    max_score = totals[dominant_category]
    total_score = sum(totals.values()) or 1
    proportion = max_score / total_score

    if proportion >= 0.40:
        confidence = "Strong Alignment"
    elif proportion >= 0.28:
        confidence = "Balanced Alignment"
    else:
        confidence = "Mixed Reflections"

    desc = CATEGORY_DESCRIPTIONS.get(dominant_category, CATEGORY_DESCRIPTIONS["Neutral"])
    recs = CATEGORY_RECOMMENDATIONS.get(dominant_category, CATEGORY_RECOMMENDATIONS["Neutral"])

    from datetime import datetime, timezone
    now_iso = datetime.now(timezone.utc).isoformat()

    return AssessmentResultResponse(
        category=dominant_category,
        confidence_label=confidence,
        summary=desc["summary"],
        supportive_message=desc["supportive_message"],
        disclaimer="PSYRA is a supportive self-reflection wellness tool and does not provide clinical diagnoses or replace medical care.",
        recommendations=recs,
        created_at=now_iso,
        answers_summary={"scores": totals, "proportion": round(proportion, 2)}
    )
