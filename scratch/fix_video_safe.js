const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filePath = path.join(__dirname, '../data.js');
const backupPath = path.join(__dirname, '../data_val.js');

// 1. Read original content
let content = fs.readFileSync(filePath, 'utf8');

const startPatt = "<!-- VÍDEO EXPLICATIVO INTEGRADO (SOPORTE PREMIUM) -->";
const endPatt = "<!-- CHECKLIST FINAL INTERACTIVA";

const startIndex = content.indexOf(startPatt);
const endIndex = content.indexOf(endPatt);

if (startIndex === -1 || endIndex === -1) {
    console.error(`Error: Could not find patterns. Start: ${startIndex}, End: ${endIndex}`);
    process.exit(1);
}

// 2. Prepare replacement
const rawReplacement = `<!-- VÍDEO EXPLICATIVO INTEGRADO (SOPORTE PREMIUM) -->
    <div id="sec-video" style="background: linear-gradient(90deg, #f9f9ff 60%, #e7f7fc 100%); border-radius: 16px; box-shadow: 0 4px 15px rgba(0, 174, 239, 0.08); padding: 2rem; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 1.5rem; box-sizing: border-box; width: 100%;">
      <div style="font-size: 1.3rem; font-weight: 800; color: var(--accent-blue); display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <i class="fas fa-video" style="color: var(--accent-blue); font-size: 1.3rem;"></i> Soporte de Video Tutorial
      </div>
      <div style="width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); background: #000; position: relative; padding-bottom: 56.25%; height: 0; box-shadow: var(--shadow);">
        <iframe src="https://www.youtube.com/embed/jmjWelzM74Q?rel=0" title="Revisión de reservas Channel – Diarias" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>
      </div>
      <div style="text-align: center; font-weight: 600; font-size: 1.05rem; color: var(--text-dark);">Revisión de reservas Channel – Diarias (Vídeo explicativo paso a paso)</div>
    </div>`;

// Stringify to get it properly escaped for JS string literal (gives us \" and \n)
let escapedReplacement = JSON.stringify(rawReplacement).slice(1, -1);

// Construct new content
const newContent = content.substring(0, startIndex) + escapedReplacement + "\\n    " + content.substring(endIndex);

// Write to a temporary validation file
fs.writeFileSync(backupPath, newContent, 'utf8');

try {
    console.log("Checking syntax of proposed changes...");
    execSync(`node -c "${backupPath}"`, { stdio: 'inherit' });
    console.log("Syntax is VALID! Applying changes permanently...");
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("data.js successfully updated.");
    if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
    }
} catch (err) {
    console.error("Syntax Error detected! Proposed changes discarded.");
}
