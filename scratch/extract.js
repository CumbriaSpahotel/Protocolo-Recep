const fs = require('fs');

// Read data.js content
let fileContent = fs.readFileSync('data.js', 'utf8');

// We want to execute data.js in a VM context or simply evaluate it.
// Since data.js defines var/const variables at the top level, let's wrap it and extract them.
// We can replace const/var with global properties or just eval it after removing const/var constraints.
fileContent = fileContent.replace(/const protocols_data =/g, 'global.protocols_data =');
fileContent = fileContent.replace(/const navigation_config =/g, 'global.navigation_config =');
fileContent = fileContent.replace(/var channels_config =/g, 'global.channels_config =');

try {
    // Run the modified code to populate global
    eval(fileContent);
    
    console.log('--- CHANNELS ---');
    if (global.channels_config) {
        global.channels_config.forEach(c => {
            console.log(`Channel: ${c.name} | Hotel: ${c.hotel || c.source || 'N/A'} | ID: ${c.id}`);
        });
    }

    console.log('\n--- PROTOCOLS ---');
    if (global.protocols_data) {
        const sorted = [...global.protocols_data].sort((a, b) => {
            const secA = String(a.section || '99');
            const secB = String(b.section || '99');
            return secA.localeCompare(secB, undefined, { numeric: true });
        });

        sorted.forEach(p => {
            console.log(`Sec: ${p.section || 'N/A'} | Title: ${p.title} | Hotel: ${p.source || 'N/A'} | Cat: ${JSON.stringify(p.categories)}`);
        });
    }
    
} catch (e) {
    console.error('Error executing data.js:', e);
}
