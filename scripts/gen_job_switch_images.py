import os
import requests
import json
import base64
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

images_to_generate = {
    "mid-year-job-switch-hero.jpg": "A premium, high-detail comic-book style spot illustration on a pure, solid white background. The subjects must be completely isolated with no background scenery, rooms, or borders. Bold black inking, expressive narrative, and rich colors (deep navy and institutional gold). Subject: A shocked corporate employee sitting at a desk, looking at an Income Tax portal screen on a laptop that displays a massive red 'TAX DEMAND' alert. The employee is holding two different Form 16s (labeled 'Company A' and 'Company B') in their hands, looking completely confused.",
    "mid-year-job-switch-context.jpg": "A premium, high-detail comic-book style spot illustration on a pure, solid white background. The subjects must be completely isolated with no background scenery, rooms, or borders. Bold black inking, expressive narrative, and rich colors (deep navy and institutional gold). Subject: A visual infographic or diagram. A large document titled 'FORM 12B' is acting as a sturdy bridge between two corporate office buildings (labeled Company A and Company B), preventing a pile of cash from falling into a fiery pit below labeled '234B Penalty'."
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
