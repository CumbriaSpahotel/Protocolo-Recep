const fs = require('fs');
const appJs = fs.readFileSync('app.js', 'utf8');

const dynamicStart = appJs.indexOf('const dynamicExplorer = `');
if (dynamicStart === -1) process.exit(1);

let scriptText = '';
const lines = appJs.split('\n');
let inScript = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<!-- Logic Injection -->')) {
        inScript = true;
        continue;
    }
    if (inScript && lines[i].includes('</script>')) {
        break;
    }
    if (inScript && !lines[i].includes('<script>')) {
        scriptText += lines[i] + '\n';
    }
}

fs.writeFileSync('test_script.js', scriptText);
console.log('Done writing test_script.js');
