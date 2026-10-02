const fs = require('fs');
const appCode = fs.readFileSync('App_7bc428ef.tsx', 'utf16le');

const start = appCode.indexOf("{activeTab === 'KNOWLEDGE' && (");
const end = appCode.indexOf("{activeTab === 'LEARN' && (");
console.log(appCode.substring(end - 100, end));
