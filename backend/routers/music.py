"""
Music and sound therapy recommendation router for PSYRA:
- GET /api/music/recommendations (categorized by mood and emotional state)
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/music", tags=["Music Recommendations"])


class MusicTrack(BaseModel):
    id: str
    title: str
    artist_or_source: str
    category: str  # uplifting, calming, focus, relaxation
    description: str
    ambient_sound_type: Optional[str] = None  # e.g., 'rain', 'waves', 'forest', 'chimes'
    external_url: str
    duration_approx: str


MUSIC_COLLECTIONS: Dict[str, List[Dict[str, Any]]] = {
    "uplifting": [
        {
            "id": "trk_sunlit_acoustic",
            "title": "Sunlit Steps & Gentle Strings",
            "artist_or_source": "Acoustic Morning Radiance",
            "category": "uplifting",
            "description": "Bright acoustic fingerpicking designed to lift your spirits and spark gentle motivation.",
            "ambient_sound_type": "birds",
            "external_url": "https://www.youtube.com/results?search_query=uplifting+acoustic+morning+instrumental",
            "duration_approx": "30 mins"
        },
        {
            "id": "trk_lofi_joy",
            "title": "Warm Coffee & Sunshine",
            "artist_or_source": "Lofi Chillhop Curations",
            "category": "uplifting",
            "description": "Warm Rhodes piano chords with light organic percussion to celebrate small joys.",
            "ambient_sound_type": "cafe",
            "external_url": "https://www.youtube.com/results?search_query=happy+lofi+chillhop+beats",
            "duration_approx": "45 mins"
        }
    ],
    "calming": [
        {
            "id": "trk_zen_stream",
            "title": "Mountain Spring & Bamboo Chimes",
            "artist_or_source": "Nature Audio Collective",
            "category": "calming",
            "description": "Pure running water layered with subtle handcrafted harmonic wind chimes.",
            "ambient_sound_type": "stream",
            "external_url": "https://www.youtube.com/results?search_query=gentle+forest+stream+and+wind+chimes",
            "duration_approx": "60 mins"
        },
        {
            "id": "trk_peaceful_keys",
            "title": "Slow Piano & Soft Atmosphere",
            "artist_or_source": "Minimalist Piano Soundscape",
            "category": "calming",
            "description": "Slow, spacious piano melodies that allow your nervous system to downshift.",
            "ambient_sound_type": "soft_piano",
            "external_url": "https://www.youtube.com/results?search_query=calming+piano+mindfulness+music",
            "duration_approx": "40 mins"
        }
    ],
    "focus": [
        {
            "id": "trk_alpha_waves",
            "title": "Binaural Alpha Waves (10 Hz)",
            "artist_or_source": "Focus Acoustics",
            "category": "focus",
            "description": "Gentle frequency entrainment designed to settle brain chatter and support clear attention.",
            "ambient_sound_type": "alpha_tone",
            "external_url": "https://www.youtube.com/results?search_query=10hz+alpha+binaural+beats+study",
            "duration_approx": "60 mins"
        },
        {
            "id": "trk_deep_library",
            "title": "Rain on the Glass Window",
            "artist_or_source": "Atmospheric Study Space",
            "category": "focus",
            "description": "A steady rhythm of rainfall on glass that masks ambient distractions comfortably.",
            "ambient_sound_type": "rain",
            "external_url": "https://www.youtube.com/results?search_query=rain+on+window+ambient+study",
            "duration_approx": "120 mins"
        }
    ],
    "relaxation": [
        {
            "id": "trk_tibetan_bowls",
            "title": "Singing Bowls & Grounding Drone",
            "artist_or_source": "Resonant Sound Healing",
            "category": "relaxation",
            "description": "Sustained harmonic overtones tuned to release muscle constriction and soften tension.",
            "ambient_sound_type": "singing_bowl",
            "external_url": "https://www.youtube.com/results?search_query=tibetan+singing+bowls+stress+relief",
            "duration_approx": "45 mins"
        },
        {
            "id": "trk_ocean_rest",
            "title": "Nocturnal Ocean Swells",
            "artist_or_source": "Pacific Shoreline Field Recordings",
            "category": "relaxation",
            "description": "Slow, rolling deep ocean waves matching the cadence of relaxed, restorative breathing.",
            "ambient_sound_type": "ocean",
            "external_url": "https://www.youtube.com/results?search_query=calm+ocean+waves+relaxation+night",
            "duration_approx": "60 mins"
        }
    ]
}


@router.get("/recommendations")
async def get_recommendations(
    category: Optional[str] = Query(None, description="uplifting, calming, focus, or relaxation"),
    emotion: Optional[str] = Query(None, description="Happy, Neutral, Stressed, Low")
):
    target_category = category

    if not target_category and emotion:
        mapping = {
            "Happy": "uplifting",
            "Neutral": "calming",
            "Stressed": "relaxation",
            "Low": "calming"
        }
        target_category = mapping.get(emotion, "calming")

    if target_category and target_category in MUSIC_COLLECTIONS:
        return {
            "category": target_category,
            "tracks": MUSIC_COLLECTIONS[target_category]
        }

    # Return all categories
    return {
        "all_categories": ["uplifting", "calming", "focus", "relaxation"],
        "collections": MUSIC_COLLECTIONS
    }
