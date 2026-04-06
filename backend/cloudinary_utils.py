import cloudinary
import cloudinary.uploader
import os
import logging
from dotenv import load_dotenv
from pathlib import Path

logger = logging.getLogger(__name__)

# Load env if not already loaded
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)


def upload_to_cloudinary(file_path, folder="shramsetu"):
    """
    Uploads a file to Cloudinary and returns the direct URL.
    Supports both images and videos.
    """
    try:
        # Determine resource type (image or video)
        ext = file_path.split(".")[-1].lower()
        resource_type = "video" if ext in ["mp4", "webm", "mov", "avi"] else "image"

        response = cloudinary.uploader.upload(
            file_path,
            folder=folder,
            resource_type=resource_type
        )
        return response.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary Upload Error: {str(e)}")
        return None


def delete_from_cloudinary(public_id, resource_type="image"):
    """
    Deletes a file from Cloudinary.
    """
    try:
        cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return True
    except Exception as e:
        logger.error(f"Cloudinary Delete Error: {str(e)}")
        return False
