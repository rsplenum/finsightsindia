import os
import requests
import json
import base64
from dotenv import load_dotenv
import time

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

base_prompt = "A varsity style minimalist illustration, pure solid deep navy background (exactly hex #0A192F) so it seamlessly blends into a webpage of that color. Institutional gold accents (#D4AF37). Elegant, modern, less is more, say more with less. Clean, premium, no text. Subject: "

images_to_generate = [
    {
        "filename": "139-9-defective-return.jpg",
        "subject": "A subtle, sleek 15-day hourglass where the falling sand forms a document."
    },
    {
        "filename": "142-1-sft-trap.jpg",
        "subject": "A glowing minimal radar sweep revealing a hidden gold coin."
    },
    {
        "filename": "143-1-tds-arrears.jpg",
        "subject": "A clean, broken chain link symbolizing a severed connection between employer and tax department."
    },
    {
        "filename": "148-escaped-assessment.jpg",
        "subject": "A sharp beam of light illuminating a single old, dusty file folder."
    },
    {
        "filename": "270a-penalty-trap.jpg",
        "subject": "A sleek, minimal metallic trap snapping shut."
    },
    {
        "filename": "271a-bookkeeping-trap.jpg",
        "subject": "A solitary closed ledger book with a heavy metallic stamp hovering just above it."
    }
]

def generate_image(filename, subject):
    print(f"Generating {filename}...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": base_prompt + subject}]}]
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

for item in images_to_generate:
    generate_image(item["filename"], item["subject"])
    time.sleep(2) # rate limit safety
