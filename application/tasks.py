from datetime import datetime, timedelta
from celery import shared_task
from .mail_service import send_message
from .models import User, Role, ServiceRequest, db
from jinja2 import Template
from celery.utils.log import get_task_logger
from .user_reports import generate_reports

logger = get_task_logger(__name__)


from datetime import datetime, timedelta
from celery import shared_task
from .mail_service import send_message
from .models import User, Role, ServiceRequest, db
from celery.utils.log import get_task_logger
import requests

logger = get_task_logger(__name__)

# Google Chat Webhook URL (replace with the actual webhook URL)
GOOGLE_CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/v1/spaces/.../messages?key=...&token=...'

def send_google_chat_reminder(professional_name, pending_requests):
    """
    Sends a reminder message to the service professional via Google Chat.
    """
    message = {
        "text": f"Hello {professional_name}, you have {pending_requests} pending service request(s). Please visit the app to accept or reject them."
    }
    response = requests.post(GOOGLE_CHAT_WEBHOOK_URL, json=message)
    if response.status_code == 200:
        logger.info(f"Reminder sent successfully to {professional_name}")
    else:
        logger.error(f"Failed to send reminder to {professional_name}: {response.status_code}")

@shared_task(ignore_result=True)
def daily_reminder():
    # Fetch all users with role 'service professional'
    professionals = User.query.filter(User.roles.any(Role.name == 'sp')).all()
    
    for professional in professionals:
        # Check if there are pending requests for the professional
        pending_requests_count = ServiceRequest.query.filter_by(
            professional_id=professional.id,
            is_accepted=False,
            is_rejected=False
        ).count()
        
        # If there are pending requests, send a reminder via Google Chat or email
        if pending_requests_count > 0:
            send_google_chat_reminder(professional.fullname, pending_requests_count)
        else:
            logger.info(f"No pending requests for {professional.fullname}")
    
    return "Daily reminders sent to all service professionals with pending requests."



@shared_task(ignore_result=True)
def daily_user_reminder():
    # Send daily reminder to users with role 'customer'
    users = User.query.filter(User.roles.any(Role.name == 'customer')).all()
    for user in users:
        today = datetime.today().strftime('%Y-%m-%d')
        daily_visit = ServiceRequest.query.filter_by(user_id=user.id, date_of_request=today).count()
        if daily_visit == 0:
            with open('daily_reminder.html', 'r') as f:
                template = Template(f.read())
                send_message(user.email, "Service App | Don't miss today's services",
                             template.render(name=user.fullname))
    return "OK"


@shared_task(ignore_result=True)
def send_monthly_report():
    # Send monthly activity report to users with role 'customer'
    users = User.query.filter(User.roles.any(Role.name == 'customer')).all()
    for user in users:
        grph1, grph2, requested_services = generate_reports(user.id)
        with open('monthly_report.html', 'r') as f:
            template = Template(f.read())
            send_message(user.email, "ServEase App | Monthly Report",
                         template.render(grph1=grph1, grph2=grph2, name=user.fullname, requested_services=requested_services))
    return "OK"


