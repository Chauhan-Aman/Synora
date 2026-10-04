// @ts-nocheck
import React from 'react';
import { BrainCircuit, CheckCircle, Compass, FileText, GraduationCap, Key, Layers, Link, Loader2, LogOut, MessageSquare, Plus, Rss, Settings, Sparkles, X, Copy, Trash2, Edit3, Type, Box, Mic, MicOff, Search, Network, List as ListIcon, Workflow, Hash, Volume2, VolumeX, Send, Image as ImageIcon, Briefcase, MessageCircle, Mail, CheckSquare, Square, Download, Printer, Globe, Wand2, Save, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { CodeBlock } from '../CodeBlock';

export interface ChatTabProps {
  activeTab: any;
  chatEndRef: any;
  chatHistory: any;
  chatQuery: any;
  chatSessions?: any;
  currentSessionId?: any;
  deleteSession?: any;
  editingSessionId?: any;
  editingTitle?: any;
  forceWebSearch: any;
  handleChatSubmit: any;
  isChatting: any;
  isListening: any;
  isSpeaking: any;
  isVoiceEnabled: any;
  loadSession?: any;
  renameSession?: any;
  setChatHistory: any;
  setChatQuery: any;
  setCurrentSessionId: any;
  setEditingSessionId?: any;
  setEditingTitle?: any;
  setForceWebSearch: any;
  setIsVoiceEnabled: any;
  stopSpeaking: any;
  toggleListening: any;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  activeTab, chatEndRef, chatHistory, chatQuery, chatSessions, currentSessionId, deleteSession, editingSessionId, editingTitle, forceWebSearch, handleChatSubmit, isChatting, isListening, isSpeaking, isVoiceEnabled, loadSession, renameSession, setChatHistory, setChatQuery, setCurrentSessionId, setEditingSessionId, setEditingTitle, setForceWebSearch, setIsVoiceEnabled, stopSpeaking, toggleListening
}) => {
  return (
    <>
{/* CHAT TAB (RAG) */}
          {/* CHAT TAB (RAG) */}
          {activeTab === 'CHAT' && (
            <div className="w-full max-w-6xl mx-auto overflow-hidden flex h-full gap-4 mt-8">
              {/* Sidebar */}
              <div className="hidden md:flex w-64 glass-panel border-synora-accent/20 shadow-2xl flex-col h-full rounded-2xl shrink-0 p-4">
                <div className="flex items-center justify-between mb-4 border-b border-synora-border pb-3 shrink-0">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-synora-accent" /> Chat History
                  </h3>
                  <button 
                    onClick={() => {
                      if (setCurrentSessionId) setCurrentSessionId(null);
                      setChatHistory([{
                        role: 'assistant',
                        content: "Hi! I'm Synora. Ask me anything about the links and notes you've captured in your private Knowledge Graph!"
                      }]);
                    }}
                    className="p-1.5 bg-synora-accent/10 text-synora-accent hover:bg-synora-accent hover:text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                  {chatSessions && chatSessions.length > 0 ? chatSessions.map((session: any) => (
                    <div 
                      key={session.id} 
                      className={`group p-3 rounded-xl border transition-all cursor-pointer ${currentSessionId === session.id ? 'bg-synora-accent/10 border-synora-accent' : 'bg-synora-surface border-synora-border hover:border-synora-accent/50'}`}
                    >
                      {editingSessionId === session.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            autoFocus
                            type="text" 
                            value={editingTitle} 
                            onChange={(e) => setEditingTitle && setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') renameSession(session.id, editingTitle);
                              if (e.key === 'Escape') setEditingSessionId(null);
                            }}
                            onBlur={() => renameSession(session.id, editingTitle)}
                            className="w-full bg-synora-bg border border-synora-accent rounded px-2 py-1 text-xs text-white outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2" onClick={() => loadSession && loadSession(session.id)}>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate font-medium ${currentSessionId === session.id ? 'text-synora-accent' : 'text-white/90'}`}>
                              {session.title || 'New Chat'}
                            </p>
                            <p className="text-[10px] text-synora-text-secondary mt-1">
                              {new Date(session.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (setEditingSessionId) setEditingSessionId(session.id);
                                if (setEditingTitle) setEditingTitle(session.title || 'New Chat');
                              }}
                              className="p-1 text-synora-text-secondary hover:text-white transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (deleteSession) deleteSession(session.id);
                              }}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-8 px-2 text-xs text-synora-text-secondary">
                      No past conversations.
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 glass-panel overflow-hidden flex flex-col h-full border-synora-accent/20 shadow-2xl rounded-2xl">
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
                          code: CodeBlock,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-synora-accent pl-4 italic text-synora-text-secondary my-4" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      
                      {msg.agentLogs && msg.agentLogs.length > 0 && (
                        <div className="mt-4 bg-synora-bg border border-synora-border rounded-xl overflow-hidden">
                          <details className="group">
                            <summary className="flex items-center gap-2 p-3 cursor-pointer text-xs font-bold text-synora-accent hover:bg-synora-surface/50 transition-colors list-none select-none">
                              <BrainCircuit className="w-4 h-4" /> Agentic Workflow ({msg.agentLogs.length} steps)
                              <span className="ml-auto transform group-open:rotate-180 transition-transform">Γû╝</span>
                            </summary>
                            <div className="p-3 pt-0 border-t border-synora-border space-y-2">
                              {msg.agentLogs.map((log, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  {log.status === 'done' ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                  ) : log.status === 'pending' ? (
                                    <Loader2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-spin" />
                                  ) : (
                                    <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <p className="font-bold text-xs text-synora-text-secondary">{log.action}</p>
                                    <p className="text-white/90 leading-tight mt-0.5">{log.message}</p>
                                  </div>
                                </div>
                              ))}
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
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-synora-surface border-t border-synora-border shrink-0">
                <div className="flex items-center justify-between mb-2 px-2">
                  <div className="flex items-center gap-4">
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
          )}

          
    </>
  );
};