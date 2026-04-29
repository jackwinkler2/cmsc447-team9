from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from config import Config

db = SQLAlchemy()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app)
    db.init_app(app)

    from app.routes.api import api_bp
    app.register_blueprint(api_bp)

    # creates tables
    with app.app_context():
        db.create_all()

    return app
