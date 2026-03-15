const fs = require('fs');

const data = fs.readFileSync('data.js', 'utf8');
const match = data.match(/const protocols_data = (\[.*\]);/s);

if (match) {
    let jsonStr = match[1];
    if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
    const protocols = JSON.parse(jsonStr);
    
    let externalLinks = new Set();
    let hasScript = 0;
    
    protocols.forEach(p => {
        // Collect external links
        const hrefMatches = p.content.match(/href=["'](https?:\/\/[^"']+)["']/g);
        if (hrefMatches) {
            hrefMatches.forEach(m => {
                const url = m.match(/href=["'](.*)["']/)[1];
                if (url.includes('blogspot.com')) externalLinks.add(url);
            });
        }
        
        // Find visible JS code (e.g., zoom de imágenes, Scroll suave)
        if (p.content.includes('Scroll suave a anclas') || p.content.includes('<script')) {
            hasScript++;
        }
    });

    console.log("External blogspot links found:", externalLinks.size);
    Array.from(externalLinks).slice(0, 10).forEach(url => console.log(url));
    console.log("Protocols with scripts/raw JS:", hasScript);
}
