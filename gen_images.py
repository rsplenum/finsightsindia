import os
import requests
import json
import base64
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

images_to_generate = {
    "139-9-defective-return.jpg": "A varsity style minimalist illustration, dark navy background (#0A192F), institutional gold accents (#D4AF37). A glowing, ominous ticking clock hovering over a stack of tax forms (Form 16) and a digital portal screen. The vibe is tense, representing a 15-day countdown. Clean, premium, no text.",
    "148-escaped-assessment.jpg": "A varsity style minimalist illustration, dark navy background (#0A192F), institutional gold accents (#D4AF37). A forensic magnifying glass examining a glowing ledger, revealing hidden digital cryptocurrency coins and international stock certificates that were previously invisible. Clean, premium, no text.",
    "142-1-sft-trap.jpg": "A varsity style minimalist illustration, dark navy background (#0A192F), institutional gold accents (#D4AF37). An algorithmic spider web or digital dragnet catching a high-value platinum credit card and house keys, while a mechanical eye observes from above. Clean, premium, no text.",
    "143-1-tds-arrears.jpg": "A varsity style minimalist illustration, dark navy background (#0A192F), institutional gold accents (#D4AF37). A legal strategist holding up a glowing shield that deflects a heavy tax demand document away from an honest worker and back toward a crumbling corporate building. Clean, premium, no text.",
    "270a-penalty-trap.jpg": "A varsity style minimalist illustration, dark navy background (#0A192F), institutional gold accents (#D4AF37). A scale of justice where one side has a small 50% weight, but a massive, crushing 200% mechanical anvil is being dropped by a robotic arm onto the other side. Clean, premium, no text."
}

def generate_image(filename, prompt):
    print(f"Generating {filename}...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Extract base64 image data
        image_base64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
        image_bytes = base64.b64decode(image_base64)
        
        path = os.path.join("src/assets/images", filename)
        with open(path, "wb") as f:
            f.write(image_bytes)
        print(f"Successfully saved {path}")
        
    except Exception as e:
        print(f"Failed to generate {filename}: {e}")
        if 'response' in locals():
            print(response.text)

for filename, prompt in images_to_generate.items():
    generate_image(filename, prompt)
