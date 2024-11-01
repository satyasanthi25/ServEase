from flask import Flask
from flask_security import Security,login_required,login_user
from config import DevelopmentConfig
from application.models import db
from application.resources import api
from application.sec import datastore
#from flask_jwt_extended import JWTManager, create_access_token,jwt_required,get_jwt_identity # type: ignore
from flask_cors import CORS
from application.instances import cache
from application.worker import celery_init_app
import flask_excel as excel
from celery.schedules import crontab
from flask import Flask
from flask_security import Security
from flask_migrate import Migrate

from application.tasks import daily_reminder, send_monthly_report



def create_app():
    app = Flask(__name__)
    app.config.from_object(DevelopmentConfig)
    db.init_app(app=app)
    api.init_app(app)
    excel.init_excel(app)
    cache.init_app(app)
    CORS(app, methods=['GET', 'PUT', 'POST', 'DELETE'])
    app.security = Security(app, datastore)
    migrate = Migrate(app, db)
  
    with app.app_context():
        import application.views

    return app


app = create_app()
celery_app = celery_init_app(app)


@celery_app.on_after_configure.connect
def automated_tasks(sender, **kwargs):
    # daily at 6 30
    sender.add_periodic_task(
        30,
        # crontab(hour=19,minute=58),
        daily_reminder.s(),
    )

    # monthly report
    sender.add_periodic_task(
        30,
        # crontab(day_of_month=1, hour=0, minute=1),
        send_monthly_report.s(),
    )
    sender.add_periodic_task(
        crontab(hour=18, minute=0),  # Schedule for 6 PM
        daily_reminder.s(),
    )

if __name__ == '__main__':
    app.run(debug=True)
