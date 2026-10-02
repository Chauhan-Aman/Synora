const fs = require('fs');
const appCode = fs.readFileSync('App_7bc428ef.tsx', 'utf8');

const learnIdx = appCode.indexOf("activeTab === 'LEARN'");
console.log(appCode.substring(learnIdx - 100, learnIdx + 500));
