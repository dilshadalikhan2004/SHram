import os
from twilio.rest import Client
from dotenv import load_dotenv

# Load .env from the backend directory
load_dotenv('c:/Users/LENOVO/SHram/backend/.env')

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_VERIFY_SERVICE_SID = os.environ.get("TWILIO_VERIFY_SERVICE_SID")

print(f"SID: {TWILIO_ACCOUNT_SID}")
print(f"Token: {'*' * len(TWILIO_AUTH_TOKEN) if TWILIO_AUTH_TOKEN else 'None'}")
print(f"Service SID: {TWILIO_VERIFY_SERVICE_SID}")

if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID]):
    print("Error: Missing Twilio environment variables.")
    exit(1)

try:
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    # Try with a common Indian test number or a placeholder
    # Use E.164 format
    test_phone = "+919876543210" 
    print(f"Attempting to send verification to {test_phone}...")
    
    verification = client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).verifications.create(to=test_phone, channel='sms')
    print(f"Success! Status: {verification.status}")
except Exception as e:
    print(f"FAILED: {str(e)}")
