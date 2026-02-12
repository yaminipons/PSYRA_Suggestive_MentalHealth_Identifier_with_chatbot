# backend/routes/music_routes.py

from flask import Blueprint, request, jsonify
import os
import random

music_bp = Blueprint("music", __name__)

# ---------- OFFLINE MUSIC STORAGE ----------
# Place MP3 files inside: frontend/assets/music/
OFFLINE_MUSIC = {
    "Happy": [
        {"title": "Joyful Morning", "file": "joyful_morning.mp3"},
        {"title": "Bright Day", "file": "bright_day.mp3"},
    ],
    "Neutral": [
        {"title": "Soft Breeze", "file": "soft_breeze.mp3"},
        {"title": "Calm Evening", "file": "calm_evening.mp3"},
    ],
    "Stressed": [
        {"title": "Deep Relaxation", "file": "deep_relax.mp3"},
        {"title": "Slow Breathing", "file": "slow_breathing.mp3"},
    ],
    "Low": [
        {"title": "Comfort Melody", "file": "comfort_melody.mp3"},
        {"title": "Gentle Hope", "file": "gentle_hope.mp3"},
    ],
}

# ---------- SPOTIFY STYLE ONLINE LINKS ----------
ONLINE_PLAYLISTS = {
    "Happy": [
        {"title": "Upbeat Vibes", 
         "url": "https://open.spotify.com/playlist/37i9dQZF1DXdPec7aLTmlC"},
        {"title": "Feel Good Hits", 
         "url": "https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0"},
    ],
    "Neutral": [
        {"title": "Easy Listening", 
         "url": "https://open.spotify.com/playlist/37i9dQZF1DWYx1r2cI2A4B"},
        {"title": "Acoustic Relax", 
         "url": "https://open.spotify.com/playlist/37i9dQZF1DX0jgyAiPl8Af"},
    ],
    "Stressed": [
        {"title": "Calm Piano", 
         "url": "https://open.spotify.com/playlist/37i9dQZF1DWU6QmMWiv7mS"},
        {"title": "Guided Breathing + Ambient",
         "url": "https://open.spotify.com/playlist/37i9dQZF1DX7gIoKXt0gmx"},
    ],
    "Low": [
        {"title": "Soothing Acoustic",
         "url": "https://open.spotify.com/playlist/37i9dQZF1DX7qK8ma5wgG1"},
        {"title": "Gentle Focus",
         "url": "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO"},
    ],
}

# ---------- MAIN ENDPOINT ----------
@music_bp.route("/recommend", methods=["POST"])
def recommend_music():
    data = request.json or {}
    mood = data.get("mood", "Neutral")

    offline = OFFLINE_MUSIC.get(mood, OFFLINE_MUSIC["Neutral"])
    online = ONLINE_PLAYLISTS.get(mood, ONLINE_PLAYLISTS["Neutral"])

    # Pick 1 random offline song
    selected_offline = random.choice(offline)

    return jsonify({
        "success": True,
        "mood": mood,
        "offline": selected_offline,
        "online": online
    }), 200
