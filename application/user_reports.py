import base64
import io
from datetime import datetime, timedelta
from matplotlib import pyplot as plt
from application.models import ServiceRequest, Service, db, User


def get_services_requested_by_category_last_30_days(user_id):
    thirty_days_ago = datetime.now() - timedelta(days=30)

    services_requested = db.session.query(Service.service_name, db.func.count(ServiceRequest.service_id)) \
        .join(Service, ServiceRequest.service_id == Service.service_id) \
        .join(User, User.id == ServiceRequest.user_id) \
        .filter(ServiceRequest.date_of_request >= thirty_days_ago, User.id == user_id, ServiceRequest.is_requested == True) \
        .group_by(Service.service_name).all()

    return services_requested


def get_services_requested_vs_closed_last_30_days(user_id):
    thirty_days_ago = datetime.now() - timedelta(days=30)

    requested_vs_closed = db.session.query(ServiceRequest.date_of_request,
                                           db.func.count(ServiceRequest.id).label('requested'),
                                           db.func.sum(db.cast(ServiceRequest.is_closed, db.Integer)).label('closed')) \
        .join(User, User.id == ServiceRequest.user_id) \
        .filter(ServiceRequest.date_of_request >= thirty_days_ago, User.id == user_id) \
        .group_by(ServiceRequest.date_of_request).all()

    return requested_vs_closed


def generate_reports(user_id):
    # Get data for reports
    services_requested_by_category = get_services_requested_by_category_last_30_days(user_id)
    services_requested_vs_closed = get_services_requested_vs_closed_last_30_days(user_id)
    services_requested = requested_services_in_30_days(user_id)

    # Generate graph for services requested by category
    category_names = [item[0] for item in services_requested_by_category]
    services_requested_counts = [item[1] for item in services_requested_by_category]
    plt.figure(figsize=(10, 6))
    plt.bar(category_names, services_requested_counts)
    plt.xlabel('Service')
    plt.ylabel('Number of Services Requested')
    plt.title('Number of Services Requested in (Last 30 Days)')
    plt.xticks(rotation=45)
    plt.tight_layout()
    requested_by_category_graph = save_plot_to_base64()

    # Generate graph for services requested vs. closed
    dates = [item[0] for item in services_requested_vs_closed]
    requested_counts = [item[1] for item in services_requested_vs_closed]
    closed_counts = [item[2] for item in services_requested_vs_closed]
    plt.figure(figsize=(10, 6))
    plt.plot(dates, requested_counts, marker='o', label='Requested')
    plt.plot(dates, closed_counts, marker='o', label='Closed')
    plt.xlabel('Date')
    plt.ylabel('Number of Services')
    plt.title('Total Number of Services Requested vs Closed (Last 30 Days)')
    plt.xticks(rotation=45)
    plt.legend()
    plt.tight_layout()
    requested_vs_closed_graph = save_plot_to_base64()

    # Encode graphs to base64
    return requested_by_category_graph, requested_vs_closed_graph, services_requested


def save_plot_to_base64():
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()
    return image_base64


def requested_services_in_30_days(user_id):
    thirty_days_ago = datetime.now() - timedelta(days=30)

    return ServiceRequest.query.filter_by(user_id=user_id, is_requested=True).filter(
        ServiceRequest.date_of_request > thirty_days_ago).all()
