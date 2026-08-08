import json
from datetime import datetime

def update_research_ledger():
    path = "src/data/researchLedger.json"
    with open(path, "r") as f:
        data = json.load(f)
    
    new_entry = {
        "slug": "p2p-crypto-bank-freeze-trap",
        "title": "The P2P Crypto Bank Freeze Nightmare",
        "category": "Advanced Markets & Crypto",
        "research": "The P2P Crypto Bank Freeze is not a tax problem; it's a criminal law problem masking as a financial transaction. Under Section 102 of the Code of Criminal Procedure (CrPC) (now Section 106 of BNSS), police can freeze any bank account suspected of holding stolen funds. When a crypto trader sells USDT on Binance P2P to an unverified buyer, that buyer often pays using money stolen from a cyber-fraud victim (like a phishing scam). When the victim reports the fraud to the National Cyber Crime Reporting Portal, the police freeze the entire money trail. Because the trader's bank account received the stolen funds via IMPS/UPI, their account is instantly frozen across all branches in India. The trader becomes a collateral suspect in a pan-India cyber fraud investigation.",
        "searchIntent": "Traders wake up to find their entire primary bank account frozen. Search intent is pure panic: 'HDFC account frozen due to crypto', 'Binance P2P cyber cell notice', 'How to unfreeze bank account cyber crime Gujarat'. The panic is exacerbated because the police FIR is often registered in a completely different state (e.g., a trader in Delhi gets their account frozen by Cyber Cell in Kerala), and the bank refuses to provide the FIR details, leaving the trader unable to pay EMIs, rent, or access their salary.",
        "oughtToKnow": "A. The Third-Party Transfer Trap: The buyer's Binance name does not match their bank account name. B. The Lien Marking vs. Total Freeze: Some banks freeze the specific disputed amount (Lien), while others freeze the entire account indefinitely. C. The Section 102 CrPC (or Section 106 BNSS) Authority: The bank is legally helpless; only the Investigating Officer (IO) who froze it can unfreeze it. D. The Chain Reaction: If the trader moved that money to their spouse's account, the spouse's account will also be frozen.",
        "mechanics": "1. The Premium Lure: Trader sees USDT selling at a 2% premium on Binance P2P. 2. The Unverified Buyer: Buyer initiates trade but pays using a third-party bank account. 3. The Fraud Report: The actual owner of the stolen funds files an FIR on the Cyber Crime portal. 4. The Chain Freeze: Cyber Cell directs banks to freeze all accounts in the money trail. 5. The Silent Lockout: Trader's debit card declines, net banking shows 'Debit Freeze'. 6. The Runaround: Bank refuses to help, hands over a generic Cyber Cell email address. 7. The Extortion Phase: Trader is forced to travel states or hire expensive lawyers just to unfreeze their own legitimate money.",
        "delta": "Safe Trader: Refuses any third-party transfers, demands video KYC before releasing crypto, trades only with verified merchants, and keeps a completely separate bank account solely for P2P transactions to protect their main salary/EMI account. Trapped Trader: Chases the highest premium blindly, accepts IMPS from unknown third parties into their primary salary account, and ends up with zero liquidity and a potential PMLA (Prevention of Money Laundering Act) headache.",
        "moldingDecisions": "Awaiting user molding for bespoke subheadings and specific article flow."
    }
    
    # Prepend to keep latest at top
    data.insert(0, new_entry)
    
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print("Updated researchLedger.json")

if __name__ == "__main__":
    update_research_ledger()
