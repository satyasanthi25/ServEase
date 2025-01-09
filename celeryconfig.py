from celery import Celery
from celery.schedules import crontab

celery = Celery(__name__,broker='redis://localhost:6379/0',backend='redis://localhost:6379/0')

CELERY_BEAT_SCHEDULE ={
    'generate_monthly_report':{
        'task':'tasks.generate_monthly_report',
        'schedule':10.0
    },
    'send_daily_reminders':{
        'task':'tasks.send_daily_reminders',
        'schedule':10.0#crontab(hour=18)
    }
}


celery.conf.beat_schedule = CELERY_BEAT_SCHEDULE