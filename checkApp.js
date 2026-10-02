const fs = require('fs');
let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

const lines = appCode.split('\n');
console.log('--- 930 to 950 ---');
console.log(lines.slice(930, 950).join('\n'));
console.log('--- 995 to 1010 ---');
console.log(lines.slice(995, 1010).join('\n'));
console.log('--- 1165 to 1185 ---');
console.log(lines.slice(1165, 1185).join('\n'));
