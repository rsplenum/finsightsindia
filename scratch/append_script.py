import json

path = '/Users/gaurangbhardwaj/Projects/backup/swp_calculator/src/data/reel-scripts.json'

with open(path, 'r') as f:
    data = json.load(f)

new_script = {
    "id": "reel-80ttb",
    "title": "The Senior Citizen FD Interest Mismatch",
    "articleSlug": "senior-citizen-80ttb-dropdown-error",
    "duration": "100s",
    "hook": "Did you know a simple dropdown error on your parents' tax return could wipe out ₹40,000 in deductions?",
    "script": [
        {
            "time": "0:00 - 0:15",
            "visual": "A person looking confused at a tax portal. A giant red '₹40,000 LOST' stamp slams onto the screen.",
            "audio": "Did you know a simple dropdown error on your parents' tax return could wipe out ₹40,000 in deductions? It's not a miscalculation. It's a classification failure."
        },
        {
            "time": "0:15 - 0:35",
            "visual": "A dropdown menu showing '80TTA (Max ₹10,000)' being selected. A buzzer sounds.",
            "audio": "When declaring Fixed Deposit interest, most people default to Section 80TTA, which caps the deduction at just ₹10,000. But if the taxpayer is over 60, they belong in a completely different legal category."
        },
        {
            "time": "0:35 - 0:55",
            "visual": "A golden shield labeled '80TTB' appears, expanding to show 'Max ₹50,000'.",
            "audio": "Section 80TTB. This section specifically grants resident senior citizens a massive ₹50,000 deduction on all deposit interest. But the algorithm won't automatically select it for you. You have to actively choose it."
        },
        {
            "time": "0:55 - 1:15",
            "visual": "A perfectly calculated tax return sliding into a government vault, while a shadow hand steals money.",
            "audio": "If you miss it, the tax system won't throw an error. It accepts the return, perfectly processing the wrong legal identity, and quietly taking more tax than it should. And under the New Tax Regime? You lose this entirely unless you opt out."
        },
        {
            "time": "1:15 - 1:40",
            "visual": "Speaker pointing aggressively to the camera. 'FinSight INDIA' logo appears.",
            "audio": "Stop letting the algorithm decide your taxes. Discover the 5-step classification defense to secure the 80TTB deduction. Read the full Masterclass on FinSight INDIA. Link in bio."
        }
    ]
}

# check if it already exists to prevent duplicates
if not any(s.get("id") == "reel-80ttb" for s in data):
    data.append(new_script)

with open(path, 'w') as f:
    json.dump(data, f, indent=2)

print("Appended successfully")
