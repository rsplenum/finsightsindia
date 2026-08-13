import os

replacements = [
    {
        "file": "src/content/direct-tax/gst-itc-mismatch-supplier-default-trap.mdx",
        "old": "gst-mythbuster-anxiety.jpg",
        "new": "gst-itc-mismatch.jpg"
    },
    {
        "file": "src/content/direct-tax/80g-fake-donation-scam-notice.mdx",
        "old": "shocked_taxpayer.jpg",
        "new": "80g-fake-donation.jpg"
    },
    {
        "file": "src/content/direct-tax/section-87a-rebate-denial-trap.mdx",
        "old": "shocked_taxpayer.jpg",
        "new": "87a-rebate-denied.jpg"
    }
]

for rep in replacements:
    filepath = rep["file"]
    with open(filepath, "r") as f:
        content = f.read()
    
    content = content.replace(rep["old"], rep["new"])
    
    with open(filepath, "w") as f:
        f.write(content)
        
    print(f"Updated {filepath}")
