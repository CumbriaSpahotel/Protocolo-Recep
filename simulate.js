const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');

const startStr = 'const dynamicExplorer = `';
const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf('        `;', startIdx);
if (startIdx === -1 || endIdx === -1) {
    console.log("Could not find dynamicExplorer");
    process.exit(1);
}

const templateStr = code.substring(startIdx + 24, endIdx + 1); // Extract ` ... `
let evaluatedStr = '';
try {
    evaluatedStr = eval(templateStr);
} catch(e) {
    console.log("Error evaluating template literal:", e);
    process.exit(1);
}

const scriptMatch = evaluatedStr.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
    const oldScriptContent = scriptMatch[1];
    const newScriptContent = `(function(){\n try {\n${oldScriptContent}\n} catch(e) { console.warn("Error ejecutando script del protocolo:", e); }\n})();`;
    
    fs.writeFileSync('browser_evaluated_script.js', newScriptContent);
    console.log("Wrote browser_evaluated_script.js");
} else {
    console.log("No <script> found inside dynamicExplorer");
}
