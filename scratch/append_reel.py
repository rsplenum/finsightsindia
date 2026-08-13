import json
import os

filepath = "src/data/reel-scripts.json"

with open(filepath, 'r') as f:
    data = json.load(f)

new_id = f"reel-{len(data) + 1:03d}"

new_reel = {
  "id": new_id,
  "title": "The Cash Token Advance Penalty",
  "articleSlug": "section-269ss-cash-token-property-advance-penalty",
  "duration": "100s",
  "hook": "You gave a ₹50,000 cash token to lock a property deal. It felt harmless. But the Income Tax department is about to hit you with a 100% flat penalty.",
  "script": [
    {
      "time": "0:00 - 0:15",
      "visual": "A handshake over a ₹50,000 cash stack. A red stamp crashes down labeled 'SECTION 271D'.",
      "audio": "You gave a ₹50,000 cash token to lock a property deal. It felt completely harmless and off the books. But the Income Tax department is about to hit you with a 100% flat penalty."
    },
    {
      "time": "0:15 - 0:35",
      "visual": "A calendar flipping to June 2015. The words 'Specified Sum' appear over a house.",
      "audio": "Back in 2015, the government changed the law. Any cash advance of ₹20,000 or more related to a property transfer became illegal under Section 269SS. It doesn't matter if you call it a token, bayana, or booking amount."
    },
    {
      "time": "0:35 - 0:55",
      "visual": "A ₹50,000 cash stack instantly duplicated into a ₹50,000 red penalty bill.",
      "audio": "And the penalty? It isn't a percentage of tax. It is exactly 100% of the cash accepted. Take 50,000 in cash? You owe 50,000 in penalty. And the deal doesn't even need to be registered for them to catch you."
    },
    {
      "time": "0:55 - 1:20",
      "visual": "The deal cancels, the cash is handed back, and a SECOND red stamp labeled '271E' crashes down.",
      "audio": "But here is the real trap. What if the deal falls through and you return the cash? Refunding that cash token triggers Section 269T. That brings a SECOND 100% penalty. You just lost double the money on a cancelled deal."
    },
    {
      "time": "1:20 - 1:40",
      "visual": "Speaker pointing to screen. FinSight INDIA logo.",
      "audio": "Stop using cash for property tokens. Use NEFT, use UPI, or use Cheques. Want the full survival playbook for property advances? Link in bio to read on FinSight INDIA."
    }
  ]
}

data.append(new_reel)

with open(filepath, 'w') as f:
    json.dump(data, f, indent=2)

print(f"Appended {new_id} to reel-scripts.json")
