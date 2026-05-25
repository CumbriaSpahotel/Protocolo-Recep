const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const appJs = fs.readFileSync('app.js', 'utf8');

// Find the start and end of dynamicExplorer string in app.js
const startStr = 'const dynamicExplorer = `';
const startIdx = appJs.indexOf(startStr);
const endIdx = appJs.indexOf('        `;', startIdx);
const templateStr = appJs.substring(startIdx + 24, endIdx + 10);

// Emulate the browser's template literal evaluation
// Since templateStr has ${...} which we don't have defined, we'll replace them with dummy values
// Actually, we can just replace all `${` with `DUMMY_VAR_` so eval doesn't throw ReferenceError
let safeTemplateStr = templateStr.replace(/\$\{/g, 'DUMMY_VAR_{');

let evaluatedStr = '';
try {
    evaluatedStr = eval(safeTemplateStr);
} catch(e) {
    console.log("Error evaluating:", e);
}

// Now we have the exact HTML string that dynamicExplorer would produce
// Put it into a JSDOM instance to emulate innerHTML parsing
const dom = new JSDOM(`<body><div id="mainColumn"></div></body>`);
const document = dom.window.document;
const mainColumn = document.getElementById('mainColumn');

mainColumn.innerHTML = evaluatedStr;

// Now get the script content exactly like the browser
const scripts = mainColumn.querySelectorAll('script');
if (scripts.length === 0) {
    console.log("No script found!");
    process.exit(1);
}

const oldScriptContent = scripts[0].textContent;

// Now create the new script text exactly like loadProtocol
const finalScriptText = `(function(){\n try {\n${oldScriptContent}\n} catch(e) { console.warn("Error ejecutando script del protocolo:", e); }\n})();`;

fs.writeFileSync('final_script_text.js', finalScriptText);
console.log("Wrote final_script_text.js");

// Now check syntax
try {
    new Function(finalScriptText);
    console.log("SYNTAX IS VALID!");
} catch (e) {
    console.log("SYNTAX ERROR FOUND!");
    console.log(e);
}
