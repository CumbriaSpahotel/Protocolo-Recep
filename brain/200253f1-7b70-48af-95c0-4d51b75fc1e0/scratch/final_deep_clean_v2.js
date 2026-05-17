const fs = require('fs');

const dataPath = 'c:\\Users\\comun\\OneDrive\\Documentos\\GitHub\\Protocolo-Recep\\data.js';

function getRepairedContent(filePath) {
    const buffer = fs.readFileSync(filePath);
    const repairMap = {
        0xE1: 'á', 0xE9: 'é', 0xED: 'í', 0xF3: 'ó', 0xFA: 'ú', 0xF1: 'ñ',
        0xC1: 'Á', 0xC9: 'É', 0xCD: 'Í', 0xD3: 'Ó', 0xDA: 'Ú', 0xD1: 'Ñ',
        0xAA: 'ª', 0xBA: 'º', 0xBF: '¿', 0xA1: '¡'
    };

    let repaired = '';
    for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        if (byte <= 127) {
            repaired += String.fromCharCode(byte);
        } else {
            if ((byte & 0xE0) === 0xC0 && i + 1 < buffer.length && (buffer[i+1] & 0xC0) === 0x80) {
                repaired += buffer.slice(i, i + 2).toString('utf8');
                i += 1;
            } else if ((byte & 0xF0) === 0xE0 && i + 2 < buffer.length && (buffer[i+1] & 0xC0) === 0x80 && (buffer[i+2] & 0xC0) === 0x80) {
                repaired += buffer.slice(i, i + 3).toString('utf8');
                i += 2;
            } else if ((byte & 0xF8) === 0xF0 && i + 3 < buffer.length && (buffer[i+1] & 0xC0) === 0x80 && (buffer[i+2] & 0xC0) === 0x80 && (buffer[i+3] & 0xC0) === 0x80) {
                repaired += buffer.slice(i, i + 4).toString('utf8');
                i += 3;
            } else {
                repaired += repairMap[byte] || '?';
            }
        }
    }
    return repaired;
}

console.log("Reading and repairing data.js...");
let content = getRepairedContent(dataPath);

console.log("Performing global deep cleaning (fixed regex)...");
const originalLength = content.length;

content = content
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<html.*?>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head.*?>/gi, '')
    .replace(/<\/head>/gi, '')
    .replace(/<body.*?>/gi, '')
    .replace(/<\/body>/gi, '')
    .replace(/<meta\s+[^>]*>/gi, '')
    .replace(/<title>.*?<\/title>/gi, '')
    // FIXED REGEX for blogger images
    .replace(/<img[\s\S]*?src=["']https:\/\/blogger\.googleusercontent\.com\/[^"']*?["'][\s\S]*?>/gi, '<!-- Imagen optimizada -->');

console.log(`Cleaned ${originalLength - content.length} characters of bloat.`);

// Fix Mojibake
const mojibakeCountBefore = (content.match(/Ã[¡©­³º±?]/g) || []).length;
content = content
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã\?/g, 'Ñ');

fs.writeFileSync(dataPath, content, 'utf8');
console.log("Deep cleaning completed successfully.");
