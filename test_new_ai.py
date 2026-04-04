import os
from dotenv import load_dotenv
from google import genai
from pathlib import Path

# Load env
env_path = Path(__file__).parent / 'backend' / '.env'
load_dotenv(env_path)

api_key = os.environ.get("GEMINI_API_KEY")
print(f"Using API Key Length: {len(api_key) if api_key else 'None'}")

if not api_key:
    exit("Abort: No API Key")

try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents="Say 'System Online'"
    )
    print("New SDK Success!")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"New SDK Error: {type(e).__name__}: {str(e)}")
