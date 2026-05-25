const fs = require('fs');
const vm = require('vm');

try {
    const code = fs.readFileSync('data.js', 'utf-8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    console.log("data.js is 100% syntactically correct and loads variables cleanly!");
    console.log("Channels in channels_config:");
    sandbox.channels_config.forEach(c => {
        console.log(`- ${c.name} (${c.id}): htmlContent length = ${c.htmlContent ? c.htmlContent.length : 0}`);
    });
} catch (e) {
    console.error("Syntax or runtime error in data.js:", e);
    process.exit(1);
}
