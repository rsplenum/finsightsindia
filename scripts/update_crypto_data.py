import json
import os
from datetime import datetime

def update_reel_scripts():
    path = "src/data/reel-scripts.json"
    with open(path, "r") as f:
        data = json.load(f)
    
    # Calculate next ID
    new_id = f"reel-{len(data) + 1:03d}"
    
    new_reel = {
        "id": new_id,
        "title": "The Mid-Year Job Switch Tax Bomb",
        "articleSlug": "mid-year-job-switch-tax-trap",
        "duration": "100s",
        "hook": "Did you switch jobs this year? If you didn't submit this one piece of paper, you might wake up to an ₹80,000 tax demand in July.",
        "script": [
            {
                "time": "0:00 - 0:15",
                "visual": "Speaker holding up a large sign that says 'FORM 12B' while a giant red 'TAX DEMAND' stamp flashes on screen.",
                "audio": "Did you switch jobs this year? If you didn't submit Form 12B to your new HR, you are walking straight into a massive tax trap."
            },
            {
                "time": "0:15 - 0:35",
                "visual": "Diagram showing 'Company A' giving a ₹3 Lakh tax-free limit, and 'Company B' giving the exact same limit again.",
                "audio": "Here is what happens. When you join a new company, their payroll software assumes you had zero income before joining. So, they give you the full ₹3 Lakh tax-free basic exemption limit all over again."
            },
            {
                "time": "0:35 - 0:55",
                "visual": "Screen shows the Income Tax Portal aggregating the two Form 16s and stripping the duplicate exemption, causing the tax bar to skyrocket.",
                "audio": "You enjoy a higher monthly paycheck for the rest of the year. But in July, the Income Tax portal aggregates both of your Form 16s. It spots the duplicate exemption, strips it away, and pushes you into a much higher tax slab."
            },
            {
                "time": "0:55 - 1:15",
                "visual": "A fiery 'Section 234B & 234C' penalty label drops onto the screen.",
                "audio": "The worst part? Because your TDS was artificially low all year, you failed to pay adequate Advance Tax. The portal instantly slaps you with a 1% per month penalty under Sections 234B and 234C."
            },
            {
                "time": "1:15 - 1:40",
                "visual": "Point to a link on screen. Text: 'Read the full guide on FinSight INDIA'.",
                "audio": "Don't let a job switch ruin your July. Want to know exactly how to fill out Form 12B or how to manually pay Advance Tax in March to kill the penalty? Read the full defensive breakdown on FinSight INDIA."
            }
        ]
    }
    
    data.append(new_reel)
    
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print("Updated reel-scripts.json")

def update_creator_logs():
    path = "src/data/creator-logs.json"
    with open(path, "r") as f:
        data = json.load(f)
    
    new_id = f"log-{int(datetime.utcnow().timestamp())}"
    
    new_log = {
        "id": new_id,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "message": "Finalized the 'mid-year-job-switch-tax-trap' article. Implemented the strict 5-step narrative framework focusing on the Form 12B omission, duplicate exemptions, and Section 234B/C penalties. Generated bespoke illustrations with the pure white background standard and appended the 100s Reel script."
    }
    
    data.append(new_log)
    
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print("Updated creator-logs.json")

if __name__ == "__main__":
    update_reel_scripts()
    update_creator_logs()
