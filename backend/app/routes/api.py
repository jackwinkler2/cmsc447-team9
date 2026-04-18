import os
import uuid
import boto3
from flask import Blueprint, jsonify, request

api_bp = Blueprint("api", __name__, url_prefix="/api")

# this should eventually be replaced once we run with AWS compute
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.environ.get("AKIA3FAJORBO7KDYJWPF"),
    aws_secret_access_key=os.environ.get("hlpox+w2XFrUgqbZTK7Ky8Xa065j78OsRTJI+KGg"),
    region_name=os.environ.get("AWS_REGION", "us-east-1")
)

@api_bp.route("/health")
def health():
    return jsonify({"status": "ok"})

@api_bp.route("/upload", methods=["POST"])
def upload_photo():
    # no file is obviously an error
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files["file"]
    
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # generates unique name for photo
    file_extension = file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    bucket_name = os.environ.get("AWS_S3_BUCKET_NAME")

    try:
        # uploads to s3
        s3_client.upload_fileobj(
            file, 
            bucket_name, 
            unique_filename,
            ExtraArgs={"ContentType": file.content_type}
        )
        
        # final textract logic will go here

        return jsonify({
            "message": "Upload successful", 
            "s3_filename": unique_filename
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
