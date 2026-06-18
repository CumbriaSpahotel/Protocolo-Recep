const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data.js');
let content = fs.readFileSync(filePath, 'utf8');

// Target the messy video block
// Note: because the content is already escaped in data.js, the matching regex has to account for that.
// The block in data.js has escaped quotes like \\\" and newlines as \\n.
// Let's print out the match to see how it looks before replacing.

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

// Stringify to get it properly escaped for JS string literal
let escapedReplacement = JSON.stringify(rawReplacement).slice(1, -1);

// We need to double-escape backslashes if the original string uses double-escaping.
// In data.js, double quotes are written as \\\" (which is \" inside the JS string).
// Wait, let's see how they are written in the file.
// In data.js, line 194 has:
// \"content\": \"<!-- CONTENEDOR MAESTRO -->\\n<div class=\\\"main-container\\\" ...\"
// In the file, it has `class=\\\"main-container\\\"`, which is three backslashes before the quote!
// Let's verify: `\"` represents an escaped quote in JSON, and `\\\"` represents a backslash and an escaped quote.
// Yes! So inside a double-quoted string in a JS file, if it is written as `class=\\\"main-container\\\"`, it means the string value contains literal `\"`.
// Let's test if we can do this by using a target regex.
// Let's search for the start and end of the block in the raw file content:
const startPatt = "<!-- VÍDEO EXPLICATIVO INTEGRADO (SOPORTE PREMIUM) -->";
const endPatt = "<!-- CHECKLIST FINAL INTERACTIVA";

const startIndex = content.indexOf(startPatt);
const endIndex = content.indexOf(endPatt);

if (startIndex === -1 || endIndex === -1) {
    console.log(`Could not find patterns. Start: ${startIndex}, End: ${endIndex}`);
    process.exit(1);
}

console.log(`Found block from index ${startIndex} to ${endIndex}`);

// We want to replace everything from startIndex up to the start of the next block.
// Let's find the exact end of the div that wraps the video.
// The next block starts with `<!-- CHECKLIST FINAL INTERACTIVA`.
// So we can replace the range [startIndex, endIndex] with our new escaped HTML, plus the endPatt.
// Wait, does the replacement HTML need to match the formatting of data.js?
// Let's look at how quotes and newlines are represented in that part of data.js:
// They are represented as `\\n` (literal backslash and n) and `\\\"` (backslash and escaped quote).
// So when we stringify rawReplacement:
// JSON.stringify(rawReplacement) will produce `\"` and `\n`.
// To write it to the file as `\\\"` and `\\n`, we need to escape backslashes once more!
// Let's do:
let finalReplacementString = JSON.stringify(rawReplacement).slice(1, -1);
// Replace `\"` with `\\\"` and `\n` with `\\n`
// Wait, no: JSON.stringify already escapes quotes as `\"` and newlines as `\n`.
// If we write that to the file directly:
// A file containing `\"` will load in JS as `"` (a literal quote, which breaks the string).
// A file containing `\n` will load in JS as a literal newline (which is invalid in a double-quoted string).
// So we must escape them so they write to the file as `\\\"` and `\\n`!
// Let's do:
finalReplacementString = finalReplacementString
    .replace(/\\"/g, '\\\\\\"')
    .replace(/\\n/g, '\\\\n');

console.log("Sample of escaped replacement:");
console.log(finalReplacementString.substring(0, 200));

content = content.substring(0, startIndex) + finalReplacementString + "\n    " + content.substring(endIndex);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully wrote updated file.");
