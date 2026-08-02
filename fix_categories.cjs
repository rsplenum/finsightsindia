const fs = require('fs');
const path = require('path');

const dir = 'src/content/direct-tax';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/category: ['"]capital-markets['"]/g, 'category: "gains"');
  content = content.replace(/category: ['"]small-business['"]/g, 'category: "tds"');
  content = content.replace(/category: ['"]freelancers['"]/g, 'category: "tds"');
  content = content.replace(/category: ['"]gst-compliance['"]/g, 'category: "tds"');
  content = content.replace(/category: ['"]capital-gains['"]/g, 'category: "gains"');
  content = content.replace(/category: ['"]penalties['"]/g, 'category: "tds"');
  content = content.replace(/category: ['"]salaried['"]/g, 'category: "slabs"');
  
  fs.writeFileSync(filePath, content);
});
console.log('Categories fixed!');
