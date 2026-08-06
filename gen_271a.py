import os
import requests
import json
import base64
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

prompt = "A varsity style minimalist illustration, dark navy background (#0A192F), institutional gold accents (#D4AF37). A solitary sleek ledger book sitting on a desk, overshadowed by a heavy, mechanical metallic stamp hovering ominously above it. Clean, premium, no text."
filename = "271a-bookkeeping-trap.jpg"

def generate_image():
    print(f"Generating {filename}...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        image_base64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
        image_bytes = base64.b64decode(image_base64)
        
        path = os.path.join("src/assets/images", filename)
        with open(path, "wb") as f:
            f.write(image_bytes)
        print(f"Successfully saved {path}")
    except Exception as e:
        print(f"Failed to generate {filename}: {e}")

generate_image()
