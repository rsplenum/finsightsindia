import json

def enrich_research_ledger():
    path = "src/data/researchLedger.json"
    with open(path, "r") as f:
        data = json.load(f)
    
    # We prepend the previous version earlier, so it's at index 0. We will overwrite index 0 with enriched data.
    enriched_entry = {
        "slug": "p2p-crypto-bank-freeze-trap",
        "title": "The P2P Crypto Bank Freeze Nightmare",
        "category": "Advanced Markets & Crypto",
        "research": "The P2P Crypto Bank Freeze is not a tax problem; it's a criminal law problem masking as a financial transaction. Under Section 102 of the Code of Criminal Procedure (CrPC) (now Section 106 of BNSS), police can freeze any bank account suspected of holding stolen funds. The trap operates on 'Layering': Layer 1 is the original scam victim. When a crypto trader sells USDT on Binance P2P, the buyer often pays using stolen funds (Layer 2 or Layer 3). Even if the trader is an innocent merchant, when the original victim reports the fraud to the National Cyber Crime Reporting Portal (1930), the police freeze the entire money trail. Because the trader's bank account received the tainted IMPS/UPI, their account is instantly hit with a 'Debit Freeze' across all branches. The trader becomes a collateral suspect in a pan-India cyber fraud investigation.",
        "searchIntent": "Traders wake up to find their entire primary bank account frozen. Search intent is pure panic: 'HDFC account frozen due to crypto', 'Binance P2P cyber cell notice', 'How to unfreeze bank account cyber crime Gujarat', 'Section 102 CrPC bank freeze'. The panic is exacerbated because the FIR is often registered in a completely different state, the bank refuses to provide the FIR details, and the trader is locked out of their salary, EMIs, and rent.",
        "oughtToKnow": "A. The Proportionality Rule (Lien vs Freeze): High Courts (Madras, Delhi) have ruled that freezing an entire account when only a small portion is disputed is arbitrary. Banks should ideally only place a 'Lien' on the specific disputed amount. B. Section 91 vs Section 102: Police often illegally use Section 91 CrPC (request for information) to freeze accounts. Only Section 102 CrPC (now 106 BNSS) authorizes seizure, and it requires mandatory notification to a Magistrate. C. Supreme Court SOP (Aug 2026): The Supreme Court recently directed the RBI to issue a Standard Operating Procedure to stop indiscriminate full-account freezes.",
        "mechanics": "1. The Premium Lure: Trader sells USDT at a 2% premium on Binance P2P to an unverified buyer. 2. The Third-Party Transfer: Buyer pays using a stolen bank account (Layering). 3. The NCRP Report: The original fraud victim dials 1930 to report the scam. 4. The Chain Freeze: Cyber Cell directs banks to freeze all accounts in the money trail under Sec 102 CrPC. 5. The Disproportionate Lockout: Instead of freezing just the ₹50,000 traded, the bank freezes the trader's entire ₹15 Lakh life savings. 6. The Runaround: Bank hands over a generic Cyber Cell email. Emails bounce or are ignored. 7. The Writ Petition: Trader is forced to file an Article 226 Writ Petition in the High Court to release the undisputed funds.",
        "delta": "Safe Trader: Demands Video KYC matching the exact bank account name before releasing crypto, uses a segregated 'burner' bank account exclusively for P2P trades, and knows how to demand a 'Proportionate Lien' instead of a total freeze citing High Court precedents. Trapped Trader: Chases the highest premium blindly, accepts third-party IMPS into their primary salary account, and loses access to their entire net worth over a ₹10,000 crypto trade.",
        "moldingDecisions": "Awaiting user molding for bespoke subheadings and specific article flow."
    }
    
    # Overwrite the first entry (which is the basic one we just added)
    if len(data) > 0 and data[0]["slug"] == "p2p-crypto-bank-freeze-trap":
        data[0] = enriched_entry
    else:
        data.insert(0, enriched_entry)
    
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print("Enriched researchLedger.json")

if __name__ == "__main__":
    enrich_research_ledger()
