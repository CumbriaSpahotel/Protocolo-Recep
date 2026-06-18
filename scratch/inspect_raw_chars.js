const fs = require('fs');
const lines = fs.readFileSync('data.js', 'utf8').split('\n');
const prefix = lines[193].substring(0, 250);
for (let i = 0; i < prefix.length; i++) {
    const char = prefix[i];
    const code = prefix.charCodeAt(i);
    console.log(`${i}: ${char} (code: ${code})`);
}
