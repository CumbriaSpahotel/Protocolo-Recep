const fs = require('fs');
const c = fs.readFileSync('data.js', 'utf8');

// Find the protocol with section 1.2 to understand the object structure
const idx = c.indexOf('"section": "1.2"');
if (idx === -1) {
    const idx2 = c.indexOf('"section":"1.2"');
    console.log('idx2:', idx2);
} else {
    // Get surrounding context (1000 chars before, 200 after)
    const start = Math.max(0, idx - 1500);
    const end = Math.min(c.length, idx + 200);
    console.log(c.substring(start, end));
}
