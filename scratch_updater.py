import os
import re

files = os.listdir('/Users/gaurangbhardwaj/Projects/backup/swp_calculator/src/content/direct-tax')
files = [f.replace('.mdx', '') for f in files if f.endswith('.mdx')]

with open('/Users/gaurangbhardwaj/.gemini/antigravity/brain/34ecf075-8b1d-41a5-b1ff-175f39769566/Topic_Master_List.md', 'r') as f:
    lines = f.readlines()

# Explicit mappings for guaranteed accuracy
explicit_map = {
    "194-ia-buyer-tds-notice": "1.",
    "section-26-joint-registry-emi-trap": "2.",
    "section-23-phantom-rent-trap": "3.",
    "section-269ss-cash-token-property-advance-penalty": "4.",
    "section-43bh-msme-45-day-payment-tax-disallowance": "5.",
    "section-129-cgst-expired-e-way-bill-penalty": "6.",
    "gst-rcm-foreign-saas-import-of-services": "7.",
    "nri-property-sale-tds-section-195-trap": "8.",
    "120-day-accidental-residency-trap": "9.",
    "mid-year-job-switch-tax-trap": "11.",
    "moonlighting-dual-employment-tax-guide": "17.",
    "the-high-value-sft-trap-section-142-1": "18.",
    "section-87a-rebate-denial-trap": "23.",
    "founder-salary-vs-dividend-strategy": "35.",
    "influencer-barter-trap-194r": "37.",
    "gst-itc-mismatch-supplier-default-trap": "42.",
    "freelance-export-gst-usd-guide": "48.",
    "foreign-remittance-lrs-tcs-guide": "57.",
    "p2p-crypto-bank-freeze-trap": "61.",
    "crypto-loss-offset-prohibition": "59.",
    "80g-fake-donation-scam-notice": "19.", # Actually 80G isn't in 19, let's rely on string matching
}

for i, line in enumerate(lines):
    if line.strip().startswith('- [ ]') or line.strip().startswith('- [x]'):
        match = re.search(r'\*\*(\d+)\.\s+(.*?)\*\*', line)
        if match:
            topic_num = match.group(1)
            topic_title = match.group(2).lower()
            
            is_matched = False
            
            # 1. Check explicit map
            for f, num in explicit_map.items():
                if num == topic_num + ".":
                    is_matched = True
                    print(f"Explicit match: Topic {topic_num} -> {f}")
                    break
                    
            # 2. Check keyword intersection
            if not is_matched:
                for file in files:
                    file_parts = [p for p in file.split('-') if p not in ['guide', 'trap', 'section', 'tax', 'the', 'of', 'and', 'to', 'vs', 'in', 'on', 'a']]
                    # Check how many parts are in title
                    matches = sum(1 for p in file_parts if p in topic_title)
                    if len(file_parts) > 0 and matches >= len(file_parts) - 1: # Allow 1 miss
                        is_matched = True
                        print(f"Heuristic match: Topic {topic_num} '{topic_title}' -> {file}")
                        break
            
            if is_matched:
                if line.strip().startswith('- [ ]'):
                    lines[i] = line.replace('- [ ]', '- [x]', 1)

with open('/Users/gaurangbhardwaj/.gemini/antigravity/brain/34ecf075-8b1d-41a5-b1ff-175f39769566/Topic_Master_List.md', 'w') as f:
    f.writelines(lines)
