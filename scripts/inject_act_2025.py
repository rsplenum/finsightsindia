import os
import glob
import re

CONTENT_DIR = "src/content/direct-tax"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # If it already has statutoryAct2025, skip
    if 'statutoryAct2025:' in content:
        print(f"Skipping {filepath}: already has statutoryAct2025")
        return

    # Find the statutoryAct line and inject statutoryAct2025 right below it
    # We use regex to handle potential trailing spaces and single/double quotes
    pattern = r'(statutoryAct:\s*[\'"].*?[\'"])'
    replacement = r'\1\nstatutoryAct2025: ""'
    
    new_content, count = re.subn(pattern, replacement, content, count=1)
    
    if count == 1:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        print(f"Warning: Could not find statutoryAct in {filepath}")

def main():
    files = glob.glob(os.path.join(CONTENT_DIR, '*.mdx')) + glob.glob(os.path.join(CONTENT_DIR, '*.md'))
    for f in files:
        process_file(f)

if __name__ == "__main__":
    main()
