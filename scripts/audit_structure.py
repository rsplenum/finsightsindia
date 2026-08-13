import os
import glob
import re

CONTENT_DIR = "src/content/direct-tax"

def audit_article(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    missing = []
    
    # Check for Symptom scene (usually a blockquote near the top)
    # Heuristic: A line starting with `> *"`
    if not re.search(r'^>\s*\*', content, re.MULTILINE):
        missing.append("Symptom scene (named person quote)")
        
    # Check for TL;DR CardPremium
    if not re.search(r'<CardPremium[^>]*title="TL;DR', content):
        missing.append("TL;DR CardPremium")
        
    # Check for NoticeTrap
    if '<NoticeTrap' not in content:
        missing.append("≥1 NoticeTrap")
        
    # Check for Key Takeaway Checklist
    if 'Key Takeaway' not in content:
        missing.append("Key Takeaway checklist")
        
    # Heuristic for Edge Cases
    if not re.search(r'(?i)edge case|what if|leaving anything out', content):
        missing.append("Edge cases")
        
    return missing

def main():
    files = glob.glob(os.path.join(CONTENT_DIR, '*.mdx')) + glob.glob(os.path.join(CONTENT_DIR, '*.md'))
    
    report = {}
    for f in files:
        basename = os.path.basename(f)
        missing = audit_article(f)
        if missing:
            report[basename] = missing
            
    print(f"Total articles audited: {len(files)}")
    print(f"Articles missing required structural elements: {len(report)}\n")
    
    for article, missing_items in sorted(report.items()):
        print(f"❌ {article}")
        for item in missing_items:
            print(f"   - Missing: {item}")
        print()

if __name__ == "__main__":
    main()
