import re
from flask import current_app as app, jsonify, request, render_template, send_file,redirect,url_for,flash
from flask.json import dump
from flask_security import auth_required, roles_required,login_user,current_user
from sqlalchemy import or_
from werkzeug.security import check_password_hash, generate_password_hash
from flask_restful import marshal, fields
from .models import User,Role, db, ServiceRequest, Service
from .sec import datastore
from flask_login import current_user,login_required
from datetime import datetime
from functools import wraps
from .resources import service_request_fields,user_fields
from email_validator import validate_email, EmailNotValidError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload



import base64
import random
import os
import matplotlib
from io import BytesIO

matplotlib.use('Agg')
import matplotlib.pyplot as plt
from flask import request, jsonify
from sqlalchemy import text,or_
from werkzeug.utils import secure_filename
from .models import *

from application.models import Service, db, User, ServiceRequest, Review




def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.has_role('admin'):
            flash('You do not have permission to access this page.', 'danger')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

def customer_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.has_role('customer'):
            flash('You do not have permission to access this page.', 'danger')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

def sp_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.has_role('sp'):
            flash('You do not have permission to access this page.', 'danger')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function
#_____________________________________________________________________
@app.get('/')
def index():
    return render_template('index.html')
@app.route('/api/about', methods=['GET'])
def about():
    about_data = {
        "mission": "We aim to make home care effortless and reliable...",
        "why_choose_us": [
            "Verified professionals with skills you can count on",
            "Easy booking and scheduling to fit your time",
            "Secure and transparent payments",
            "Dedicated customer support to assist you",
            "Flexible packages tailored to your needs"
        ],
        "features": [
            {"title": "Comprehensive Service Options", "description": "From repairs to cleaning, and everything in between."},
            {"title": "Simple Navigation", "description": "Designed with you in mind, our intuitive interface makes finding the right service easy."},
            {"title": "Detailed Profiles", "description": "View experience, ratings, and reviews to choose the best professional for the job."},
            {"title": "Real-Time Updates", "description": "Stay updated on the status of your service request and communicate easily with professionals."}
        ]
    }
    return jsonify(about_data)


#-------------------------------------LOGIN-ROUTE----------------------------------------------------
@app.route('/user-login', methods=['GET', 'POST'])
def user_login():
    if request.method == 'POST':
        data = request.get_json()
        
        # Ensure email is provided
        email = data.get('email')
        role = data.get('role')
        if not email:
            return jsonify({"message": "Email not provided"}), 400
        
        # Fetch user based on email
        user = datastore.find_user(email=email)
        
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        # Check password
        if not check_password_hash(user.password, data.get("password")):
            return jsonify({"message": "Incorrect password"}), 400
        
        # Determine user role and respond accordingly
        if "customer" in user.roles:
            return jsonify({
                "token": user.get_auth_token(),
                "email": user.email,
                "role": "customer"
            }), 200

        elif "sp" in user.roles:
            return jsonify({
                "token": user.get_auth_token(),
                "email": user.email,
                "role": "sp"
            }), 200

        elif "admin" in user.roles:
            return jsonify({
                "token": user.get_auth_token(),
                "email": user.email,
                "role": "admin"
            }), 200
        
        return jsonify({"message": "Invalid role. User is neither a Customer, Service Professional, nor Admin"}), 404
    else:
        # If it's a GET request, you can render a page or return any necessary data (if required).
        return jsonify({"message": "Login Page"}), 200
#_____________________________________CUSTOMER-REGISTER___________________________________________
@app.post('/customer-register')
def customer_register():
    data = request.get_json()
    role = data.get('role')
    email = data.get('email')
    username = data.get('username')  
    password = data.get('password')
    fullname = data.get('fullname')
    address = data.get('address')
    pin_code = data.get('pin_code')  
    contact_no = data.get('contact_no')  

    # Check required fields
    if not email:
        return jsonify({"message": "Email not provided"}), 400
    if not username:
        return jsonify({"message": "Username not provided"}), 400
    if not password:
        return jsonify({"message": "Password not provided"}), 400
    if not fullname:
        return jsonify({"message": "Full name not provided"}), 400
    if not address:
        return jsonify({"message": "Address not provided"}), 400
    if not pin_code:
        return jsonify({"message": "Pin code not provided"}), 400
    if not contact_no:
        return jsonify({"message": "Contact number not provided"}), 400
    
    # Check if user already exists
    user_exists = User.query.filter_by(email=email).count()
    if user_exists:
        return jsonify({"message": "Email already taken, use another email"}), 401

    # Create new user
    user = datastore.create_user(
        email=email, 
        username=username, 
        password=generate_password_hash(password), 
        fullname=fullname,
        active=True,
        roles=["customer"],
        address=address,
        pin_code=pin_code,
        contact_no=contact_no  
    )
    db.session.commit()
    return jsonify({"token": user.get_auth_token(),
                    "email": user.email,
                    "role": user.roles[0].name}), 201
#---------------------------PROFESSIONAL-REGISTER----------------------------------------------
@app.post('/sp-register')
def professional_register():
    data = request.get_json()
    role = data.get('role')
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')
    fullname = data.get('fullname')
    service_name = data.get('service_name')
    experience_years = data.get('experience_years')
    address = data.get('address')
    pin_code = data.get('pin_code')
    contact_no = data.get('contact_no')
    is_professional = data.get('is_professional', False)
    is_approved = data.get('is_approved', False)
    is_blocked = data.get('is_blocked', False)

    # Input validations
    if not email:
        return jsonify({"message": "email not provided"}), 400
    if not username:
        return jsonify({"message": "username not provided"}), 400
    if not fullname:
        return jsonify({"message": "fullname not provided"}), 400
    if not password:
        return jsonify({"message": "password not provided"}), 400
    if not service_name:
        return jsonify({"message": "service name not provided"}), 400
    if not experience_years:
        return jsonify({"message": "experience not provided"}), 400
    if not address:
        return jsonify({"message": "address not provided"}), 400
    if not pin_code:
        return jsonify({"message": "pin code not provided"}), 400
    if not contact_no:
        return jsonify({"message": "contact number not provided"}), 400
    if not is_professional:
        return jsonify({"message": "is_professional not provided"}), 400

    user_exists = User.query.filter_by(email=email).count()
    if user_exists:
        return {"message": "Email already taken, use another email"}, 401

    try:
        user = datastore.create_user(
            email=email, 
            username=username, 
            password=generate_password_hash(password), 
            fullname=fullname,
            active=True,
            roles=["sp"],
            service_name=service_name,
            experience_years=experience_years,
            address=address,
            pin_code=pin_code,
            contact_no=contact_no,
            is_professional=True,
            is_approved=False,
            is_blocked=False
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({
            "token": user.get_auth_token(),
            "email": user.email,
            "role": user.roles[0].name if user.roles else None
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "An error occurred during user registration", "error": str(e)}), 500

#-----------------------------------------PROFILE---------------------------------------------
@app.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    # Profile data setup
    user = current_user
    profile_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'fullname': user.fullname,
        'address': user.address,
        'pin_code': user.pin_code,
        'contact_no': user.contact_no,
        'service_name': user.service_name if user.is_service_professional else None,
        'experience_years': user.experience_years if user.is_professional else None,
        'is_professional': user.is_professional,
        'is_approved': user.is_approved,
        'is_blocked': user.is_blocked,
    }
    return jsonify(profile_data), 200, {'Content-Type': 'application/json'}

#_______________________________________
@app.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    user = current_user
    data = request.json

    if not data:
        return jsonify({"message": "No data provided"}), 400

    errors = []

    # Password validation
    if 'password' in data and data['password']:
        password = data['password']
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in password):
            errors.append("Password must contain at least one number.")
        if not any(char.isupper() for char in password):
            errors.append("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in password):
            errors.append("Password must contain at least one lowercase letter.")
        if not any(char in '!@#$%^&*()-_+=' for char in password):
            errors.append("Password must contain at least one special character.")
        else:
            user.password = generate_password_hash(password)

    # Email validation
    if 'email' in data and data['email']:
        try:
            valid_email = validate_email(data['email']).email
        except EmailNotValidError as e:
            errors.append(str(e))
        # Check if the email is already taken
        if User.query.filter(User.email == data['email'], User.id != user.id).first():
            errors.append("Email is already taken.")
        user.email = valid_email

    # Username validation
    if 'username' in data and data['username']:
        if len(data['username']) < 3 or len(data['username']) > 20:
            errors.append("Username must be between 3 and 20 characters long.")
        if not re.match("^[a-zA-Z0-9_.-]+$", data['username']):
            errors.append("Username can only contain letters, numbers, dots, underscores, and hyphens.")
        # Check if the username is already taken
        if User.query.filter(User.username == data['username'], User.id != user.id).first():
            errors.append("Username is already taken.")
        user.username = data['username']

    # Address validation (Optional)
    if 'address' in data and data['address']:
        if len(data['address']) < 10:
            errors.append("Address must be at least 10 characters long.")
        user.address = data['address']

    # Pin code validation
    if 'pin_code' in data and data['pin_code']:
        if not re.match("^[0-9]{5,6}$", data['pin_code']):
            errors.append("Pin code must be 5 or 6 digits long.")
        user.pin_code = data['pin_code']

    # Contact number validation
    if 'contact_no' in data and data['contact_no']:
        if not re.match("^[0-9]{10}$", data['contact_no']):
            errors.append("Contact number must be 10 digits long.")
        user.contact_no = data['contact_no']

    # Service Professional-specific fields
    if user.is_professional:
        if 'service_name' in data and data['service_name']:
            if len(data['service_name']) < 3:
                errors.append("Service name must be at least 3 characters long.")
            user.service_name = data['service_name']
        
        if 'experience_years' in data and data['experience_years']:
            if not isinstance(data['experience_years'], int) or data['experience_years'] < 0:
                errors.append("Experience years must be a non-negative integer.")
            user.experience_years = data['experience_years']

    # If there are errors, return them to the client
    if errors:
        return jsonify({"errors": errors}), 400

    # Save changes to the database
    try:
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "An integrity error occurred."}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'An error occurred: {str(e)}'}), 500
#_________________________________PROFESSIONAL-ROUTES___________________________________________
@app.route('/api/professionals', methods=['GET'])
def get_professionals():
    try:
        # Check if the 'sp' role exists
        service_professional_role = Role.query.filter_by(name='sp').first()

        if not service_professional_role:
            return jsonify({"error": "Service Professional role not found"}), 400

        # Fetch users with the 'sp' role
        professionals = User.query.join(User.roles).filter(Role.name == 'sp').all()

        # Check if any professionals were found
        if not professionals:
            return jsonify({"message": "No professionals found"}), 404

        # Prepare data for response
        result = [
            {
                'id': professional.id,
                'fullname': professional.fullname,
                'email': professional.email,
                'contact_no': professional.contact_no,
                'is_approved': 'Yes' if professional.is_approved else 'No',
                'experience_years': professional.experience_years,
                'service_name': professional.service_name,
                'is_professional': 'Yes' if professional.is_professional else 'No',
                'is_blocked': 'Yes' if professional.is_blocked else 'No',
            }
            for professional in professionals
        ]

        # Return JSON response
        return jsonify(result), 200

    except Exception as e:
        # Log the error message for easier debugging
        print("Error fetching professionals:", str(e))
        return jsonify({"error": str(e)}), 500
#_____________________________________________________________
@app.route('/api/service/accept/<int:service_id>', methods=['POST'])
def accept_service(service_id):
    # Logic to accept the service here
    try:
        # Example logic to mark the service as accepted
        service = Service.query.get(service_id)
        if service:
            service.status = 'accepted'
            db.session.commit()
            return jsonify({"success": True, "message": "Service accepted successfully."}), 200
        else:
            return jsonify({"success": False, "message": "Service not found."}), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/service/reject/<int:service_id>', methods=['POST'])
@auth_required("token")  # Assuming the user must be authenticated to reject a service
def reject_service(service_id):
    try:
        # Fetch the service request by ID
        service = ServiceRequest.query.get(service_id)
        
        # Check if the service request exists
        if not service:
            return jsonify({'error': 'Service request not found'}), 404

        # Update the service status to 'rejected'
        service.service_request_status = 'rejected'
        db.session.commit()

        return jsonify({'message': 'Service rejected successfully'}), 200

    except Exception as e:
        # Log the error for debugging purposes
        print(f"Error rejecting service request: {str(e)}")
        
        # Return a generic error message
        return jsonify({'error': 'An error occurred while rejecting the service'}), 500

  
  #________________________________________USER-ROUTES_________________________________
from flask_restful import fields
# User fields to include in API responses
user_fields = {
    'id': fields.Integer,
    'email': fields.String,
    'username': fields.String,
    'active': fields.Boolean,
    'is_blocked': fields.Boolean,  # Include the is_blocked field
    'is_approved': fields.Boolean,  # Include the is_approved field if necessary
    'roles': fields.List(fields.String)  # Include roles if you want to display them
}

# Endpoint to get all users
@app.route('/users', methods=['GET'])
@auth_required("token")
@roles_required("admin")
def all_users():
    users = User.query.all()
    if len(users) == 0:
        return jsonify({"message": "No User Found"}), 404
    return marshal(users, user_fields)

@app.route('/activate/inst/<int:user_id>', methods=['POST'])
@auth_required("token")
@roles_required("admin")
def activate_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404
    user.active = True
    db.session.commit()
    return jsonify({"message": f"User {user.username} has been activated."}), 200

@app.route('/block/inst/<int:user_id>', methods=['POST'])
@auth_required("token")
@roles_required("admin")
def block_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404
    user.is_blocked = True
    db.session.commit()
    return jsonify({"message": f"User {user.username} has been blocked."}), 200

@app.route('/unblock/inst/<int:user_id>', methods=['POST'])
@auth_required("token")
@roles_required("admin")
def unblock_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404
    user.is_blocked = False
    db.session.commit()
    return jsonify({"message": f"User {user.username} has been unblocked."}), 200
#_________________________________________________________
@app.route('/api/admin/approve/<int:user_id>', methods=['POST'])
@login_required
@roles_required("admin")
def approve_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found.'}), 404
    
    if user.can_be_approved:  # Ensure this logic is defined in your User model
        user.is_approved = True
        db.session.commit()
        return jsonify({'message': f'User {user.username} has been approved successfully.'}), 200
    else:
        return jsonify({'message': 'User cannot be approved.'}), 400
#______________
@app.route('/api/admin/reject/<int:user_id>', methods=['POST'])
@login_required
@roles_required("admin")
def reject_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found.'}), 404
    
    if not user.is_blocked:
        user.is_blocked = True
        db.session.commit()
        return jsonify({'message': f'User {user.username} has been blocked successfully.'}), 200
    else:
        return jsonify({'message': 'User is already blocked.'}), 400
#__
# @app.route('/api/admin/delete/<int:user_id>', methods=['DELETE'])
# @login_required
# @roles_required("admin")
# def delete_user(user_id):
#     user = User.query.get(user_id)
#     if not user:
#         return jsonify({'message': 'User not found.'}), 404
    
#     db.session.delete(user)
#     db.session.commit()
#     return jsonify({'message': f'User {user.username} has been deleted successfully.'}), 200

#____________________________SERVICE-REQUESTS___CREATE___________________
@app.route('/api/service-requests', methods=['POST'])
@auth_required("token")
def service_requests():
    data = request.get_json()

    # Retrieve the current user's ID
    customer_id = current_user.id
    
    # Parse dates if they are provided; otherwise, set to None
    try:
        date_of_request = datetime.strptime(data.get('date_of_request'), '%Y-%m-%d') if data.get('date_of_request') else None
        booking_date = datetime.strptime(data.get('booking_date'), '%Y-%m-%d') if data.get('booking_date') else None
        #date_of_completion = datetime.strptime(data.get('date_of_completion'), '%Y-%m-%d') if data.get('date_of_completion') else None
    except ValueError:
        return jsonify({"message": "Invalid date format. Expected format is YYYY-MM-DD"}), 400

    # Create the new service request
    service_request = ServiceRequest(
        service_id=data.get('service_id'),
        customer_id=customer_id,
        professional_id=None,
        date_of_request=date_of_request,
        service_request_status=data.get('service_request_status', 'requested'),
        remarks=data.get('remarks'),
        booking_date=booking_date,
        #date_of_completion=date_of_completion
    )
    db.session.add(service_request)
    db.session.commit()

    return jsonify({"message": "Service Request Created Successfully"}), 201
#_____________________________________________________________________
# Route to handle fetching and updating a specific service request by ID
@app.route('/api/service-requests/<int:request_id>', methods=['GET', 'PUT'])
@auth_required("token")
def handle_service_request(request_id):
    service_request = ServiceRequest.query.get(request_id)
    customer_id = current_user.id
    # Check if the service request exists
    if not service_request:
        return jsonify({"message": "Service Request not found"}), 404

    # Handling the GET request: returning the service request data
    if request.method == 'GET':
        return jsonify(service_request.to_dict()), 200

    # Handling the PUT request: updating the service request
    elif request.method == 'PUT':
        data = request.get_json()

        # Update date fields with proper error handling for date parsing
        try:
            if 'date_of_request' in data and data['date_of_request']:
                service_request.date_of_request = datetime.strptime(data['date_of_request'], '%Y-%m-%d').date()
                        
            if 'booking_date' in data and data['booking_date']:
                service_request.booking_date = datetime.strptime(data['booking_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"message": "Invalid date format. Expected format is YYYY-MM-DD"}), 400

        # Update other fields in the service request if they are present in the request data
        service_request.service_id = data.get('service_id', service_request.service_id)
        service_request.customer_id = data.get('customer_id', service_request.customer_id)
        #service_request.professional_id = data.get('professional_id', service_request.professional_id)
        service_request.service_request_status = data.get('service_request_status', service_request.service_request_status)
        service_request.remarks = data.get('remarks', service_request.remarks)
        service_request.is_booked = data.get('is_booked', service_request.is_booked)
        service_request.is_requested = data.get('is_requested', service_request.is_requested)
        #service_request.is_accepted = data.get('is_accepted', service_request.is_accepted)
        #service_request.is_closed = data.get('is_closed', service_request.is_closed)

        # Commit changes to the database
        try:
            db.session.commit()
            return jsonify({"message": "Service Request Updated Successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"An error occurred while updating the request: {str(e)}"}), 500
#_____________CLOSE-SERVICE REQUEST_______________________________________________________________________
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/api/request/close/<int:request_id>', methods=['POST'])
@auth_required("token")  
def close_service_request(request_id):
    try:
        user_id = current_user.id
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'Invalid or missing authentication token'}), 401

        # Find the service request by ID
        service_request = ServiceRequest.query.get(request_id)

        # Check if the service request exists
        if not service_request:
            return jsonify({'success': False, 'message': 'Service request not found'}), 404

        # Check if the user is authorized to close this request (customer or admin)
        if service_request.customer_id != user.id:
            return jsonify({'success': False, 'message': 'Unauthorized action'}), 403

        # Check if the request is already closed
        if service_request.service_request_status == 'closed':
            return jsonify({'success': False, 'message': 'Service request is already closed'}), 400

        # Update the status to 'closed' and set the completion date
        service_request.service_request_status = 'closed'
        service_request.date_of_completion = datetime.now()

        # Commit changes to the database
        db.session.commit()

        return jsonify({'success': True, 'message': 'Service request closed successfully'}), 200

    except SQLAlchemyError as db_error:
        db.session.rollback()
        logger.error(f"Database error: {str(db_error)}")
        return jsonify({'success': False, 'message': 'Database error while closing request'}), 500

#___________________________CUSTOMER-REVIEW_________________________________________ 
@app.route('/api/review', methods=['POST'])
@auth_required("token")  # Ensure the user is authenticated
def submit_review():
    user_id = current_user.id
    data = request.get_json()

    # Extract data from the request
    service_request_id = data.get('service_request_id')
    rating = data.get('rating')
    comments = data.get('comments')

    # Validate the data (you can add more validations as per your requirements)
    if not service_request_id or not rating:
        return jsonify({"message": "Service request ID and rating are required."}), 400

    # Check if the service request exists and belongs to the user
    service_request = ServiceRequest.query.filter_by(id=service_request_id, user_id=user_id,is_closed=True).first()

    if not service_request:
        return jsonify({"message": "Service request not found or not eligible for review."}), 404

    # Save the review to the database
    review = Review(
        service_request_id=service_request_id,
        user_id=user_id,
        rating=rating,
        comments=comments,
        date_posted=datetime.now()
    )
    db.session.add(review)
    db.session.commit()

    return jsonify({"message": "Review submitted successfully."}), 200

#____________________________________________________________________________________  
@app.route('/api/my-requests', methods=['GET'])
def get_customer_requests():
    # Get the customer ID from the current user session
    customer_id = current_user.id

    # Fetch service requests by customer ID
    service_requests = ServiceRequest.query.filter_by(customer_id=customer_id).all()

    # Check if service requests exist
    if not service_requests:
        return jsonify({"message": "No service requests found"}), 404
    
    # Serialize the requests to JSON
    requests_list = [
        {
            "id": req.id,
            "service_id": req.service_id,
            "service_request_status": req.service_request_status,
            "remarks": req.remarks,
            "is_booked": req.is_booked,
            "is_accepted": req.is_accepted,
            "is_closed": req.is_closed,
            "is_requested": req.is_requested,
            "date_of_request": req.date_of_request.strftime('%Y-%m-%d') if req.date_of_request else None,
            "date_of_completion": req.date_of_completion.strftime('%Y-%m-%d') if req.date_of_completion else None,
            "booking_date": req.booking_date.strftime('%Y-%m-%d') if req.booking_date else None,
        }
        for req in service_requests
    ]
    
    return jsonify({"requests": requests_list}), 200

#__________________________________________________________________________
@app.route('/api/service-requests/<int:request_id>/book', methods=['POST'])
def book_service_request(request_id):
    service_request = ServiceRequest.query.get(request_id)
    
    if not service_request:
        return jsonify({"message": "Service request not found"}), 404
    # Set request as booked
    service_request.is_booked = True
    service_request.service_request_status = 'booked'
    db.session.commit()
    return jsonify({"message": "Service request booked successfully"}), 200
#_____________________________________________________
@app.route('/api/admin/all-requests', methods=['GET'])
def get_service_requests():
    service_requests = ServiceRequest.query.all()
    data = [{
        'id': req.id,
        'customer_name': req.customer.fullname if req.customer else 'N/A',
        'service_type': req.service.service_name if req.service else 'N/A',
        'status': req.service_request_status,
        'date_of_request': req.date_of_request.strftime('%Y-%m-%d') if req.date_of_request else 'N/A',
        'professional_name': req.professional.fullname if req.professional else 'Unassigned',
        'remarks': req.remarks,
        'is_booked': req.is_booked,
        'is_requested': req.is_requested,
        'is_accepted': req.is_accepted,
        'is_closed': req.is_closed
    } for req in service_requests]
    return jsonify(data)
#__________________________________________________CUSTOMER-ROUTES________________________________
import logging

@app.errorhandler(500)
def internal_error(error):
    logging.error(f"Internal server error: {error}")
    response = jsonify({"error": "An internal error occurred. Please try again later."})
    response.status_code = 500
    return response

@app.route('/api/service-hist', methods=['GET'])
@login_required
def get_service_history():
    try:
        # Check if the user is logged in and print their ID for debugging
        if current_user.is_authenticated:
            logging.info(f"Authenticated user: {current_user.id}")
        else:
            logging.warning("User is not authenticated.")

        customer_id = current_user.id  # Get current customer ID

        # Fetch service requests related to the current customer, using the relationship for service details
        service_history = (
            ServiceRequest.query
            .filter_by(customer_id=customer_id)
            .join(User, ServiceRequest.professional_id == User.id)  # Join User for professional details
            .add_columns(ServiceRequest.id, 
                         ServiceRequest.service_request_status, 
                         User.fullname.label('professional_name'), 
                         User.contact_no.label('professional_contact'),
                         User.address.label('professional_address'))
            .all()
        )
        
        # Format the results into a list of dictionaries
        result = []
        for service_request in service_history:
            result.append({
                'id': service_request.id,
                'service_name': service_request.Service.name if service_request.Service else 'N/A',
                'status': service_request.service_request_status,
                'professional_name': service_request.professional_name,
                'professional_contact': service_request.professional_contact,
                'professional_address': service_request.professional_address,
            })
        
        # Return the formatted result as JSON
        return jsonify(result), 200

    except Exception as e:
        logging.error(f"Error fetching service history for customer {current_user.id}: {str(e)}")
        return jsonify({"error": "An error occurred while fetching service history"}), 500

#____________________________________Professional Routes_________________________
# Utility function to get today's date
def get_today():
    return datetime.now().date()

# 1. Get today's service requests
@app.route('/api/today-services', methods=['GET'])
def get_today_services():
    try:
        today = get_today()
        # Query service requests where date_of_request is today
        today_requests = ServiceRequest.query.filter(ServiceRequest.date_of_request == today).all()
        
        if not today_requests:
            return jsonify([]), 200  # Return empty list if no requests
        
        # Prepare data to return
        requests_data = []
        for req in today_requests:
            customer = User.query.get(req.user_id)
            requests_data.append({
                'id': req.id,
                'customer_name': customer.full_name,
                'customer_contact_no': customer.contact_no,
                'customer_address': customer.address,
                'customer_pin_code': customer.pin_code,
                'status': req.service_request_status
            })
        
        return jsonify(requests_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
#_______________
# # 2. Accept a service request
@app.route('/api/accept-service/<int:request_id>', methods=['POST'])
def sp_accept_service(request_id):
    try:
        # Fetch the service request by ID
        service_request = ServiceRequest.query.get(request_id)
        
        if not service_request:
            return jsonify({'error': 'Service request not found'}), 404
        
        # Ensure that only service professionals can accept a service request
        user_role = request.headers.get('Role')
        if user_role != 'sp':
            return jsonify({'error': 'Unauthorized action'}), 403

        # Check if the request has already been accepted or rejected
        if service_request.service_request_status in ['accepted', 'rejected']:
            return jsonify({'error': f'Service request already {service_request.service_request_status}'}), 400
        
        # Update the service request status to 'accepted'
        service_request.service_request_status = 'accepted'
        db.session.commit()
        
        # Return the professional status and service request data
        return jsonify({
            'message': f'Service request {request_id} accepted.',
            'professional_status': service_request.service_request_status,  # Use the updated status from the model
            'service_request': service_request.serialize()  # Ensure this includes all necessary fields
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500



# 3. Reject a service request
@app.route('/api/reject-service/<int:request_id>', methods=['POST'])
def sp_reject_service(request_id):
    try:
        # Fetch the service request by ID
        service_request = ServiceRequest.query.get(request_id)
        
        if not service_request:
            return jsonify({'error': 'Service request not found'}), 404
        
        # Ensure that only service professionals can reject a service request
        user_role = request.headers.get('Role')
        if user_role != 'sp':
            return jsonify({'error': 'Unauthorized action'}), 403

        # Check if the request has already been accepted or rejected
        if service_request.service_request_status in ['accepted', 'rejected']:
            return jsonify({'error': f'Service request already {service_request.service_request_status}'}), 400

        # Update the service request status to 'rejected'
        service_request.service_request_status = 'rejected'
        db.session.commit()
        
        # Return a success message and the updated service request data
        return jsonify({
            'message': f'Service request {request_id} rejected.',
            'professional_status': service_request.service_request_status,  # Include the updated professional status
            'service_request': service_request.serialize()  # Ensure this includes all necessary fields
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

#____________________________________
@app.route('/api/closed-services', methods=['GET'])
def get_closed_services():
    try:
        # Query for service requests where the status is 'closed'
        closed_requests = ServiceRequest.query.filter(ServiceRequest.service_request_status == 'closed').all()
        
        if not closed_requests:
            return jsonify([]), 200  # Return an empty list if no closed services found
        
        # Prepare the data to return
        closed_services_data = []
        for req in closed_requests:
            customer = User.query.get(req.customer_id)
            if customer:
                 print(f"Customer ID: {req.customer_id}, Full Name: {customer.fullname}, Contact No: {customer.contact_no}")
            else:
                print(f"Customer details missing for request ID: {req.id}")

            
            closed_services_data.append({
                'id': req.id,
                'customer_name': customer.fullname,
                'customer_contact_no': customer.contact_no,
                'customer_address': customer.address,
                'customer_pin_code': customer.pin_code,
                'date_of_completion': req.date_of_completion.strftime('%Y-%m-%d') if req.date_of_completion else 'N/A',
                # 'service_rating': req.rating if req.service_rating else 'N/A'
            })
        
        return jsonify(closed_services_data), 200
    except Exception as e:
        print(f"Error fetching closed services: {str(e)}")  # Log the error for debugging
        return jsonify({'error': str(e)}), 500

#________________________________
@app.route('/api/my-services', methods=['GET'])
@auth_required("token")
def professional_my_services():
    if not current_user or not current_user.is_service_professional:
        return jsonify({"error": "Unauthorized access"}), 403
    
    # Fetch service requests for the service professional
    service_requests = (ServiceRequest.query
                        .filter_by(professional_id=current_user.id)
                        .options(joinedload(ServiceRequest.service), joinedload(ServiceRequest.customer))
                        .all())

    # Prepare the data to send in response
    result = []
    for request in service_requests:
        result.append({
            'id': request.id,
            'service_name': request.service.service_name,
            'customer_name': request.customer.fullname,
            'customer_contact_no': request.customer.contact_no,
            'customer_address': request.customer.address,
            'customer_pin_code': request.customer.pin_code,
            'professional_status': request.service_request_status  # This includes accepted/rejected status
        })
    
    return jsonify(result), 200


#____________________SEARCH_FUNCTIONS_______________
#customer search functions
@app.route('/api/search/services', methods=['GET'])
def search_services():
    query = request.args.get('query', '')
    address = request.args.get('address', '')
    pin_code = request.args.get('pin_code', '')
    
    services = Service.query.all()
    
    if query:
        services = services.filter(Service.name.ilike(f"%{query}%"))
    if address:
        services = services.filter(Service.location.ilike(f"%{address}%"))
    if pin_code:
        services = services.filter_by(pin_code=pin_code)
    
    # Execute the query and get the result
    result = services.all()
    
    return jsonify([s.to_dict() for s in result])  # Assuming you have a .to_dict() method in your model

@app.route('/api/search/requests', methods=['GET'])
def search_requests():
    query = request.args.get('query', '')
    date_of_request = request.args.get('date_of_request', '')
    address = request.args.get('address', '')
    pin_code = request.args.get('pin_code', '')
    
    requests = ServiceRequest.query
    
    if query:
        requests = requests.filter(ServiceRequest.service_name.ilike(f"%{query}%"))
    if date_of_request:
        requests = requests.filter_by(date=date_of_request)
    if address:
        requests = requests.filter(ServiceRequest.location.ilike(f"%{address}%"))
    if pin_code:
        requests = requests.filter_by(pin_code=pin_code)
    
    # Execute the query and get the result
    result = requests.all()
    
    return jsonify([r.to_dict() for r in result])  # Assuming you have a .to_dict() method in your model

@app.route('/api/search/professionals', methods=['GET'])
def search_professionals():
    query = request.args.get('query', '')
    
    # Filtering users with role='sp' (Service Professional)
    professionals = User.query.filter_by(role='sp')
    
    if query:
        professionals = professionals.filter(User.name.ilike(f"%{query}%"))
    
    # Execute the query and get the result
    result = professionals.all()
    
    return jsonify([p.to_dict() for p in result])  # Assuming you have a .to_dict() method in your model
#______________________________________________________________
# @cache.cached(timeout=50)
@auth_required("token")
@app.route('/api/admin/report')
def get_admin_report():
    # Query all services and requests
    services = Service.query.all()
    requests = ServiceRequest.query.all()

    # Create dictionaries to store counts
    service_counts = {}
    completed_counts = {}

    # Count requests for each service
    for service in services:
        service_name = service.service_name
        service_counts[service_name] = service_counts.get(service_name, 0) + 1

        # Count completed requests for this service
        completed_requests = ServiceRequest.query.filter_by(service_id=service.service_id, is_closed=True).all()
        completed_count = len(completed_requests)
        completed_counts[service_name] = completed_count

    # First bar chart: Request distribution by services
    plt.figure(figsize=(5, 5))
    plt.bar(service_counts.keys(), service_counts.values(), color='green')
    plt.xlabel('Service')
    plt.ylabel('Number of Requests')
    plt.title('Request Distribution by Services')
    plt.xticks(rotation=90)

    # Convert first plot to base64
    buffer1 = BytesIO()
    plt.tight_layout()
    plt.savefig(buffer1, format='png')
    buffer1.seek(0)
    plot_data_service = base64.b64encode(buffer1.getvalue()).decode()
    plt.close()

    # Second bar chart: Completed requests for each service
    plt.figure(figsize=(5, 5))
    plt.bar(completed_counts.keys(), completed_counts.values(), color='blue')
    plt.xlabel('Service')
    plt.ylabel('Number of Completed Requests')
    plt.title('Completed Requests')
    plt.xticks(rotation=90)

    # Convert second plot to base64
    buffer2 = BytesIO()
    plt.tight_layout()
    plt.savefig(buffer2, format='png')
    buffer2.seek(0)
    plot_data_request = base64.b64encode(buffer2.getvalue()).decode()
    plt.close()
    # Prepare JSON response
    graph_data = {
        'plot_data_service': plot_data_service,  # Correct key names
        'plot_data_request': plot_data_request,
        'service_counts': service_counts
    }
    return jsonify(graph_data)
