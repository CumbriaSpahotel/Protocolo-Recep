const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.js');
let dataContent = fs.readFileSync(dataPath, 'utf8');

const target = 'data:image/png;base64,/9j/4AAQSk...';
const replacement = 'https://placehold.co/800x400?text=Configuracion+Grabacion+Onity';

if (dataContent.includes(target)) {
    dataContent = dataContent.replaceAll(target, replacement);
    fs.writeFileSync(dataPath, dataContent, 'utf8');
    console.log('✅ Base64 string successfully replaced in data.js');
} else {
    console.log('❌ Base64 string not found in data.js');
}
