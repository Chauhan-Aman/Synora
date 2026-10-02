const fs = require('fs');
let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');
appCode = appCode.replace(/      \/>\n    <\/div>\n  \);\n}/, '      />\n      </div>\n    </div>\n  );\n}');
appCode = appCode.replace(/    role: 'assistant',\n    content: "Hi! I'm Synora. Ask me anything about the links and notes you've captured in your private Knowledge Graph!"\n  \}\]\);/, '');
fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('Fixed App.tsx syntax errors');
