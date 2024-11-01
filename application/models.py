from flask_sqlalchemy import SQLAlchemy
from flask_login import current_user
from flask_security import UserMixin, RoleMixin,current_user, auth_required
from datetime import datetime

db = SQLAlchemy()

# Association table for many-to-many relationship between Users and Roles
class RolesUsers(db.Model):
    __tablename__ = 'roles_users'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key=True)#Unique identifier for the role
    name = db.Column(db.String(80), unique=True)  # Role: Admin, ServiceProfessional, Customer(name of the role)
    description = db.Column(db.String(255))#description of the role

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)# Unique identifier for each user
    username = db.Column(db.String(80), unique=False)# User's display name
    email = db.Column(db.String(255), unique=True, index=True)#User's email address
    password = db.Column(db.String(255))#hash of password for authentication
    active = db.Column(db.Boolean, default=True)#Indicates whether the user is active
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False)#Unique identifier for Flask Security
    roles = db.relationship('Role', secondary='roles_users',
                            backref=db.backref('users', lazy='dynamic'))
    
    # Common fields
    fullname = db.Column(db.String(150), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    pin_code = db.Column(db.String(10), nullable=True)
    contact_no = db.Column(db.String(255), nullable=True)
    

    # Additional fields for Service Professionals
    service_name = db.Column(db.String(100), nullable=True)
    experience_years = db.Column(db.Integer, nullable=True)
    #document_file = db.Column(db.String(255), nullable=True)  # Document for verification
    
    # Fields to manage service professional status
    is_professional = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)  # Admin approval status for service professional
    is_blocked = db.Column(db.Boolean, default=False)  # Blocked status for fraudulent activity
    #is_service_professional = db.Column(db.Boolean, default=False)  # True if user is a service professional
  
    # Service requests made by this customer
    service_requests = db.relationship('ServiceRequest', foreign_keys='ServiceRequest.customer_id', back_populates='customer')

    # Services provided by this professional
    provided_services = db.relationship('ServiceRequest', foreign_keys='ServiceRequest.professional_id', back_populates='professional', overlaps="assigned_professional,provided_services")
    # Custom properties or methods for admin actions
    @property
    def can_be_approved(self):
        return self.is_service_professional and not self.is_approved

    @property
    def can_be_blocked(self):
        return not self.is_blocked

    # Methods to check roles
    def has_role(self, role_name):
        return any(role.name == role_name for role in self.roles)

    def is_admin(self):
        return self.has_role('Admin')

    def is_customer(self):
        return self.has_role('Customer')

    def is_service_professional(self):
        return self.has_role('sp')
   
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'active': self.active,
            'fullname': self.fullname,
            'address': self.address,
            'pin_code': self.pin_code,
            'contact_no': self.contact_no,
            'service_name': self.service_name,
            'experience_years': self.experience_years,
            'is_professional': self.is_professional,
            'is_approved': self.is_approved,
            'is_blocked': self.is_blocked,
            'roles': [role.to_dict() for role in self.roles],  # Returns a list of roles for the user
        }
      
class Service(db.Model):
    __tablename__ = 'service'
    service_id = db.Column(db.Integer,autoincrement=True, primary_key=True)
    service_name = db.Column(db.String(100), nullable=False)#same as service type
    base_price = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(100), nullable=True)
    service_date_created = db.Column(db.DateTime)
    service_rating = db.Column(db.Integer, nullable=True)
    image = db.Column(db.String, nullable=True)
    
    

    @property
    def assigned_professional(self):
        rqs = ServiceRequest.query.filter_by(service_id=self.service_id, is_accepted=True, is_requested=False, is_closed=False).first()
        return rqs.professional_id if rqs else None
    @property
    def is_closed(self):
        return self.service_request_status == 'closed'
    def to_dict(self):
        return {
            'service_id': self.service_id,
            'service_name': self.service_name,
            'base_price': self.base_price,
            'description': self.description,
            'service_date_created': self.service_date_created.strftime('%Y-%m-%d') if self.service_date_created else None,
            'service_rating': self.service_rating,
            'image': self.image,
        }
        
class ServiceRequest(db.Model):
    __tablename__ = 'service_request'
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('service.service_id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    date_of_request = db.Column(db.DateTime, nullable=False)
    service_request_status = db.Column(db.String(20), default='requested')
    remarks = db.Column(db.String, nullable=True)
    is_booked = db.Column(db.Boolean, default=False)
    is_requested = db.Column(db.Boolean, default=False)
    is_accepted = db.Column(db.Boolean, default=False)
    is_closed = db.Column(db.Boolean, default=False)
    is_pending = db.Column(db.Boolean, default=True)
    booking_date = db.Column(db.DateTime, nullable=True)
    date_of_completion = db.Column(db.DateTime, nullable=True)

    # Relationship with the Service model
    service = db.relationship('Service', backref='service_requests')
    customer = db.relationship('User', foreign_keys=[customer_id], back_populates='service_requests')
    professional = db.relationship('User', foreign_keys=[professional_id], back_populates='provided_services', overlaps="assigned_professional,provided_services")

    def to_dict(self):
        return {
            'id': self.id,
            'service_id': self.service_id,
            'service_name': self.service.service_name if self.service else None,  # Fetch service name
            'customer_id': self.customer_id,
            'professional_id': self.professional_id,
            'date_of_request': self.date_of_request.strftime('%Y-%m-%d') if self.date_of_request else None,
            'service_request_status': self.service_request_status,
            'remarks': self.remarks,
            'is_booked': self.is_booked,
            'is_requested': self.is_requested,
            'is_accepted': self.is_accepted,
            'is_closed': self.is_closed,
            'booking_date': self.booking_date.strftime('%Y-%m-%d') if self.booking_date else None,
            'date_of_completion': self.date_of_completion.strftime('%Y-%m-%d') if self.date_of_completion else None
        }

    def to_dict(self):
        return {
            'id': self.id,
            'service_id': self.service_id,
            'customer_id': self.customer_id,
            'professional_id': self.professional_id,
            'date_of_request': self.date_of_request.strftime('%Y-%m-%d') if self.date_of_request else None,
            'service_request_status': self.service_request_status,
            'remarks': self.remarks,
            'is_booked': self.is_booked,
            'is_requested': self.is_requested,
            'is_accepted': self.is_accepted,
            'is_closed': self.is_closed,
            'booking_date': self.booking_date.strftime('%Y-%m-%d') if self.booking_date else None,
            'date_of_completion': self.date_of_completion.strftime('%Y-%m-%d') if self.date_of_completion else None
        }


class Review(db.Model):
    __tablename__ = 'review'
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign key to ServiceRequest (existing)
    service_request_id = db.Column(db.Integer, db.ForeignKey('service_request.id'), nullable=False)
    
    # Foreign key to User (existing)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Foreign key to Service (fixing the issue here)
    service_id = db.Column(db.Integer, db.ForeignKey('service.service_id'), nullable=False)
    
    rating = db.Column(db.Integer, nullable=False)  # 1-5 scale
    comments = db.Column(db.String, nullable=True)
    date_posted = db.Column(db.DateTime)
    
    # Relationships
    service_request = db.relationship('ServiceRequest', backref='reviews')  # Backref to service_request reviews
    user = db.relationship('User', backref='reviews')  # Relationship to User
    service = db.relationship('Service', backref='reviews')  # Relationship to Service
    
    def to_dict(self):
        return {
            'id': self.id,
            'service_request_id': self.service_request_id,
            'user_id': self.user_id,
            'service_id': self.service_id,
            'rating': self.rating,
            'comments': self.comments,
            'date_posted': self.date_posted.strftime('%Y-%m-%d') if self.date_posted else None
        }
    

class DailyVisit(db.Model):
    __tablename__ = 'daily_visits'
    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    date = db.Column(db.Date)
    user = db.relationship('User', backref='visits')
