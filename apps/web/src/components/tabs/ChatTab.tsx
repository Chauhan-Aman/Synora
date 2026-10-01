import React from 'react';
import { 
  MessageSquare, Plus, Edit3, Trash2, BrainCircuit, 
  CheckCircle, Loader2, X, Compass, Volume2, VolumeX, 
  MicOff, Mic, Send 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../CodeBlock';

interface ChatMessage { 
  role: 'user' | 'assistant'; 
  content: string; 
  sources?: string[]; 
  agentLogs?: { action: string; status: 'pending'|'done'|'error'; message: string }[]; 
}

interface ChatSession {
  id: string;
  title?: string;
  updatedAt: string;
}

interface ChatTabProps {
  setCurrentSessionId: (id: string | null) => void;
  setChatHistory: (history: ChatMessage[]) => void;
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  editingSessionId: string | null;
  loadSession: (id: string) => void;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  renameSession: (id: string) => void;
  setEditingSessionId: (id: string | null) => void;
  deleteSession: (id: string) => void;
  chatHistory: ChatMessage[];
  isChatting: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
  forceWebSearch: boolean;
  setForceWebSearch: (val: boolean) => void;
  isVoiceEnabled: boolean;
  setIsVoiceEnabled: (val: boolean) => void;
  chatQuery: string;
  setChatQuery: (val: string) => void;
  handleChatSubmit: (e: React.FormEvent) => void;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  toggleListening: () => void;
  isListening: boolean;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  setCurrentSessionId,
  setChatHistory,
  chatSessions,
  currentSessionId,
  editingSessionId,
  loadSession,
  editingTitle,
  setEditingTitle,
  renameSession,
  setEditingSessionId,
  deleteSession,
  chatHistory,
  isChatting,
  chatEndRef,
  forceWebSearch,
  setForceWebSearch,
  isVoiceEnabled,
  setIsVoiceEnabled,
  chatQuery,
  setChatQuery,
  handleChatSubmit,
  isSpeaking,
  stopSpeaking,
  toggleListening,
  isListening,
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto flex gap-6 h-full mt-8 px-4 md:px-0 pb-8">
      {/* Left Sidebar: Chat History */}
      <div className="w-64 shrink-0 glass-panel border-synora-border rounded-2xl flex flex-col overflow-hidden h-full hidden md:flex">
        <div className="p-4 border-b border-synora-border flex justify-between items-center bg-synora-surface/50">
          <h3 className="font-bold flex items-center gap-2 text-sm"><MessageSquare className="w-4 h-4 text-synora-accent"/> Chat History</h3>
          <button onClick={() => {
            setCurrentSessionId(null);
            setChatHistory([{
              role: 'assistant',
              content: "Hi! I'm Synora. Ask me anything about the links and notes you've captured in your private Knowledge Graph!"
            }]);
          }} className="p-1.5 bg-synora-accent/20 text-synora-accent hover:bg-synora-accent hover:text-white rounded-md transition-colors" title="New Chat">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {chatSessions.length === 0 ? (
            <p className="text-xs text-synora-text-secondary p-2 italic text-center mt-4">No recent chats.</p>
          ) : (
            chatSessions.map(session => (
              <div
                key={session.id}
                className={`p-3 rounded-xl cursor-pointer flex justify-between items-center group transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-synora-accent/20 border border-synora-accent/50'
                    : 'hover:bg-synora-surface border border-transparent'
                }`}
                onClick={() => editingSessionId !== session.id && loadSession(session.id)}
              >
                <div className="overflow-hidden pr-1 flex-1 min-w-0">
                  {editingSessionId === session.id ? (
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      onBlur={() => renameSession(session.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') renameSession(session.id);
                        if (e.key === 'Escape') setEditingSessionId(null);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="w-full bg-synora-bg border border-synora-accent/60 rounded-md px-2 py-0.5 text-sm text-white outline-none focus:border-synora-accent"
                    />
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate text-white">{session.title || 'New Chat'}</p>
                      <p className="text-xs text-synora-text-secondary mt-0.5">{new Date(session.updatedAt).toLocaleDateString()}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditingSessionId(session.id);
                      setEditingTitle(session.title || '');
                    }}
                    className="p-1.5 text-synora-text-secondary hover:text-synora-accent"
                    title="Rename chat"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteSession(session.id); }}
                    className="p-1.5 text-synora-text-secondary hover:text-red-400"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass-panel overflow-hidden flex flex-col h-full border-synora-accent/20 shadow-2xl shadow-synora-accent/5 rounded-2xl">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 min-h-0 custom-scrollbar pr-2">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-synora-accent text-white rounded-tr-sm' 
                : 'bg-synora-surface border border-synora-border rounded-tl-sm text-white/90'
            }`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({node, ...props}) => <p className="leading-relaxed mb-4 last:mb-0" {...props} />,
                  a: ({node, ...props}) => <a className="text-synora-accent hover:underline font-medium" target="_blank" rel="noreferrer" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6 text-white" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 mt-5 text-white" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2 mt-4 text-white" {...props} />,
                  code: CodeBlock as any,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-synora-accent pl-4 italic text-synora-text-secondary my-4" {...props} />,
                }}
              >
                {msg.content}
              </ReactMarkdown>
              
              {msg.agentLogs && msg.agentLogs.length > 0 && (
                <div className="mt-5 mb-2">
                  <details className="group bg-gradient-to-b from-synora-surface to-synora-bg border border-synora-border/60 shadow-xl rounded-2xl overflow-hidden">
                    <summary className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors text-sm font-bold text-synora-accent list-none [&::-webkit-details-marker]:hidden">
                      <div className="p-1.5 bg-synora-accent/10 rounded-lg group-hover:bg-synora-accent/20 transition-colors">
                        <BrainCircuit className="w-4 h-4 text-synora-accent group-open:animate-pulse" />
                      </div>
                      Agentic Workflow ({msg.agentLogs.length} steps)
                      <span className="ml-auto transform group-open:rotate-180 transition-transform duration-300 text-synora-text-secondary opacity-70">
                        ▼
                      </span>
                    </summary>
                    <div className="px-5 pb-5 pt-1 animate-fade-in">
                      <div className="space-y-5 border-l-2 border-synora-border/60 ml-2.5 pl-6 py-2 relative">
                        {msg.agentLogs.map((log, i) => (
                          <div key={i} className="relative group/step">
                            <div className="absolute -left-[33px] top-0 bg-synora-bg rounded-full p-0.5 shadow-sm border border-synora-border">
                              {log.status === 'done' ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              ) : log.status === 'pending' ? (
                                <Loader2 className="w-4 h-4 text-synora-accent animate-spin" />
                              ) : (
                                <X className="w-4 h-4 text-rose-400" />
                              )}
                            </div>
                            
                            <div className={`transition-all duration-300 ${log.status === 'pending' ? 'opacity-90' : 'opacity-100'}`}>
                              <h5 className="font-bold text-xs uppercase tracking-wider text-synora-text-secondary mb-1 flex items-center gap-2">
                                {log.action}
                                {log.status === 'pending' && <span className="text-[9px] bg-synora-accent/20 text-synora-accent px-2 py-0.5 rounded-full font-black animate-pulse">ACTIVE</span>}
                              </h5>
                              <p className="text-white/80 text-[13px] leading-relaxed">{log.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-synora-border/50 flex flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-synora-text-secondary w-full">Sources Cited:</span>
                  {msg.sources.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer" className="text-xs bg-synora-bg border border-synora-border px-2 py-1 rounded-md text-synora-accent hover:bg-synora-accent/10 transition-colors truncate max-w-[200px]">
                      {src}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isChatting && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-synora-surface border border-synora-border rounded-2xl rounded-tl-sm p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-synora-accent" />
              <span className="text-synora-text-secondary animate-pulse">Synora is thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef as any} />
      </div>

      <div className="p-4 bg-synora-surface border-t border-synora-border shrink-0">
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setCurrentSessionId(null);
                setChatHistory([{
                  role: 'assistant',
                  content: "Hi! I'm Synora. Ask me anything about the links and notes you've captured in your private Knowledge Graph!"
                }]);
              }}
              className="flex items-center gap-2 text-xs bg-synora-bg border border-synora-border px-3 py-1 rounded-full text-white hover:border-synora-accent transition-colors"
            >
              <Plus className="w-3 h-3" /> New Chat
            </button>
            <label className="flex items-center gap-2 text-xs text-synora-text-secondary cursor-pointer hover:text-white transition-colors">
              <input 
                type="checkbox" 
                checked={forceWebSearch} 
                onChange={(e) => setForceWebSearch(e.target.checked)}
                className="accent-synora-accent rounded"
              />
              <Compass className="w-3 h-3" /> Force Web Search
            </label>
            <label className="flex items-center gap-2 text-xs text-synora-text-secondary cursor-pointer hover:text-white transition-colors">
              <input 
                type="checkbox" 
                checked={isVoiceEnabled} 
                onChange={(e) => setIsVoiceEnabled(e.target.checked)}
                className="accent-synora-accent rounded"
              />
              {isVoiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />} Voice Answers
            </label>
          </div>
        </div>
        <form onSubmit={handleChatSubmit} className="relative">
          <input
            type="text"
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            placeholder="Ask a question about your knowledge graph..."
            className="glass-input pr-32 w-full bg-synora-bg"
            disabled={isChatting}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="p-2 text-synora-text-secondary hover:text-white hover:bg-synora-border rounded-lg transition-colors"
                title="Stop speaking"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse' 
                  : 'text-synora-text-secondary hover:text-white hover:bg-synora-border'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              disabled={isChatting || !chatQuery.trim()}
              className="p-2 bg-synora-accent hover:bg-synora-accent-hover text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};
