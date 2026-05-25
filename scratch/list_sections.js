const fs = require('fs');
const c = fs.readFileSync('data.js', 'utf8');
const ms = [...c.matchAll(/"section":\s*"([^"]+)"/g)];
const secs = [...new Set(ms.map(m => m[1]))].sort();
console.log('Sections found:');
console.log(secs.join('\n'));
console.log('\nTotal unique sections:', secs.length);
