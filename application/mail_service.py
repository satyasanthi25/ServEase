from smtplib import SMTP
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText   #create a text plain/html

SMTP_HOST = "localhost"#mailhog smtp server running on the localhost
SMTP_PORT = 1025
SENDER_EMAIL = 'donot-reply@servease.project'
SENDER_PASSWORD = ''


def send_message(to, subject, content_body):#create multipart msg
    msg = MIMEMultipart()
    msg["To"] = to
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg.attach(MIMEText(content_body, 'html'))
    client = SMTP(host=SMTP_HOST, port=SMTP_PORT)
    client.send_message(msg=msg)
    client.quit()#terminate the client