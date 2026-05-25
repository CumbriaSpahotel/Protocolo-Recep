const fs = require('fs');
const vm = require('vm');

const dataFilePath = 'c:\\Users\\comun\\Documents\\GitHub\\Protocolo-Recep\\data.js';
const htmlFilePath = 'c:\\Users\\comun\\Documents\\GitHub\\Protocolo-Recep\\scratch\\booking_new.html';

const code = fs.readFileSync(dataFilePath, 'utf-8');
const newHtml = fs.readFileSync(htmlFilePath, 'utf-8');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

if (sandbox.channels_config && Array.isArray(sandbox.channels_config)) {
    const booking = sandbox.channels_config.find(c => c.id === 'booking' || c.name === 'BOOKING.COM');
    if (booking) {
        console.log("Found booking channel! Updating htmlContent from file...");
        booking.htmlContent = newHtml;
        
        // Serialize variables back exactly
        let newContent = `var channels_config = ${JSON.stringify(sandbox.channels_config, null, 2)};\n`;
        newContent += `const protocols_data = ${JSON.stringify(sandbox.protocols_data, null, 2)};\n`;
        newContent += `const navigation_config = ${JSON.stringify(sandbox.navigation_config, null, 2)};\n`;
        newContent += `const home_config = ${JSON.stringify(sandbox.home_config, null, 2)};\n`;
        newContent += `var cloud_config = ${JSON.stringify(sandbox.cloud_config, null, 2)};\n`;
        newContent += `const menus_data = ${JSON.stringify(sandbox.menus_data, null, 2)};\n`;
        
        fs.writeFileSync(dataFilePath, newContent, 'utf-8');
        console.log("Successfully updated data.js!");
    } else {
        console.log("Could not find Booking channel!");
    }
} else {
    console.log("channels_config is not an array!");
}
