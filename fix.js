const fs = require('fs');
let text = fs.readFileSync('data.js', 'utf8');

// remove tailwind
text = text.split('<script src=\\"https://cdn.tailwindcss.com\\"></script>').join('');

// target formbutton block
const startStr = '/* INTEGRACIÓN FORMBUTTON';
const endStr = '});\\n</script>'; // ensuring we get trailing stuff if needed, but wait it's string literal, the \\n is actually \n

while (true) {
    let startIdx = text.indexOf(startStr);
    if (startIdx === -1) break;
    let postStart = text.slice(startIdx);
    let endIdxOffset = postStart.indexOf('});');
    if (endIdxOffset === -1) break;
    
    let endIdx = startIdx + endIdxOffset + '});'.length;
    // let's go a bit further to include the script tag and formbutton push array if we want, but let's just wipe the whole window.formbutton = ...
    text = text.substring(0, startIdx) + text.substring(endIdx);
}

const configStartStr = '/* CONFIGURACIÓN FORMBUTTON';

while (true) {
    let startIdx = text.indexOf(configStartStr);
    if (startIdx === -1) break;
    let postStart = text.slice(startIdx);
    let endIdxOffset = postStart.indexOf('});');
    if (endIdxOffset === -1) break;
    
    let endIdx = startIdx + endIdxOffset + '});'.length;
    text = text.substring(0, startIdx) + text.substring(endIdx);
}

// remove the script source
text = text.split('<script src=\\"https://formspree.io/js/formbutton-v1.min.js\\" defer></script>').join('');

fs.writeFileSync('data.js', text, 'utf8');
console.log('Done!');
