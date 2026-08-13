import os
import requests
import json
import base64
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

base_prompt = "Modern art-like but highly contextual and narrative-driven. Clean, crisp. A standalone spot illustration with no borders, no margins, and no surrounding layout elements, designed to be placed inside an article. Pure white background with black line art and one specific accent color (institutional gold). Subject: "

images_to_generate = {
    # Section 23
    "inset-municipal-scale-v2.jpg": base_prompt + "A rigid, mechanical scale precisely weighing a miniature golden city hall building against an aggressive market graph. The vibe is subtle, metaphorical, reinforcing systemic tension without melodrama.",
    "inset-data-matrix-v2.jpg": base_prompt + "A sleek, illuminated data-matrix showing three diverging paths, visually highlighting how a massive loan (uncapped interest) instantly shatters a notional rent tax. The vibe is subtle, metaphorical.",
    "inset-regime-doors-v2.jpg": base_prompt + "Two architectural doors standing side-by-side. One door is slightly open, revealing a salary slip. The other door is firmly bolted shut. The vibe is subtle, metaphorical, reinforcing systemic tension without melodrama.",
    
    # Section 26
    "inset-deed-scale-v2.jpg": base_prompt + "A metaphorical scale weighing legal property deeds against bank statements, visually explaining how algorithms prioritize ink over cash flow. The vibe is subtle, metaphorical, reinforcing systemic tension without melodrama."
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
        
        image_base64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
        image_bytes = base64.b64decode(image_base64)
        
        path = os.path.join("src/assets/images", filename)
        with open(path, "wb") as f:
            f.write(image_bytes)
        print(f"Successfully generated {path}")
        return True
        
    except Exception as e:
        print(f"Failed to generate {filename}: {e}")
        if 'response' in locals():
            print(response.text)
        return False

for filename, prompt in images_to_generate.items():
    if not os.path.exists(os.path.join("src/assets/images", filename)):
        generate_image(filename, prompt)
    else:
        print(f"{filename} already exists, skipping.")
