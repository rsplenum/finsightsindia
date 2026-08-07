import os
import requests
import json
import base64
from dotenv import load_dotenv
import time

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

base_prompt = "A varsity style minimalist illustration. Pure solid white background (#FFFFFF). Institutional gold accents (#D4AF37) and deep navy lines (#0A192F). Elegant, modern line art, less is more, say more with less. Clean, premium, no text. Subject: "

images_to_generate = [
    # 139(9) Defective Return
    {
        "filename": "139-9-deadline-anxiety.jpg",
        "subject": "A ticking clock face melting over a disorganized pile of tax documents, creating a sense of frantic urgency."
    },
    {
        "filename": "139-9-correction-relief.jpg",
        "subject": "A sleek, glowing digital JSON file icon being slotted perfectly into a glowing server slot, symbolizing precise correction."
    },
    
    # 142(1) SFT Trap
    {
        "filename": "142-1-sft-anxiety.jpg",
        "subject": "A massive credit card looming like a monolith, casting a long, dark shadow over a small figure."
    },
    {
        "filename": "142-1-defense-relief.jpg",
        "subject": "A pristine metallic shield deflecting a barrage of red laser beams, with a neat stack of receipts behind it."
    },
    
    # 143(1) TDS Arrears
    {
        "filename": "143-1-tds-anxiety.jpg",
        "subject": "A severed, broken pipeline spilling golden coins, with an automated robotic claw pointing accusingly at a person."
    },
    {
        "filename": "143-1-tds-relief.jpg",
        "subject": "A glowing legal gavel striking a chain, redirecting the robotic claw back toward a massive corporate factory."
    },
    
    # 148 Escaped Assessment
    {
        "filename": "148-reassessment-anxiety.jpg",
        "subject": "An ancient, dusty hourglass with sand flowing aggressively, surrounded by 11 calendar pages blowing in the wind."
    },
    {
        "filename": "148-reassessment-relief.jpg",
        "subject": "A majestic stone courthouse pillar standing firm against a violent storm, offering shelter."
    },
    
    # 270A Penalty Trap
    {
        "filename": "270a-misreporting-anxiety.jpg",
        "subject": "A digital screen displaying '50%' rapidly glitching and morphing into a massive, menacing '200%' in deep red."
    },
    {
        "filename": "270a-safe-harbor-relief.jpg",
        "subject": "A glowing golden harbor with a calm, illuminated ship securely anchored, protected from crashing algorithmic waves."
    },
    
    # 271A Bookkeeping
    {
        "filename": "271a-bookkeeping-anxiety.jpg",
        "subject": "A towering, heavy metallic stamp reading '25,000' crashing down toward a blank piece of paper."
    },
    {
        "filename": "271a-compliance-relief.jpg",
        "subject": "A perfectly organized, illuminated ledger book floating peacefully, surrounded by a glowing aura of protection."
    }
]

def generate_image(filename, prompt, max_retries=3):
    print(f"Generating {filename}...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    for attempt in range(max_retries):
        try:
            print(f"  Attempt {attempt + 1}/{max_retries}...")
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()
            data = response.json()
            image_base64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
            image_bytes = base64.b64decode(image_base64)
            
            path = os.path.join("src/assets/images", filename)
            with open(path, "wb") as f:
                f.write(image_bytes)
            print(f"Successfully saved {path}")
            return
        except Exception as e:
            print(f"  Failed attempt {attempt + 1}: {e}")
            time.sleep(2)
    print(f"Failed to generate {filename} after {max_retries} attempts.")

for item in images_to_generate:
    generate_image(item["filename"], base_prompt + item["subject"])
    time.sleep(2)
