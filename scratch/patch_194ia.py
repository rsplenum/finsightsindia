import os
import re

filepath = "src/content/direct-tax/194-ia-buyer-tds-notice.mdx"

images = [
    ("hero-194ia-tds-notice.jpg", "A split scene showing a pristine real estate contract"),
    ("inset-194ia-split.jpg", "A flowchart showing a pile of money being split"),
    ("inset-194ia-threshold.jpg", "A split ledger showing")
]

with open(filepath, 'r') as f:
    content = f.read()

for filename, keyword in images:
    pattern = r"\{/\*\s*ILLUSTRATION PLACEHOLDER:.*?" + re.escape(keyword) + r".*?\*/\}"
    replacement = f"![Illustration](../../assets/images/{filename})"
    content = re.sub(pattern, replacement, content, flags=re.IGNORECASE | re.DOTALL)
    
with open(filepath, 'w') as f:
    f.write(content)

print("194-ia-buyer-tds-notice.mdx patched successfully.")
