const fs = require('fs');
const path = require('path');

const dataPath = 'c:\\Users\\comun\\OneDrive\\Documentos\\GitHub\\Protocolo-Recep\\data.js';
const backupPath = 'c:\\Users\\comun\\OneDrive\\Documentos\\GitHub\\Protocolo-Recep\\data.js.pre_migration.bak';
const tempPath = path.join(__dirname, 'temp_protocols_v4.js');

// 1. Repair Encoding and Read
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
            // Check for valid UTF-8 sequences to avoid double-repairing
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
                // Invalid or single-byte encoding repair
                repaired += repairMap[byte] || '?';
            }
        }
    }
    return repaired;
}

console.log("Reading and repairing data.js...");
let rawContent = getRepairedContent(dataPath);

// Section Mapping for legacy categories
const SectionMap = {
    "1ª Sección": "1",
    "2ª Sección": "2",
    "3ª Sección": "3",
    "4ª Sección": "4",
    "5ª Sección": "5",
    "6ª Sección": "6",
    "7ª Sección": "7",
    "8ª Sección": "8",
    "9ª Sección": "9",
    "10ª Sección": "10",
    "11ª Sección": "11",
    "12ª Sección": "12",
    "13ª Sección": "13",
    "14ª Sección": "14",
    "Campañas": "11",
    "General": "5",
    "Noticias": "11"
};

const PreferredIds = {
    "Registro de incidencias durante la estancia de los clientes": "5.8",
    "Contratos Agencias y las condiciones": "11.1",
    "NEGLIGENCIA EN LA ASIGNACIÓN DE HABITACIONES DE GRUPOS - PROTOCOLO OBLIGATORIO": "5.9"
};

function sanitizeContent(html) {
    if (!html) return '';
    return html
        .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
        .replace(/<html.*?>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<head.*?>/gi, '')
        .replace(/<\/head>/gi, '')
        .replace(/<body.*?>/gi, '')
        .replace(/<\/body>/gi, '')
        .replace(/<meta.*?>/gi, '')
        .replace(/<title.*?>.*?<\/title>/gi, '')
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
        .replace(/<img[\s\S]*?src=["']https:\/\/blogger\.googleusercontent\.com\/[^"'] *?["'][\s\S]*?>/gi, '<!-- Imagen optimizada -->')
        .trim();
}

// 2. Extract parts
const startMarker = 'const protocols_data = ';
const startIndex = rawContent.indexOf(startMarker);
const navMarker = 'const navigation_config';
const navIndex = rawContent.indexOf(navMarker);

if (startIndex === -1 || navIndex === -1) {
    console.error("Markers not found in data.js");
    process.exit(1);
}

const beforeNav = rawContent.substring(0, navIndex);
const lastClosingBracket = beforeNav.lastIndexOf('];');
const protocolsStr = rawContent.substring(startIndex + startMarker.length, lastClosingBracket + 2);

// 3. Parse protocols
console.log("Parsing protocols...");
fs.writeFileSync(tempPath, 'module.exports = ' + protocolsStr);
let protocols = require(tempPath);
if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

console.log(`Loaded ${protocols.length} protocols.`);

// 4. Track highest IDs for auto-incrementing missing ones
const counters = {};
protocols.forEach(p => {
    // Force preferred IDs
    for (const [title, id] of Object.entries(PreferredIds)) {
        if (p.title && p.title.includes(title)) {
            p.section = id;
            break;
        }
    }

    if (p.section) {
        const parts = p.section.split('.');
        const base = parts.slice(0, -1).join('.');
        const last = parseInt(parts[parts.length - 1]);
        if (!isNaN(last)) {
            counters[base] = Math.max(counters[base] || 0, last);
        }
    }
});

// 5. Migrate and Clean
console.log("Migrating and cleaning protocols...");
protocols.forEach(p => {
    // Video Extraction
    if (!p.video_url && p.content) {
        // Match Google Drive iframes
        const iframeMatch = p.content.match(/<iframe.*?src=["'](https:\/\/drive\.google\.com\/[^"']+)["'].*?><\/iframe>/i);
        if (iframeMatch) {
            p.video_url = iframeMatch[1];
            p.video_caption = p.video_caption || "Video Tutorial";
            console.log(`Extracted video for: ${p.title}`);
        }
    }
    
    // HTML Sanitization
    if (p.content) {
        const originalContent = p.content;
        p.content = sanitizeContent(p.content);
        if (originalContent !== p.content) {
            // console.log(`Sanitized content for: ${p.title}`);
        }
    }

    // Section/Category Migration
    if (!p.section) {
        let baseSection = "1";
        if (p.categories && p.categories.length > 0) {
            const cat = p.categories[0];
            baseSection = SectionMap[cat] || "1";
        }
        counters[baseSection] = (counters[baseSection] || 0) + 1;
        p.section = `${baseSection}.${counters[baseSection]}`;
    }

    // Standardize categories based on section
    const mainSection = p.section.split('.')[0];
    p.categories = [`${mainSection}ª Sección`];
});

// 6. Serialize
function serializeProtocol(p) {
    const lines = ['  {'];
    const props = ["title", "section", "source", "status", "published", "updated", "video_url", "video_caption", "isCritical", "isAnnouncement"];
    props.forEach(prop => {
        if (p[prop] !== undefined) {
            lines.push(`    "${prop}": ${JSON.stringify(p[prop])},`);
        }
    });

    if (p.content) {
        // Use backticks for content with newlines or length
        if (p.content.includes('\n') || p.content.length > 60) {
            const escapedContent = p.content.replace(/`/g, '\\`').replace(/\${/g, '\\${');
            lines.push(`    "content": \`${escapedContent}\`,`);
        } else {
            lines.push(`    "content": ${JSON.stringify(p.content)},`);
        }
    }

    if (p.commonErrors && Array.isArray(p.commonErrors)) {
        lines.push(`    "commonErrors": ${JSON.stringify(p.commonErrors, null, 2).split('\n').join('\n    ')},`);
    }

    lines.push(`    "categories": ${JSON.stringify(p.categories, null, 2).split('\n').join('\n    ')}`);
    lines.push('  }');
    return lines.join('\n');
}

const serializedProtocols = 'const protocols_data = [\n' + protocols.map(serializeProtocol).join(',\n') + '\n];';

// 7. Reconstruct file
console.log("Reconstructing data.js...");
const prePart = rawContent.substring(0, startIndex);
const postPart = rawContent.substring(lastClosingBracket + 2);
let newContent = prePart + serializedProtocols + postPart;

// Update home_config alert IDs to match new sections
for (const [title, id] of Object.entries(PreferredIds)) {
    const alertRegex = new RegExp(`("title":\\s*"[^"]*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*",\\s*"date":\\s*"[^"]*",\\s*"id":\\s*")[^"]+(")`, "g");
    newContent = newContent.replace(alertRegex, `$1${id}$2`);
}

fs.writeFileSync(dataPath, newContent, 'utf8');
console.log("\nDone! Migration and deep cleaning completed successfully.");
console.log(`Source: ${dataPath}`);
console.log(`Backup: ${backupPath}`);
console.log(`Total protocols processed: ${protocols.length}`);
