const fs = require('fs');

let knowledgeCode = fs.readFileSync('apps/web/src/components/tabs/KnowledgeTab.tsx', 'utf8');
knowledgeCode = knowledgeCode.replace('const {', 'const { selectedArtifact, setArtifacts,');
knowledgeCode = knowledgeCode.replace('import { BrainTreeMap } from \'../BrainTreeMap\';', 'import { BrainTreeMap } from \'../graphs/BrainTreeMap\';');
fs.writeFileSync('apps/web/src/components/tabs/KnowledgeTab.tsx', knowledgeCode);

let createCode = fs.readFileSync('apps/web/src/components/tabs/CreateTab.tsx', 'utf8');
createCode = createCode.replace('const {', 'const { isSavingPreferences,');
fs.writeFileSync('apps/web/src/components/tabs/CreateTab.tsx', createCode);

console.log('Fixed props');
