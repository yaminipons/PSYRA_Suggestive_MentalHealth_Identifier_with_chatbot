# backend/db.py
from pymongo import MongoClient
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client.get_default_database()

users = db.users
quiz_answers = db.quiz_answers
emotions = db.emotions
journals = db.journals
