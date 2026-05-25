const fs = require('fs');

// Read the backup file
const bak = fs.readFileSync('data.js.bak', 'utf8');

// Find the section 1.1 protocol
const idx = bak.indexOf('"section": "1.1"');
console.log('Found at index:', idx);

// Get start of object (find the { before this)
let start = idx;
let depth = 0;
// Go backwards to find the opening {
for (let i = idx; i >= 0; i--) {
    if (bak[i] === '{') {
        start = i;
        break;
    }
}

// Now find the complete object
let end = start;
depth = 0;
for (let i = start; i < bak.length; i++) {
    if (bak[i] === '{') depth++;
    if (bak[i] === '}') {
        depth--;
        if (depth === 0) {
            end = i + 1;
            break;
        }
    }
}

const protocol = bak.substring(start, end);
console.log('\n=== PROTOCOL 1.1 FROM BACKUP ===');
console.log(protocol.substring(0, 500));
console.log('... [' + protocol.length + ' chars total]');

// Save it to a separate file
fs.writeFileSync('scratch/protocol_1_1_backup.json', protocol, 'utf8');
console.log('\nSaved to scratch/protocol_1_1_backup.json');

// Also check its title
const titleMatch = protocol.match(/"title":\s*"([^"]+)"/);
console.log('Title:', titleMatch ? titleMatch[1] : 'NOT FOUND');
