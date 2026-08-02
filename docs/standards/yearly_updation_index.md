# Yearly Updation Master Index (Tax Volatility Dictionary)

This document serves as the master checklist for maintaining the platform's accuracy. Following the presentation of the Union Budget (typically February or July), the maintenance team MUST cross-reference the Finance Bill against this document. 

If any of the variables listed below are amended by the government, they must be immediately updated across all prose `.mdx` files and interactive UI components.

## 1. Income Tax Slab Thresholds & Surcharges
- **New Tax Regime Slabs (Section 115BAC)**: Currently 6 slabs starting from ₹3L, peaking at 30% above ₹15L.
- **Old Tax Regime Slabs**: Currently peaking at 30% above ₹10L.
- **Section 87A Marginal Relief**:
  - *New Regime:* Up to ₹12 Lakhs (Effectively ₹12.75L with Standard Deduction).
  - *Old Regime:* Up to ₹5 Lakhs.
- **Surcharge Rates**: High Net Worth Individual surcharges (currently capped at 25% under the New Regime).

## 2. Standard Deductions & Allowances
- **Salaried Standard Deduction (Section 16(ia))**: Currently ₹75,000 for New Regime, ₹50,000 for Old Regime.
- **Family Pension Standard Deduction**: Currently ₹25,000 or 1/3rd of pension (whichever is lower).
- **Leave Encashment Exemption (Section 10(10AA))**: Currently capped at ₹25 Lakhs for non-government employees.
- **Gratuity Exemption Limit**: Currently capped at ₹20 Lakhs.

## 3. Chapter VI-A Investment Limits (Mostly Old Regime)
- **Section 80C**: Capped at ₹1.5 Lakhs.
- **Section 80D (Health Insurance)**: Capped at ₹25,000 (Non-senior) and ₹50,000 (Senior Citizen).
- **Section 80CCD(1B) (NPS Tier 1)**: Capped at ₹50,000.
- **Section 80CCD(2) (Corporate NPS)**: Capped at 10% of Basic Salary (14% for Govt). *Note: This is one of the few deductions applicable in the New Regime.*
- **Section 24(b) (Home Loan Interest)**: Capped at ₹2 Lakhs for self-occupied properties.

## 4. Capital Gains Rates & Exemptions
- **Section 112A (LTCG on Equities/Mutual Funds)**: Currently 12.5%.
- **Section 112A Tax-Free Limit**: Currently ₹1.25 Lakhs per year.
- **Section 111A (STCG on Equities)**: Currently 20%.
- **Real Estate Indexation**: Monitor rules regarding Section 48 (Currently indexation removed, flat 12.5% rate applies, with grandfathering rules).
- **Section 54/54EC Exemption Caps**: Currently capped at ₹10 Crores and ₹50 Lakhs respectively.

## 5. Penalties, Interest, & Deadlines
- **ITR Filing Deadline (Section 139(1))**: Typically July 31st for non-audit cases.
- **Section 234F (Late Filing Fee)**: Currently ₹1,000 (Income < ₹5L) and ₹5,000 (Income > ₹5L).
- **Section 234A/B/C (Penal Interest)**: Currently 1% per month.
- **TCS on Foreign Remittances (LRS)**: Currently 20% beyond ₹7 Lakhs (for non-education/medical purposes).

## Execution Protocol
When a variable above changes:
1. Update the React/Astro component logic (e.g., `HRAExemptionWorkbench.astro`) to instantly deploy the math globally.
2. Use the codebase search to find all mentions of the affected variable (e.g., `"12.5%"`) or Section (e.g., `"Section 112A"`) in the `src/content/direct-tax/` directory and rewrite the prose.
3. Update the `updatedDate` frontmatter in the affected `.mdx` files to the new Financial Year.
