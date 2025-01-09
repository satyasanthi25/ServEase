import base64
import random
import os
import matplotlib
from datetime import datetime
from io import BytesIO
from application.instances import cache
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from flask import request, jsonify
from flask_restful import Resource, Api, reqparse, fields, marshal
from flask_security import current_user, auth_required, roles_required
from sqlalchemy import text,or_
from werkzeug.utils import secure_filename
from .models import *
from flask import current_app
from application.models import Service, db, User, ServiceRequest,DailyVisit




def log_user_visits():
    if current_user is not None and any(role in current_user.roles for role in ["customer", "sp"]):
        visited = DailyVisit.query.filter_by(user_id=current_user.id,
                                             date=datetime.today().strftime('%Y-%m-%d')).count()
        if visited == 0:
            vs = DailyVisit(user_id=current_user.id, date=datetime.today())
            db.session.add(vs)
            db.session.commit()


api = Api(prefix='/api')

user_fields = {
    "id":fields.Integer,
    'username': fields.String,
    'email': fields.String,
    'fullname': fields.String,
    'address': fields.String,
    'pin_code': fields.String,
    'contact_no': fields.String,  
    'service_name': fields.String,  
    'experience_years': fields.Integer,  
    'is_professional': fields.Boolean, 
    'is_approved': fields.Boolean,  
    'is_blocked': fields.Boolean, 
}

service_request_fields = {
    'id': fields.Integer,
    'customer_id': fields.Integer,
    'professional_id': fields.Integer,
    'service_id': fields.Integer,
    'date_of_request': fields.DateTime,
    'service_request_status': fields.String,
    'is_booked': fields.Boolean,
    'is_accepted': fields.Boolean,
    'is_closed': fields.Boolean,
    'is_requested': fields.Boolean,
    'date_of_request': fields.DateTime(dt_format='iso8601'),
    'date_of_completion': fields.DateTime(dt_format='iso8601'),  
    'remarks': fields.String,
    'user':fields.Nested('user_fields'),
    'service': fields.Nested('service_fields'),
}

package_fields = {
    'package_id': fields.Integer,
    'package_name': fields.String,
    'package_price': fields.Float,
    'package_description': fields.String,
    'package_rating': fields.Integer,
    'package_booking_status': fields.String,
    'user_id': fields.Integer,
    'service_id': fields.Integer,
    'image': fields.String,
    'service': fields.Nested({
        'service_id': fields.Integer,
        'service_name': fields.String,
        'base_price': fields.Float,
        'description': fields.String,
        'service_date_created': fields.DateTime(dt_format='iso8601'),
        'image': fields.String,
        'service_rating': fields.Integer,
    }),  
}

service_fields = {
    'service_id': fields.Integer,
    'service_name': fields.String,
    'base_price': fields.Float,
    'description': fields.String,
    'service_date_created': fields.DateTime(dt_format='iso8601'),
    'image': fields.String,
    'service_rating': fields.Integer,
    
}    
#====================================================================
# API Resource for a single service---id
class ServiceResource(Resource):
    @auth_required("token")
    #@cache.cached(timeout=5)
    # GET /service/<int:service_id>
    def get(self, service_id):
        service = Service.query.get_or_404(service_id)
        return marshal(service,service_fields)
    #_____________________________________________________
  
    # PUT /service/<int:service_id> (Admin only)
    @auth_required("token")
    @roles_required("admin")
    #@cache.cached(timeout=5)
    def put(self, service_id):
        try:
            parser = reqparse.RequestParser()
            parser.add_argument('service_name', type=str, required=True, help='Name of the service is required')
            parser.add_argument('description', type=str, required=True, help='Description of the service is required')
            parser.add_argument('base_price', type=float, required=True, help='Base price of the service is required')
            parser.add_argument('service_rating', type=str, required=True, help='Rating of the service is required')
            parser.add_argument('image', type=str)
            parser.add_argument('service_date_created', type=str, required=True, help='Date created in YYYY-MM-DD format')
            args = parser.parse_args()

            # Retrieve the service by ID
            service = Service.query.get(service_id)
            if not service:
                return {"message": "Service not found"}, 404

            # Handle image upload
            if 'image' in request.files:
                file = request.files['image']
                if file:
                    filename = str(random.randint(100, 9999999)) + secure_filename(file.filename)
                    file.save("static/upload/" + filename)
                else:
                    filename = service.image  # Retain the existing image if no new file is uploaded
            else:
                filename = service.image

            # Update fields
            service.service_name = args.get('service_name')
            service.description = args.get('description')
            service.base_price = args.get('base_price')
            service.service_rating = args.get('service_rating')
            service.image = filename

            # Convert and set the service_date_created
            date_created_str = args.get('service_date_created')
            try:
                # Handle both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:MM:SS' formats
                if "T" in date_created_str:
                    date_created_str = date_created_str.split("T")[0]  # Remove the time portion
                service.service_date_created = datetime.strptime(date_created_str, '%Y-%m-%d')
            except ValueError:
                return {"message": f"Invalid date format for 'service_date_created': {date_created_str}. Use YYYY-MM-DD."}, 400
            
        except Exception as e:
            db.session.rollback()
            return {'message': f"Error in updating service: {str(e)}"}, 500
        else:
            db.session.commit()
            return {"message": "Service updated successfully"}, 200


     #__________________________________________________________________________               
   # DELETE /service/<int:service_id> (Admin only)
    @roles_required("admin")
    def delete(self, service_id):
        try:
            edit_service = Service.query.get(service_id)
            db.session.delete(edit_service)
        except Exception as e:
            db.session.rollback()
            return {'message': 'error in deleting'}, 500
        else:
            db.session.commit()
            return {'message': 'Service deleted successfully'}, 200
 
#------------------GET/POST-----------------------------------------------------
# API Resource for service collection
class ServiceListResource(Resource):
       
    @auth_required("token")
    def get(self):
        log_user_visits() 
        services = Service.query.all()
        return marshal(services,service_fields)

    # POST /service (Admin only)
    @auth_required("token")
    #@cache.cached(timeout=5)
    def post(self):
        # Set up the request parser
        parser = reqparse.RequestParser()
        parser.add_argument('service_name', type=str, required=True, help='Name of the service is required')
        parser.add_argument('description', type=str, required=True, help='Description of the service is required')
        parser.add_argument('base_price', type=float, required=True, help='Base price of the service is required')
        parser.add_argument('service_rating', type=int, required=True, help='Service rating of the service is required')  # Changed to integer
        parser.add_argument('image', type=str)  # Optional image field
        parser.add_argument('service_date_created', type=str, required=True, help='Date created is required')  # Will convert later
        args = parser.parse_args()

        # Convert 'service_date_created' to a datetime object
        try:
            if args.get('service_date_created'):
                service_date_created = datetime.strptime(args.get('service_date_created'), "%Y-%m-%d")
            else:
                return {"message": "Date not specified"}, 400
        except ValueError:
            return {"message": "Invalid date format. Expected format is YYYY-MM-DD"}, 400

        # Ensure required fields are provided
        if args.get('service_name') == "":
            return {"message": "Service name is required"}, 400
        if args.get('base_price') == "":
            return {"message": "Base price is required"}, 400
        if args.get('description') == "":
            return {"message": "Description is required"}, 400
        if args.get('service_rating') == "":
            return {"message": "Service rating is required"}, 400

        # Handle file upload if provided
        if 'image' in request.files:
            file = request.files['image']
            if file:
                # Secure the file name and save it
                filename = str(random.randint(100000, 10000000)) + secure_filename(file.filename)
                file.save("static/upload/" + filename)
                file.close()
            else:
                filename = ""
        else:
            filename = ""

        # Create a new Service instance
        new_service = Service(
            service_name=args.get('service_name'),
            description=args.get('description'),
            base_price=args.get('base_price'),
            service_rating=args.get('service_rating'),  # Integer rating
            image=filename,
            service_date_created=service_date_created  # Use converted datetime object
        )

        # Add to the session and commit
        db.session.add(new_service)
        db.session.commit()

        return {"message": "Service created successfully"}, 201
#__________________________________________________________________
api.add_resource(ServiceListResource, '/service')
api.add_resource(ServiceResource, '/service/<int:service_id>')





     
    
    




