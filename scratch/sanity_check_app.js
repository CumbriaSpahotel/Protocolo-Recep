const fs = require('fs');
const vm = require('vm');

try {
    const code = fs.readFileSync('app.js', 'utf-8');
    const sandbox = {
        window: {
            addEventListener: () => {},
            scrollTo: () => {}
        },
        document: {
            addEventListener: () => {},
            getElementById: () => null,
            querySelector: () => ({ offsetTop: 0 }),
            querySelectorAll: () => []
        },
        localStorage: {
            getItem: () => null,
            setItem: () => null
        },
        navigator: {},
        console: console
    };
    sandbox.window.parent = sandbox.window;
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    console.log("app.js is 100% syntactically correct!");
} catch (e) {
    console.error("Syntax or runtime error in app.js:", e);
    process.exit(1);
}
