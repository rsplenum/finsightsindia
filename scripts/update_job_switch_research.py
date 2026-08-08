import json

def add_job_switch_research():
    path = "src/data/researchLedger.json"
    with open(path, "r") as f:
        data = json.load(f)
    
    new_entry = {
        "slug": "mid-year-job-switch-tax-trap",
        "title": "The Mid-Year Job Switch Tax Bomb",
        "category": "Salaried Professionals & HR Traps",
        "research": "When an employee switches jobs mid-year, they must declare their previous income to the new employer using Form 12B (Rule 26A of the Income Tax Rules). If they fail to do this, Employer B treats their salary from the joining date to March 31st as their *only* income for the entire financial year. Consequently, Employer B applies the Basic Exemption Limit (₹3 Lakhs) and the Standard Deduction all over again. Since Employer A already gave the employee these exemptions, the employee effectively claims the basic exemption limit *twice* during the year. This artificially lowers their monthly TDS, leading to slightly higher in-hand pay, which the employee assumes is correct.",
        "searchIntent": "In July, when filing the ITR, the portal aggregates both Form 16s. The system strips the duplicate exemptions and pushes the combined income into a much higher tax bracket. The user is slapped with a massive tax demand. Search intent: 'Why do I owe tax with two Form 16s?', 'Huge tax demand after job change', 'Section 234B and 234C interest on salary'. The shock is that salaried employees assume their HR takes care of all tax, so receiving a ₹60,000 demand feels like a system error.",
        "oughtToKnow": "A. The Form 12B Mandate: It is the employee's legal responsibility to submit Form 12B; HR will not chase you for it. B. The Section 234B/C Penalty: Because the TDS was short-deducted, the employee failed to pay adequate 'Advance Tax' by March 15th, triggering 1% per month penal interest on the shortfall. C. The AIS Aggregation: The Annual Information Statement (AIS) perfectly tracks both employer TDS deposits, making it impossible to hide the previous salary.",
        "mechanics": "1. The Switch: Employee leaves Company A in August and joins Company B in September. 2. The Omission: Employee skips the 'Previous Income' section during Company B's onboarding. 3. The Double Exemption: Company B calculates TDS assuming a 7-month total annual income, granting a fresh ₹3L exemption. 4. The False Wealth: Employee enjoys lower TDS and higher in-hand salary for 7 months. 5. The July Shock: At ITR filing, the portal aggregates ₹8L (Comp A) + ₹10L (Comp B) = ₹18L total income, stripping the duplicate exemption. 6. The Penalty: Employee owes ₹80,000 in tax shortfall PLUS ₹5,000 in penal interest.",
        "delta": "Safe Employee: Submits Form 12B to the new HR in the first week, absorbing a slightly higher monthly TDS but ensuring zero tax liability in July. Trapped Employee: Ignores Form 12B, enjoys the temporary cash flow bump, and faces a massive, unfunded ₹85,000 tax demand right when they are trying to pay children's school fees in July.",
        "moldingDecisions": "Awaiting user molding for bespoke subheadings and specific article flow."
    }
    
    data.insert(0, new_entry)
    
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print("Updated researchLedger.json with Job Switch Trap")

if __name__ == "__main__":
    add_job_switch_research()
