
from sqlalchemy import or_
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from io import StringIO
from datetime import datetime, timedelta
from celeryconfig import celery
#from app import app
from application.models import db,User,Service,ServiceRequest 
import csv

from app import app

#generate mothly report for customers
@celery.task
def generate_monthly_report():
    with app.app_context():
        # Get current month and year
        current_month = datetime.now().strftime('%B')
        current_year = datetime.now().year

        # # Generate the date range for the previous month
        # start_date = datetime(datetime.now().year, datetime.now().month - 1, 1)
        # end_date = datetime(datetime.now().year, datetime.now().month, 1)

        # Fetch all users with the 'Customer' role
        customers = User.query.filter(User.roles.any(name="customer")).all()

        if not customers:
            print("No customers found for the monthly report.")
            return

        for customer in customers:
            # Fetch customer-specific activity data for the last month
            total_services_requested = ServiceRequest.query.filter(
                ServiceRequest.customer_id == customer.id
            ).count()

            services_closed = ServiceRequest.query.filter(
                ServiceRequest.customer_id == customer.id,
                ServiceRequest.service_request_status == 'closed',
            ).count()

            active_requests = ServiceRequest.query.filter(
                ServiceRequest.customer_id == customer.id,
                ServiceRequest.service_request_status == 'requested'
            ).count()

            # Create an HTML report
            html_content = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Monthly Activity Report</title>
                </head>
                <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
                    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #4CAF50; color: #ffffff; padding: 15px; text-align: center;">
                            <h2 style="margin: 0; font-size: 24px;">Monthly Activity Report</h2>
                        </div>
                        <div style="padding: 20px;">
                            <p style="font-size: 16px; color: #333333;">Hello <b>{customer.username}</b>,</p>
                            <p style="font-size: 14px; color: #555555;">Here is your activity report for <b>{current_month} {current_year}</b>.</p>
                            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                                <tr>
                                    <th style="background-color: #f2f2f2; padding: 10px; font-size: 14px; text-align: left; border: 1px solid #ddd;">Service Metric</th>
                                    <th style="background-color: #f2f2f2; padding: 10px; font-size: 14px; text-align: left; border: 1px solid #ddd;">Count</th>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; font-size: 14px; border: 1px solid #ddd;">Total Services Requested</td>
                                    <td style="padding: 10px; font-size: 14px; border: 1px solid #ddd;">{total_services_requested}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; font-size: 14px; border: 1px solid #ddd;">Services Closed</td>
                                    <td style="padding: 10px; font-size: 14px; border: 1px solid #ddd;">{services_closed}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; font-size: 14px; border: 1px solid #ddd;">Active Requests</td>
                                    <td style="padding: 10px; font-size: 14px; border: 1px solid #ddd;">{active_requests}</td>
                                </tr>
                            </table>
                            <p style="margin-top: 20px; font-size: 14px; color: #555555;">Thank you for using our services!</p>
                        </div>
                        <div style="background-color: #f2f2f2; padding: 10px; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #FF9F29;">© {current_year} Servease App. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """


            # Send the email report to the customer
            send_email('21f3000613@ds.study.iitm.ac.in', html_content,role='customer')

def send_email(to_email, html_content):
    from_email = 'noreply@serveaseapp.com'
    subject = 'Monthly Activity Report'
    msg = MIMEMultipart('alternative')
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject

    # Attach HTML content
    part1 = MIMEText(html_content, 'html')
    msg.attach(part1)

    # Email server configuration
    smtp_server = 'localhost'
    smtp_port = 1025  # Change to production SMTP settings if necessary

    # Send the email
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.sendmail(from_email, to_email, msg.as_string())
#____________________________________________________________
@celery.task
def export_closed_requests_as_csv():
    app.logger.info("Starting CSV export task...")
    
    # Query closed service requests
    closed_requests = ServiceRequest.query.filter(ServiceRequest.service_request_status == 'closed').all()
    app.logger.info(f"Found {len(closed_requests)} closed requests.")
    
    # Prepare CSV buffer
    csv_buffer = StringIO()
    csv_writer = csv.writer(csv_buffer)
    csv_writer.writerow([
        'ServiceID', 'CustomerID', 'ProfessionalID', 'DateOfRequest', 
        'DateOfCompletion', 'Remarks', 'BookingDate'
    ])
    
    # Write details for each closed request
    for request in closed_requests:
        csv_writer.writerow([
            request.service_id or 'N/A',
            request.customer_id or 'N/A',
            request.professional_id or 'N/A',
            request.date_of_request or 'N/A',
            request.date_of_completion or 'N/A',
            request.remarks or 'N/A',
            request.booking_date or 'N/A'
            
        ])
    base_dir = os.path.abspath(os.path.dirname(__name__))
    csv_file_path = os.path.join(base_dir,'csv/closed_requests_report.csv')  
      
    # Save CSV to file
    with open(csv_file_path, 'w') as csv_file:
        csv_file.write(csv_buffer.getvalue())
    
    app.logger.info(f"Closed requests CSV exported to: {csv_file_path}")
    return csv_buffer.getvalue()
#_____________________________________________
@celery.task
def send_daily_reminders():
    with app.app_context():
        # Get current date
        today = datetime.now().date()

        # Fetch all service professionals
        professionals = User.query.filter(User.roles.any(name="sp")).all()

        if not professionals:
            print("No service professionals found for daily reminders.")
            return

        for professional in professionals:
            # Fetch pending service requests for the professional
            pending_requests = ServiceRequest.query.filter(
                ServiceRequest.professional_id == professional.id,
                ServiceRequest.service_request_status=='requested',
                #ServiceRequest.date_of_request <= today
            ).all()

            if not pending_requests:
                continue

            # Create the HTML content for the reminder email
            request_details = "".join([
                f"<tr><td>{request.id}</td><td>{request.service.service_name}</td><td>{request.date_of_request}</td></tr>"
                for request in pending_requests
            ])

            html_content = f"""
            <!DOCTYPE html>
                <html>
                <head>
                    <title>Daily Reminder</title>
                </head>
                <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; color: #333;">
                    <div style="max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #ddd;">
                        <div style="padding: 20px; text-align: center; background-color: #4CAF50; color: #fff;">
                            <h2 style="margin: 0;">Hello {professional.username},</h2>
                        </div>
                        <div style="padding: 20px;">
                            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">You have pending service requests. Please review and take action as soon as possible.</p>
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background-color: #f2f2f2;">
                                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Request ID</th>
                                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Service Name</th>
                                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date of Request</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {request_details}
                                </tbody>
                            </table>
                            <p style="margin-top: 20px; font-size: 16px; line-height: 1.6;">Please log in to your dashboard to accept/reject these requests or visit the customer.</p>
                            <p style="margin-top: 20px; font-size: 16px; line-height: 1.6;">Thank you for your dedication to our platform!</p>
                        </div>
                        <div style="text-align: center; padding: 15px; background-color: #f9f9f9; border-top: 1px solid #ddd;">
                            <p style="margin: 0; font-size: 14px; color: #777;">Servease App | Your trusted service platform</p>
                        </div>
                    </div>
                </body>
                </html>"""


            # Send the email reminder to the professional
            send_email(professional.email, html_content, 'sp')

        # Fetch all customers
        customers = User.query.filter(User.roles.any(name="customer")).all()

        if not customers:
            print("No customers found for activity reports.")
            return

        for customer in customers:
            # Fetch last month's activity
            start_date = today.replace(day=1) - timedelta(days=1)
            end_date = start_date.replace(day=1)

            services_requested = ServiceRequest.query.filter(
                ServiceRequest.customer_id == customer.id,
                ServiceRequest.date_of_request.between(end_date, start_date)
            ).all()

            services_closed = [req for req in services_requested if req.service_request_status == 'closed']

            service_details = "".join([
                f"<tr><td>{req.id}</td><td>{req.service.service_name}</td><td>{req.date_of_request}</td><td>{req.service_request_status}</td></tr>"
                for req in services_requested
            ])

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Monthly Activity Report</title>
            </head>
            <body>
                    <h2>Hello {customer.username},</h2>
                    <p>Here is your activity report for the last month:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #F1FEA4;">
                        <tr>
                            <th style="border: 1px solid #ddd; padding: 10px; background-color: #A1EEBD; font-weight: bold;">Request ID</th>
                            <th style="border: 1px solid #ddd; padding: 10px; background-color: #A1EEBD; font-weight: bold; ">Service Name</th>
                            <th style="border: 1px solid #ddd; padding: 10px; background-color: #A1EEBD; font-weight: bold; ">Date of Request</th>
                            <th style="border: 1px solid #ddd; padding: 10px; background-color: #A1EEBD; font-weight: bold; ">Status</th>
                        </tr>
                        {service_details}
                    </table>
                    <p>Total Services Requested: {len(services_requested)}</p>
                    <p>Total Services Closed: {len(services_closed)}</p>
                    <p>Thank you for using our platform! We appreciate your trust and look forward to serving you better.</p>
                </body>
            </html>"""

            # Send the email report to the customer
            send_email(customer.email, html_content, 'customer')

def send_email(to_email, html_content,role):
    from_email = 'noreply@serveaseapp.com'
    if role == 'sp':
        subject = 'Daily Reminder: Pending Service Requests'
    elif role == 'customer':
        subject = 'Monthly Activity Report(customer)'
    else:
        subject = 'Notification from Servease App'
    
    msg = MIMEMultipart('alternative')
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject

    
    part1 = MIMEText(html_content, 'html')# Attach HTML content
    msg.attach(part1)

    # Email server configuration
    smtp_server = 'localhost'
    smtp_port = 1025  # Change to production SMTP settings if necessary

    # Send the email
    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.sendmail(from_email, to_email, msg.as_string())
        print(f"Email successfully sent to {to_email} with subject '{subject}'.")
    except Exception as e:
        print(f"Failed to send email to {to_email}. Error: {e}")

