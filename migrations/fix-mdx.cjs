const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'src', 'content', 'direct-tax');
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'));

files.forEach(file => {
    const filePath = path.join(contentDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Prepend '## ' to '1. Executive Summary' if missing
    content = content.replace(/^1\. Executive Summary/m, '## 1. Executive Summary');

    // 2. Add import for NoticeTrap if warning blocks exist but import is missing
    if (content.includes('> [!WARNING]') && !content.includes('NoticeTrap.astro')) {
        content = content.replace(/---\n\n/, "---\n\nimport NoticeTrap from '../../components/mdx/NoticeTrap.astro';\n\n");
    }

    // 3. Convert > [!WARNING] blocks to <NoticeTrap>
    const blockquoteRegex = /(?:^> .*\n?)+/gm;
    content = content.replace(blockquoteRegex, (match) => {
        if (!match.includes('[!WARNING]')) return match;
        
        let lines = match.split('\n').filter(l => l.trim() !== '');
        // Extract title from the first line
        let firstLine = lines[0].replace('> [!WARNING]', '').trim();
        let title = firstLine;
        
        let body = lines.slice(1).map(l => {
            let text = l.replace(/^>\s?/, '');
            return `<p>${text}</p>`;
        }).join('\n');

        return `<NoticeTrap title="${title}">\n${body}\n</NoticeTrap>\n\n`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
});
