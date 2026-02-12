# backend/routes/journal_routes.py
from flask import Blueprint, request, jsonify
from db import journals
from datetime import datetime

journal_bp = Blueprint("journal", __name__)

@journal_bp.route("/save", methods=["POST"])
def save_journal():
    data = request.json
    user_id = data.get("user_id")
    content = data.get("content")
    if not user_id or content is None:
        return jsonify({"ok": False, "error": "missing fields"}), 400
    journals.insert_one({"user_id": user_id, "content": content, "timestamp": datetime.utcnow()})
    return jsonify({"ok": True})
