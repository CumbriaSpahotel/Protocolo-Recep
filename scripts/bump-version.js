const fs = require('fs');
const path = require('path');

// Rutas a los archivos clave
const packagePath = path.join(__dirname, '..', 'package.json');
const registroPath = path.join(__dirname, '..', 'REGISTRO_VERSIONES.md');

// Argumentos: node bump-version.js "Descripción de la mejora" [--patch|--minor|--major] [--modules "Módulo 1, Módulo 2"]
const args = process.argv.slice(2);
let description = 'Mejora y actualización del sistema';
let type = 'patch'; // Por defecto incrementa patch (1.0.0 -> 1.0.1)
let modules = 'General';

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--minor') {
        type = 'minor';
    } else if (arg === '--major') {
        type = 'major';
    } else if (arg === '--patch') {
        type = 'patch';
    } else if (arg === '--modules' && args[i + 1]) {
        modules = args[i + 1];
        i++;
    } else if (!arg.startsWith('--')) {
        description = arg;
    }
}

// 1. Leer package.json
if (!fs.existsSync(packagePath)) {
    console.error('Error: No se encontró package.json');
    process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = pkg.version || '1.0.0';
const parts = currentVersion.split('.').map(Number);

if (parts.length !== 3 || parts.some(isNaN)) {
    console.error(`Error: Formato de versión no válido en package.json (${currentVersion})`);
    process.exit(1);
}

let [major, minor, patch] = parts;

if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
} else if (type === 'minor') {
    minor += 1;
    patch = 0;
} else {
    patch += 1;
}

const newVersion = `${major}.${minor}.${patch}`;
pkg.version = newVersion;

// Guardar package.json actualizado
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

// 2. Formatear Fecha actual (DD/MM/AAAA)
const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const year = now.getFullYear();
const formattedDate = `${day}/${month}/${year}`;

// 3. Actualizar REGISTRO_VERSIONES.md
if (fs.existsSync(registroPath)) {
    let content = fs.readFileSync(registroPath, 'utf8');

    // Reemplazar tabla de versión actual
    content = content.replace(
        /\|\s*\*\*`v[0-9.]+`\*\*\s*\|\s*\*\*[0-9/]+\*\*\s*\|/g,
        `| **\`v${newVersion}\`** | **${formattedDate}** |`
    );

    // Preparar nueva entrada
    const newEntry = `### [v${newVersion}] — ${formattedDate}\n` +
        `- **Módulos Afectados:** ${modules}\n` +
        `- **Tipo de Cambio:** ${type === 'major' ? 'Actualización Mayor' : type === 'minor' ? 'Nueva Característica / Mejora' : 'Mejora / Corrección'}\n` +
        `- **Detalle de Cambios:**\n` +
        `  - ${description}\n\n`;

    // Insertar justo debajo de "## 📝 Historial de Modificaciones del Sistema\n\n"
    const targetHeader = '## 📝 Historial de Modificaciones del Sistema\n\n';
    if (content.includes(targetHeader)) {
        content = content.replace(targetHeader, targetHeader + newEntry);
    } else {
        content += '\n' + newEntry;
    }

    fs.writeFileSync(registroPath, content, 'utf8');
}

console.log(`✅ Versión incrementada automáticamente a v${newVersion} (${formattedDate})`);
console.log(`📝 Registrado en REGISTRO_VERSIONES.md y package.json`);
