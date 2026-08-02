const fs = require('fs');
const path = require('path');

const dir = 'src/content/direct-tax';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));

const replacements = {
  'capital-markets-ltcg-budget-guide.mdx': '5. The Brutal Fine Print (Edge Cases)',
  'crypto-tax-forensic-audit-guide.mdx': '5. The Interrogation Room (Forensic Edge Cases)',
  'ecommerce-gst-mythbuster-guide.mdx': '5. The "Wait, What If...?" Scenarios',
  'fo-trading-loss-setoff-guide.mdx': '5. The Margin Call (Trading Edge Cases)',
  'foreign-remittance-lrs-tcs-guide.mdx': '5. Customs & Border Checks (The 360° Edge Cases)',
  'freelance-export-gst-usd-guide.mdx': '5. The Freelancer\'s Paranoia Checklist',
  'inherited-house-sale-tax-guide.mdx': '5. Family Feuds & Complex Scenarios',
  'missed-itr-deadline-penalty-guide.mdx': '5. The "My Dog Ate My ITR" Scenarios',
  'moonlighting-dual-employment-tax-guide.mdx': '5. The HR Nightmare Scenarios',
  'new-vs-old-regime-guide.mdx': '5. The Number Cruncher\'s Dilemmas',
  'rent-to-parents-hra-exemption-guide.mdx': '5. The Family Dinner Awkward Questions',
  'startup-esops-double-taxation-guide.mdx': '5. The Founder\'s Trap (ESOP Edge Cases)'
};

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (replacements[file]) {
    content = content.replace(/5\. Am I leaving anything out\? \(The 360° Edge Cases\)/g, replacements[file]);
    fs.writeFileSync(filePath, content);
  }
});
console.log('Headers replaced!');
