import os
import requests
import json
import base64
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

images_to_generate = {
    # Section 23
    "hero-phantom-rent.jpg": "A premium, high-detail comic-book style spot illustration on a pure, solid white background. The subjects must be completely isolated with no background scenery, rooms, or borders. Bold black inking, expressive narrative, and rich colors (deep navy and institutional gold). Subject: Three golden property keys. Two of the keys are shielded under a calm, glowing blue 'Nil' aura. The third key is linked by a rigid data wire to a simple, clean tax ledger line. The vibe is systemic tension, algorithmic sorting, and rigid bureaucracy.",
    "inset-municipal-scale.jpg": "Modern art-like but highly contextual and narrative-driven. Clean, crisp, and seamlessly integrated into a digital article flow. Pure white background with black line art and one specific accent color (institutional gold). Subject: A rigid, mechanical scale precisely weighing 'Municipal Value' against 'Fair Rent', outputting a single, heavy 'Expected Rent' integer block. The vibe is subtle, metaphorical, and deeply integrated into the text's logic, reinforcing systemic tension without melodrama.",
    "inset-data-matrix.jpg": "Modern art-like but highly contextual and narrative-driven. Clean, crisp, and seamlessly integrated into a digital article flow. Pure white background with black line art and one specific accent color (institutional gold). Subject: A sleek, illuminated data-matrix showing three diverging paths (A, B, C), visually highlighting how a massive loan (uncapped interest) instantly shatters the notional rent tax. The vibe is subtle, metaphorical, and deeply integrated into the text's logic.",
    "inset-regime-doors.jpg": "Modern art-like but highly contextual and narrative-driven. Clean, crisp, and seamlessly integrated into a digital article flow. Pure white background with black line art and one specific accent color (institutional gold). Subject: Two architectural doors standing side-by-side. The 'Old Regime' door is slightly open, revealing a salary slip. The 'New Regime' door is firmly bolted shut. The vibe is subtle, metaphorical, and deeply integrated into the text's logic, reinforcing systemic tension without melodrama.",
    
    # Section 26
    "hero-joint-registry.jpg": "A premium, high-detail comic-book style spot illustration on a pure, solid white background. The subjects must be completely isolated with no background scenery, rooms, or borders. Bold black inking, expressive narrative, and rich colors (deep navy and institutional gold). Subject: A rigid, mechanical sorting machine aggressively splitting a single, heavy stream of gold coins down the middle into two distinct funnels, completely ignoring the source of the flow, emphasizing algorithmic blind spots. The vibe is clean transactions disrupted by rigid bureaucratic machinery, systemic tension, and algorithmic sorting.",
    "inset-deed-scale.jpg": "Modern art-like but highly contextual and narrative-driven. Clean, crisp, and seamlessly integrated into a digital article flow. Pure white background with black line art and one specific accent color (institutional gold). Subject: A metaphorical scale weighing legal property deeds against bank statements, visually explaining how algorithms prioritize ink over cash flow. The vibe is subtle, metaphorical, and deeply integrated into the text's logic, reinforcing systemic tension without melodrama."
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
        print(f"Successfully restored {path}")
        return True
        
    except Exception as e:
        print(f"Failed to generate {filename}: {e}")
        if 'response' in locals():
            print(response.text)
        return False

for filename, prompt in images_to_generate.items():
    generate_image(filename, prompt)
