import os
import json
import re
from collections import defaultdict

def audit_content():
    content_dir = "src/content/direct-tax"
    reels_path = "src/data/reel-scripts.json"
    
    # 1. Load Reels
    with open(reels_path, "r") as f:
        reels_data = json.load(f)
        
    articles_with_reels = set()
    for reel in reels_data:
        articles_with_reels.add(reel.get("articleSlug"))

    # 2. Scan MDX files
    article_files = [f for f in os.listdir(content_dir) if f.endswith('.mdx')]
    
    image_to_articles = defaultdict(list)
    article_images = {}
    
    for filename in article_files:
        filepath = os.path.join(content_dir, filename)
        slug = filename.replace('.mdx', '')
        
        with open(filepath, 'r') as f:
            content = f.read()
            
            images_found = set()
            
            # Match frontmatter coverImage
            cover_match = re.search(r'coverImage:\s*"([^"]+)"', content)
            if cover_match:
                images_found.add(cover_match.group(1))
                
            # Match imports
            import_matches = re.findall(r'import\s+\w+\s+from\s+"(?:[^"]+/assets/images/)([^"]+)"', content)
            for img in import_matches:
                images_found.add(img)
                
            # Match markdown images: ![alt](../../assets/images/filename.jpg)
            markdown_matches = re.findall(r'!\[.*?\]\((?:.*?/assets/images/)([^)]+)\)', content)
            for img in markdown_matches:
                images_found.add(img)
                
            article_images[slug] = list(images_found)
            
            for img in images_found:
                image_to_articles[img].append(slug)
                
    # 3. Generate Report
    missing_reels = []
    reused_images = []
    
    for slug in [f.replace('.mdx', '') for f in article_files]:
        if slug not in articles_with_reels:
            missing_reels.append(slug)
            
    for img, slugs in image_to_articles.items():
        if len(slugs) > 1:
            reused_images.append((img, slugs))
            
    print("=== MISSING REEL SCRIPTS ===")
    if not missing_reels:
        print("None! All articles have reel scripts.")
    for slug in sorted(missing_reels):
        print(f"- {slug}")
        
    print("\n=== REUSED/PLACEHOLDER ILLUSTRATIONS ===")
    for img, slugs in reused_images:
        print(f"Image: {img}")
        for slug in slugs:
            print(f"  - {slug}")
            
    print("\n=== ARTICLES WITH NO IMAGES AT ALL ===")
    found_no_images = False
    for slug, imgs in article_images.items():
        if not imgs:
            print(f"- {slug}")
            found_no_images = True
    if not found_no_images:
        print("None! All articles have at least one image.")

if __name__ == "__main__":
    audit_content()
