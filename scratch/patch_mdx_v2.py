import os
import re

files_to_update = {
    "src/content/direct-tax/section-23-phantom-rent-trap.mdx": [
        ("inset-municipal-scale.jpg", "inset-municipal-scale-v2.jpg"),
        ("inset-data-matrix.jpg", "inset-data-matrix-v2.jpg"),
        ("inset-regime-doors.jpg", "inset-regime-doors-v2.jpg")
    ],
    "src/content/direct-tax/section-26-joint-registry-emi-trap.mdx": [
        ("inset-deed-scale.jpg", "inset-deed-scale-v2.jpg")
    ]
}

for filepath, images in files_to_update.items():
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old_filename, new_filename in images:
        content = content.replace(f"![Illustration](../../assets/images/{old_filename})", f"![Illustration](../../assets/images/{new_filename})")
        
    with open(filepath, 'w') as f:
        f.write(content)

print("MDX files patched to point to -v2 images.")
