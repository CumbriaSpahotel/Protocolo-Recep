const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf8');

const startStr = 'const dynamicExplorer = `';
const startIdx = appJs.indexOf(startStr);
const endIdx = appJs.indexOf('        `;', startIdx);
const templateStr = appJs.substring(startIdx + 24, endIdx + 10);

console.log("START OF TEMPLATE STR:");
console.log(templateStr.substring(0, 100));
console.log("END OF TEMPLATE STR:");
console.log(templateStr.substring(templateStr.length - 100));

try {
    eval(templateStr);
} catch(e) {
    console.log("EVAL ERROR:", e);
}
