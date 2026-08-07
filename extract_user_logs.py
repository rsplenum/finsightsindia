import json
import re
from pathlib import Path

TRANSCRIPT_PATH = "/Users/gaurangbhardwaj/.gemini/antigravity/brain/34ecf075-8b1d-41a5-b1ff-175f39769566/.system_generated/logs/transcript.jsonl"
OUTPUT_PATH = "/Users/gaurangbhardwaj/Projects/backup/swp_calculator/src/data/creator-logs.json"

logs = []

def extract_content(content):
    match = re.search(r'<USER_REQUEST>\n(.*?)\n</USER_REQUEST>', content, re.DOTALL)
    if match:
        text = match.group(1).strip()
        return text
    return None

with open(TRANSCRIPT_PATH, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT':
                content = data.get('content', '')
                text = extract_content(content)
                
                if text and text != "" and text != "go ahead":
                    logs.append({
                        "id": data.get('step_index'),
                        "timestamp": data.get('created_at'),
                        "message": text
                    })
        except json.JSONDecodeError:
            continue

# Create dir if not exists
Path(OUTPUT_PATH).parent.mkdir(parents=True, exist_ok=True)

with open(OUTPUT_PATH, 'w') as f:
    json.dump(logs, f, indent=2)

print(f"Extracted {len(logs)} messages to {OUTPUT_PATH}")
