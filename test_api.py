import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

prompt = "A varsity style minimalist illustration, dark navy background, institutional gold accents. A glowing ticking clock."
model = "gemini-3.1-flash-image"

# Try generateContent
print("Trying generateContent...")
url1 = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
payload1 = {
    "contents": [{"parts": [{"text": prompt}]}]
}
r1 = requests.post(url1, json=payload1)
print(r1.status_code)
print(r1.text)

# Try generateImages (predict?)
# Wait, for Gemini Developer API, it's:
# https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict
# But maybe gemini-3.1-flash-image is generateImages?
print("\nTrying predict...")
url2 = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:predict?key={key}"
payload2 = {
    "instances": [{"prompt": prompt}],
    "parameters": {"sampleCount": 1}
}
r2 = requests.post(url2, json=payload2)
print(r2.status_code)
print(r2.text)

print("\nTrying generateImages...")
url3 = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateImages?key={key}"
r3 = requests.post(url3, json=payload1) # not sure about payload format
print(r3.status_code)
print(r3.text)

