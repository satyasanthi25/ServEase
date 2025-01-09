from flask import Flask
from flask_security import Security
from config import DevelopmentConfig
from application.models import db
from application.resources import api
from application.sec import datastore
from flask_cors import CORS
from application.instances import cache

import redis

def create_app():
    app = Flask(__name__)
    redis_client = redis.Redis(host='localhost', port=6379, db=0)
    app.config.from_object(DevelopmentConfig)
    db.init_app(app=app)
    api.init_app(app)
    CORS(app, methods=['GET', 'PUT', 'POST', 'DELETE'])
    app.security = Security(app, datastore)
    cache.init_app(app)
    

    with app.app_context():
        import application.views

    return app
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
