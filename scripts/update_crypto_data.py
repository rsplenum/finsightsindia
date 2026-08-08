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
        "title": "The P2P Crypto Bank Freeze Trap",
        "articleSlug": "p2p-crypto-bank-freeze-trap",
        "duration": "100s",
        "hook": "Selling USDT on Binance? You might wake up to find your entire bank account frozen by the Cyber Cell.",
        "script": [
            {
                "time": "0:00 - 0:15",
                "visual": "Speaker holding a phone showing 'Binance P2P Success' while standing next to an ATM with police tape on it.",
                "audio": "Selling USDT on Binance? You might wake up tomorrow to find your entire salary account frozen by the Cyber Cell."
            },
            {
                "time": "0:15 - 0:35",
                "visual": "Diagram showing a scammer stealing money from a victim and immediately using it to buy crypto from the trader.",
                "audio": "Here is the trap: Scammers steal money from a victim, then use that stolen money to buy your crypto on P2P to wash it. When the victim files a police report, the police trace the money directly to you."
            },
            {
                "time": "0:35 - 0:55",
                "visual": "Screen shows a 10,000 rupee trade freezing a 15 Lakh rupee account balance.",
                "audio": "The worst part? Even if you only sold 10,000 rupees of crypto, the bank will often lazily freeze your entire life savings. You can't pay rent. You can't pay your EMIs."
            },
            {
                "time": "0:55 - 1:15",
                "visual": "Speaker holding a burner phone/debit card. Text says 'Burner Account'.",
                "audio": "How do you protect yourself? Never accept third-party transfers, demand Video KYC, and most importantly... keep a separate burner bank account strictly for P2P trading."
            },
            {
                "time": "1:15 - 1:40",
                "visual": "Point to a link on screen. Text: 'Read the full guide on FinSight INDIA'.",
                "audio": "Want to know how to use High Court rulings to unfreeze your money if you get caught? Read the full defensive breakdown on FinSight INDIA."
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
        "message": "Finalized the 'p2p-crypto-bank-freeze-trap' article using the strict Swarm-Draft-Mold workflow. Executed deep legal research into CrPC Section 102 and High Court proportionality rulings before drafting. Generated bespoke spot illustrations matching the pure white background standard, and appended the 100s reel script."
    }
    
    data.append(new_log)
    
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print("Updated creator-logs.json")

if __name__ == "__main__":
    update_reel_scripts()
    update_creator_logs()
