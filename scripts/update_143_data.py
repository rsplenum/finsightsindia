import json
from datetime import datetime

def update_reel_scripts():
    path = "src/data/reel-scripts.json"
    with open(path, "r") as f:
        data = json.load(f)
    
    new_id = f"reel-{int(datetime.now().timestamp())}"
    
    new_reel = {
        "id": new_id,
        "title": "The Section 143(1) TDS Arrears Trap",
        "articleSlug": "the-section-143-1-tds-arrears-demand",
        "duration": "100s",
        "hook": "Did you get a massive tax demand because your employer went bankrupt and stole your TDS? Do not pay it.",
        "script": [
            {
                "time": "0:00 - 0:15",
                "visual": "Speaker holding a glowing red '143(1) Demand Notice' with a shocked expression.",
                "audio": "Did you get a massive tax demand because your old employer went bankrupt and stole your TDS? Do not pay it."
            },
            {
                "time": "0:15 - 0:35",
                "visual": "Screen shows a payslip with 'TDS Deducted: 1 Lakh', then flashes to an empty Form 26AS.",
                "audio": "Here is the trap. The HR department deducts the tax from your salary, but they use the money to keep the company alive instead of depositing it. The income tax algorithm is blind to your payslip. It only reads Form 26AS. If the money isn't there, it assumes you are the one who didn't pay."
            },
            {
                "time": "0:35 - 0:55",
                "visual": "An employee is cornered by a tax official, while a corporate boss sneaks away with a money bag.",
                "audio": "Because the notice comes from the government, most employees assume they are guilty, panic, and pay the demand to avoid trouble. You end up paying your taxes twice while the thief walks free."
            },
            {
                "time": "0:55 - 1:15",
                "visual": "A massive shield labeled 'Section 205' slams down, deflecting the demand back to the boss.",
                "audio": "But there is a specific legal shield for this. Section 205 of the Income Tax Act explicitly states that if the tax was deducted from your income, the government cannot demand it from you again."
            },
            {
                "time": "1:15 - 1:40",
                "visual": "Point to a link on screen. Text: 'Read the full guide on FinSight INDIA'.",
                "audio": "You have to force the Assessing Officer to shift the burden of recovery onto the defaulting employer. Want the exact step-by-step grievance process to freeze this demand? Read the full breakdown on FinSight INDIA."
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
    
    new_id = f"log-{int(datetime.now().timestamp())}"
    
    new_log = {
        "id": new_id,
        "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "message": "Finalized the 'the-section-143-1-tds-arrears-demand' article. Executed a deep, first-principles research teardown before drafting. Molded the narrative strictly around provocative education and awareness of rights (Section 205), avoiding adversarial incitement. Generated bespoke illustrations conforming to the pure white background standard, and appended the 100s Reel script."
    }
    
    data.append(new_log)
    
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print("Updated creator-logs.json")

if __name__ == "__main__":
    update_reel_scripts()
    update_creator_logs()
