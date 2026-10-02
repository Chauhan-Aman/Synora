const fs = require('fs');

let createCode = fs.readFileSync('apps/web/src/components/tabs/CreateTab.tsx', 'utf8');
createCode = createCode.replace('const { isSavingPreferences,', `const { 
  isSavingPreferences, handleReject, handleApprove, suggestedParagraph, setSuggestedParagraph, 
  revisionPrompt, setRevisionPrompt, handleRewrite, isRevising, draftContext, Link, Box, 
  Compass, isSettingsOpen, setIsSettingsOpen, Settings, modelConfig, setModelConfig, Key, 
  handleLogout, userPreferences, setUserPreferences, setIsSavingPreferences, fetchWithAuth,
  BrainCircuit,
`);
// Replace draftContext with draftText just in case it's used as draftContext instead of draftText
createCode = createCode.replace(/draftContext/g, 'draftText');
fs.writeFileSync('apps/web/src/components/tabs/CreateTab.tsx', createCode);

let knowledgeCode = fs.readFileSync('apps/web/src/components/tabs/KnowledgeTab.tsx', 'utf8');
knowledgeCode = knowledgeCode.replace('../graphs/BrainTreeMap', '../BrainTreeMap');
fs.writeFileSync('apps/web/src/components/tabs/KnowledgeTab.tsx', knowledgeCode);

console.log('Fixed CreateTab missing props and KnowledgeTab import');
