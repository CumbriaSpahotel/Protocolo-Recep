const fs = require('fs');
const lines = fs.readFileSync('data.js', 'utf8').split('\n');
console.log("Line 194 prefix:");
console.log(lines[193].substring(0, 300));
