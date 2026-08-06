import re

files_and_images = {
    "src/content/direct-tax/the-15-day-defective-return-clock-section-139-9.mdx": "139-9-defective-return.jpg",
    "src/content/direct-tax/the-section-148-escaped-assessment-nightmare.mdx": "148-escaped-assessment.jpg",
    "src/content/direct-tax/the-high-value-sft-trap-section-142-1.mdx": "142-1-sft-trap.jpg",
    "src/content/direct-tax/the-section-143-1-tds-arrears-demand.mdx": "143-1-tds-arrears.jpg",
    "src/content/direct-tax/the-section-270a-200-penalty-trap.mdx": "270a-penalty-trap.jpg"
}

for file_path, img_name in files_and_images.items():
    with open(file_path, 'r') as f:
        content = f.read()
    
    img_md = f"![Illustration](../../assets/images/{img_name})"
    
    # 1. Remove all existing images from the file to clean up placeholders
    content = re.sub(r'!\[.*?\]\(.*?\)\n*', '', content)
    
    # 2. Insert the new image right before <CardPremium>
    content = content.replace('<CardPremium>', img_md + '\n\n<CardPremium>')
    
    with open(file_path, 'w') as f:
        f.write(content)
        
    print(f"Patched {file_path}")
