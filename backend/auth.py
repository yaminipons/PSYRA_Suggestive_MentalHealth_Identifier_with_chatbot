# backend/auth.py
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from db import users

def create_user(username, password):
    if users.find_one({"username": username}):
        return None, "User exists"
    hashed = generate_password_hash(password)
    user = {"username": username, "password": hashed, "user_id": str(uuid.uuid4())}
    users.insert_one(user)
    return user, None

def verify_user(username, password):
    u = users.find_one({"username": username})
    if not u: return None
    if check_password_hash(u["password"], password):
        token = str(uuid.uuid4())
        users.update_one({"_id": u["_id"]}, {"$set": {"token": token}})
        return {"token": token, "user_id": u["user_id"], "username": u["username"]}
    return None
