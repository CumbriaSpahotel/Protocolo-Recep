const https = require('https');
const apiKey = 'AIzaSyANpWx03TEwiC6Y-5beW81wPlsEkOdKTls';

function fetchModels(pageToken = '') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}${pageToken ? '&pageToken=' + pageToken : ''}`;
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const body = JSON.parse(data);
            if (body.models) {
                body.models.forEach(m => console.log(m.name));
            }
            if (body.nextPageToken) {
                fetchModels(body.nextPageToken);
            }
        });
    });
}

fetchModels();
