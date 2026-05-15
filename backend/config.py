# backend/config.py
import os

SECRET_KEY = os.environ.get("PSYRA_SECRET_KEY", "dev-secret")
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/psyra_db")
RASA_URL = os.environ.get("RASA_URL", "http://localhost:5005")
