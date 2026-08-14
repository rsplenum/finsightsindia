import json
import os

file_path = '/Users/gaurangbhardwaj/Projects/backup/swp_calculator/src/data/reel-scripts.json'

with open(file_path, 'r') as f:
    data = json.load(f)

new_id = f"reel-{len(data) + 1:03d}"

new_reel = {
  "id": new_id,
  "title": "The P2P Lending Infinite Tax Trap",
  "articleSlug": "p2p-lending-bad-debt-disallowance",
  "duration": "100s",
  "hook": "Did you know that investing in P2P lending at a 12% return can mathematically result in an infinite tax rate? Here is how the government taxes your losses.",
  "script": [
    {
      "time": "0:00 - 0:15",
      "visual": "Speaker holding a phone showing a P2P dashboard with '12% Return!'. A red 'TAXED' stamp hits it.",
      "audio": "Did you know that investing in P2P lending at a 12% return can mathematically result in an infinite tax rate? Here is how the government taxes your losses."
    },
    {
      "time": "0:15 - 0:35",
      "visual": "Split screen: 'Bank NPAs' (deductible) vs 'Retail P2P Bad Debt' (non-deductible).",
      "audio": "When a bank loses money on a bad loan, they deduct it from their profits before paying tax. But when you lose money on a P2P platform, the Income Tax Act treats it as a non-deductible capital loss."
    },
    {
      "time": "0:35 - 0:55",
      "visual": "A 12% yield graphic is sliced by a 30% tax slab, then crushed by a 5% default rate.",
      "audio": "You pay full slab-rate tax on the interest earned. But you cannot deduct the principal you lost. A 12% yield in the 30% bracket drops to 8.4%. Add a 5% default rate, and your true return is just 3.4%."
    },
    {
      "time": "0:55 - 1:15",
      "visual": "An investor pulling their hair out as the yield goes negative but the tax bill remains.",
      "audio": "If defaults hit 8.4%, your cash flow breaks even. But you still owe taxes on the gross interest. You are literally paying the government a premium for the privilege of losing your own money."
    },
    {
      "time": "1:15 - 1:40",
      "visual": "Speaker pointing to screen with the 'FinSight INDIA' logo.",
      "audio": "Retail P2P lending is mathematically broken. Learn the corporate entity structuring loopholes that HNI investors use to bypass this trap on FinSight INDIA. Link in bio."
    }
  ]
}

data.append(new_reel)

with open(file_path, 'w') as f:
    json.dump(data, f, indent=2)

print("Reel appended successfully!")
