const fs = require('fs');
const path = require('path');

const reels = {
  "capital-markets-ltcg-budget-guide.mdx": `
## The 100-Second Reel

**The Hook:** Did you know you could be paying a massive 12.5% tax on stock gains, even if you just held them for a year?
**The Anxiety:** The old rules are dead. Now, if you sell stocks and make more than ₹1.25 Lakh, the taxman takes a brutal 12.5% cut under the new LTCG rules. 
**The Pivot:** But here’s the loophole: The ₹1.25 Lakh exemption resets every single financial year. You can harvest this tax-free limit annually by selling and immediately rebuying your stocks before March 31st!
**The Relief:** Stop letting your tax-free quota go to waste. Use the FinSight Capital Gains Workbench to mathematically time your exits and save thousands.
`,
  "crypto-tax-forensic-audit-guide.mdx": `
## The 100-Second Reel

**The Hook:** Why are you paying 30% tax on crypto even if you lost all your money overall?
**The Anxiety:** The tax department treats every crypto token in isolation. If you made ₹1 Lakh on Bitcoin and lost ₹2 Lakh on Ethereum, you still owe 30% tax on the Bitcoin gains. You can’t set off losses!
**The Pivot:** The strategy? Stop trading multiple tokens simultaneously if you aren't tracking them meticulously. Use off-ramp strategies and only liquidate winners when you can absorb the massive flat tax hit.
**The Relief:** Don't get caught in a forensic audit trap. Read our complete guide to understand exactly how Section 115BBH tracks your digital footprint.
`,
  "ecommerce-gst-mythbuster-guide.mdx": `
## The 100-Second Reel

**The Hook:** Selling a few T-shirts online? The government could freeze your bank account tomorrow if you don't have this one number.
**The Anxiety:** E-commerce has zero threshold limits. The moment you list a single product on Amazon or Shopify, you are legally required to register for GST. The ₹20 Lakh limit doesn't apply to you.
**The Pivot:** Don't panic. You can apply for a GST number online for free, or you can operate as a casual taxable person if your venture is purely seasonal.
**The Relief:** Avoid the dreaded compliance freeze. Use our FinSight E-Commerce guide to map out exactly what filings you need before making your first sale.
`,
  "fo-trading-loss-setoff-guide.mdx": `
## The 100-Second Reel

**The Hook:** Did you lose ₹5 Lakhs trading options this year? You might be able to wipe out your entire salary tax!
**The Anxiety:** Actually, wait—that’s a myth. The IT department strictly classifies F&O losses as non-speculative business losses, meaning you *cannot* set them off against your salary income!
**The Pivot:** But here is the massive relief: You *can* set them off against rental income, capital gains, or other business income. And even better, you can carry forward these losses for 8 years.
**The Relief:** Stop wasting your losses. File your ITR before the deadline, declare the loss, and carry it forward. Calculate your exact tax shield on FinSight India.
`,
  "foreign-remittance-lrs-tcs-guide.mdx": `
## The 100-Second Reel

**The Hook:** Sending money to your kid studying abroad? The bank just secretly deducted a massive 20% tax from your transfer.
**The Anxiety:** The new LRS rules mandate a brutal 20% Tax Collected at Source (TCS) on foreign remittances. If you send ₹10 Lakhs, ₹2 Lakhs gets trapped by the government!
**The Pivot:** The loophole? Educational remittances backed by a loan only attract a 0.5% TCS. Even for self-funded education, the rate is 5%, and the first ₹7 Lakhs per year is entirely TCS-free!
**The Relief:** TCS isn't an extra tax—it's an advance tax. You can claim it back when filing your ITR. Learn how to navigate the 20% trap using our LRS guide.
`,
  "freelance-export-gst-usd-guide.mdx": `
## The 100-Second Reel

**The Hook:** Getting paid in US Dollars for freelance work? You might be accidentally breaking the law if you aren't generating this one specific document.
**The Anxiety:** Receiving foreign currency isn't just income; it's an "Export of Service." Under GST law, you need a Letter of Undertaking (LUT) to avoid paying an 18% export tax out of your own pocket.
**The Pivot:** File an LUT online before the financial year begins. Then, you can legally export services with 0% GST. Next, use Section 44ADA to slash your taxable income by 50% automatically!
**The Relief:** Don't let compliance fears stop your global hustle. Learn how to map your FIRC documents and zero-rate your GST in our Master Guide.
`,
  "inherited-house-sale-tax-guide.mdx": `
## The 100-Second Reel

**The Hook:** Selling your grandfather's house? You could owe lakhs in taxes on money you never actually made.
**The Anxiety:** When you sell an inherited property, the taxman doesn't care that you got it for free. They calculate tax based on its original purchase price from decades ago, leading to massive Capital Gains.
**The Pivot:** The secret weapon is "Indexation" (if bought before 2001) or reinvestment. You can wipe out the entire tax liability by reinvesting the gains into a new residential property under Section 54, or into 54EC capital gains bonds.
**The Relief:** Protect your generational wealth. Use the FinSight Capital Gains Workbench to calculate exactly how much you need to reinvest to legally drop your tax to zero.
`,
  "missed-itr-deadline-penalty-guide.mdx": `
## The 100-Second Reel

**The Hook:** Missed the July 31st deadline to file your taxes? You might think it's no big deal, but the clock is ticking on a massive financial trap.
**The Anxiety:** If you file a belated return, you face a flat ₹5,000 penalty. But worse, you lose the right to carry forward any stock or business losses to future years. They vanish forever!
**The Pivot:** If you have zero tax liability and income under ₹5 Lakhs, the penalty drops to ₹1,000. Better yet, file a Belated Return before December 31st to at least stop the 1% per month interest bleeding under Section 234A.
**The Relief:** Don't panic, take action. Use our Notice Trap calculator to find out exactly what penalties you owe and file immediately.
`,
  "moonlighting-dual-employment-tax-guide.mdx": `
## The 100-Second Reel

**The Hook:** Working two jobs secretly? Your second employer just snitched on you to your first employer through the tax department.
**The Anxiety:** Your PAN card links everything. When both employers deposit PF or deduct TDS, the data clashes on your Form 26AS. If both employers gave you the ₹75,000 standard deduction, you’ll be hit with a massive tax demand.
**The Pivot:** The safest route? Do not claim the standard deduction or 80C benefits from the second employer. Ask them to deduct TDS at a flat 10% under Section 194J as a consultant, rather than as a full-time employee.
**The Relief:** Stay off the forensic radar. Use our Dual Income calculator to see exactly how your Form 26AS is going to look before the taxman does.
`,
  "new-vs-old-regime-guide.mdx": `
## The 100-Second Reel

**The Hook:** Still clinging to your LIC policies and ELSS funds to save tax? You might be losing money by choosing the Old Tax Regime.
**The Anxiety:** The government desperately wants you in the New Regime. If you earn ₹12 Lakhs and don't have at least ₹3 Lakhs in heavy deductions (Home Loan, 80C, 80D), the Old Regime is mathematically bleeding you dry.
**The Pivot:** The break-even point is brutal. If your income is under ₹12.75 Lakhs, the New Regime makes your tax absolutely ZERO with zero investments required! 
**The Relief:** Stop guessing. Plug your exact salary into the FinSight India Interactive Slab Engine and instantly see which regime saves you more money today.
`,
  "rent-to-parents-hra-exemption-guide.mdx": `
## The 100-Second Reel

**The Hook:** Want to claim HRA but live with your parents? You can legally pay them rent and save lakhs in tax.
**The Anxiety:** But beware—the tax department is cracking down on fake rent receipts. If you just transfer money and don't create a legal trail, they will reject your HRA and slap you with a penalty.
**The Pivot:** The strategy is simple: Create a formal rent agreement, transfer the rent via bank channel every month, and most importantly—your parents MUST declare this rent as income on their own tax returns.
**The Relief:** Turn a family expense into a legal tax shield. Follow our HRA Workbench rules to ensure your rent-to-parents strategy is bulletproof against an audit.
`,
  "startup-esops-double-taxation-guide.mdx": `
## The 100-Second Reel

**The Hook:** Your startup gave you ESOPs worth ₹50 Lakhs? Congratulations, you might owe ₹15 Lakhs in tax before you even sell a single share.
**The Anxiety:** ESOPs are taxed twice! First, when you exercise them (buy the shares), it’s treated as salary, and you pay up to 30% tax on the paper profit. Second, when you sell them, you pay Capital Gains tax.
**The Pivot:** The loophole? If you work for a DPIIT-recognized eligible startup, you can legally defer this massive tax payment for up to 5 years, or until you leave the company!
**The Relief:** Don't let paper wealth ruin your real-world bank account. Use the FinSight ESOP calculator to map out exactly when to exercise your options safely.
`
};

const dir = path.join(__dirname, 'src/content/direct-tax');

Object.keys(reels).forEach(file => {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Ensure we don't append multiple times
    if (!content.includes('## The 100-Second Reel')) {
      content += reels[file];
      fs.writeFileSync(filePath, content);
      console.log(`Appended reel to ${file}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});
