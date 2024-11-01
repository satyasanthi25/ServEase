from app import app
from application.sec import datastore
from application.models import db, Role
from flask_security import hash_password
from werkzeug.security import generate_password_hash

with app.app_context():
    db.drop_all()  # Deletes all tables and data
    db.create_all()  # Re-creates the tables
    
    # Correcting 'username' to 'name' for roles
    datastore.find_or_create_role(name="admin", description="User is an Admin")
    datastore.find_or_create_role(name="customer", description="User is a Customer")
    datastore.find_or_create_role(name="sp", description="User is a ServiceProfessional")
    
    db.session.commit()  # Save changes to the database
    
    # Create users if they don't already exist
    if not datastore.find_user(email="admin@email.com"):
        datastore.create_user(username="admin", email="admin@email.com", 
                              password=generate_password_hash("admin"), roles=["admin"])
    if not datastore.find_user(email="customer@email.com"):
        datastore.create_user(username="customer", email="customer@email.com", 
                              password=generate_password_hash("customer"), roles=["customer"],
                              active=True)
    if not datastore.find_user(email="sp@email.com"):
        datastore.create_user(username="ServiceProfessional", email="sp@email.com", 
                              password=generate_password_hash("sp123"), roles=["sp"])
    
    db.session.commit()  # Finalize changes
