const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.js');

try {
    let content = fs.readFileSync(dataPath, 'utf8');

    // Replace https://youtu.be/ID -> https://www.youtube.com/embed/ID?rel=0
    // We match src=\"https://youtu.be/...\" taking escaping into account
    let regex1 = /https:\\?\/\\?\/youtu\.be\\?\/([a-zA-Z0-9_-]+)/g;
    let newContent = content.replace(regex1, 'https://www.youtube.com/embed/$1?rel=0');

    // Replace https://www.youtube.com/watch?v=ID -> https://www.youtube.com/embed/ID?rel=0
    let regex2 = /https:\\?\/\\?\/www\.youtube\.com\\?\/watch\?v=([a-zA-Z0-9_-]+)/g;
    newContent = newContent.replace(regex2, 'https://www.youtube.com/embed/$1?rel=0');

    // Also add ?rel=0 to existing embed links if they don't have it
    // regex3 matches https://www.youtube.com/embed/ID not followed by ?
    let regex3 = /(https:\\?\/\\?\/www\.youtube\.com\\?\/embed\\?\/[a-zA-Z0-9_-]+)(?![\?&])/g;
    newContent = newContent.replace(regex3, '$1?rel=0');

    if (content !== newContent) {
        fs.writeFileSync(dataPath, newContent, 'utf8');
        console.log('Successfully updated YouTube URLs in data.js to use embed format with rel=0');
    } else {
        console.log('No YouTube URLs needed updating.');
    }
} catch (e) {
    console.error('Error:', e);
}
