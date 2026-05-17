const fs = require('fs');

const path = 'data.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix Protocol 2.1 content and add placeholder
// We look for the protocol with section "2.1"
const protocol21Regex = /("section":\s*"2.1"[\s\S]*?"content":\s*`)([\s\S]*?)(`,)/;
content = content.replace(protocol21Regex, (match, p1, p2, p3) => {
    // If it already has the placeholder, don't add it again
    if (p2.includes('{{CHANNELS_EXPLORER}}')) return match;
    
    // Add the placeholder at the end of the content
    return p1 + p2 + '\n\n{{CHANNELS_EXPLORER}}' + p3;
});

// 2. Fix specific Mojibake patterns found in tail output
const replacements = [
    { from: /Y-'\?/g, to: '📂' },
    { from: /'~\?\?/g, to: '' },
    { from: /Y"/g, to: '📂' },
    { from: /YZ/g, to: '🎬' },
    { from: /Y\?/g, to: '📂' },
    { from: /ASIGNACI"N/g, to: 'ASIGNACIÓN' },
    { from: /RECEP"N/g, to: 'RECEPCIÓN' },
    { from: /COMUNICACI"N/g, to: 'COMUNICACIÓN' },
    { from: /INFORMACI"N/g, to: 'INFORMACIÓN' },
    { from: /GESTI"N/g, to: 'GESTIÓN' },
    { from: /"N/g, to: 'ÓN' },
    { from: /"/g, to: 'Ó' },
    { from: /Y/g, to: '📂' }
];

replacements.forEach(r => {
    content = content.replace(r.from, r.to);
});

fs.writeFileSync(path, content, 'utf8');
console.log('Deep clean v3 completed: Protocol 2.1 updated and Mojibake repaired.');
