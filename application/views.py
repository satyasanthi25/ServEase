import re
from flask import current_app as app, jsonify, request, render_template,redirect,url_for,flash,make_response
from flask.json import dump
from flask_security import auth_required, roles_required,login_user,current_user
from sqlalchemy import or_,func
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
from application.instances import cache


import base64
import random
import os
import matplotlib
from io import BytesIO

matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sqlalchemy import text,or_
from werkzeug.utils import secure_filename
from .models import *

from application.models import Service, db, User, ServiceRequest,DailyVisit



def login_required_json(func):
    @wraps(func)
    def decorated_view(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "User not authenticated"}), 401
        return func(*args, **kwargs)
    return decorated_view
#______________________________________________________
def log_user_visits():
    if current_user is not None and any(role in current_user.roles for role in ["customer", "sp"]):
        visited = DailyVisit.query.filter_by(user_id=current_user.id,
                                             date=datetime.today().strftime('%Y-%m-%d')).count()
        if visited == 0:
            vs = DailyVisit(user_id=current_user.id, date=datetime.today())
            db.session.add(vs)
            db.session.commit()
#_____________________________________________________________________
@app.get('/')
def index():
    return render_template('index.html')
#-------------------------------------LOGIN-ROUTE-----------completed-----------------------------------------
@app.route('/user-login', methods=['POST'])
def user_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Check if the email and password are provided
    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    # Check if user exists
    user = datastore.find_user(email=email)
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Verify password
    if not check_password_hash(user.password, password):
        return jsonify({"message": "Incorrect password"}), 400

    # Professional approval check
    if user.is_professional and not user.is_approved:
        return jsonify({"message": "Your account is not approved by the admin yet. Please wait for approval."}), 403
    
    
    
    if "admin" in [role.name for role in user.roles]:
        pending_professionals = db.session.query(User).filter_by(is_professional=True, is_approved=False).count()
        return jsonify({
            "message": f"Welcome, Admin. There are {pending_professionals} professionals waiting for approval.",
            "role": "admin",
            "username": user.username,
            "id": user.id,
            "token": user.get_auth_token()
        }), 200

    # Customer login response
    elif "customer" in [role.name for role in user.roles]:
        
        return jsonify({
            
            "role": "customer",
            "username": user.username,
            "id": user.id,
            "token": user.get_auth_token()
        }), 200

    # Service Professional (SP) login response
    elif "sp" in [role.name for role in user.roles]:
        
        return jsonify({
           
            "role": "sp",
            "username": user.username,
            "id": user.id,
            "token": user.get_auth_token()
        }), 200

    # Invalid role response
    else:
        return jsonify({
            "message": "Unauthorized role or invalid login.",
            "role": "unknown"
        }), 403
#_____________________________________CUSTOMER-REGISTER______completed_____________________________________
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
#---------------------------PROFESSIONAL-REGISTER-------completed---------------------------------------
@app.route('/pending-professionals', methods=['GET'])
def pending_professionals():
    # Query for count of professionals who are not approved yet
    pending_count = db.session.query(User).filter_by(is_professional=True, is_approved=False).count()

    return jsonify({"message": f"There are {pending_count} professionals waiting for approval."}), 200
#________________________________________________________
@app.post('/sp-register')
def professional_register():
    data = request.get_json()

    # Extract fields from the request
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')
    fullname = data.get('fullname')
    service_name = data.get('service_name')
    experience_years = data.get('experience_years')
    address = data.get('address')
    pin_code = data.get('pin_code')
    contact_no = data.get('contact_no')

    # Set default values for is_professional and is_approved
    is_professional = True
    is_approved = False  # Pending approval

    # Input validations
    if not email:
        return jsonify({"message": "Email not provided"}), 400
    if not username:
        return jsonify({"message": "Username not provided"}), 400
    if not fullname:
        return jsonify({"message": "Full name not provided"}), 400
    if not password:
        return jsonify({"message": "Password not provided"}), 400
    if not service_name:
        return jsonify({"message": "Service name not provided"}), 400
    if not experience_years:
        return jsonify({"message": "Experience not provided"}), 400
    if not address:
        return jsonify({"message": "Address not provided"}), 400
    if not pin_code:
        return jsonify({"message": "Pin code not provided"}), 400
    if not contact_no:
        return jsonify({"message": "Contact number not provided"}), 400

    # Check if email is already registered
    user_exists = User.query.filter_by(email=email).count()
    if user_exists:
        return jsonify({"message": "Email already taken, use another email"}), 401

    try:
        # Create and save the new professional user
        user = datastore.create_user(
            email=email, 
            username=username, 
            password=generate_password_hash(password), 
            fullname=fullname,
            active=True,
            roles=["sp"],  # Service professional role
            service_name=service_name,
            experience_years=experience_years,
            address=address,
            pin_code=pin_code,
            contact_no=contact_no,
            is_professional=is_professional,
            is_approved=is_approved,  # Account pending approval
            is_blocked=False
        )
        db.session.add(user)
        db.session.commit()

        # Return success message with details
        return jsonify({
            "status": "success",
            "message": "Registration successful. Your account is pending admin approval.",
            "token": user.get_auth_token(),
            "email": user.email,
            "role": user.roles[0].name if user.roles else None
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "An error occurred during user registration", "error": str(e)}), 500
#_______________________________________________________
@app.route('/admin/professionals', methods=['GET'])
def get_pending_professionals():
    if not current_user.is_admin:
        return jsonify({"message": "Access denied"}), 403

    # Fetch all professionals who are pending approval
    pending_professionals = User.query.filter_by(is_professional=True, is_approved=False).all()

    professionals_data = []
    for professional in pending_professionals:
        professionals_data.append({
            "id": professional.id,
            "fullname": professional.fullname,
            "email": professional.email,
            "service_name": professional.service_name,
            "experience_years": professional.experience_years,
            "address": professional.address,
            "contact_no": professional.contact_no
        })
    
    return jsonify({"professionals": professionals_data}), 200 
#-----------------------------------------PROFILE--completed-------------------------------------------
@app.route('/api/profile', methods=['GET', 'PUT'])
@login_required
@cache.cached(timeout=10)
def profile():
    user = current_user

    # Handle GET request (fetch profile data)
    if request.method == 'GET':
        profile_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'fullname': user.fullname,
            # 'password': user.password,  # Exclude sensitive data like password
            'address': user.address,
            'pin_code': user.pin_code,
            'contact_no': user.contact_no,
            'service_name': user.service_name if user.is_professional else None,
            'experience_years': user.experience_years if user.is_professional else None,
            'is_professional': user.is_professional,
            'is_approved': user.is_approved,
            'is_blocked': user.is_blocked,
        }
        return jsonify(profile_data), 200

    # Handle PUT request (update profile data)
    elif request.method == 'PUT':
        data = request.json
        if not data:
            return jsonify({"message": "No data provided"}), 400

        errors = []

        # Email validation and update
        if 'email' in data and data['email']:
            try:
                valid_email = validate_email(data['email']).email
                # Check if the email is already taken
                if User.query.filter(User.email == valid_email, User.id != user.id).first():
                    errors.append("Email is already taken.")
                else:
                    user.email = valid_email
            except EmailNotValidError as e:
                errors.append(str(e))

        # Username validation and update
        if 'username' in data and data['username']:
            if len(data['username']) < 3 or len(data['username']) > 20:
                errors.append("Username must be between 3 and 20 characters long.")
            if not re.match("^[a-zA-Z0-9_.-]+$", data['username']):
                errors.append("Username can only contain letters, numbers, dots, underscores, and hyphens.")
            elif User.query.filter(User.username == data['username'], User.id != user.id).first():
                errors.append("Username is already taken.")
            else:
                user.username = data['username']

        # Address validation and update
        if 'address' in data and data['address']:
            if len(data['address']) < 4:
                errors.append("Address must be at least 4 characters long.")
            else:
                user.address = data['address']

        # Pin code validation and update
        if 'pin_code' in data and data['pin_code']:
            if not re.match("^[0-9]{5,6}$", data['pin_code']):
                errors.append("Pin code must be 5 or 6 digits long.")
            else:
                user.pin_code = data['pin_code']

        # Contact number validation and update
        if 'contact_no' in data and data['contact_no']:
            if not re.match("^[0-9]{10}$", data['contact_no']):
                errors.append("Contact number must be 10 digits long.")
            else:
                user.contact_no = data['contact_no']

        # Service Professional-specific fields
        if user.is_professional:
            if 'service_name' in data and data['service_name']:
                if len(data['service_name']) < 3:
                    errors.append("Service name must be at least 3 characters long.")
                else:
                    user.service_name = data['service_name']
            
            if 'experience_years' in data and data['experience_years']:
                try:
                    experience_years = int(data['experience_years'])
                    if experience_years < 0:
                        errors.append("Experience years must be a non-negative integer.")
                    else:
                        user.experience_years = experience_years
                except ValueError:
                    errors.append("Experience years must be a valid integer.")

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

#_________________________________PROFESSIONAL-ROUTES___completed________________________________________
@app.route('/api/professionals', methods=['GET'])
#@auth_required("token")
def get_professionals():
    try:
        # Fetch the 'sp' role
        service_professional_role = Role.query.filter_by(name='sp').first()

        if not service_professional_role:
            raise ValueError("Role 'sp' not found.")

        # Query professionals with the 'sp' role and is_professional=True
        professionals = (
            User.query
            .join(Role, User.roles)
            .filter(Role.name == 'sp', User.is_professional == True)
            .options(joinedload(User.roles))  # To eagerly load roles if needed
            .all()
        )
        if not professionals:
            return jsonify({"message": "No professionals found"}), 404

        # Prepare data for response
        result = [
            {
                "id": professional.id,
                "fullname": professional.fullname,
                "experience_years": professional.experience_years,
                "service_name": professional.service_name,
                "is_approved": "Yes" if professional.is_approved else "No",
                "is_blocked": "Yes" if professional.is_blocked else "No",
                "is_professional": "Yes" if professional.is_professional else "No",
            }
            for professional in professionals
        ]
        return jsonify(result),200

    except Exception as e:
        print("Error fetching professionals:", str(e))
        return jsonify({"error": str(e)}), 500
#_____________________________________________completed    
@app.route('/api/professionals/<int:professional_id>/approve', methods=['POST'])
@auth_required("token")  
def approve_professional(professional_id):
    try:
        professional = User.query.get(professional_id)

        if not professional or not professional.is_professional:
            return jsonify({"error": "Professional not found"}), 404

        professional.is_approved = True
        db.session.commit()
        return jsonify({"message": "Professional has been approved. Please log in to continue."}), 200

    except Exception as e:
        print("Error approving professional:", str(e))
        return jsonify({"error": str(e)}), 500
#_________________________________________________
@app.route('/api/professionals/<int:professional_id>/decline', methods=['POST'])
@auth_required("token")
def decline_professional(professional_id):
    try:
        professional = User.query.get(professional_id)
        if not professional or not professional.is_professional:
            return jsonify({"error": "Professional not found"}), 404
        
        professional.is_approved = False

        db.session.commit()
        return jsonify({"message": f"Professional {professional_id} has been declined."}), 200

    except Exception as e:
        print("Error declining professional:", str(e))
        return jsonify({"error": str(e)}), 500
#_______________________________________________________________
@app.route('/api/service', methods=['GET'])
@auth_required("token")
def get_all_services():
    services = Service.query.all()
    services_list = [
        {
            #"id": service.id,
            "service_name": service.service_name,
            "base_price": service.base_price,
            "description": service.description,
            "service_date_created": service.service_date_created,
            "service_rating": service.service_rating
        }
        for service in services
    ]
    return jsonify(services_list), 200

# Endpoint to get a single service by ID
@app.route('/api/service/<int:service_id>', methods=['GET'])
@auth_required("token")
def get_service(service_id):
    service = Service.query.get_or_404(service_id)
    service_data = {
        #"id": service.id,
        "service_name": service.service_name,
        "base_price": service.base_price,
        "description": service.description,
        "service_date_created": service.service_date_created,
        "service_rating": service.service_rating
    }
    return jsonify(service_data), 200
#________________________________________
# Utility function to validate service data
def validate_service_data(data):
    errors = []
    if not data.get('service_name') or not isinstance(data['service_name'], str):
        errors.append("Service name is required and must be a string.")

    if not isinstance(data.get('base_price'), (int, float)) or data['base_price'] <= 0:
        errors.append("Base price must be a positive number.")

    if 'description' in data and not isinstance(data['description'], str):
        errors.append("Description must be a string.")

    if 'service_date_created' in data:
        try:
            service_date = datetime.strptime(data['service_date_created'], "%Y-%m-%d")
            if service_date < datetime.now():
                errors.append("Service date cannot be in the past.")
        except ValueError:
            errors.append("Service date created must be in 'YYYY-MM-DD' format.")

    if 'service_rating' in data and not (0 <= data['service_rating'] <= 5):
        errors.append("Service rating must be between 0 and 5.")

    return errors
#_________________________________________________-
@app.route('/api/service', methods=['POST'])
@auth_required("token")
def add_service():
    data = request.get_json()
    errors = validate_service_data(data)

    if errors:
        return jsonify({"errors": errors}), 400

    # Validate `service_date_created` is not a past date
    service_date_str = data.get('service_date_created', datetime.now().strftime('%Y-%m-%d'))
    try:
        service_date = datetime.strptime(service_date_str, '%Y-%m-%d')
        if service_date < datetime.now():
            return jsonify({"message": "Service date cannot be a past date."}), 400
    except ValueError:
        return jsonify({"message": "Invalid date format. Use 'YYYY-MM-DD'."}), 400

    try:
        new_service = Service(
            service_name=data['service_name'],
            base_price=data['base_price'],
            description=data.get('description', ''),
            service_date_created=service_date.strftime('%Y-%m-%d'),
            service_rating=data.get('service_rating', 0)  # Default rating to 0
        )
        db.session.add(new_service)
        db.session.commit()

        service_data = {
            "service_name": new_service.service_name,
            "base_price": new_service.base_price,
            "description": new_service.description,
            "service_date_created": new_service.service_date_created,
            "service_rating": new_service.service_rating
        }
        return jsonify(service_data), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400


# Endpoint to update an existing service by ID
@app.route('/api/service/<int:service_id>', methods=['PUT'])
def update_service(service_id):
    service = Service.query.get_or_404(service_id)
    data = request.get_json()
    errors = validate_service_data(data)

    if errors:
        return jsonify({"errors": errors}), 400
    service_date_str = data.get('service_date_created', datetime.now().strftime('%Y-%m-%d'))
    try:
        service_date = datetime.strptime(service_date_str, '%Y-%m-%d')
        if service_date < datetime.now():
            return jsonify({"message": "Service date cannot be a past date."}), 400
    except ValueError:
        return jsonify({"message": "Invalid date format. Use 'YYYY-MM-DD'."}), 400


    try:
        service.service_name = data.get('service_name', service.service_name)
        service.base_price = data.get('base_price', service.base_price)
        service.description = data.get('description', service.description)
        service.service_date_created = data.get('service_date_created', service.service_date_created)
        service.service_rating = data.get('service_rating', service.service_rating)

        db.session.commit()

        service_data = {
            "service_name": service.service_name,
            "base_price": service.base_price,
            "description": service.description,
            "service_date_created": service.service_date_created,
            "service_rating": service.service_rating
        }
        return jsonify(service_data), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400


# Endpoint to delete a service by ID
@app.route('/api/service/<int:service_id>', methods=['DELETE'])
def delete_service(service_id):
    service = Service.query.get_or_404(service_id)
    try:
        db.session.delete(service)
        db.session.commit()
        return jsonify({"message": "Service deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting service: {e}")  # Add this line to log the error
        return jsonify({"message": str(e)}), 400    
  #________________________________________USER-ROUTES__completed_______________________________
from flask_restful import fields

user_fields = {
    'id': fields.Integer,
    'email': fields.String,
    'fullname': fields.String,
    'active': fields.Boolean,
    'is_blocked': fields.Boolean,  
    'is_approved': fields.Boolean, 
    'roles': fields.List(fields.String)  
}

@app.route('/users', methods=['GET'])
@auth_required("token")
@roles_required("admin")
#@cache.cached(timeout=10)
def all_users():
    users = User.query.all()

    if not users:
        return jsonify({"message": "No User Found"}), 404

    role_counts = {
        "Professional": User.query.filter(User.roles.any(name="sp")).count(),
        "Customer": User.query.filter(User.roles.any(name="customer")).count(),
        "Admin": User.query.filter(User.roles.any(name="admin")).count(),
    }
    
    # Count active and blocked users
    status_counts = {
        "Approved": User.query.filter_by(is_approved=True).count(),
        "Blocked": User.query.filter_by(is_blocked=True).count(),
    }
    print(f"Status Counts: {status_counts}") 

    users_data = [user.to_dict() for user in users]  # Use the to_dict method to get user data

    return jsonify({
        "message": "Users retrieved successfully",
        "total_users": len(users),
        "role_counts": role_counts,
        "status_counts": status_counts,
        "users": users_data,
    }), 200
#_____________________________________completed_________________________________________
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
#____________________________SERVICE-REQUESTS___CREATE_completed__________________
@app.route('/api/services', methods=['GET'])
@auth_required("token")
def get_services():
    services = Service.query.all()
    return jsonify([service.to_dict() for service in services]), 200
#_______________________________________________
@app.route('/api/service-requests', methods=['POST'])
@auth_required("token")
def service_requests():
    data = request.get_json()
    customer_id = current_user.id
    
    # Parse dates if provided; otherwise, set to None
    try:
        date_of_request = datetime.strptime(data.get('date_of_request'), '%Y-%m-%d') if data.get('date_of_request') else None
        booking_date = datetime.strptime(data.get('booking_date'), '%Y-%m-%d') if data.get('booking_date') else None
        date_of_completion = datetime.strptime(data.get('date_of_completion'), '%Y-%m-%d') if data.get('date_of_completion') else None
    except ValueError:
        return jsonify({"message": "Invalid date format. Expected format is YYYY-MM-DD"}), 400

    # Check for past dates
    today = datetime.now().date()  # Current date without time

    if date_of_request and date_of_request.date() < today:
        return jsonify({"message": "Date of request cannot be in the past."}), 400
    if booking_date and booking_date.date() < today:
        return jsonify({"message": "Booking date cannot be in the past."}), 400
    if date_of_completion and date_of_completion.date() < today:
        return jsonify({"message": "Date of completion cannot be in the past."}), 400

    service_id = data.get('service_id')
    if not service_id:
        return jsonify({"message": "Service ID is required"}), 400

    professional = User.query.filter(
        User.is_professional == True,
        #User.is_approved == True,
        User.service_name == Service.query.get(service_id).service_name
    ).first()

    # If no professional is found, set professional_id to None and update the status
    if not professional:
        professional_id = None
        service_request_status = "pending"  # Status when no professional is assigned
        message = "No professional assigned. Service request is pending."
    else:
        professional_id = professional.id
        service_request_status = data.get('service_request_status', 'requested')
        message = "Service Request Created Successfully"

    # Create the new service request
    service_request = ServiceRequest(
        service_id=service_id,
        customer_id=customer_id,
        professional_id=professional_id,
        date_of_request=date_of_request,
        service_request_status=service_request_status,
        remarks=data.get('remarks'),
        booking_date=booking_date,
        date_of_completion=date_of_completion,
        is_requested=True,     
    )

    try:
        db.session.add(service_request)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to create service request: {str(e)}"}), 500

    return jsonify({
        "message": message,
        "professional_id": professional_id
    }), 201

#_________________________________________________________
@app.route('/api/services/<int:service_id>/professional', methods=['GET'])
@auth_required("token")
def get_professional_for_service(service_id):
    service = Service.query.get(service_id)
    if not service:
        return jsonify({"message": "Service not found"}), 404

    print(f"Service found: {service.service_name}")

    # Find the first approved professional who offers this service
    professional = User.query.filter(
        User.is_professional == True,
        #User.is_approved == True,
        User.service_name == service.service_name
    ).first()

    if not professional:
        print("No professional matched the criteria.")
        return jsonify({"message": "No professional found"}), 404

    print(f"Professional found: {professional.id}, Name: {professional.service_name}")

    return jsonify({
        "professional_id": professional.id,
        "service_name": service.service_name
    }), 200
#__________________________________completed___________________________________
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
            if 'date_of_completion' in data and data['date_of_completion']:
                service_request.date_of_completion = datetime.strptime(data['date_of_completion'], '%Y-%m-%d').date()
            if 'booking_date' in data and data['booking_date']:
                service_request.booking_date = datetime.strptime(data['booking_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"message": "Invalid date format. Expected format is YYYY-MM-DD"}), 400

        new_service_id = data.get('service_id')
        if new_service_id and new_service_id != service_request.service_id:
            service_request.service_id = new_service_id

            professional = User.query.filter(
                User.is_professional == True,
                User.is_approved == True,
                User.service_name == Service.query.get(new_service_id).service_name
            ).first()

            if not professional:
                return jsonify({"message": "No available professional for the updated service"}), 404

            service_request.professional_id = professional.id

        service_request.customer_id = data.get('customer_id', service_request.customer_id)
        service_request.service_request_status = data.get('service_request_status', service_request.service_request_status)
        service_request.remarks = data.get('remarks', service_request.remarks)
        service_request.is_booked = data.get('is_booked', service_request.is_booked)
        service_request.is_requested = data.get('is_requested', service_request.is_requested)
        service_request.is_accepted = data.get('is_accepted', service_request.is_accepted)
        service_request.is_closed = data.get('is_closed', service_request.is_closed)

        try:
            db.session.commit()
            return jsonify({"message": "Service Request Updated Successfully", "professional_id": service_request.professional_id}), 200
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

        service_request = ServiceRequest.query.get(request_id)

        if not service_request:
            return jsonify({'success': False, 'message': 'Service request not found'}), 404

        if service_request.customer_id != user.id :
            return jsonify({'success': False, 'message': 'Unauthorized action'}), 403

        
        if service_request.service_request_status == 'closed':
            return jsonify({'success': False, 'message': 'Service request is already closed'}), 400

        service_request.service_request_status = 'closed'
        service_request.is_closed = True  
        service_request.date_of_completion = datetime.now()

        db.session.commit()

        return jsonify({'success': True, 'message': 'Service request closed successfully'}), 200

    except SQLAlchemyError as db_error:
        db.session.rollback()
        logger.error(f"Database error: {str(db_error)}")
        return jsonify({'success': False, 'message': 'Database error while closing request'}), 500

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'success': False, 'message': 'An unexpected error occurred'}), 500

#_________________________________________________completed___________________________________  
@app.route('/api/my-requests', methods=['GET'])
def get_customer_requests():
    customer_id = current_user.id

    service_requests = ServiceRequest.query.filter_by(customer_id=customer_id).all()

    if not service_requests:
        return jsonify({"message": "No service requests found"}), 404
    
    requests_list = [
        {
            "id": req.id,
            "service_id": req.service_id,
            "service_name": req.service.service_name,
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
#______________________________________________________________
@app.route('/api/request/delete/<int:request_id>', methods=['DELETE'])
@login_required
def delete_request(request_id):
    request = ServiceRequest.query.get(request_id)
    if not request:
        return jsonify({'message': 'Request not found'}), 404

    db.session.delete(request)
    db.session.commit()
    return jsonify({'message': 'Request deleted successfully'}), 200
#_______________________________________________________completed___________________
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
#____________________________________customer Routes_/samelocation________________________

@app.route('/api/professionals/similar_location', methods=['GET'])
@auth_required("token")
@login_required
def get_professionals_by_customer_location():
    if not current_user.is_customer:
        return jsonify({'error': 'Access denied: You must be a customer to view this data.'}), 403

    try:
        customer_pin_code = current_user.pin_code
        customer_address = current_user.address

        professionals = User.query.filter(
            User.roles.any(name="sp"),  
            User.is_professional.is_(True),
            User.is_approved.is_(True),
            (User.pin_code == customer_pin_code) | (User.address == customer_address)
        ).all()

        if not professionals:
            return jsonify({'message': 'No professionals found in your location.'}), 404

        
        professionals_data = [professional.to_dict() for professional in professionals]
        return jsonify(professionals_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

#_____________completed______________________________
@app.route('/api/closed-services', methods=['GET'])
def get_closed_services():
    try:
        closed_requests = ServiceRequest.query.filter(ServiceRequest.service_request_status == 'closed').all()
        
        if not closed_requests:
            return jsonify([]), 200  
        
        closed_services_data = []
        for req in closed_requests:
           
            customer = User.query.get(req.customer_id)
            if customer:
                print(f"Customer ID: {req.customer_id}, Full Name: {customer.fullname}, Contact No: {customer.contact_no}")
            else:
                print(f"Customer details missing for request ID: {req.id}")
            
            service = Service.query.get(req.service_id)
            service_name = service.service_name if service else "Service not found"
            
            closed_services_data.append({
                'id': req.id,
                'service_name': service_name,  
                'customer_name': customer.fullname if customer else 'N/A',
                'customer_contact_no': customer.contact_no if customer else 'N/A',
                'customer_address': customer.address if customer else 'N/A',
                'customer_pin_code': customer.pin_code if customer else 'N/A',
                'date_of_completion': req.date_of_completion.strftime('%Y-%m-%d') if req.date_of_completion else 'N/A',
                'is_closed': req.is_closed==True,
                # 'service_rating': req.rating if req.service_rating else 'N/A'
            })
        
        return jsonify(closed_services_data), 200
    except Exception as e:
        print(f"Error fetching closed services: {str(e)}")  
        return jsonify({'error': str(e)}), 500
#____________________________________________________completed_____________________
@app.route('/api/my-services', methods=['GET'])
@auth_required("token")
def my_services():
    logging.debug(f"Fetching services for user {current_user.id}, is_professional: {current_user.is_professional}")

    if not current_user.is_professional:
        return jsonify({"error": "Unauthorized: Only service professionals can access this route."}), 403

    service_requests = ServiceRequest.query.filter_by(professional_id=current_user.id).options(
        joinedload(ServiceRequest.service),
        joinedload(ServiceRequest.customer)
    ).all()

    if not service_requests:
        return jsonify([]), 200

    result = [
        {
            'id': sr.id,
            'service_id': sr.service_id,
            'service_name': sr.service.service_name if sr.service else None,
            'customer_id': sr.customer_id,
            'customer_name': sr.customer.fullname if sr.customer else None,
            'customer_contact': sr.customer.contact_no if sr.customer else None,
            'customer_address': sr.customer.address if sr.customer else None,
            'pin_code': sr.customer.pin_code if sr.customer else None,
            'professional_status': sr.service_request_status,  # Use status directly
            'remarks': sr.remarks,
            'is_booked': sr.is_booked,  # Retain if required; otherwise, remove
            'booking_date': sr.booking_date.strftime('%Y-%m-%d') if sr.booking_date else None,
            'date_of_completion': sr.date_of_completion.strftime('%Y-%m-%d') if sr.date_of_completion else None,
        }
        for sr in service_requests
    ]

    return jsonify(result), 200
#________________________________________________________completed_______
@app.route('/api/prof/all-requests', methods=['GET'])
def get_filtered_customer_requests():
    try:
        professional_id = request.headers.get('User-Id')
        if not professional_id:
            return jsonify({"error": "Unauthorized: Missing User ID"}), 401
        if not professional_id.isdigit():
            return jsonify({"error": "Invalid User ID format"}), 400

        professional_id = int(professional_id)

        professional = User.query.filter_by(id=professional_id, is_professional=True).first()
        if not professional:
            return jsonify({"error": "Unauthorized: User is not a professional"}), 403
        service_requests = (
            ServiceRequest.query
            .join(Service, ServiceRequest.service_id == Service.service_id)
            .join(User, ServiceRequest.customer_id == User.id)  
            .filter(
                ServiceRequest.professional_id == professional_id,
                ServiceRequest.service_request_status.notin_(['accepted', 'closed']),  # Exclude accepted and closed requests
                (User.pin_code == professional.pin_code) | (User.address.ilike(f"%{professional.address}%")),  # Match pincode or address
                Service.service_name == professional.service_name  # Match service name
            )
            .all()
        )
        # Prepare response data
        requests_data = [
            {
                'id': req.id,
                'service_name': req.service.service_name,
                'customer_name': req.customer.fullname if req.customer else "Unknown",
                'customer_pin_code': req.customer.pin_code if req.customer else "Unknown",
                'customer_address': req.customer.address if req.customer else "Unknown",
                'date_of_request': req.date_of_request.strftime('%Y-%m-%d') if req.date_of_request else None,
                'status': req.service_request_status
            } for req in service_requests
        ]
        return jsonify(requests_data), 200

    except Exception as e:
        import traceback
        app.logger.error(f"Error fetching filtered requests: {e}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500
#_______________________________________________________________________
@app.route('/api/service-requests/<int:request_id>/accept', methods=['POST'])
def accept_request(request_id):
    """
    Accept a specific service request by setting its status to 'accepted'.
    """
    service_request = ServiceRequest.query.get_or_404(request_id)

    if service_request.service_request_status in ['requested', 'pending']:
        service_request.service_request_status = 'accepted'
        service_request.is_accepted = True
        
        db.session.commit()
        return jsonify({'message': 'Request accepted', 'status': service_request.service_request_status}), 200

    return jsonify({'message': 'Cannot accept request in the current state'}), 400
#_____________________________________________________________________________________
@app.route('/api/service-requests/<int:request_id>/reject', methods=['POST'])
def reject_request(request_id):
    """
    Reject a specific service request by setting its status to 'rejected'.
    """
    service_request = ServiceRequest.query.get_or_404(request_id)

    if service_request.service_request_status in ['requested', 'pending']:
        service_request.service_request_status = 'rejected'
        service_request.is_accepted = True
        db.session.commit()
        return jsonify({'message': 'Request rejected', 'status': service_request.service_request_status}), 200

    return jsonify({'message': 'Cannot reject request in the current state'}), 400
#_______________________________________________________
@app.route('/api/service-requests/<int:request_id>/close', methods=['POST'])
def close_request(request_id):
    """
    Close a specific service request by setting its status to 'closed'.
    """
    service_request = ServiceRequest.query.get_or_404(request_id)
    service_request.service_request_status = 'closed'
    db.session.commit()
    return jsonify({'message': 'Request closed'}), 200
#_______________________________________________________
@app.route('/api/update-service-status/<int:service_id>', methods=['POST'])
def update_service_status(service_id):
    try:
        data = request.get_json()
        new_status = data.get('status')

        if new_status not in ['accepted', 'rejected', 'pending']:
            return jsonify({'error': 'Invalid status provided.'}), 400

        service_request = ServiceRequest.query.filter_by(service_id=service_id).first()

        if not service_request:
            return jsonify({'error': 'Service request not found.'}), 404

        service_request.professional_status = new_status
        db.session.commit()

        return jsonify({'message': 'Status updated successfully.'}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'An error occurred while updating the status.'}), 500
#____________________SEARCH_FUNCTIONS_______completed________
from sqlalchemy.orm import aliased, joinedload
from sqlalchemy import or_
from sqlalchemy import func

from sqlalchemy.exc import SQLAlchemyError
@app.route('/api/search-result', methods=['GET'])
def search():
    query = request.args.get('query')
    search_type = request.args.get('type')
    role = request.args.get('role')

    if not query or not search_type or not role:
        return jsonify({"error": "Missing 'query', 'type', or 'role' parameter"}), 400

    results = []
    if search_type == 'service' and role == 'customer':
        try:
    
            if not current_user.is_authenticated:
                return jsonify({"error": "Unauthorized access"}), 401

            customer_address = current_user.address
            customer_pin_code = current_user.pin_code

            if not customer_address or not customer_pin_code:
                missing_fields = []
                if not customer_address:
                    missing_fields.append('address')
                if not customer_pin_code:
                    missing_fields.append('pincode')
                return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

            # Step 1: Find all professionals with matching address or pin code
            matching_professionals = db.session.query(
                User.id.label('professional_id'),
                User.service_name,
                User.address,
                User.pin_code,
                User.contact_no,
                User.experience_years,
                User.is_approved,
                Service.base_price,
                
                Service.description,
                #Service.service_rating
               
            ).join(Service, 
                func.lower(func.trim(Service.service_name)) == func.lower(func.trim(User.service_name)), 
                isouter=True) \
            .filter(
                User.is_professional == True,
                or_(
                    User.address.ilike(f"%{customer_address}%"),
                    User.pin_code.ilike(f"%{customer_pin_code}%")
                )
            ).all()

            # Step 2: Clean matching service names and log them
            matching_service_names = {professional.service_name.strip().lower() for professional in matching_professionals}
            print("Matching Service Names from Professionals:", matching_service_names)

            # Step 3: If there are no matching professionals, return early
            if not matching_professionals:
                return jsonify({"error": "No matching professionals found in the database"}), 404

            # Step 4: Create the response with service details, including the base price
            services = [
                {
                    "service_id": professional.professional_id,
                    "service_name": professional.service_name.strip(),  # Strip extra spaces
                    "base_price": professional.base_price if professional.base_price is not None else "N/A",  
                    "address": professional.address,
                    "pin_code": professional.pin_code,
                    "contact_no": professional.contact_no,
                    "experience_years": professional.experience_years,
                    "is_approved": professional.is_approved,
                    "description": professional.description or "No description available",  
                    #"service_rating": professional.service_rating if professional.rating is not None else "No rating available",  
                }
                for professional in matching_professionals 
            ]

            return jsonify({"services": services}), 200

        except AttributeError as e:
            return jsonify({"error": f"Invalid field in Service model: {str(e)}"}), 500
        except Exception as e:
            return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500
#_______________________________________________________________
    elif search_type == 'professional' and role == 'admin':
        
        try:
            results = User.query.filter(
                User.is_professional == True,
                or_(
                    User.fullname.contains(query),
                    User.address.contains(query),
                    User.pin_code.contains(query),
                    User.contact_no.contains(query),
                    User.service_name.contains(query),
                    User.experience_years.contains(query)  
                )
            ).all()
        
            results = [
                {
                    "id": professional.id,
                    "fullname": professional.fullname,
                    "email": professional.email,
                    "experience_years": professional.experience_years, 
                    "address": professional.address,
                    "pin_code": professional.pin_code,
                    "is_blocked": professional.is_blocked,
                    "service_name": professional.service_name 
                }
                for professional in results
            ]
            return jsonify(results)

        except AttributeError as e:
            return jsonify({"error": f"Invalid field in User model: {str(e)}"}), 500
#_________________________________________
    elif role == 'sp' and search_type == 'service_request':
        try:
            # Professional search for service requests associated with customers
            results = ServiceRequest.query \
                .join(User, ServiceRequest.customer_id == User.id) \
                .join(Service, ServiceRequest.service_id == Service.service_id) \
                .filter(
                    or_(
                        User.fullname.ilike(f"%{query}%"),
                        User.address.ilike(f"%{query}%"),
                        User.pin_code.ilike(f"%{query}%")
                    )
                ) \
                .options(joinedload(ServiceRequest.service)) \
                .all()

            # Debugging: Log the number of results found
            print(f"Results found: {len(results)}")

            service_requests = [
                {
                    "service_request_id": request.id,
                    "customer_name": request.customer.fullname,
                    "service_name": request.service.service_name,  
                    "service_id": request.service_id,  
                    "address": request.customer.address,
                    "pin_code": request.customer.pin_code,
                    "service_request_status": request.service_request_status,
                    "date_of_request": request.date_of_request.strftime('%Y-%m-%d'),
                    
                    "booking_date": request.booking_date.strftime('%Y-%m-%d') if request.booking_date else "Not Booked", 
                }
                for request in results
            ]
            return jsonify({"service_requests": service_requests}), 200

        except AttributeError as e:
            return jsonify({"error": f"Attribute error: {str(e)}"}), 500
        except Exception as e:
            return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
#_______________________________________________________________________________
@auth_required("token")
@app.route('/api/admin/report')
def get_admin_report():
    
    services = Service.query.all()
    requests = ServiceRequest.query.all()
    users = User.query.all()  
    
    total_visits = db.session.query(func.count(DailyVisit.id)).scalar()   
    visits_per_day = db.session.query(DailyVisit.date, func.count(DailyVisit.id)).group_by(DailyVisit.date).all()
    data1 = [{"date": str(date), "count": count} for date, count in visits_per_day]
    #print(data1)
    
    service_counts = {}
    completed_counts = {}

    # Count requests for each service
    for service in services:
        service_name = service.service_name
        service_counts[service_name] = service_counts.get(service_name, 0) + 1

        # Count completed requests for this service
        completed_requests = ServiceRequest.query.filter_by(service_id=service.service_id, service_request_status='closed').all()
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

    # Calculate user statistics
    total_users = len(users)
    blocked_users = User.query.filter_by(is_blocked=True).count()
    approved_users = User.query.filter_by(is_approved=True).count()
    customers = User.query.filter(User.roles.any(name="customer")).count()
    professionals = User.query.filter(User.roles.any(name="sp")).count()

    # Prepare the data
    user_stats_labels = ['Total Users', 'Blocked Users', 'Approved Users', 'Customers', 'Professionals']
    user_stats_counts = [total_users, blocked_users, approved_users, customers, professionals]
    colors = ['purple', 'red', 'green', 'blue', 'orange']

    plt.figure(figsize=(12, 6))

    # Create the bar chart
    bars = plt.bar(user_stats_labels, user_stats_counts, color=colors,width=0.5)

    # Customize the chart
    plt.xlabel('User Categories', fontsize=12)
    plt.ylabel('Count', fontsize=12)
    plt.title('User Statistics', fontsize=14)
    plt.xticks(rotation=30, fontsize=10)
    plt.yticks(fontsize=10)
    plt.grid(axis='y', linestyle='--', alpha=0.7)  # Add grid lines for clarity

    # Annotate the bars with their values
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width() / 2, yval + 0.5, f'{yval}', ha='center', va='bottom', fontsize=10)

    # Adjust layout to prevent clipping
    plt.tight_layout()

    # Convert plot to base64 for frontend rendering
    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    plot_data_user_stats = base64.b64encode(buffer.getvalue()).decode()
    plt.close()
    # Prepare JSON response
    graph_data = {
        'plot_data_service': plot_data_service,
        'plot_data_request': plot_data_request,
        'service_counts': service_counts,
        'plot_data_user_stats': plot_data_user_stats,
        'total_visits': total_visits,
        'data1':data1
    }
    return jsonify(graph_data)
#___________________________________________________
@app.route('/exportcsv', methods=['POST'])
def export_csv():
    try:
        from tasks import export_closed_requests_as_csv
        # Fetch CSV data as a string
        csv_data = export_closed_requests_as_csv()

        # Prepare the response for downloading as a file
        response = make_response(csv_data)
        response.headers['Content-Disposition'] = 'attachment; filename=closed_requests_report.csv'
        response.headers['Content-Type'] = 'text/csv'
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500
#_____________________________
from flask import url_for, jsonify

@app.route('/cust-services/<int:customer_id>', methods=['GET'])
@auth_required("token")
def get_services_matching_customer_address(customer_id):
    try:
        # Validate user role and identity
        if not current_user.is_customer or current_user.id != customer_id:
            return jsonify({'error': 'Access denied: Invalid customer credentials.'}), 403

        if not current_user.pin_code:
            return jsonify({"message": "Pin code not found for this customer."}), 404

        customer_pin_code = current_user.pin_code

        # Fetch services where professionals' pin code matches the customer's pin code
        matching_services = (
            Service.query
            .join(ServiceRequest, Service.service_id == ServiceRequest.service_id)
            .join(User, ServiceRequest.professional_id == User.id)
            .filter(
                User.pin_code == customer_pin_code,
                User.is_professional.is_(True),
                User.is_approved.is_(True)
            )
            .with_entities(
                Service.service_id,
                Service.service_name,
                Service.base_price,
                Service.description,
                Service.service_date_created,
                Service.service_rating,
                Service.image,
                User.fullname.label('professional_fullname')  # Add the professional's name
            )
            .all()
        )

        if not matching_services:
            return jsonify({"message": "No matching services found."}), 404

        # Serialize services
        services_data = [
            {
                "service_id": service.service_id,
                "service_name": service.service_name,
                "base_price": service.base_price,
                "description": service.description,
                "service_date_created": service.service_date_created.strftime('%Y-%m-%d') if service.service_date_created else None,
                "service_rating": service.service_rating,
                "image": url_for('static', filename=f"upload/{service.image}", _external=True) if service.image else None,
                "provided_by": service.professional_fullname  # Include the professional's name
            }
            for service in matching_services
        ]

        return jsonify(services_data), 200

    except Exception as e:
        app.logger.exception("Error fetching services")
        return jsonify({"message": "Internal server error."}), 500
