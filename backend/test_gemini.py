import sys
from google import genai
client = genai.Client(api_key='AIzaSyDDM6SfH9jqLWDe84TAY8DaOtXn-PJF9yg')
try:
    print('Testing gemini-2.5-flash...')
    r = client.models.generate_content(model='gemini-2.5-flash', contents='hi')
    print('SUCCESS:', r.text)
except Exception as e:
    print('ERROR:', e)

try:
    print('Testing gemini-pro...')
    r = client.models.generate_content(model='gemini-pro', contents='hi')
    print('SUCCESS:', r.text)
except Exception as e:
    print('ERROR:', e)
