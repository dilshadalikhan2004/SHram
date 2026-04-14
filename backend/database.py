import os
import logging
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime

logger = logging.getLogger(__name__)

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'shramsetu')

# Global client and db
client = None
db = None


def get_db():
    global client, db
    if db is None:
        try:
            logger.info("Initializing lazy MongoDB connection...")
            is_local = "localhost" in mongo_url or "127.0.0.1" in mongo_url
            client_kwargs = {
                "serverSelectionTimeoutMS": 15000,
                "connectTimeoutMS": 15000
            }
            if not is_local:
                client_kwargs["tls"] = True
                client_kwargs["tlsCAFile"] = certifi.where()

            client = AsyncIOMotorClient(mongo_url, **client_kwargs)
            db = client[db_name]
        except Exception as e:
            logger.error(f"MongoDB Lazy Init Error: {e}")
            return None
    return db


def mongo_to_dict(obj):
    if obj is None:
        return None
    if isinstance(obj, list):
        return [mongo_to_dict(x) for x in obj]
    if isinstance(obj, dict):
        new_dict = {}
        for k, v in obj.items():
            if k == "_id":
                new_dict["id"] = str(v)
            elif isinstance(v, ObjectId):
                new_dict[k] = str(v)
            elif isinstance(v, datetime):
                new_dict[k] = v.isoformat()
            elif isinstance(v, (dict, list)):
                new_dict[k] = mongo_to_dict(v)
            else:
                new_dict[k] = v

        # Ensure 'id' exists if '_id' was present
        if "_id" in obj and "id" not in new_dict:
            new_dict["id"] = str(obj["_id"])

        return new_dict
    return obj


def mongo_list_to_dict(docs):
    """Sanitizes a list of MongoDB documents."""
    return [mongo_to_dict(doc) for doc in docs]
