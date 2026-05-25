const fs = require('fs');
const c = fs.readFileSync('data.js', 'utf8');

// Find all protocols with their sections and titles
const titleMatches = [...c.matchAll(/"title":\s*"([^"]+)"/g)];
const sectionMatches = [...c.matchAll(/"section":\s*"([^"]+)"/g)];

// Find the full protocol objects by searching for section 1.x
const section1Matches = [...c.matchAll(/"section":\s*"(1\.[^"]+)"/g)];
section1Matches.forEach(m => {
    const idx = m.index;
    // Look backwards for title
    const before = c.substring(Math.max(0, idx - 500), idx);
    const titleMatch = before.match(/"title":\s*"([^"]+)"\s*,?\s*$/);
    const titleMatch2 = [...before.matchAll(/"title":\s*"([^"]+)"/g)].pop();
    console.log(`Section ${m[1]}: ${titleMatch2 ? titleMatch2[1] : 'NO TITLE FOUND'}`);
});

console.log('\n--- Missing from navigation ---');
const navSections = ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6'];
const foundSections = new Set(sectionMatches.map(m => m[1]));
navSections.forEach(s => {
    if (!foundSections.has(s)) {
        console.log(`MISSING: ${s}`);
    }
});
