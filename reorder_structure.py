import os
import re

files_to_fix = [
    "src/content/direct-tax/the-section-270a-200-penalty-trap.mdx",
    "src/content/direct-tax/the-15-day-defective-return-clock-section-139-9.mdx",
    "src/content/direct-tax/the-section-148-escaped-assessment-nightmare.mdx",
    "src/content/direct-tax/the-high-value-sft-trap-section-142-1.mdx"
]

for file_path in files_to_fix:
    with open(file_path, 'r') as f:
        content = f.read()

    # We need to extract the TL;DR block
    tldr_match = re.search(r'(<CardPremium>\s*### TL;DR.*?</CardPremium>)', content, re.DOTALL)
    if not tldr_match:
        print(f"No TL;DR found in {file_path}")
        continue
        
    tldr_block = tldr_match.group(1)
    
    # Remove the TL;DR from its current location
    content = content.replace(tldr_block, '')
    # Clean up empty lines left by removal
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # Extract the first image (Illustration) if any exists in the file, and remove it from its current place
    # We want to put it right before the TLDR.
    image_match = re.search(r'(!\[.*?\]\(.*?\))', content)
    image_block = ""
    if image_match:
        image_block = image_match.group(1)
        content = content.replace(image_block, '')
        content = re.sub(r'\n{3,}', '\n\n', content)
    
    # Now we need to find the first H2 (## ) to insert the Image + TL;DR right before it.
    # The text before the first H2 is the intro.
    # The structure will be: Intro -> Image -> TL;DR -> ## First Heading
    
    parts = content.split('## ', 1)
    if len(parts) == 2:
        intro_part = parts[0].strip()
        rest = '## ' + parts[1]
        
        # Build the new transition
        new_transition = "\n\n"
        if image_block:
            new_transition += image_block + "\n\n"
        new_transition += tldr_block + "\n\n"
        
        new_content = intro_part + new_transition + rest
        
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Fixed {file_path}")
    else:
        print(f"Could not find first H2 in {file_path}")

