const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.js');

try {
    let content = fs.readFileSync(dataPath, 'utf8');

    // Replace <script src="https://cdn.tailwindcss.com"></script>
    // We handle possible escaped quotes as well
    const regex = /<script src=\\?["']https:\/\/cdn\.tailwindcss\.com\\?["']><\/script>/g;
    
    // We also might find unescaped versions if it's inside template literals
    const newContent = content.replace(regex, '<link rel=\\"stylesheet\\" href=\\"tailwind.css\\">');
    
    if (content !== newContent) {
        fs.writeFileSync(dataPath, newContent, 'utf8');
        console.log('Successfully replaced Tailwind CDN in data.js');
    } else {
        console.log('No replacements made. String not found or already replaced.');
    }
} catch (e) {
    console.error('Error:', e);
}
