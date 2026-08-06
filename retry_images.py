import os
import requests
import json
import base64
from dotenv import load_dotenv
import time

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

base_prompt_light = "A varsity style minimalist illustration. Pure solid white background (#FFFFFF) so it blends perfectly into a light theme. Institutional gold accents (#D4AF37) and deep navy lines (#0A192F). Elegant, modern line art, less is more, say more with less. Clean, premium, no text. Subject: "
base_prompt_dark = "A varsity style minimalist illustration. Pure solid deep navy background (#0A192F) so it blends perfectly into a dark theme. Institutional gold accents (#D4AF37) and bright white/silver lines. Elegant, modern line art, less is more, say more with less. Clean, premium, no text. Subject: "

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
        image_base64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
        image_bytes = base64.b64decode(image_base64)
        
        path = os.path.join("src/assets/images", filename)
        with open(path, "wb") as f:
            f.write(image_bytes)
        print(f"Successfully saved {path}")
    except Exception as e:
        print(f"Failed to generate {filename}: {e}")

# Retry the failed ones
generate_image("143-1-tds-arrears-dark.jpg", base_prompt_dark + "A clean, broken chain link symbolizing a severed connection.")
time.sleep(2)
generate_image("271a-bookkeeping-trap-light.jpg", base_prompt_light + "A solitary closed ledger book with a heavy metallic stamp hovering just above it.")
