import os
import re

files_to_update = {
    "src/content/direct-tax/section-23-phantom-rent-trap.mdx": [
        ("hero-phantom-rent.jpg", "Three golden property keys"),
        ("inset-municipal-scale.jpg", "scale precisely weighing"),
        ("inset-data-matrix.jpg", "sleek, illuminated data-matrix"),
        ("inset-regime-doors.jpg", "Two architectural doors")
    ],
    "src/content/direct-tax/section-26-joint-registry-emi-trap.mdx": [
        ("hero-joint-registry.jpg", "mechanical sorting machine"),
        ("inset-deed-scale.jpg", "weighing legal property deeds")
    ]
}

for filepath, images in files_to_update.items():
    with open(filepath, 'r') as f:
        content = f.read()
    
    for filename, keyword in images:
        pattern = r"\{/\*\s*ILLUSTRATION PLACEHOLDER:.*?" + keyword + r".*?\*/\}"
        replacement = f"![Illustration](../../assets/images/{filename})"
        content = re.sub(pattern, replacement, content, flags=re.IGNORECASE | re.DOTALL)
        
    with open(filepath, 'w') as f:
        f.write(content)

print("Placeholders replaced.")
