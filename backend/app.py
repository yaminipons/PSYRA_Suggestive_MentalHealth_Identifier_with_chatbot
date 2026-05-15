from flask import Flask
from routes.auth_routes import auth_bp
from routes.quiz_routes import quiz_bp
from routes.journal_routes import journal_bp
from routes.chat_routes import chat_bp
from routes.music_routes import music_bp
from flask_cors import CORS
import config

app = Flask(__name__, static_folder="../frontend", template_folder="../frontend")
app.config.from_object(config)
CORS(app)

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(quiz_bp, url_prefix="/api/quiz")
app.register_blueprint(journal_bp, url_prefix="/api/journal")
app.register_blueprint(chat_bp, url_prefix="/api/chat")
app.register_blueprint(music_bp, url_prefix="/api/music")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
