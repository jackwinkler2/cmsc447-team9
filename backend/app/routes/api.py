from flask import Blueprint, request, jsonify
import boto3
import os
import uuid
import json
import re # NEW: Needed for parsing quantities
from app import db
from app.models import Delivery, Material, Location, User, Inventory, MaterialRequest, PurchaseOrder

api_bp = Blueprint('api', __name__, url_prefix='/api')

# S3
s3_client = boto3.client(
    "s3",
    region_name=os.environ.get("AWS_REGION", "us-east-1")
)

# Textract
textract_client = boto3.client(
    "textract",
    region_name=os.environ.get("AWS_REGION", "us-east-1")
)

@api_bp.route('/locations', methods=['GET'])
def get_locations():
    """Fetches locations. If role is provided, filters to ONLY their assigned locations."""
    # listen for the 'role' instead of the integer ID
    role = request.args.get('role')
    
    try:
        if role:
            # grab the user based on their role
            user = User.query.filter_by(role=role).first()
            if not user:
                return jsonify({"error": "User not found"}), 404
            locations = user.locations # get only their assigned locations
        else:
            locations = Location.query.all() # get all locations (For Admins)
            
        return jsonify([{
            "id": loc.id, 
            "name": loc.name, 
            "type": loc.type,
            "address": loc.address,
            "latitude": loc.latitude,
            "longitude": loc.longitude
        } for loc in locations]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/locations', methods=['POST'])
def create_location():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('type'):
        return jsonify({"error": "Missing 'name' or 'type' in payload"}), 400
    try:
        new_loc = Location(
            name=data['name'], 
            type=data['type'], 
            status="Active",
            address=data.get('address'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        db.session.add(new_loc)
        db.session.commit()
        return jsonify({"message": "Location created successfully", "id": new_loc.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@api_bp.route('/locations/<int:loc_id>', methods=['PATCH'])
def update_location(loc_id):
    """Admin route to update an existing location's details"""
    data = request.get_json()
    try:
        loc = Location.query.get(loc_id)
        if not loc:
            return jsonify({"error": "Location not found"}), 404
            
        if 'name' in data: loc.name = data['name']
        if 'type' in data: loc.type = data['type']
        if 'address' in data: loc.address = data['address']
        if 'latitude' in data: loc.latitude = data['latitude']
        if 'longitude' in data: loc.longitude = data['longitude']
            
        db.session.commit()
        return jsonify({"message": "Location updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@api_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    bucket_name = os.environ.get("AWS_S3_BUCKET_NAME")
    unique_filename = f"{uuid.uuid4()}.jpg"
    
    try:
        s3_client.upload_fileobj(file, bucket_name, unique_filename)
        s3_url = f"https://{bucket_name}.s3.amazonaws.com/{unique_filename}"
    except Exception as e:
        return jsonify({"error": f"S3 Upload failed: {str(e)}"}), 500

    ocr_data_str = request.form.get('ocr_data')
    if not ocr_data_str:
        return jsonify({"error": "No OCR data provided"}), 400

    try:
        ocr_data = json.loads(ocr_data_str)
        user = User.query.filter_by(email="logistics@yourdomain.com").first() # put the exact email here
        if not user:
            user = User(name="Test Logistics", email="log@williams.com", role="logistics")
            db.session.add(user)
            db.session.commit()

        jobsite_name = ocr_data.get("jobSite", "Unknown Site")
        location = Location.query.filter_by(name=jobsite_name).first()
        if not location:
            location = Location(name=jobsite_name, type="Jobsite", status="Active")
            db.session.add(location)
            db.session.commit() 

        new_delivery = Delivery(
            crew_member_id=user.id,
            jobsite_id=location.id,
            packing_slip_url=s3_url
        )
        db.session.add(new_delivery)
        db.session.flush() 

        for item in ocr_data.get("items", []):
            mat_name = item.get("material")
            qty = int(item.get("qty", 0))

            material = Material.query.filter_by(name=mat_name).first()
            if not material:
                material = Material(name=mat_name)
                db.session.add(material)
                db.session.flush()

            inventory_record = Inventory.query.filter_by(location_id=location.id, material_id=material.id).first()
            if inventory_record:
                inventory_record.quantity += qty
            else:
                new_inv = Inventory(location_id=location.id, material_id=material.id, quantity=qty)
                db.session.add(new_inv)

            # auto fulfillment
            pending_requests = MaterialRequest.query.filter_by(jobsite_id=location.id, material_name=mat_name, status="Approved").all()
            for req in pending_requests:
                if req.quantity <= qty:
                    req.status = "Fulfilled"
                    qty -= req.quantity 

        db.session.commit()
        return jsonify({"message": "Successfully uploaded photo and saved data!", "delivery_id": new_delivery.id}), 200

    except Exception as e:
        db.session.rollback() 
        return jsonify({"error": f"Database insertion failed: {str(e)}"}), 500


@api_bp.route('/inventory', methods=['GET'])
def get_inventory():
    """Fetches all inventory across all locations"""
    try:
        inventory_records = Inventory.query.all()
        result = []
        for inv in inventory_records:
            result.append({
                "id": inv.id,
                "location_id": inv.location_id, 
                "location": inv.location.name,
                "location_type": inv.location.type,
                "material": inv.material.name,
                "quantity": inv.quantity,
                "photo_url": inv.material.photo_url 
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route('/locations/<int:location_id>/inventory', methods=['GET'])
def get_location_inventory(location_id):
    """Fetches inventory for a specific Warehouse or Jobsite"""
    try:
        location = Location.query.get(location_id)
        if not location:
            return jsonify({"error": "Location not found"}), 404

        inventory_records = Inventory.query.filter_by(location_id=location_id).all()
        
        items = []
        for inv in inventory_records:
            items.append({
                "id": inv.id,
                "material": inv.material.name,
                "quantity": inv.quantity
            })
            
        return jsonify({
            "location_name": location.name,
            "location_type": location.type,
            "inventory": items
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/requests', methods=['POST'])
def create_material_request():
    data = request.get_json()
    if not data or not data.get('material_name') or not data.get('quantity') or not data.get('jobsite_id'):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        user = User.query.filter_by(role="logistics").first()
        if not user:
            return jsonify({"error": "No user found in database."}), 404

        new_request = MaterialRequest(
            material_name=data['material_name'],
            quantity=int(data['quantity']),
            jobsite_id=data['jobsite_id'],
            requester_id=user.id,
            status="Pending"
        )
        db.session.add(new_request)
        db.session.commit()
        return jsonify({"message": "Request submitted successfully!", "id": new_request.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@api_bp.route('/requests', methods=['GET'])
def get_material_requests():
    try:
        status_filter = request.args.get('status')
        if status_filter:
            requests_data = MaterialRequest.query.filter_by(status=status_filter).all()
        else:
            requests_data = MaterialRequest.query.all()

        result = []
        for req in requests_data:
            material = Material.query.filter_by(name=req.material_name).first()
            warehouse_stock = 0
            if material:
                warehouse_invs = Inventory.query.join(Location).filter(
                    Inventory.material_id == material.id, 
                    Location.type == 'Warehouse'
                ).all()
                warehouse_stock = sum(inv.quantity for inv in warehouse_invs)

            result.append({
                "id": req.id,
                "material_name": req.material_name,
                "quantity": req.quantity,
                "status": req.status,
                "jobsite": req.jobsite.name if req.jobsite else "Unknown",
                "requester": req.requester.name if req.requester else "Unknown",
                "warehouse_stock": warehouse_stock 
            })
            
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/requests/<int:request_id>', methods=['PATCH'])
def update_request_status(request_id):
    """Admin route to Approve, Deny, or Manually Fulfill a request"""
    data = request.get_json()
    new_status = data.get('status')
    
    # listen for an array of explicit warehouse deductions from the frontend
    deductions = data.get('deductions', []) 

    if new_status not in ['Approved', 'Denied', 'Fulfilled']:
        return jsonify({"error": "Status must be 'Approved', 'Denied', or 'Fulfilled'"}), 400

    try:
        mat_req = MaterialRequest.query.get(request_id)
        if not mat_req:
            return jsonify({"error": "Request not found"}), 404

        # manual fulfillment
        if new_status == 'Fulfilled' and mat_req.status == 'Approved':
            material = Material.query.filter_by(name=mat_req.material_name).first()

            if material and deductions:
                total_transferred = 0

                # deduct specifically from the warehouses the admin selected
                for d in deductions:
                    inv_record = Inventory.query.get(d['inventory_id'])
                    qty_to_pull = int(d['quantity'])

                    if inv_record and inv_record.quantity >= qty_to_pull and qty_to_pull > 0:
                        inv_record.quantity -= qty_to_pull
                        total_transferred += qty_to_pull

                # add the total pulled directly to the jobsite's inventory
                if total_transferred > 0:
                    jobsite_inv = Inventory.query.filter_by(location_id=mat_req.jobsite_id, material_id=material.id).first()
                    if jobsite_inv:
                        jobsite_inv.quantity += total_transferred
                    else:
                        new_inv = Inventory(location_id=mat_req.jobsite_id, material_id=material.id, quantity=total_transferred)
                        db.session.add(new_inv)

        mat_req.status = new_status
        db.session.commit()
        
        return jsonify({"message": f"Request {request_id} marked as {new_status}"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@api_bp.route('/materials', methods=['GET'])
def get_materials():
    """Admin route to list all materials in the catalog"""
    try:
        materials = Material.query.order_by(Material.name).all()
        return jsonify([{"id": m.id, "name": m.name, "photo_url": m.photo_url} for m in materials]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route('/materials', methods=['POST'])
def create_material():
    """Admin route to create a new material type"""
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"error": "Missing material name"}), 400
    try:
        new_mat = Material(name=data['name'], photo_url=data.get('photo_url'))
        db.session.add(new_mat)
        db.session.commit()
        return jsonify({"message": "Material created successfully", "id": new_mat.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@api_bp.route('/materials/<int:mat_id>', methods=['PATCH'])
def update_material(mat_id):
    """Admin route to update a material's photo URL"""
    data = request.get_json()
    try:
        mat = Material.query.get(mat_id)
        if not mat:
            return jsonify({"error": "Material not found"}), 404
            
        if 'photo_url' in data:
            mat.photo_url = data['photo_url']
        if 'name' in data:
            mat.name = data['name']
            
        db.session.commit()
        return jsonify({"message": "Material updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@api_bp.route('/deliveries', methods=['POST'])
def log_manual_delivery():
    """Logistics route to log a delivery (now supports multiple materials!)"""
    data = request.get_json()
    
    if not data or not data.get('jobsite_id'):
        return jsonify({"error": "Missing jobsite_id"}), 400

    items = data.get('items', [])
    
    if not items and data.get('material_id') and data.get('quantity'):
        items = [{'material_id': data.get('material_id'), 'quantity': data.get('quantity')}]

    if not items:
        return jsonify({"error": "Missing materials and quantities"}), 400

    try:
        user = User.query.filter_by(role="logistics").first()
        
        new_delivery = Delivery(
            crew_member_id=user.id, 
            jobsite_id=data['jobsite_id'],
            packing_slip_url=data.get('packing_slip_url')
        )
        db.session.add(new_delivery)
        db.session.flush()

        jobsite_id = data['jobsite_id']

        for item in items:
            mat_id = item['material_id']
            qty = int(item['quantity'])

            inventory_record = Inventory.query.filter_by(location_id=jobsite_id, material_id=mat_id).first()
            if inventory_record:
                inventory_record.quantity += qty
            else:
                new_inv = Inventory(location_id=jobsite_id, material_id=mat_id, quantity=qty)
                db.session.add(new_inv)

            material = Material.query.get(mat_id)
            if material:
                pending_requests = MaterialRequest.query.filter_by(jobsite_id=jobsite_id, material_name=material.name, status="Approved").all()
                for req in pending_requests:
                    if req.quantity <= qty:
                        req.status = "Fulfilled"
                        qty -= req.quantity 

        db.session.commit()
        return jsonify({"message": "Delivery logged successfully!", "delivery_id": new_delivery.id}), 201

    except Exception as e:
        db.session.rollback() 
        return jsonify({"error": str(e)}), 500


@api_bp.route('/upload-image', methods=['POST'])
def upload_image_only():
    """Generic route to securely upload a photo to S3 and return the URL"""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    bucket_name = os.environ.get("AWS_S3_BUCKET_NAME")
    unique_filename = f"materials/{uuid.uuid4()}.jpg" 
    
    try:
        s3_client.upload_fileobj(file, bucket_name, unique_filename)
        s3_url = f"https://{bucket_name}.s3.amazonaws.com/{unique_filename}"
        return jsonify({"photo_url": s3_url}), 200
    except Exception as e:
        return jsonify({"error": f"S3 Upload failed: {str(e)}"}), 500


# OCR processing
@api_bp.route('/analyze-receipt', methods=['POST'])
def analyze_receipt():
    """Takes a photo, runs AWS Textract, and matches line items to the DB"""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    bucket_name = os.environ.get("AWS_S3_BUCKET_NAME")
    unique_filename = f"ocr-processing/{uuid.uuid4()}.jpg"
    
    try:
        # upload the image to S3 so Textract can access it
        s3_client.upload_fileobj(file, bucket_name, unique_filename)
        s3_url = f"https://{bucket_name}.s3.amazonaws.com/{unique_filename}"
        
        # call AWS Textract
        response = textract_client.detect_document_text(
            Document={'S3Object': {'Bucket': bucket_name, 'Name': unique_filename}}
        )
        
        # extract text lines
        extracted_lines = [item['Text'] for item in response['Blocks'] if item['BlockType'] == 'LINE']
        
        # smart Matching engine against DB Catalog
        all_materials = Material.query.all()
        found_items = []
        
        for line in extracted_lines:
            line_lower = line.lower()
            for mat in all_materials:
                # if a DB material name is found on this receipt line
                if mat.name.lower() in line_lower:
                    # look for a number on the same line to guess the quantity
                    numbers = re.findall(r'\b\d+\b', line_lower)
                    qty = int(numbers[-1]) if numbers else 1 # default to 1 if no number found
                    
                    # prevent duplicate additions if the same material spans multiple lines
                    if not any(item['material_id'] == mat.id for item in found_items):
                        found_items.append({
                            "material_id": mat.id,
                            "material_name": mat.name,
                            "quantity": qty
                        })
                        
        return jsonify({
            "receipt_url": s3_url,
            "extracted_items": found_items
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
import base64

@api_bp.route('/deliveries', methods=['GET'])
def get_deliveries():
    """Fetches the Audit Trail of all deliveries"""
    try:
        # order by newest first
        deliveries = Delivery.query.order_by(Delivery.date.desc()).all()
        result = []
        for d in deliveries:
            result.append({
                "id": d.id,
                "date": d.date.strftime("%Y-%m-%d %I:%M %p"),
                "crew_member": d.crew_member.name if d.crew_member else "Unknown",
                "jobsite": d.jobsite_ref.name if d.jobsite_ref else "Unknown",
                "packing_slip_url": d.packing_slip_url
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/upload-base64', methods=['POST'])
def upload_base64():
    """Securely uploads a drawn signature to AWS S3"""
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({"error": "No image data provided"}), 400
        
    try:
        # strip the data:image/png;base64, header
        img_data = base64.b64decode(data['image'].split(',')[1])
        bucket_name = os.environ.get("AWS_S3_BUCKET_NAME")
        unique_filename = f"signatures/{uuid.uuid4()}.png"
        
        s3_client.put_object(Bucket=bucket_name, Key=unique_filename, Body=img_data, ContentType='image/png')
        s3_url = f"https://{bucket_name}.s3.amazonaws.com/{unique_filename}"
        
        return jsonify({"photo_url": s3_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from datetime import datetime

@api_bp.route('/purchase-orders', methods=['POST'])
def create_purchase_order():
    """Saves a signed PO to the database and auto-generates a smart PO Number"""
    data = request.get_json()
    if not data or not data.get('jobsite_id') or not data.get('signature'):
        return jsonify({"error": "Missing jobsite or signature"}), 400
        
    try:
        jobsite_id = data['jobsite_id']
        
        # generate po string
        today_str = datetime.utcnow().strftime("%Y%m%d") # e.g., "20260511"
        
        # count existing POs for this specific jobsite to create the sequence (01, 02, etc.)
        existing_count = PurchaseOrder.query.filter_by(jobsite_id=jobsite_id).count()
        sequence_num = existing_count + 1
        
        # assemble: PO-20260511-JS4-01
        generated_po_number = f"PO-{today_str}-JS{jobsite_id}-{sequence_num:02d}"

        # save to DB
        new_po = PurchaseOrder(
            po_number=generated_po_number,
            jobsite_id=jobsite_id,
            signature=data['signature'],
            status="Signed & Approved"
        )
        db.session.add(new_po)
        db.session.commit()
        
        return jsonify({"message": "Purchase Order Generated", "po_number": generated_po_number}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@api_bp.route('/purchase-orders', methods=['GET'])
def get_purchase_orders():
    """Fetches all Purchase Orders for the PO Hub"""
    try:
        # order by newest first!
        pos = PurchaseOrder.query.order_by(PurchaseOrder.date.desc()).all()
        result = []
        for po in pos:
            loc = Location.query.get(po.jobsite_id)
            result.append({
                "id": po.id,
                "po_number": po.po_number, # pass the new string to the frontend
                "jobsite": loc.name if loc else "Unknown",
                "status": po.status,
                "signature": po.signature,
                "date": po.date.strftime("%Y-%m-%d")
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@api_bp.route('/crew', methods=['GET'])
def get_crew_members():
    """Admin Route: Gets all Logistics/Field users and their assigned location IDs"""
    try:
        users = User.query.filter_by(role='logistics').all()
        return jsonify([{
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "assigned_location_ids": [loc.id for loc in u.locations]
        } for u in users]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/crew/<int:user_id>/assign', methods=['POST'])
def assign_crew_locations(user_id):
    """Admin Route: Overwrites a user's assigned locations"""
    data = request.get_json()
    location_ids = data.get('location_ids', [])
    
    try:
        user = User.query.get(user_id)
        if not user: return jsonify({"error": "User not found"}), 404
        
        # clear existing and assign new
        user.locations = []
        for loc_id in location_ids:
            loc = Location.query.get(loc_id)
            if loc: user.locations.append(loc)
            
        db.session.commit()
        return jsonify({"message": "Crew assignments updated successfully!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500