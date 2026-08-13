import os
import glob
import re
from collections import defaultdict

content_dir = "src/content/direct-tax"
files = glob.glob(os.path.join(content_dir, "*.mdx")) + glob.glob(os.path.join(content_dir, "*.md"))
image_map = defaultdict(list)

for f in files:
    with open(f, "r") as file:
        content = file.read()
    match = re.search(r"coverImage:\s*[\'\"](.*?)[\'\"]", content)
    if match:
        img = match.group(1)
        image_map[img].append(os.path.basename(f))

reused = {k: v for k, v in image_map.items() if len(v) > 1}

if not reused:
    print("No reused images found!")
else:
    for img, flist in reused.items():
        print(f"Reused Image: {img}")
        for f in flist:
            print(f"  - {f}")
