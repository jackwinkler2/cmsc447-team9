from datetime import datetime
from app import db

class User(db.Model):
    """Combines Project Manager, Warehouse Worker, Field Crew, and Admin """
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False, default="Field") # Options: PM, Warehouse, Field, Admin
    
    # Relationships
    deliveries = db.relationship('Delivery', backref='crew_member', lazy=True)

class Location(db.Model):
    """Represents the Jobsite/Warehouse entity [cite: 300]"""
    __tablename__ = 'locations'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False) # Maps to 'location' in SRS
    status = db.Column(db.String(50), nullable=False, default="Active")
    type = db.Column(db.String(50), nullable=False) # e.g., 'Warehouse' or 'Jobsite'

class PurchaseOrder(db.Model):
    """Represents the Purchase Order entity [cite: 294, 297]"""
    __tablename__ = 'purchase_orders'
    id = db.Column(db.Integer, primary_key=True)
    jobsite_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False, default="Pending")
    signature = db.Column(db.String(255), nullable=True) # S3 URL to signature image
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    deliveries = db.relationship('Delivery', backref='purchase_order', lazy=True)

class Delivery(db.Model):
    """Represents the Deliveries entity [cite: 297]"""
    __tablename__ = 'deliveries'
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    jobsite_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    crew_member_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    po_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id'), nullable=True)
    packing_slip_url = db.Column(db.String(255), nullable=True) # Link to S3 image

class Material(db.Model):
    """Represents the Material/Equipment entity [cite: 297, 300]"""
    __tablename__ = 'materials'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    serial_number = db.Column(db.String(100), nullable=True) # Mapped from 'Serial #'
    
    # Links to a Material Request if applicable
    request_id = db.Column(db.Integer, nullable=True) 

class Inventory(db.Model):
    """Relational mapping for the InventoryDB entity to track quantities per location """
    __tablename__ = 'inventory'
    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    
    location = db.relationship('Location', backref=db.backref('inventory_items', lazy=True))
    material = db.relationship('Material', backref=db.backref('inventory_locations', lazy=True))

class MaterialRequest(db.Model):
    __tablename__ = 'material_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    material_name = db.Column(db.String(100), nullable=False) 
    quantity = db.Column(db.Integer, nullable=False)

    jobsite_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    status = db.Column(db.String(20), default='Pending') 

    jobsite = db.relationship('Location', backref='requests')
    requester = db.relationship('User', backref='requests')