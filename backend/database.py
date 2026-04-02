import os
import logging
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

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
            client = AsyncIOMotorClient(
                mongo_url,
                tls=True,
                tlsCAFile=certifi.where(),
                tlsAllowInvalidCertificates=True,
                serverSelectionTimeoutMS=2000, # Faster timeout
                connectTimeoutMS=2000
            )
            db = client[db_name]
        except Exception as e:
            logger.error(f"MongoDB Lazy Init Error: {e}")
            return None
    return db
