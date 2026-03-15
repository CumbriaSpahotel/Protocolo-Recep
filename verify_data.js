try {
    require('./data.js');
    console.log("data.js is valid!");
    if (typeof protocols_data !== 'undefined' && Array.isArray(protocols_data)) {
        console.log(`protocols_data is valid array with ${protocols_data.length} items.`);
    } else {
        console.error("protocols_data is MISSING or NOT an array!");
        process.exit(1);
    }
    if (typeof navigation_config !== 'undefined' && typeof navigation_config === 'object') {
        console.log("navigation_config is valid!");
    } else {
        console.error("navigation_config is MISSING!");
        process.exit(1);
    }
} catch (e) {
    console.error("SYNTAX ERROR in data.js:", e.message);
    process.exit(1);
}
