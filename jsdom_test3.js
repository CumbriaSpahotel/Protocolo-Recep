const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf8');

const startStr = 'const dynamicExplorer = `';
const startIdx = appJs.indexOf(startStr);
const endIdx = appJs.indexOf('        `;', startIdx);
const templateStr = appJs.substring(startIdx + 24, endIdx + 10);

const relevantChannels = [
    { id: '1', name: 'Test', hotel: 'Ambos hoteles', icon: '🏨', isGift: false }
];
const config = { id: '1', icon: 'H', name: 'N', isGift: false, summary: 'S', content: 'C', notes: 'N', errors: 'E' };

let evaluatedStr = '';
try {
    evaluatedStr = eval(templateStr);
} catch(e) {
    console.log("EVAL ERROR:", e);
    process.exit(1);
}

const scriptMatch = evaluatedStr.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
    console.log("NO SCRIPT");
    process.exit(1);
}

const oldScriptContent = scriptMatch[1];
const finalScriptText = `(function(){\n try {\n${oldScriptContent}\n} catch(e) { console.warn("Error ejecutando script del protocolo:", e); }\n})();`;

fs.writeFileSync('final_script_text.js', finalScriptText);
console.log("Wrote final_script_text.js");

try {
    new Function(finalScriptText);
    console.log("SYNTAX VALID");
} catch(e) {
    console.log("SYNTAX ERROR:", e);
}
