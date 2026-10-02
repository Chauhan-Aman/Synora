const fs = require('fs');
let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

if (!appCode.includes('import { useCapture }')) {
  appCode = appCode.replace(
    "import { useKnowledge } from './hooks/useKnowledge';",
    "import { useKnowledge } from './hooks/useKnowledge';\nimport { useCapture } from './hooks/useCapture';"
  );
}

const authInsert = appCode.indexOf('} = useKnowledge(');
const insertPoint = appCode.indexOf(';', authInsert) + 1;

appCode = appCode.substring(0, insertPoint) + `
  const {
    inputType, setInputType, inputValue, setInputValue,
    selectedFile, setSelectedFile, isSubmitting, setIsSubmitting,
    status, setStatus, artifactId, setArtifactId, handleCaptureSubmit
  } = useCapture(token, fetchWithAuth, fetchKnowledge, showToast, isListening, toggleListening);
` + appCode.substring(insertPoint);

fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('useCapture hooked into App.tsx');
