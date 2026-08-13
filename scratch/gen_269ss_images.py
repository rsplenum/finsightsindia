import os
import requests
import json
import base64
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

images_to_generate = {
    "hero-269ss-token.jpg": "A premium, high-detail comic-book style spot illustration on a pure, solid white background. The subjects must be completely isolated with no background scenery, rooms, or borders. Bold black inking, expressive narrative, and rich colors (deep navy and institutional gold). Subject: “Token ₹50,000” beside “271D penalty ₹50,000” + line “100% of amount accepted · deal need not complete.” No crushed human, no vault-on-person.",
    "inset-269t-refund.jpg": "Modern art-like but highly contextual and narrative-driven. Clean, crisp. A standalone spot illustration with no borders, no margins, and no surrounding layout elements, designed to be placed inside an article. Pure white background with black line art and one specific accent color (institutional gold). Subject: A mechanical flowchart showing a cash bayana entering a machine, the machine breaking (deal dies), and the cash refund triggering a secondary trap labeled 271E."
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
