import os
import re

files_to_fix = [
    "src/content/direct-tax/the-15-day-defective-return-clock-section-139-9.mdx",
    "src/content/direct-tax/the-section-148-escaped-assessment-nightmare.mdx",
    "src/content/direct-tax/the-high-value-sft-trap-section-142-1.mdx"
]

def fix_notice_traps(content):
    pattern_multi = re.compile(r'<NoticeTrap\s+title="([^"]+)"\s+severity="([^"]+)"\s+trigger="([^"]+)"\s+solution="([^"]+)"\s*/>', re.DOTALL)
    
    def replacer(match):
        title = match.group(1)
        trigger = match.group(3)
        solution = match.group(4)
        return f'<NoticeTrap title="{title}">\n**The Trigger:** {trigger}\n\n**The Solution:** {solution}\n</NoticeTrap>'
    
    content = pattern_multi.sub(replacer, content)
    return content

def fix_5_whys(content):
    content = re.sub(r'## The Philosophy: The 5 Whys of.*', r'## The Historical Intent & Legal Shift', content)
    content = re.sub(r'the 5 Whys\.', 'its historical and mechanical evolution.', content)
    return content

tldrs = {
    "src/content/direct-tax/the-15-day-defective-return-clock-section-139-9.mdx": """
<CardPremium>
### TL;DR
- **The Trigger:** A Form 16/AIS mismatch causes the CPC to flag your return as defective under Section 139(9).
- **The Deadline:** You have exactly 15 days to respond; otherwise, your ITR is legally treated as "never filed."
- **The Fix:** Log into the e-Filing portal, navigate to Pending Actions, and correct the specific error code (e.g., Error 38) by submitting a revised computation.
</CardPremium>
""",
    "src/content/direct-tax/the-section-148-escaped-assessment-nightmare.mdx": """
<CardPremium>
### TL;DR
- **The Trigger:** The algorithm detects unrecorded foreign assets, RSUs, or crypto transactions via CRS/AIS data, suggesting income has "escaped assessment."
- **The Time Limit:** Normally 3 years, but the AO can reach back up to 10 years if the escaped asset is valued at ₹50 Lakhs or more.
- **The Defense:** Use the mandatory Section 148A(b) show-cause phase to prove your cost-basis and dismantle their valuation before the case is officially reopened.
</CardPremium>
""",
    "src/content/direct-tax/the-high-value-sft-trap-section-142-1.mdx": """
<CardPremium>
### TL;DR
- **The Trigger:** Paying a ₹10 Lakh credit card bill or buying ₹30 Lakhs of property triggers an SFT mismatch if it exceeds your declared ITR slab.
- **The Inquiry:** The CPC issues a Section 142(1) e-Campaign notice demanding you explain the source of the funds.
- **The Defense:** Provide the "Holy Trinity" of proof (Identity, Genuineness, Creditworthiness) in the Compliance Portal by categorizing the funds as past savings, loans, or exempt gifts.
</CardPremium>
"""
}

for file_path in files_to_fix:
    with open(file_path, 'r') as f:
        content = f.read()
    
    content = fix_notice_traps(content)
    content = fix_5_whys(content)
    
    parts = content.split('---', 2)
    if len(parts) == 3:
        frontmatter = parts[1]
        body = parts[2]
        
        import_end = body.rfind('import')
        if import_end != -1:
            next_newline = body.find('\n', import_end)
            body = body[:next_newline+1] + '\n' + tldrs[file_path] + '\n' + body[next_newline+1:]
        else:
            body = '\n' + tldrs[file_path] + '\n' + body
            
        new_content = '---' + frontmatter + '---' + body
        
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Fixed {file_path}")
