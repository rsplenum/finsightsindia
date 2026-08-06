import os, requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

r = requests.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={key}")
models = r.json().get('models', [])
for m in models:
    if 'image' in m['name'].lower() or 'imagen' in m['name'].lower():
        print(m['name'])
