const fs = require('fs');
let code = fs.readFileSync('apps/web/src/components/tabs/KnowledgeTab.tsx', 'utf8');
code = code.replace(/<\/div>[\r\n\s]*<\/>[\r\n\s]*\);[\r\n\s]*};/g, '</div>\n          )}\n    </>\n  );\n};');
fs.writeFileSync('apps/web/src/components/tabs/KnowledgeTab.tsx', code);
console.log('Fixed KnowledgeTab');
