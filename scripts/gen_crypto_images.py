import os
import requests
import json
import base64
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

images_to_generate = {
    "p2p-crypto-bank-freeze-hero.jpg": "A premium, high-detail comic-book style spot illustration on a pure, solid white background. The subjects must be completely isolated with no background scenery, rooms, or borders. Bold black inking, expressive narrative, and rich colors (deep navy and institutional gold). Subject: A glowing, frozen ATM screen wrapped in heavy police caution tape. A terrified crypto trader is standing in front of it, holding a smartphone showing a 'Binance P2P Success' notification, completely disconnected from the crime but locked out of his money. The vibe is dramatic, high-stakes financial tension.",
    "p2p-crypto-bank-freeze-context.jpg": "A premium, high-detail comic-book style spot illustration on a pure, solid white background. The subjects must be completely isolated with no background scenery, rooms, or borders. Bold black inking, expressive narrative, and rich colors (deep navy and institutional gold). Subject: A visual diagram showing 'Stolen Money' flowing into a 'Washing Machine' (labeled P2P), and coming out as 'Clean Crypto' for the scammer, while the machine spits out a 'Freeze Notice' onto an innocent trader's bank account."
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
