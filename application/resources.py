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
from application.models import Service, db, User, ServiceRequest, Review


api = Api(prefix='/api')

user_fields = {
    "id":fields.Integer,
    'username': fields.String,
    'email': fields.String,
    'fullname': fields.String,
    'address': fields.String,
    'pin_code': fields.String,
    'contact_no': fields.String,  # Add contact number
    'service_name': fields.String,  # For Service Professional
    'experience_years': fields.Integer,  # For Service Professional
    'is_professional': fields.Boolean, 
    'is_approved': fields.Boolean,  # Admin approval status for service professional
    'is_blocked': fields.Boolean, # Admin approval status for service professional
}

review_fields = {
    'id': fields.Integer,
    'user_id': fields.Integer,
    'service_request_id': fields.Integer,  
    'rating': fields.Integer,
    'comments': fields.String, 
    'date_posted': fields.DateTime(dt_format='iso8601'),
    'service_id': fields.Integer,
    'user': fields.Nested(user_fields),
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
    # GET /service/<int:service_id>
    def get(self, service_id):
        service = Service.query.get_or_404(service_id)
        return marshal(service,service_fields)
    #_____________________________________________________
  
    # PUT /service/<int:service_id> (Admin only)
    @auth_required("token")
    @roles_required("admin")
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
    #@cache.cached(timeout=50)
    # GET /service
    @auth_required("token")
    def get(self):
        services = Service.query.all()
        return marshal(services,service_fields)

    # POST /service (Admin only)
    @auth_required("token")
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
#_____________________________________________________________________-______________________
class ProfessionalList(Resource):
    # @cache.cached(timeout=50)
    @auth_required("token")
    def get(self):
        if not current_user.has_role('admin'):
            return {"message": "Admin access required"}, 403

        try:
            professionals = User.query.filter_by(is_professional=True).all()
            if not professionals:
                return {"message": "No professionals found"}, 404
            return {"professionals": marshal(professionals, user_fields)}, 200
        except Exception as e:
            return {"message": str(e)}, 500
#__________________________________________________________________
class ApproveProfessionals(Resource):
    @auth_required("token")
    def get(self, user_id):
        # Fetch the service professional user by user_id
        user = User.query.get(user_id)

        if not user:
            return {"message": "User not found"}, 404  # Handle if the user doesn't exist

        if not user.is_service_professional:
            return {"message": "User is not a service professional"}, 400  # Handle if the user is not a professional

        if user.is_approved:
            return {"message": "User is already approved"}, 400  # Handle already approved case

        # Approve the service professional
        user.is_approved = True
        user.date_of_request = datetime.today()  # Assuming this tracks the approval date

        db.session.add(user)
        db.session.commit()

        return {"message": "Professional approved successfully"}, 201
#___________________________________________________________________________________
class BlockProfessionals(Resource):
    @auth_required("token")
    def get(self, user_id):
        # Fetch the service professional user by user_id
        user = User.query.get(user_id)

        if not user:
            return {"message": "User not found"}, 404  # Handle if the user doesn't exist

        if not user.is_service_professional:
            return {"message": "User is not a service professional"}, 400  # Handle if the user is not a professional

        if not user.is_approved and user.is_blocked:
            return {"message": "User is already rejected"}, 400  # Handle already rejected case

        # Reject the service professional
        user.is_approved = False
        user.is_blocked = True  # Mark as blocked or rejected (you can adjust this based on your logic)

        db.session.add(user)
        db.session.commit()

        return {"message": "Professional rejected successfully"}, 201
#________________________________________________________________
class DeleteProfessionals(Resource):
    @auth_required("token")
    def delete(self, user_id):
        # Fetch the service professional user by user_id
        user = User.query.get(user_id)

        if not user:
            return {"message": "User not found"}, 404  # Handle if the user doesn't exist

        if not user.is_service_professional:
            return {"message": "User is not a service professional"}, 400  # Handle if the user is not a professional

        # Delete the service professional
        db.session.delete(user)
        db.session.commit()

        return {"message": "Professional deleted successfully"}, 200
#___________________________________________________________
# Service Request Handling Resources
# POST /service-requests: Create a new service request (Customer only).
# GET /service-requests: List all service requests for the logged-in user (Customer/Professional).
# GET /service-requests/<int:request_id>: Get details of a specific service request.
# PUT /service-requests/<int:request_id>: Update a service request (Customer/Professional - status updates).
# DELETE /service-requests/<int:request_id>: Delete a service request (Customer/Admin).            
#______________________________________________________________________________ 

class MarkFavService(Resource):
    @auth_required("token")
    # @cache.cached(timeout=50)
    def get(self,service_id):
        user = User.query.get(current_user.id)
        user.fav_service = service_id;
        db.session.commit()
        return {"message":"updated successfully"},200   
# #__________________________________________________________________
api.add_resource(ServiceListResource, '/service')
api.add_resource(ServiceResource, '/service/<int:service_id>')
api.add_resource(ProfessionalList, '/professionals') # Plural
api.add_resource(ApproveProfessionals, '/admin/approve/<int:user_id>')
api.add_resource(BlockProfessionals, '/admin/reject/<int:user_id>')
api.add_resource(DeleteProfessionals, '/admin/delete/<int:user_id>')
#api.add_resource(AcceptService, '/admin/accept/<int:id>')

api.add_resource(MarkFavService, '/service/mark_as_fav/<int:service_id>')




     
    
    




