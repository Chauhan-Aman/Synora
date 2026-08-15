import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Link, Type, Loader2, CheckCircle, BrainCircuit, Hash, Box, MessageSquare, Send, Network, List } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

type InputType = 'URL' | 'TEXT';
type Tab = 'CAPTURE' | 'KNOWLEDGE' | 'CHAT';

interface Topic { id: string; name: string; count: number; }
interface Entity { id: string; name: string; type: string; count: number; }
interface ChatMessage { role: 'user' | 'assistant'; content: string; sources?: string[]; }

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('KNOWLEDGE');
  
  // Capture State
  const [inputType, setInputType] = useState<InputType>('URL');
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [artifactId, setArtifactId] = useState<string | null>(null);

  // Knowledge State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const [knowledgeView, setKnowledgeView] = useState<'LIST' | 'GRAPH'>('GRAPH');

  // Chat State
  const [chatQuery, setChatQuery] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: "Hi! I'm your local AI. Ask me anything about the links and notes you've captured!"
  }]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'KNOWLEDGE') fetchKnowledge();
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const fetchKnowledge = async () => {
    setIsLoadingKnowledge(true);
    try {
      const [topicsRes, entitiesRes, graphRes] = await Promise.all([
        fetch('http://localhost:3000/knowledge/topics'),
        fetch('http://localhost:3000/knowledge/entities'),
        fetch('http://localhost:3000/knowledge/graph')
      ]);
      setTopics(await topicsRes.json());
      setEntities(await entitiesRes.json());
      setGraphData(await graphRes.json());
    } catch (error) {
      console.error("Failed to fetch knowledge graph", error);
    } finally {
      setIsLoadingKnowledge(false);
    }
  };

  const handleCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsSubmitting(true);
    setStatus('idle');
    setArtifactId(null);

    try {
      const response = await fetch('http://localhost:3000/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: inputType,
          [inputType === 'URL' ? 'sourceUrl' : 'content']: inputValue,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit capture');

      const data = await response.json();
      setArtifactId(data.artifactId);
      setStatus('success');
      setInputValue('');
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || isChatting) return;

    const userMessage = chatQuery;
    setChatQuery('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatting(true);

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage }),
      });

      if (!response.ok) throw new Error('Failed to fetch chat response');

      const data = await response.json();
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        sources: data.sources 
      }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: "Oops! Something went wrong trying to connect to the local AI. Ensure Ollama is running." 
      }]);
    } finally {
      setIsChatting(false);
    }
  };

  // Custom node paint for the force graph
  const renderNode = (node: any, ctx: any, globalScale: number) => {
    const label = node.name;
    const fontSize = 14 / globalScale;
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8); // padding

    // Draw pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(
      node.x - bckgDimensions[0] / 2, 
      node.y - bckgDimensions[1] / 2, 
      bckgDimensions[0], 
      bckgDimensions[1], 
      5 / globalScale // border radius
    );
    ctx.fill();

    // Draw pill border based on group
    ctx.lineWidth = 1.5 / globalScale;
    if (node.group === 'artifact') ctx.strokeStyle = '#10b981'; // emerald
    else if (node.group === 'topic') ctx.strokeStyle = '#8b5cf6'; // violet
    else ctx.strokeStyle = '#3b82f6'; // blue
    ctx.stroke();

    // Draw text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, node.x, node.y);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden h-screen">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-synora-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-synora-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-5xl z-10 flex flex-col h-full animate-fade-in">
        
        {/* Header & Tabs */}
        <div className="text-center mb-6 w-full shrink-0">
          <div className="inline-flex items-center justify-center p-3 bg-synora-surface rounded-2xl mb-4 border border-synora-border shadow-lg">
            <Sparkles className="w-8 h-8 text-synora-accent" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Synora Engine</h1>
          
          <div className="flex bg-synora-surface/50 backdrop-blur-md p-1.5 rounded-2xl border border-synora-border shadow-xl w-full mx-auto max-w-2xl">
            {(['CAPTURE', 'KNOWLEDGE', 'CHAT'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-synora-bg text-synora-text-primary shadow-md border border-synora-border/50 scale-100'
                    : 'text-synora-text-secondary hover:text-synora-text-primary scale-95'
                }`}
              >
                {tab === 'CAPTURE' && <Link className="w-4 h-4" />}
                {tab === 'KNOWLEDGE' && <BrainCircuit className="w-4 h-4" />}
                {tab === 'CHAT' && <MessageSquare className="w-4 h-4" />}
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="w-full flex-1 overflow-hidden animate-fade-in flex flex-col min-h-0">
          
          {/* CAPTURE TAB */}
          {activeTab === 'CAPTURE' && (
            <div className="max-w-2xl w-full mx-auto glass-panel p-6 md:p-8 shrink-0 mt-8">
              <div className="flex bg-synora-bg p-1 rounded-xl mb-6">
                <button onClick={() => setInputType('URL')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-200 ${inputType === 'URL' ? 'bg-synora-surface text-synora-text-primary shadow-sm' : 'text-synora-text-secondary hover:text-synora-text-primary'}`}>
                  <Link className="w-4 h-4" /> URL Link
                </button>
                <button onClick={() => setInputType('TEXT')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-200 ${inputType === 'TEXT' ? 'bg-synora-surface text-synora-text-primary shadow-sm' : 'text-synora-text-secondary hover:text-synora-text-primary'}`}>
                  <Type className="w-4 h-4" /> Raw Text
                </button>
              </div>

              <form onSubmit={handleCaptureSubmit} className="space-y-4">
                {inputType === 'URL' ? (
                  <input type="url" placeholder="https://example.com/article" className="glass-input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={isSubmitting} required />
                ) : (
                  <textarea placeholder="Paste your text snippet here..." className="glass-input min-h-[120px] resize-y" value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={isSubmitting} required />
                )}
                <button type="submit" disabled={isSubmitting || !inputValue.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
                  {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Sparkles className="w-5 h-5" /> Send to Synora</>}
                </button>
              </form>

              {status === 'success' && (
                <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 animate-fade-in text-emerald-400">
                  <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Successfully captured!</p>
                    <p className="text-sm opacity-80 mt-1">Artifact queued in backend (ID: {artifactId?.split('-')[0]}).</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KNOWLEDGE TAB */}
          {activeTab === 'KNOWLEDGE' && (
            <div className="w-full glass-panel p-6 md:p-8 flex flex-col h-full">
              
              <div className="flex justify-between items-center mb-6 shrink-0 border-b border-synora-border pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BrainCircuit className="w-6 h-6 text-synora-accent" /> Your Knowledge
                </h2>
                
                <div className="flex bg-synora-bg p-1 rounded-xl">
                  <button onClick={() => setKnowledgeView('LIST')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${knowledgeView === 'LIST' ? 'bg-synora-surface text-synora-text-primary shadow-sm' : 'text-synora-text-secondary hover:text-synora-text-primary'}`}>
                    <List className="w-4 h-4" /> List
                  </button>
                  <button onClick={() => setKnowledgeView('GRAPH')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${knowledgeView === 'GRAPH' ? 'bg-synora-surface text-synora-text-primary shadow-sm' : 'text-synora-text-secondary hover:text-synora-text-primary'}`}>
                    <Network className="w-4 h-4" /> Graph
                  </button>
                </div>
              </div>

              {isLoadingKnowledge ? (
                <div className="flex flex-col items-center justify-center flex-1 text-synora-text-secondary">
                  <Loader2 className="w-10 h-10 animate-spin text-synora-accent mb-4" />
                  <p>Loading Knowledge Graph...</p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 w-full relative rounded-xl overflow-hidden">
                  {knowledgeView === 'LIST' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full overflow-y-auto pr-2">
                      <div>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-synora-text-secondary">
                          <Hash className="w-5 h-5 text-synora-accent" /> Extracted Topics
                        </h3>
                        {topics.length === 0 ? (
                          <p className="text-synora-text-secondary py-8 text-center bg-synora-bg/30 rounded-xl border border-synora-border/50">No topics extracted yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-3">
                            {topics.map(topic => (
                              <div key={topic.id} className="group flex items-center gap-2 bg-synora-surface border border-synora-border hover:border-synora-accent/50 rounded-full px-4 py-2 transition-all hover:-translate-y-0.5">
                                <span className="font-medium">{topic.name}</span>
                                <span className="bg-synora-bg text-synora-text-secondary text-xs rounded-full px-2 py-0.5 border border-synora-border">{topic.count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-synora-text-secondary">
                          <Box className="w-5 h-5 text-synora-accent" /> Named Entities
                        </h3>
                        {entities.length === 0 ? (
                          <p className="text-synora-text-secondary py-8 text-center bg-synora-bg/30 rounded-xl border border-synora-border/50">No entities extracted yet.</p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {entities.map(entity => (
                              <div key={entity.id} className="flex justify-between bg-synora-surface border border-synora-border rounded-xl p-3">
                                <div className="flex flex-col">
                                  <span className="font-bold">{entity.name}</span>
                                  <span className="text-xs text-synora-accent uppercase mt-0.5">{entity.type}</span>
                                </div>
                                <div className="text-sm bg-synora-bg px-3 py-1 rounded-full border border-synora-border">{entity.count}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-synora-bg/50 border border-synora-border rounded-xl absolute inset-0">
                      <ForceGraph2D
                        graphData={graphData}
                        width={900}
                        height={600}
                        nodeRelSize={6}
                        dagMode="lr"
                        dagLevelDistance={200}
                        linkDirectionalArrowLength={4}
                        linkDirectionalArrowRelPos={1}
                        nodeCanvasObject={renderNode}
                        nodePointerAreaPaint={(node, color, ctx) => {
                          ctx.fillStyle = color;
                          const bckgDimensions = [ctx.measureText(node.name).width + 20, 20];
                          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
                        }}
                        linkColor={() => 'rgba(148, 163, 184, 0.2)'}
                        linkWidth={1.5}
                        d3VelocityDecay={0.3}
                        cooldownTicks={100}
                        onNodeClick={(node) => {
                          // Could implement selection or opening of details here
                          console.log('Clicked node', node);
                        }}
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-synora-text-secondary font-medium">Artifacts</span></div>
                         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500"></div><span className="text-xs text-synora-text-secondary font-medium">Topics</span></div>
                         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs text-synora-text-secondary font-medium">Entities</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CHAT TAB (RAG) */}
          {activeTab === 'CHAT' && (
            <div className="w-full max-w-4xl mx-auto glass-panel overflow-hidden flex flex-col h-full border-synora-accent/20 shadow-2xl shadow-synora-accent/5 mt-8">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 min-h-0">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 ${
                      msg.role === 'user' 
                        ? 'bg-synora-accent text-white rounded-tr-sm' 
                        : 'bg-synora-surface border border-synora-border rounded-tl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      
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
                      <span className="text-synora-text-secondary animate-pulse">Searching your knowledge graph...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-synora-surface border-t border-synora-border shrink-0">
                <form onSubmit={handleChatSubmit} className="relative">
                  <input
                    type="text"
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    placeholder="Ask a question about the things you've captured..."
                    className="glass-input pr-12 w-full bg-synora-bg"
                    disabled={isChatting}
                  />
                  <button
                    type="submit"
                    disabled={isChatting || !chatQuery.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-synora-accent hover:bg-synora-accent-hover text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default App;
