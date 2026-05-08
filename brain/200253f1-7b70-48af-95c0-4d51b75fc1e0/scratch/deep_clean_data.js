const fs = require('fs');
const path = 'c:\\Users\\comun\\OneDrive\\Documentos\\GitHub\\Protocolo-Recep\\data.js';

let content = fs.readFileSync(path, 'utf8');

// 1. Extraer vídeos de iframes y ponerlos en video_url si no existe
// Buscamos el patrón de un objeto que tiene content e iframe pero no video_url
const objectRegex = /\{[\s\S]*?"title":\s*"(.*?)"[\s\S]*?"content":\s*[`"]([\s\S]*?)[`"][\s\S]*?\}/g;

content = content.replace(objectRegex, (match) => {
    // Si ya tiene video_url, no hacemos nada con el video pero limpiaremos el content luego
    let driveUrl = null;
    const iframeMatch = match.match(/<iframe.*?src=["'](https:\/\/drive\.google\.com\/[^"']+)["'].*?><\/iframe>/i);
    
    let updatedMatch = match;
    if (iframeMatch && !match.includes('"video_url"')) {
        driveUrl = iframeMatch[1];
        // Insertar video_url después del título
        updatedMatch = updatedMatch.replace(/"title":\s*"(.*?)"/, `"title": "$1",\n    "video_url": "${driveUrl}"`);
    }
    
    return updatedMatch;
});

// 2. Limpieza global de etiquetas basura en todo el archivo (dentro de los strings de content)
// Usamos una función para procesar solo el contenido de las backticks de "content"
content = content.replace(/"content":\s*`([\s\S]*?)`/g, (m, inner) => {
    let clean = inner
        .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
        .replace(/<html.*?>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<head.*?>/gi, '')
        .replace(/<\/head>/gi, '')
        .replace(/<body.*?>/gi, '')
        .replace(/<\/body>/gi, '')
        .replace(/<meta.*?>/gi, '')
        .replace(/<title.*?>.*?<\/title>/gi, '')
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, '') // Quitar iframes ya que ahora van en video_url
        .replace(/<img[\s\S]*?src=["']https:\/\/blogger\.googleusercontent\.com\/[^" Shannon''] *?["'][\s\S]*?>/gi, '<!-- Imagen optimizada -->');
    
    return `"content": \`${clean.trim()}\``;
});

// 3. Lo mismo para los que usan comillas dobles
content = content.replace(/"content":\s*"([\s\S]*?)"/g, (m, inner) => {
    let clean = inner
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
        .replace(/<img[\s\S]*?src=["']https:\/\/blogger\.googleusercontent\.com\/[^" Shannon''] *?["'][\s\S]*?>/gi, '<!-- Imagen optimizada -->');
    
    return `"content": "${clean.trim()}"`;
});

fs.writeFileSync(path, content, 'utf8');
console.log('Saneamiento profundo completado.');
