const fs = require('fs');
let appCode = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

if (!appCode.includes('import { useChat }')) {
  appCode = appCode.replace(
    "import { useCapture } from './hooks/useCapture';",
    "import { useCapture } from './hooks/useCapture';\nimport { useChat } from './hooks/useChat';"
  );
}

const authInsert = appCode.indexOf('} = useCapture(');
const insertPoint = appCode.indexOf(';', authInsert) + 1;

appCode = appCode.substring(0, insertPoint) + `
  const {
    chatQuery, setChatQuery, isChatting, setIsChatting, forceWebSearch, setForceWebSearch,
    chatHistory, setChatHistory, currentSessionId, setCurrentSessionId, chatSessions, setChatSessions,
    editingSessionId, setEditingSessionId, editingTitle, setEditingTitle, isListening, setIsListening,
    isSpeaking, setIsSpeaking, isVoiceEnabled, setIsVoiceEnabled, chatEndRef, loadSession,
    renameSession, deleteSession, handleChatSubmit, stopSpeaking, speak, toggleListening
  } = useChat(token, fetchWithAuth);
` + appCode.substring(insertPoint);

fs.writeFileSync('apps/web/src/App.tsx', appCode);
console.log('useChat hooked into App.tsx');
