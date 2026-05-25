const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Colors for terminal output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}=== INICIANDO VALIDACIÓN DE MIGRACIÓN SEGURA (VM) ===${RESET}\n`);

// 1. Load data.js securely and evaluate variables inside a secure Node VM context
const dataContent = fs.readFileSync('data.js', 'utf8');

// Append safe global assignments to expose const/let declarations
const executableContent = dataContent + `
;
if (typeof navigation_config !== 'undefined') global.navigation_config = navigation_config;
if (typeof protocols_data !== 'undefined') global.protocols_data = protocols_data;
`;

const sandbox = {};
sandbox.global = sandbox;
vm.createContext(sandbox);

try {
    vm.runInNewContext(executableContent, sandbox);
    console.log(`${GREEN}✔ Test 1: data.js es JS parseable y se ejecutó de forma aislada en Node VM.${RESET}`);
} catch (e) {
    console.error(`${RED}❌ Test 1 Fallido: data.js tiene errores de sintaxis o ejecución:${RESET}`, e.message);
    process.exit(1);
}

// Extract variables from VM context
const nav = sandbox.navigation_config;
const protocols = sandbox.protocols_data;

if (!nav || !protocols) {
    console.error(`${RED}❌ Error: No se expusieron navigation_config o protocols_data en el contexto.${RESET}`);
    process.exit(1);
}

let errors = 0;

// 2. Validate navigation_config structure
console.log(`\n${BLUE}--- Validando navigation_config ---${RESET}`);
const validTopLevels = Object.keys(nav);
console.log(`Categorías principales encontradas: [${validTopLevels.join(', ')}]`);

const allSectionsMap = new Map(); // Store all section definitions (parent and children)
validTopLevels.forEach(id => {
    allSectionsMap.set(id, { type: 'category', name: nav[id].name });
    if (nav[id].subsections && typeof nav[id].subsections === 'object') {
        Object.entries(nav[id].subsections).forEach(([subId, subName]) => {
            allSectionsMap.set(subId, { type: 'subsection', name: subName, parent: id });
        });
    }
});

// 3. Validate protocols_data (section, duplicates, parents)
console.log(`\n${BLUE}--- Validando protocols_data ---${RESET}`);
const seenSections = new Set();
const seenTitles = new Set();

protocols.forEach((p, idx) => {
    const title = p.title ? p.title.replace(/\{.*?\}/, '').trim() : 'SIN TÍTULO';
    
    // a. Empty section check (N/A check)
    if (!p.section || p.section.trim() === "") {
        console.error(`${RED}❌ Error: Protocolo en índice ${idx} ("${title}") tiene section vacía (N/A).${RESET}`);
        errors++;
        return;
    }

    const sec = p.section.trim();

    // b. Duplicate section check
    if (seenSections.has(sec)) {
        console.error(`${YELLOW}⚠️ Advertencia: Sección duplicada "${sec}" detectada en protocolo "${title}".${RESET}`);
    }
    seenSections.add(sec);

    // c. Duplicate title check
    if (seenTitles.has(title)) {
        console.warn(`${YELLOW}⚠️ Advertencia: Título duplicado "${title}" (Sección ${sec}).${RESET}`);
    }
    seenTitles.add(title);

    // d. Parent exist check and valid hierarchy
    const parts = sec.split('.');
    
    // Check main parent category (first part of section must exist in nav)
    const mainCat = parts[0];
    if (!nav[mainCat]) {
        console.error(`${RED}❌ Error: Sección "${sec}" en "${title}" apunta a la categoría principal "${mainCat}" que NO existe en el menú.${RESET}`);
        errors++;
    }

    // Check ancestors exist
    if (parts.length > 2) {
        // e.g. for "3.4.2", parent is "3.4"
        const parentId = parts.slice(0, parts.length - 1).join('.');
        const parentRecord = allSectionsMap.get(parentId);
        
        if (!parentRecord) {
            console.warn(`${YELLOW}⚠️ Aviso: Protocolo "${title}" tiene sección "${sec}" pero su sección superior "${parentId}" no está registrada explícitamente en navigation_config.subsections.${RESET}`);
        }
    }
});

// 4. Validate Synchronization (app.js and admin.js vs data.js)
console.log(`\n${BLUE}--- Validando sincronía con app.js y admin.js ---${RESET}`);
const appJsContent = fs.readFileSync('app.js', 'utf8');
const adminJsContent = fs.readFileSync('admin.js', 'utf8');

// Extract DEFAULT_CAT_MAP from app.js using regex
const appMapMatch = appJsContent.match(/const DEFAULT_CAT_MAP = ({[\s\S]*?});/);
if (appMapMatch) {
    try {
        const sandboxApp = {};
        vm.createContext(sandboxApp);
        vm.runInNewContext(`const DEFAULT_CAT_MAP = ${appMapMatch[1]}; this.DEFAULT_CAT_MAP = DEFAULT_CAT_MAP;`, sandboxApp);
        const appMap = sandboxApp.DEFAULT_CAT_MAP;
        
        const appKeys = Object.keys(appMap).sort().join(',');
        const dataKeys = Object.keys(nav).sort().join(',');
        
        if (appKeys !== dataKeys) {
            console.error(`${RED}❌ Inconsistencia: DEFAULT_CAT_MAP en app.js tiene claves [${appKeys}] pero navigation_config en data.js tiene [${dataKeys}].${RESET}`);
            errors++;
        } else {
            console.log(`${GREEN}✔ DEFAULT_CAT_MAP en app.js está alineado con data.js.${RESET}`);
        }
    } catch (e) {
        console.error(`${RED}❌ Error parseando DEFAULT_CAT_MAP en app.js:${RESET}`, e.message);
        errors++;
    }
} else {
    console.error(`${RED}❌ No se encontró DEFAULT_CAT_MAP en app.js.${RESET}`);
    errors++;
}

// Extract defaultNav from admin.js using regex
const adminNavMatch = adminJsContent.match(/const defaultNav = ({[\s\S]*?});/);
if (adminNavMatch) {
    try {
        const sandboxAdmin = {};
        vm.createContext(sandboxAdmin);
        vm.runInNewContext(`const defaultNav = ${adminNavMatch[1]}; this.defaultNav = defaultNav;`, sandboxAdmin);
        const adminMap = sandboxAdmin.defaultNav;
        
        const adminKeys = Object.keys(adminMap).sort().join(',');
        const dataKeys = Object.keys(nav).sort().join(',');
        
        if (adminKeys !== dataKeys) {
            console.error(`${RED}❌ Inconsistencia: defaultNav en admin.js tiene claves [${adminKeys}] pero navigation_config en data.js tiene [${dataKeys}].${RESET}`);
            errors++;
        } else {
            console.log(`${GREEN}✔ defaultNav en admin.js está alineado con data.js.${RESET}`);
        }
    } catch (e) {
        console.error(`${RED}❌ Error parseando defaultNav en admin.js:${RESET}`, e.message);
        errors++;
    }
} else {
    console.error(`${RED}❌ No se encontró defaultNav en admin.js.${RESET}`);
    errors++;
}

// 5. Validate Font Awesome icons
console.log(`\n${BLUE}--- Validando iconos de Font Awesome ---${RESET}`);
const standardIcons = ['fa-calendar-check', 'fa-walking', 'fa-desktop', 'fa-users-cog', 'fa-shield-alt', 'fa-book', 'fa-thumbs-up', 'fa-sync-alt', 'fa-newspaper', 'fa-utensils', 'fa-book-reader', 'fa-trophy', 'fa-user-tie', 'fa-spa'];
validTopLevels.forEach(id => {
    const icon = nav[id].icon;
    if (icon.startsWith('fa-')) {
        if (!standardIcons.includes(icon)) {
            console.warn(`${YELLOW}⚠️ Aviso: Icono "${icon}" de la categoría "${nav[id].name}" no está en la lista de prueba (asegúrate de que exista en Font Awesome 6.x).${RESET}`);
        } else {
            console.log(`Icono de categoría "${nav[id].name}" es correcto: ${icon}`);
        }
    } else if (icon.startsWith('http') || icon.startsWith('assets/')) {
        console.log(`Categoría "${nav[id].name}" usa imagen: ${icon}`);
    } else {
        console.warn(`${YELLOW}⚠️ Aviso: Icono "${icon}" de la categoría "${nav[id].name}" no tiene prefijo "fa-".${RESET}`);
    }
});

console.log(`\n${BLUE}=== RESULTADO GLOBAL DE LA COMPROBACIÓN ===${RESET}`);
if (errors === 0) {
    console.log(`${GREEN}✔ Éxito: 0 errores críticos encontrados. La estructura está sana para continuar.${RESET}\n`);
} else {
    console.error(`${RED}❌ Error: Se encontraron ${errors} errores críticos. Corrige las inconsistencias antes de la migración.${RESET}\n`);
    process.exit(1);
}
