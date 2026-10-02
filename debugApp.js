const fs = require('fs');

let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

// Check what's there
const idx = appCode.indexOf("setToast(null), 3000)");
console.log('Found at:', idx);
console.log('Context:', JSON.stringify(appCode.slice(Math.max(0, idx - 20), idx + 50)));
