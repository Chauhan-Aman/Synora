const fs = require('fs');
let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

if (!appCode.includes('import { useCreate }')) {
  appCode = appCode.replace(
    "import { useChat } from './hooks/useChat';",
    "import { useChat } from './hooks/useChat';\nimport { useCreate } from './hooks/useCreate';"
  );
}

const insertPoint = appCode.indexOf('} = useChat(');
const realInsertPoint = appCode.indexOf(';', insertPoint) + 1;

appCode = appCode.substring(0, realInsertPoint) + `
  const {
    draftText, setDraftText, coverData, setCoverData, isGeneratingCover, setIsGeneratingCover,
    draftContext, setDraftContext, isGeneratingParagraph, setIsGeneratingParagraph,
    isProofreading, setIsProofreading, suggestedParagraph, setSuggestedParagraph,
    revisionPrompt, setRevisionPrompt, isRevising, setIsRevising, modelConfig, setModelConfig,
    handleProofread, handleRevise, generateCover, generateNextParagraph
  } = useCreate(token, fetchWithAuth, showToast);
` + appCode.substring(realInsertPoint);

fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('useCreate hooked into App.tsx');
