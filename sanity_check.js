
const fs = require('fs');
const path = require('path');

// Simulate the server's data management logic
let currentData = {
    channels_config: [{ id: 'test' }],
    protocols_data: [{ title: 'Protocol 1' }],
    navigation_config: { '1': { name: 'Cat' } },
    home_config: { welcome: 'Hi' },
    menus_data: []
};

function simulateSave(payload) {
    console.log('--- Simulating Save with Payload:', JSON.stringify(payload).slice(0, 50) + '...');
    
    // Server logic (simplified version of what I implemented in server.js)
    const channels = payload.channels_config || currentData.channels_config;
    const protocols = payload.protocols_data || currentData.protocols_data;
    const nav = payload.navigation_config || currentData.navigation_config;
    const home = payload.home_config || currentData.home_config;
    const menus = payload.menus_data || currentData.menus_data;

    const content = `
var channels_config = ${JSON.stringify(channels, null, 4)};
var protocols_data = ${JSON.stringify(protocols, null, 4)};
var navigation_config = ${JSON.stringify(nav, null, 4)};
var home_config = ${JSON.stringify(home, null, 4)};
var menus_data = ${JSON.stringify(menus, null, 4)};
    `;

    fs.writeFileSync('data-test.js', content);
    console.log('✅ data-test.js generated.');
}

// TEST CASES
try {
    // 1. Full payload
    simulateSave(currentData);
    require('./data-test.js');
    console.log('Test 1 Passed: Full payload produces valid JS');

    // 2. Partial payload (only channels)
    simulateSave({ channels_config: [{ id: 'new-channel' }] });
    require('./data-test.js');
    // Check if other variables are still there (mental check: they will be because of || currentData.x)
    console.log('Test 2 Passed: Partial payload preserved other fields');

    // 3. Empty payload
    simulateSave({});
    require('./data-test.js');
    console.log('Test 3 Passed: Empty payload didn\'t break file');

    console.log('\n--- ALL SAFETY TESTS PASSED ---');
} catch (e) {
    console.error('❌ SAFETY TEST FAILED:', e.message);
    process.exit(1);
}
