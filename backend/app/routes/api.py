from flask import Blueprint, request, jsonify
import boto3
import os
import uuid
import json
from app import db
from app.models import Delivery, Material, Location, User, Inventory

# Define the blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# this should eventually be replaced once we run with AWS compute
s3_client = boto3.client(
    "s3",
    region_name=os.environ.get("AWS_REGION", "us-east-1")
)


@api_bp.route('/upload', methods=['POST'])
def upload_file():
    # image upload
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    bucket_name = os.environ.get("AWS_S3_BUCKET_NAME")
    unique_filename = f"{uuid.uuid4()}.jpg"
    
    try:
        # upload to s3
        s3_client.upload_fileobj(file, bucket_name, unique_filename)
        # store the image url to add to the database
        s3_url = f"https://{bucket_name}.s3.amazonaws.com/{unique_filename}"
    except Exception as e:
        return jsonify({"error": f"S3 Upload failed: {str(e)}"}), 500

    # extract ocr data
    ocr_data_str = request.form.get('ocr_data')
    if not ocr_data_str:
        return jsonify({"error": "No OCR data provided"}), 400

    try:
        ocr_data = json.loads(ocr_data_str)
        
        # placeholder user
        user = User.query.filter_by(role="Field").first()
        if not user:
            user = User(name="Test Field Worker", email="field@williams.com", role="Field")
            db.session.add(user)
            db.session.commit() # Commit to generate the user.id

        # gets jobsite location
        jobsite_name = ocr_data.get("jobSite", "Unknown Site")
        location = Location.query.filter_by(name=jobsite_name).first()
        if not location:
            location = Location(name=jobsite_name, type="Jobsite", status="Active")
            db.session.add(location)
            db.session.commit() # Commit to generate the location.id

        # create delivery record
        new_delivery = Delivery(
            crew_member_id=user.id,
            jobsite_id=location.id,
            packing_slip_url=s3_url
        )
        db.session.add(new_delivery)
        db.session.flush()

        # creates materials and updates inventory
        for item in ocr_data.get("items", []):
            mat_name = item.get("material")
            qty = int(item.get("qty", 0))

            # find the material or create a new one
            material = Material.query.filter_by(name=mat_name).first()
            if not material:
                material = Material(name=mat_name)
                db.session.add(material)
                db.session.flush()

            # update the inventory for this specific location
            inventory_record = Inventory.query.filter_by(location_id=location.id, material_id=material.id).first()
            if inventory_record:
                inventory_record.quantity += qty
            else:
                new_inv = Inventory(location_id=location.id, material_id=material.id, quantity=qty)
                db.session.add(new_inv)

        db.session.commit()

        return jsonify({
            "message": "Successfully uploaded photo and saved data!", 
            "delivery_id": new_delivery.id
        }), 200

    except Exception as e:
        db.session.rollback() # if anything fails, undo the database changes to prevent corrupted data
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
                "location": inv.location.name,
                "location_type": inv.location.type,
                "material": inv.material.name,
                "quantity": inv.quantity
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/locations', methods=['POST'])
def create_location():
    """Admin route to create a new Jobsite or Warehouse"""
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('type'):
        return jsonify({"error": "Missing 'name' or 'type' in payload"}), 400

    try:
        new_loc = Location(
            name=data['name'], 
            type=data['type'], # e.g., 'Jobsite' or 'Warehouse'
            status="Active"
        )
        db.session.add(new_loc)
        db.session.commit()
        return jsonify({"message": "Location created successfully", "id": new_loc.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500