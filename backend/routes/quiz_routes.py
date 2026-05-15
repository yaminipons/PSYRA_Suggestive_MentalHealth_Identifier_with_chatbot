# backend/routes/quiz_routes.py
from flask import Blueprint, request, jsonify
from db import quiz_answers, emotions
from datetime import datetime

quiz_bp = Blueprint("quiz", __name__)

@quiz_bp.route("/submit", methods=["POST"])
def submit_quiz():
    data = request.json
    user_id = data.get("user_id")
    answers = data.get("answers")
    if not user_id or not answers:
        return jsonify({"ok": False, "error": "missing fields"}), 400

    doc = {"user_id": user_id, "answers": answers, "timestamp": datetime.utcnow()}
    quiz_answers.insert_one(doc)

    score_map = {"A":3, "B":2, "C":1, "D":0}
    score = sum(score_map.get(a,0) for a in answers)
    emotions.insert_one({"user_id": user_id, "score": score, "answers": answers, "timestamp": datetime.utcnow()})

    if score >= 13: level = "good"
    elif score >= 8: level = "neutral"
    else: level = "needs_help"

    return jsonify({"ok": True, "score": score, "level": level})
