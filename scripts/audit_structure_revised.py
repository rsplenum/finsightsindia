import os
import glob
import re

CONTENT_DIR = "src/content/direct-tax"

def audit_article(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    missing = []
    
    # 1. Symptom Scene: Usually a blockquote `> *"` or just `>` at the beginning to set the stakes/scenario
    if not re.search(r'^>\s', content, re.MULTILINE):
        missing.append("Symptom Scene (Blockquote/Scenario)")
        
    # 2. TL;DR CardPremium
    if not re.search(r'<CardPremium[^>]*title="TL;DR', content):
        missing.append("TL;DR CardPremium")
        
    # 3. NoticeTrap
    if '<NoticeTrap' not in content:
        missing.append("≥1 NoticeTrap")
        
    # 4. Key Takeaway Checklist
    # Some articles use "Key Takeaway", some use "Key Takeaways"
    if not re.search(r'(?i)Key Takeaway', content):
        missing.append("Key Takeaway checklist")
        
    # 5. Edge Cases
    if not re.search(r'(?i)edge case|what if|leaving anything out|exceptions|special case', content):
        missing.append("Edge cases")
        
    return missing

def main():
    files = glob.glob(os.path.join(CONTENT_DIR, '*.mdx')) + glob.glob(os.path.join(CONTENT_DIR, '*.md'))
    
    report = {}
    passed = []
    
    for f in files:
        basename = os.path.basename(f)
        missing = audit_article(f)
        if missing:
            report[basename] = missing
        else:
            passed.append(basename)
            
    print(f"Total articles audited: {len(files)}")
    print(f"Articles missing required structural elements: {len(report)}")
    print(f"Articles fully compliant: {len(passed)}\n")
    
    if passed:
        print("✅ FULLY COMPLIANT ARTICLES:")
        for article in sorted(passed):
            print(f"   - {article}")
        print("\n" + "-"*40 + "\n")
    
    for article, missing_items in sorted(report.items()):
        print(f"❌ {article}")
        for item in missing_items:
            print(f"   - Missing: {item}")
        print()

if __name__ == "__main__":
    main()
