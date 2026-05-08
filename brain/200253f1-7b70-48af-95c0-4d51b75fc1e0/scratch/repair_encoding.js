const fs = require('fs');

const buffer = fs.readFileSync('c:\\Users\\comun\\OneDrive\\Documentos\\GitHub\\Protocolo-Recep\\data.js.bak');
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
        // Check if it's a valid UTF-8 start byte
        if ((byte & 0xE0) === 0xC0 && i + 1 < buffer.length && (buffer[i+1] & 0xC0) === 0x80) {
            // 2-byte sequence
            repaired += buffer.slice(i, i + 2).toString('utf8');
            i += 1;
        } else if ((byte & 0xF0) === 0xE0 && i + 2 < buffer.length && (buffer[i+1] & 0xC0) === 0x80 && (buffer[i+2] & 0xC0) === 0x80) {
            // 3-byte sequence
            repaired += buffer.slice(i, i + 3).toString('utf8');
            i += 2;
        } else if ((byte & 0xF8) === 0xF0 && i + 3 < buffer.length && (buffer[i+1] & 0xC0) === 0x80 && (buffer[i+2] & 0xC0) === 0x80 && (buffer[i+3] & 0xC0) === 0x80) {
            // 4-byte sequence
            repaired += buffer.slice(i, i + 4).toString('utf8');
            i += 3;
        } else {
            // Invalid UTF-8 byte, repair if in map, otherwise keep as is (or use ?)
            repaired += repairMap[byte] || '?';
        }
    }
}

fs.writeFileSync('c:\\Users\\comun\\OneDrive\\Documentos\\GitHub\\Protocolo-Recep\\data_repaired.js', repaired, 'utf8');
console.log("Repair completed. Checking for 'Sección'...");
if (repaired.includes('Sección')) console.log("Found Sección!");
if (repaired.includes('Recepción')) console.log("Found Recepción!");
