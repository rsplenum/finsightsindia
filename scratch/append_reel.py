import json

with open('/Users/gaurangbhardwaj/Projects/backup/swp_calculator/src/data/reel-scripts.json', 'r') as f:
    data = json.load(f)

new_reel = {
  "id": "reel-067",
  "title": "The Bonus Stripping Trap in Mutual Funds",
  "articleSlug": "bonus-stripping-trap",
  "duration": "100s",
  "hook": "Think you found a glitch in the tax matrix to get free tax losses from mutual fund bonus issues? Think again. Here is how Section 175 traps you.",
  "script": [
    {
      "time": "0:00 - 0:15",
      "visual": "A person looking at a 'Free Tax Loss' button. When pushed, a steel cage drops down.",
      "audio": "Think you found a glitch in the tax matrix to get free tax losses from mutual fund bonus issues? Think again. The Income Tax Act has a specific trap waiting for you."
    },
    {
      "time": "0:15 - 0:35",
      "visual": "A timeline diagram showing the 3-month Entry Window and 9-month Exit Window.",
      "audio": "It's called the Bonus Stripping Trap. If you buy units within 3 months of a bonus, get the bonus, and sell the original units within 9 months, you trip the wire."
    },
    {
      "time": "0:35 - 0:55",
      "visual": "A balance scale where a heavy 'Tax Loss' weight is teleported by a lightning bolt to the 'Bonus Units' side.",
      "audio": "The law ignores your tax loss completely. Instead, it 'teleports' that loss and turns it into the cost basis of your free bonus units. You haven't lost the deduction, you just deferred it."
    },
    {
      "time": "0:55 - 1:15",
      "visual": "A calendar flipping past 9 months, then a green checkmark appears.",
      "audio": "It's a strict liability rule. It doesn't care if the market crashed or if you needed emergency cash. But there is a way out: simply wait out the 9-month window, or sell everything at once."
    },
    {
      "time": "1:15 - 1:40",
      "visual": "Speaker pointing to screen with FinSight INDIA logo.",
      "audio": "Don't let rigid tax rules nullify your capital losses. Get the full survival guide to Basis Teleportation and Section 175 on FinSight INDIA. Link in bio."
    }
  ]
}

data.append(new_reel)

with open('/Users/gaurangbhardwaj/Projects/backup/swp_calculator/src/data/reel-scripts.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Appended reel successfully!")
