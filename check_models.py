import os
from dotenv import load_dotenv
from google import genai

# Wake up and grab your hidden magic key
load_dotenv()

print("\n🔍 ASKING GOOGLE FOR THE EXACT MACHINE NAMES...")
try:
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    for model in client.models.list():
        # We only want the fast, free-tier "Flash" models
        if "flash" in model.name.lower():
            print(f"✅ Found one! {model.name}")
except Exception as e:
    print(f"Uh oh, an error: {e}")
print("==================================================\n")
