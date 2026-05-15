# backend/routes/auth_routes.py
from flask import Blueprint, request, jsonify
from auth import create_user, verify_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    user, err = create_user(data["username"], data["password"])
    if err: return jsonify({"ok": False, "error": err}), 400
    return jsonify({"ok": True, "user_id": user["user_id"]})

@auth_bp.route("/login", methods=["POST"])
def login():
    res = verify_user(request.json["username"], request.json["password"])
    if not res: return jsonify({"ok": False, "error": "invalid credentials"}), 401
    return jsonify({"ok": True, "token": res["token"], "user_id": res["user_id"], "username": res["username"]})
