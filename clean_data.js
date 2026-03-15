const fs = require('fs');

const file_path = 'c:\\Users\\comun\\Documents\\GitHub\\Operativa recepcion\\data.js';
const data = fs.readFileSync(file_path, 'utf8');
const prefix = 'const protocols_data = ';

if (data.startsWith(prefix)) {
    let jsonStr = data.substring(prefix.length).trim();
    if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
    
    // Parse the JSON
    const protocols = JSON.parse(jsonStr);
    
    let cleaned = 0;
    
    protocols.forEach(p => {
        const originalContent = p.content;
        
        // Remove <script> elements and their content
        let newContent = p.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        if (newContent !== originalContent) {
            p.content = newContent;
            cleaned++;
        }
    });

    if (cleaned > 0) {
        const newFileContent = prefix + JSON.stringify(protocols, null, 2) + ";\n";
        fs.writeFileSync(file_path, newFileContent, 'utf8');
        console.log(`Successfully cleaned scripts from ${cleaned} protocols in data.js`);
    } else {
        console.log("No scripts found to clean.");
    }
} else {
    console.log("Could not parse protocols_data");
}
