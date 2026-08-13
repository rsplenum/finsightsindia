import os
import requests
import json
import base64
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

base_modifiers_hero = "A premium, high-detail comic-book style spot illustration on a pure, solid white background. The subjects must be completely isolated with no background scenery, rooms, or borders. Bold black inking, expressive narrative, and rich colors (deep navy and institutional gold). Subject: "
base_modifiers_inset = "Modern art-like but highly contextual and narrative-driven. Clean, crisp. A standalone spot illustration with no borders, no margins, and no surrounding layout elements, designed to be placed inside an article. Pure white background with black line art and one specific accent color (institutional gold). Subject: "

images_to_generate = {
    "hero-194ia-tds-notice.jpg": base_modifiers_hero + "A split scene showing a pristine real estate contract on one side, and a glowing smartphone with a red CPC-TDS notification on the other, connected by a rigid, algorithmic line. Vibe: Systemic tension, not panic; a clean transaction disrupted by rigid bureaucracy.",
    "inset-194ia-split.jpg": base_modifiers_inset + "A flowchart showing a pile of money being split into 99% going to a 'Seller' bucket and 1% being diverted to a 'Government Tax' bucket labeled Form 26QB, locking the seller into the grid.",
    "inset-194ia-threshold.jpg": base_modifiers_inset + "A split ledger showing ₹30L plus ₹30L equaling ₹60L total, with an aggressive red line crossing the ₹50L threshold, emphasizing the property value over the individual share."
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
