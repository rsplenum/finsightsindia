import os
import requests
import json
import base64
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

images_to_generate = {
    "fo-trading-turnover-hero.jpg": "A premium, high-detail comic-book style illustration. Bold black inking, expressive narrative, and rich, saturated colors (deep navy and institutional gold). Include bold, thematic typography integrated naturally into the scene. Subject: A stressed salaried professional in a varsity jacket staring in horror at a massive, glowing '10 CRORE TURNOVER' red warning on his phone trading app, while a towering, menacing robotic tax auditor looms behind him holding a 'TAX AUDIT DEMAND' clipboard. The vibe is dramatic, high-stakes financial tension.",
    "fo-trading-turnover-context.jpg": "A clean, simple whiteboard-style explanatory diagram. Crisp black line art on a pure white background with one specific accent color (institutional gold). Subject: A flowchart showing a small stack of money labeled '50k CAPITAL' passing through a fast-spinning mechanical wheel labeled 'HIGH FREQUENCY F&O TRADES', which artificially inflates it into a massive, overflowing vault labeled '10 CRORE TURNOVER'."
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
