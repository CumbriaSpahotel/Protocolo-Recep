const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');

const filesToVerify = [
    'print-guide.html',
    'print-channels.html'
];

let failed = false;

console.log('🔍 Starting validation of print files...');

filesToVerify.forEach(filename => {
    const filePath = path.join(projectDir, filename);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: ${filename} does not exist!`);
        failed = true;
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for script block load logic
    if (!content.includes('data.js?t=')) {
        console.error(`❌ Error: ${filename} is missing dynamic cache-busting loader for data.js!`);
        failed = true;
    } else {
        console.log(`✅ Success: ${filename} has cache-busting logic.`);
    }

    // Check for FontAwesome references
    if (!content.includes('font-awesome')) {
        console.error(`❌ Error: ${filename} is missing FontAwesome styling library!`);
        failed = true;
    }

    // Check for print date container
    if (!content.includes('id="print-date"')) {
        console.error(`❌ Error: ${filename} is missing a print date container!`);
        failed = true;
    }

    // Check for stats-bar element
    if (!content.includes('id="stats-bar"')) {
        console.error(`❌ Error: ${filename} is missing a stats-bar container!`);
        failed = true;
    }
});

if (failed) {
    console.error('❌ Validation failed!');
    process.exit(1);
} else {
    console.log('🎉 All validations passed successfully!');
}
