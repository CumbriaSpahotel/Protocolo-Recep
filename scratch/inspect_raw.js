const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data.js');
const content = fs.readFileSync(filePath, 'utf8');

const startPatt = "<!-- VÍDEO EXPLICATIVO INTEGRADO (SOPORTE PREMIUM) -->";
const endPatt = "<!-- CHECKLIST FINAL INTERACTIVA";

const startIndex = content.indexOf(startPatt);
const endIndex = content.indexOf(endPatt);

console.log("Start Index:", startIndex);
console.log("End Index:", endIndex);

if (startIndex !== -1 && endIndex !== -1) {
    console.log("RAW SUBSTRING:");
    console.log(content.substring(startIndex - 50, endIndex + 100));
}
