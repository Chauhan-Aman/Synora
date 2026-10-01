// @ts-nocheck
import { useState, useEffect, useRef, RefObject } from 'react';

export function useChat(token: string | null, fetchWithAuth: any) {
  const [chatQuery, setChatQuery] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [forceWebSearch, setForceWebSearch] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([{ role: 'assistant', content: 'Hi' }]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || isChatting) return;

    const userMessage = chatQuery;
    setChatQuery('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatting(true);
    
    // Add empty assistant message placeholder
    setChatHistory(prev => [...prev, { role: 'assistant', content: '', sources: [], agentLogs: [] }]);

    try {
      const response = await fetchWithAuth('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, history: chatHistory, forceWebSearch, model: modelConfig, sessionId: currentSessionId }),
      });

      if (!response.ok) throw new Error('Failed to fetch chat response');
      if (!response.body) throw new Error('Streaming not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const messages = chunk.split('\n\n').filter(Boolean);
        
        for (const msg of messages) {
          if (msg.startsWith('data: ')) {
            const dataStr = msg.substring(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'session_info') {
                setCurrentSessionId(data.sessionId);
              } else if (data.type === 'log') {
                setChatHistory(prev => {
                  const newHistory = [...prev];
                  const lastMsg = newHistory[newHistory.length - 1];
                  const existingLogs = [...(lastMsg.agentLogs || [])];
                  
                  // If a 'done' log arrives for the same action as a 'pending' log,
                  // update the existing entry in-place instead of appending a duplicate.
                  if (data.log.status === 'done') {
                    const pendingIdx = existingLogs.findLastIndex(
                      (l: any) => l.action === data.log.action && l.status === 'pending'
                    );
                    if (pendingIdx !== -1) {
                      existingLogs[pendingIdx] = data.log;
                      newHistory[newHistory.length - 1] = { ...lastMsg, agentLogs: existingLogs };
                      return newHistory;
                    }
                  }
                  
                  // Otherwise append as a new entry
                  newHistory[newHistory.length - 1] = { ...lastMsg, agentLogs: [...existingLogs, data.log] };
                  return newHistory;
                });
              } else if (data.type === 'metadata') {
                setChatHistory(prev => {
                  const newHistory = [...prev];
                  const lastMsg = newHistory[newHistory.length - 1];
                  newHistory[newHistory.length - 1] = { ...lastMsg, sources: data.sources || [] };
                  return newHistory;
                });
              } else if (data.type === 'text') {
                assistantText += data.text;
                setChatHistory(prev => {
                  const newHistory = [...prev];
                  newHistory[newHistory.length - 1] = { ...newHistory[newHistory.length - 1], content: assistantText };
                  return newHistory;
                });
              }
            } catch(e) {}
          }
        }
      }
      
      // Auto-speak response if enabled
      if (isVoiceEnabled) {
        speakText(assistantText);
      }
      
    } catch (err) {
      console.error(err);
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { 
          role: 'assistant', 
          content: "Oops! Something went wrong trying to connect to Synora. Ensure Ollama is running." 
        };
        return newHistory;
      });
    } finally {
      setIsChatting(false);
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (isSpeaking && synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      recognitionRef.current.start();
    }
  }

  

  

  

  return {
    chatQuery, setChatQuery,
    isChatting, setIsChatting,
    forceWebSearch, setForceWebSearch,
    chatHistory, setChatHistory,
    currentSessionId, setCurrentSessionId,
    chatSessions, setChatSessions,
    editingSessionId, setEditingSessionId,
    editingTitle, setEditingTitle,
    isListening, setIsListening,
    isSpeaking, setIsSpeaking,
    isVoiceEnabled, setIsVoiceEnabled,
    chatEndRef,
    loadSession,
    renameSession,
    deleteSession,
    handleChatSubmit,
    stopSpeaking,
    speak,
    toggleListening
  };
}
