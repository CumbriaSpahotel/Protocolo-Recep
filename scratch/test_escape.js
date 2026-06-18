const raw = `hello
world "test"`;

console.log("RAW:");
console.log(raw);

console.log("STRINGIFIED:");
const stringified = JSON.stringify(raw);
console.log(stringified);

console.log("SLICED:");
const sliced = stringified.slice(1, -1);
console.log(sliced);

const fs = require('fs');
fs.writeFileSync('scratch/test_out.txt', sliced, 'utf8');
console.log("WRITTEN TO scratch/test_out.txt:");
console.log(fs.readFileSync('scratch/test_out.txt', 'utf8'));
