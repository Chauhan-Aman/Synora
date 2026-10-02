const fs = require('fs');
let code = fs.readFileSync('apps/web/src/hooks/useChat.ts', 'utf8');

const missingFunctions = `
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const loadSession = async (id: string) => {
    try {
      const res = await fetchWithAuth(\`http://localhost:3001/chat/sessions/\${id}\`);
      if (res.ok) {
        const session = await res.json();
        setCurrentSessionId(id);
        setChatHistory([{ role: 'assistant', content: "Hi, I'm Synora. Ask me to search your knowledge base, brainstorm ideas, or discover new connections." }, ...(session.messages || []).map((m: any) => ({
          role: m.role,
          content: m.content,
          sources: m.sources,
          agentLogs: m.agentLogs
        }))]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renameSession = async (id: string) => {
    if (!editingTitle.trim()) return;
    try {
      await fetchWithAuth(\`http://localhost:3001/chat/sessions/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle.trim() })
      });
      setChatSessions(prev => prev.map(s => s.id === id ? { ...s, title: editingTitle.trim() } : s));
      setEditingSessionId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await fetchWithAuth(\`http://localhost:3001/chat/sessions/\${id}\`, {
        method: 'DELETE'
      });
      setChatSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setChatHistory([{ role: 'assistant', content: "Hi, I'm Synora. Ask me to search your knowledge base, brainstorm ideas, or discover new connections." }]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const speak = (text: string) => {}; // mock
`;

code = code.replace('  return {', missingFunctions + '\n  return {');

fs.writeFileSync('apps/web/src/hooks/useChat.ts', code);
console.log('Fixed useChat.ts functions');
