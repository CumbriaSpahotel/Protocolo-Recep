const https = require('https');

// Load API key from env
const apiKey = 'AIzaSyANpWx03TEwiC6Y-5beW81wPlsEkOdKTls';

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response: ${data}`);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
