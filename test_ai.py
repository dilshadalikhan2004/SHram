import os
from dotenv import load_dotenv
import google.generativeai as genai
from pathlib import Path

# Load env
load_dotenv(Path(__file__).parent / 'backend' / '.env')

api_key = os.environ.get("GEMINI_API_KEY")
print(f"Using API Key: {api_key[:5]}...{api_key[-5:]}" if api_key else "No API Key found")

if not api_key:
    exit("Abort: No API Key")

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content("Hello, this is a test.")
    print("Response Success!")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error caught: {type(e).__name__}: {str(e)}")
