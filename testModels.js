const fs = require('fs');
const dataStr = fs.readFileSync('data.js', 'utf8');
const m = dataStr.match(/"geminiApiKey":\s*"([^"]+)"/);
if(m) {
    fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + m[1])
        .then(r => r.json())
        .then(j => console.log(j.models ? j.models.map(x => x.name).join('\n') : j))
        .catch(console.error);
} else {
    console.log('key not found');
}
