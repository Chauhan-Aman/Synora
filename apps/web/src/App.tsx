import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Link, Type, Loader2, CheckCircle, BrainCircuit, Hash, Box, MessageSquare, Send, Network, List, X, LogOut, Key, GraduationCap, Compass, FileText, Mic, MicOff, VolumeX } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import { RadialMenu, type RadialMenuItem } from './components/RadialMenu';

type InputType = 'URL' | 'TEXT' | 'FILE';
type Tab = 'CAPTURE' | 'KNOWLEDGE' | 'LEARN' | 'CHAT' | 'DISCOVER';

interface Topic { id: string; name: string; count: number; }
interface Entity { id: string; name: string; type: string; count: number; }
interface Artifact { id: string; title?: string; sourceUrl: string; type: string; status: string; content?: string; summary?: string; createdAt: string; topics: {id: string, name: string}[] }
interface ChatMessage { role: 'user' | 'assistant'; content: string; sources?: string[]; }

function App() {
  // Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem('synora_token'));
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('CAPTURE');
  
  // Capture State
  const [inputType, setInputType] = useState<InputType>('URL');
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [artifactId, setArtifactId] = useState<string | null>(null);

  // Knowledge State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const [knowledgeView, setKnowledgeView] = useState<'LIST' | 'GRAPH'>('LIST');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const [activeRadialCategory, setActiveRadialCategory] = useState<{ id: string, title: string, items: RadialMenuItem[] } | null>(null);
  const [wikiSummary, setWikiSummary] = useState<string | null>(null);
  const [isFetchingWiki, setIsFetchingWiki] = useState(false);

  useEffect(() => {
    setWikiSummary(null);
  }, [selectedNode]);

  const fetchWiki = async (topic: string) => {
    setIsFetchingWiki(true);
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
      const data = await res.json();
      if (data.extract) {
        setWikiSummary(data.extract);
      } else {
        setWikiSummary("No article found for this concept on Wikipedia.");
      }
    } catch (e) {
      setWikiSummary("Failed to fetch article.");
    }
    setIsFetchingWiki(false);
  };

  const radialCategories = useMemo(() => {
    const cats: Record<string, RadialMenuItem[]> = {
      'Documents': artifacts.map(a => ({ id: a.id, label: a.title || a.sourceUrl || 'Document', color: '#10b981', data: { ...a, isArtifact: true } })),
      'Concepts': topics.map(t => ({ id: t.id, label: t.name, count: t.count, color: '#a855f7', data: { ...t, group: 'topics' } }))
    };
    
    entities.forEach(e => {
      const type = e.type || 'OTHER';
      if (!cats[type]) cats[type] = [];
      cats[type].push({ id: e.id, label: e.name, count: e.count, color: '#3b82f6', data: { ...e, group: 'entities' } });
    });

    return Object.entries(cats)
      .filter(([_, items]) => items.length > 0)
      .map(([title, items]) => ({
        id: title,
        title: title === 'Concepts' ? 'Concepts & Topics' : (title === 'Documents' ? 'Original Documents' : title.charAt(0) + title.slice(1).toLowerCase() + 's'),
        items: title === 'Documents' ? items : items.sort((a, b) => (b.count || 0) - (a.count || 0))
      }));
  }, [topics, entities, artifacts]);

  // Resize logic for Graph
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!graphContainerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      setGraphDimensions({
        width: entries[0].contentRect.width,
        height: entries[0].contentRect.height
      });
    });
    resizeObserver.observe(graphContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [knowledgeView, activeTab, token]);

  // Chat State
  const [chatQuery, setChatQuery] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: "Hi! I'm your local AI. Ask me anything about the links and notes you've captured in your private Knowledge Graph!"
  }]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Learn State
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoadingLearn, setIsLoadingLearn] = useState(false);

  // Discover State
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingDiscover, setIsLoadingDiscover] = useState(false);
  const [exploringId, setExploringId] = useState<string | null>(null);

  useEffect(() => {
    if (token && activeTab === 'KNOWLEDGE') fetchKnowledge();
    if (token && activeTab === 'LEARN') fetchLearn();
    if (token && activeTab === 'DISCOVER') fetchDiscover();
  }, [activeTab, token]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-200);
      fgRef.current.d3Force('link').distance(120);
    }
  }, [graphData, knowledgeView, activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        setIsListening(false);
      };
      
      recognition.onresult = (e: any) => {
        let interimTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            setChatQuery(prev => prev + transcript + ' ');
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

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
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    
    // Clean text: remove URLs, brackets, formatting
    const cleanText = text.replace(/\[.*?\]\s*\(.*?\)/g, '').replace(/https?:\/\/[^\s]+/g, '').replace(/[#*`]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const fetchWithAuth = async (url: string, options: any = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      handleLogout();
      throw new Error('Unauthorized');
    }
    return res;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');

    try {
      const endpoint = authMode === 'LOGIN' ? '/auth/login' : '/auth/register';
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed');

      localStorage.setItem('synora_token', data.access_token);
      setToken(data.access_token);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('synora_token');
    setToken(null);
    setTopics([]);
    setEntities([]);
    setGraphData({ nodes: [], links: [] });
  };

  const fetchKnowledge = async () => {
    setIsLoadingKnowledge(true);
    try {
      const [topicsRes, entitiesRes, graphRes, artifactsRes] = await Promise.all([
        fetchWithAuth('http://localhost:3000/knowledge/topics'),
        fetchWithAuth('http://localhost:3000/knowledge/entities'),
        fetchWithAuth('http://localhost:3000/knowledge/graph'),
        fetchWithAuth('http://localhost:3000/knowledge/artifacts')
      ]);
      setTopics(await topicsRes.json());
      setEntities(await entitiesRes.json());
      setGraphData(await graphRes.json());
      setArtifacts(await artifactsRes.json());
    } catch (err: any) {
      console.error("Failed to fetch knowledge graph", err);
    } finally {
      setIsLoadingKnowledge(false);
    }
  };

  const fetchLearn = async () => {
    setIsLoadingLearn(true);
    try {
      const res = await fetchWithAuth('http://localhost:3000/learn/due');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch flashcards');
      setFlashcards(data);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLearn(false);
    }
  };

  const fetchDiscover = async () => {
    setIsLoadingDiscover(true);
    try {
      const res = await fetchWithAuth('http://localhost:3000/discovery/feed');
      if (!res.ok) throw new Error('Failed to fetch discovery feed');
      setRecommendations(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDiscover(false);
    }
  };

  const handleExplore = async (id: string) => {
    setExploringId(id);
    try {
      const res = await fetchWithAuth(`http://localhost:3000/discovery/${id}/explore`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to explore');
      setRecommendations(prev => prev.filter(r => r.id !== id));
      alert("Artifact generated and sent for processing! Check your Knowledge Graph soon.");
    } catch (err) {
      console.error(err);
    } finally {
      setExploringId(null);
    }
  };

  const handleReview = async (score: number) => {
    const card = flashcards[currentCardIndex];
    if (!card) return;

    try {
      await fetchWithAuth(`http://localhost:3000/learn/review/${card.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      });
      
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        fetchLearn();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputType === 'FILE' && !selectedFile) return;
    if (inputType !== 'FILE' && !inputValue.trim()) return;

    setIsSubmitting(true);
    setStatus('idle');
    setArtifactId(null);

    try {
      let response;
      if (inputType === 'FILE') {
        const formData = new FormData();
        formData.append('file', selectedFile as File);
        
        response = await fetchWithAuth('http://localhost:3000/capture/upload', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetchWithAuth('http://localhost:3000/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: inputType,
            [inputType === 'URL' ? 'sourceUrl' : 'content']: inputValue,
          }),
        });
      }

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
      const response = await fetchWithAuth('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, history: chatHistory }),
      });

      if (!response.ok) throw new Error('Failed to fetch chat response');

      const data = await response.json();
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        sources: data.sources 
      }]);
      
      // Auto-speak response
      speakText(data.response);
      
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
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(
      node.x - bckgDimensions[0] / 2, 
      node.y - bckgDimensions[1] / 2, 
      bckgDimensions[0], 
      bckgDimensions[1], 
      5 / globalScale 
    );
    ctx.fill();

    ctx.lineWidth = 1.5 / globalScale;
    if (node.group === 'artifact') ctx.strokeStyle = '#10b981';
    else if (node.group === 'topic') ctx.strokeStyle = '#8b5cf6';
    else ctx.strokeStyle = '#3b82f6';
    
    if (selectedNode && selectedNode.id === node.id) {
      ctx.lineWidth = 3 / globalScale;
      ctx.strokeStyle = '#f59e0b';
    }
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, node.x, node.y);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-synora-accent/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="glass-panel w-full max-w-md p-8 relative z-10 animate-fade-in shadow-2xl border-synora-border/50">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-synora-surface rounded-2xl border border-synora-border shadow-lg">
              <Sparkles className="w-10 h-10 text-synora-accent" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-2">Synora Engine</h2>
          <p className="text-synora-text-secondary text-center mb-8">Your private knowledge operating system</p>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-synora-text-secondary mb-1">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="glass-input w-full bg-synora-bg/50" 
                placeholder="you@example.com"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-synora-text-secondary mb-1">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="glass-input w-full bg-synora-bg/50" 
                placeholder="••••••••"
                required 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isAuthenticating} 
              className="btn-primary w-full mt-6 py-3 flex justify-center items-center gap-2"
            >
              {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
              {authMode === 'LOGIN' ? 'Access Knowledge Graph' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-synora-text-secondary">
            {authMode === 'LOGIN' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => {
                setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                setAuthError('');
              }} 
              className="text-synora-accent hover:underline font-medium"
            >
              {authMode === 'LOGIN' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden h-screen">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-synora-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-synora-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="absolute top-6 right-6 z-50">
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-synora-surface border border-synora-border rounded-lg text-synora-text-secondary hover:text-white hover:border-synora-accent/50 transition-colors shadow-lg">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="w-full max-w-5xl z-10 flex flex-col h-full animate-fade-in">
        
        {/* Header & Tabs */}
        <div className="text-center mb-6 w-full shrink-0">
          <div className="inline-flex items-center justify-center p-3 bg-synora-surface rounded-2xl mb-4 border border-synora-border shadow-lg">
            <Sparkles className="w-8 h-8 text-synora-accent" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Synora Engine</h1>
          
          <div className="flex bg-synora-surface/50 backdrop-blur-md p-1.5 rounded-2xl border border-synora-border shadow-xl w-full mx-auto max-w-2xl">
            {(['CAPTURE', 'KNOWLEDGE', 'LEARN', 'CHAT', 'DISCOVER'] as Tab[]).map((tab) => (
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
                {tab === 'LEARN' && <GraduationCap className="w-4 h-4" />}
                {tab === 'CHAT' && <MessageSquare className="w-4 h-4" />}
                {tab === 'DISCOVER' && <Compass className="w-4 h-4" />}
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
                <button onClick={() => setInputType('FILE')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-200 ${inputType === 'FILE' ? 'bg-synora-surface text-synora-text-primary shadow-sm' : 'text-synora-text-secondary hover:text-synora-text-primary'}`}>
                  <Box className="w-4 h-4" /> File
                </button>
              </div>

              <form onSubmit={handleCaptureSubmit} className="space-y-4">
                {inputType === 'URL' ? (
                  <input type="url" placeholder="https://example.com/article" className="glass-input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={isSubmitting} required />
                ) : inputType === 'TEXT' ? (
                  <textarea placeholder="Paste your text snippet here..." className="glass-input min-h-[120px] resize-y" value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={isSubmitting} required />
                ) : (
                  <div className="glass-input min-h-[120px] flex items-center justify-center border-dashed border-2 hover:border-synora-accent/50 transition-colors relative">
                    <input type="file" accept=".pdf,image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} disabled={isSubmitting} required />
                    <div className="text-center pointer-events-none">
                      <p className="font-medium text-synora-text-primary">{selectedFile ? selectedFile.name : 'Click or Drag file to upload'}</p>
                      <p className="text-xs text-synora-text-secondary mt-1">Supports PDF, PNG, JPG, WEBP</p>
                    </div>
                  </div>
                )}
                <button type="submit" disabled={isSubmitting || (inputType === 'FILE' ? !selectedFile : !inputValue.trim())} className="btn-primary w-full flex items-center justify-center gap-2">
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
            <div className="w-full glass-panel p-6 md:p-8 flex flex-col h-full relative">
              
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
                <div className="flex-1 min-h-0 w-full relative rounded-xl overflow-hidden" ref={graphContainerRef}>
                  {knowledgeView === 'LIST' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 h-full overflow-y-auto pr-2">
                      {/* Documents / Artifacts Column */}
                      <div>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-synora-text-secondary">
                          <FileText className="w-5 h-5 text-synora-accent" /> Documents
                        </h3>
                        {artifacts.length === 0 ? (
                          <p className="text-synora-text-secondary py-8 text-center bg-synora-bg/30 rounded-xl border border-synora-border/50">No documents captured yet.</p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {artifacts.map(artifact => (
                              <div 
                                key={artifact.id} 
                                onClick={() => setSelectedArtifact(artifact)}
                                className="flex flex-col bg-synora-surface border border-synora-border hover:border-synora-accent/50 rounded-xl p-4 cursor-pointer hover:-translate-y-0.5 transition-all group"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${artifact.type === 'URL' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : artifact.type === 'PDF' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                    {artifact.type}
                                  </span>
                                  <span className="text-xs text-synora-text-secondary">{new Date(artifact.createdAt).toLocaleDateString()}</span>
                                </div>
                                <span className="font-bold text-white mb-2 line-clamp-2 leading-snug group-hover:text-synora-accent transition-colors">
                                  {artifact.title || (artifact.sourceUrl ? artifact.sourceUrl.replace('synora://discovery/', 'Discovery Concept: ') : (artifact.content ? artifact.content.substring(0, 50) + '...' : 'Unknown Document'))}
                                </span>
                                {artifact.summary && (
                                  <p className="text-xs text-synora-text-secondary line-clamp-2 leading-relaxed">{artifact.summary}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Knowledge Categories for Radial Menu */}
                      <div className="md:col-span-1 lg:col-span-2">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-synora-text-secondary">
                          <Compass className="w-5 h-5 text-synora-accent" /> Knowledge Hub
                        </h3>
                        {radialCategories.length === 0 ? (
                          <p className="text-synora-text-secondary py-8 text-center bg-synora-bg/30 rounded-xl border border-synora-border/50">Your knowledge graph is empty.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {radialCategories.map((cat: any) => (
                              <button 
                                key={cat.id}
                                onClick={() => setActiveRadialCategory(cat)}
                                className="group flex flex-col bg-synora-surface border border-synora-border hover:border-synora-accent/80 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-synora-accent/10 relative overflow-hidden"
                              >
                                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-synora-accent/10 rounded-full blur-2xl group-hover:bg-synora-accent/20 transition-all"></div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                  <span className="bg-synora-bg border border-synora-border px-3 py-1 rounded-full text-xs font-bold text-synora-accent tracking-wider">
                                    {cat.items.length} ITEMS
                                  </span>
                                  <div className="w-8 h-8 rounded-full bg-synora-bg border border-synora-border flex items-center justify-center group-hover:scale-110 group-hover:border-synora-accent/50 transition-all">
                                    <Network className="w-4 h-4 text-synora-text-secondary group-hover:text-synora-accent" />
                                  </div>
                                </div>
                                <h4 className="text-xl font-bold text-white text-left relative z-10">{cat.title}</h4>
                                <p className="text-sm text-synora-text-secondary text-left mt-2 relative z-10">Click to explore {cat.id.toLowerCase()} in the radial wheel.</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-synora-bg/50 border border-synora-border rounded-xl absolute inset-0">
                      {graphDimensions.width > 0 && (
                        <ForceGraph2D
                          ref={fgRef}
                          graphData={graphData}
                          width={graphDimensions.width}
                          height={graphDimensions.height}
                          nodeRelSize={6}
                          linkDirectionalArrowLength={4}
                          linkDirectionalArrowRelPos={1}
                          nodeCanvasObject={renderNode}
                          nodePointerAreaPaint={(node, color, ctx) => {
                            ctx.fillStyle = color;
                            const bckgDimensions = [ctx.measureText(node.name).width + 20, 20];
                            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
                          }}
                          linkColor={() => 'rgba(148, 163, 184, 0.3)'}
                          linkWidth={1.5}
                          d3VelocityDecay={0.3}
                          cooldownTicks={100}
                          onNodeClick={(node) => setSelectedNode(node)}
                          onNodeDragEnd={(node) => {
                            node.fx = node.x;
                            node.fy = node.y;
                          }}
                          onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
                        />
                      )}
                      
                      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none bg-synora-surface/80 backdrop-blur px-3 py-2 rounded-lg border border-synora-border">
                         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-synora-text-secondary font-medium">Documents</span></div>
                         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500"></div><span className="text-xs text-synora-text-secondary font-medium">Topics</span></div>
                         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs text-synora-text-secondary font-medium">Entities</span></div>
                      </div>


                    </div>
                  )}

                  {/* Selected Node Details Panel */}
                  {selectedNode && (
                    <div className="absolute top-0 right-0 h-full w-[350px] bg-synora-surface/95 backdrop-blur-xl border-l border-synora-border shadow-2xl p-6 flex flex-col animate-fade-in z-20">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-xs uppercase text-synora-accent font-bold tracking-wider">{selectedNode.group}</span>
                          <h4 className="text-xl font-bold mt-1 text-white leading-tight">{selectedNode.name}</h4>
                        </div>
                        <button onClick={() => setSelectedNode(null)} className="text-synora-text-secondary hover:text-white p-1 bg-synora-bg rounded-lg">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-6">
                        {selectedNode.details && (
                          <div>
                            <h5 className="text-xs font-bold text-synora-text-secondary uppercase mb-2">Summary</h5>
                            <p className="text-sm leading-relaxed">{selectedNode.details}</p>
                          </div>
                        )}
                        {wikiSummary ? (
                          <div className="bg-synora-bg p-4 rounded-xl border border-synora-border">
                            <h5 className="text-xs font-bold text-synora-text-secondary uppercase mb-2 flex items-center gap-2"><Box className="w-4 h-4"/> Wikipedia Article</h5>
                            <p className="text-sm leading-relaxed text-white/90">{wikiSummary}</p>
                          </div>
                        ) : (
                          <button 
                            onClick={() => fetchWiki(selectedNode.name)}
                            disabled={isFetchingWiki}
                            className="w-full bg-synora-surface border border-synora-border hover:border-synora-accent text-synora-text-secondary hover:text-white rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-sm"
                          >
                            {isFetchingWiki ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                            {isFetchingWiki ? "Fetching article..." : "Fetch Wikipedia Article"}
                          </button>
                        )}
                        {selectedNode.sourceUrl && (
                          <div>
                            <h5 className="text-xs font-bold text-synora-text-secondary uppercase mb-2">Source</h5>
                            <a href={selectedNode.sourceUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline break-all">
                              {selectedNode.sourceUrl}
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="pt-4 border-t border-synora-border mt-auto shrink-0">
                        <button 
                          onClick={() => {
                            setChatQuery(`Tell me everything you know about ${selectedNode.name}.`);
                            setActiveTab('CHAT');
                          }} 
                          className="w-full btn-primary flex items-center justify-center gap-2 py-3 shadow-lg shadow-synora-accent/20"
                        >
                          <MessageSquare className="w-5 h-5" /> Chat with AI about this
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Radial Menu Overlay */}
                  {activeRadialCategory && (
                    <RadialMenu 
                      title={activeRadialCategory.title}
                      items={activeRadialCategory.items}
                      onClose={() => setActiveRadialCategory(null)}
                      onSelect={(item) => {
                        if (item.data) {
                          if (item.data.isArtifact) {
                            setSelectedArtifact(item.data);
                          } else {
                            setSelectedNode(item.data);
                          }
                        }
                      }}
                    />
                  )}

                  {/* Artifact Reader Modal */}
                  {selectedArtifact && (
                    <div className="absolute inset-0 bg-synora-bg/95 backdrop-blur-xl z-50 flex flex-col animate-fade-in rounded-xl border border-synora-border overflow-hidden">
                      <div className="flex items-center justify-between p-6 border-b border-synora-border/50 shrink-0">
                        <div>
                          <span className="text-xs font-bold px-2 py-1 rounded-full border bg-synora-surface text-synora-accent border-synora-accent/30 mb-2 inline-block">
                            {selectedArtifact.type}
                          </span>
                          <h2 className="text-2xl font-bold text-white max-w-2xl truncate">
                            {selectedArtifact.title || (selectedArtifact.sourceUrl ? selectedArtifact.sourceUrl.replace('synora://discovery/', 'Discovery Concept: ') : 'Unknown Document')}
                          </h2>
                          <p className="text-sm text-synora-text-secondary mt-1">{new Date(selectedArtifact.createdAt).toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedArtifact(null)} 
                          className="glass-button p-2"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full flex flex-col gap-8 pb-16">
                        {selectedArtifact.summary && (
                          <div className="bg-synora-accent/10 border border-synora-accent/20 p-6 rounded-2xl shrink-0">
                            <h3 className="text-sm font-bold text-synora-accent uppercase mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4"/> AI Summary</h3>
                            <p className="text-lg leading-relaxed text-white/90">{selectedArtifact.summary}</p>
                          </div>
                        )}
                        <div className="shrink-0">
                          <h3 className="text-sm font-bold text-synora-text-secondary uppercase mb-4 flex items-center gap-2"><FileText className="w-4 h-4"/> Full Document Content</h3>
                          <div className="bg-synora-surface border border-synora-border p-6 rounded-2xl font-serif text-lg leading-loose text-white/80 whitespace-pre-wrap">
                            {selectedArtifact.content || "No content available. It might still be processing, or this was a URL scrape without raw content saved."}
                          </div>
                        </div>
                        {selectedArtifact.topics.length > 0 && (
                          <div className="shrink-0">
                            <h3 className="text-sm font-bold text-synora-text-secondary uppercase mb-4 flex items-center gap-2"><Hash className="w-4 h-4"/> Topics in this Document</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedArtifact.topics.map(t => (
                                <span key={t.id} className="bg-synora-surface border border-synora-border px-3 py-1.5 rounded-full text-sm">
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === 'LEARN' && (
            <div className="w-full max-w-3xl mx-auto flex flex-col h-full mt-8 animate-fade-in px-4">
              {isLoadingLearn ? (
                 <div className="flex flex-col items-center justify-center flex-1 text-synora-text-secondary glass-panel rounded-xl">
                   <Loader2 className="w-10 h-10 animate-spin text-synora-accent mb-4" />
                   <p>Loading your learning journey...</p>
                 </div>
              ) : flashcards.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">You're all caught up!</h2>
                  <p className="text-synora-text-secondary max-w-md">There are no flashcards due for review right now. Capture more knowledge or check back tomorrow.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center h-full max-h-[600px] w-full">
                  <div className="w-full flex justify-between items-center mb-6 px-2">
                    <span className="text-synora-text-secondary font-medium">Card {currentCardIndex + 1} of {flashcards.length}</span>
                  </div>
                  
                  <div 
                    className="relative w-full flex-1 perspective-1000 mb-8 cursor-pointer group"
                    onClick={() => !isFlipped && setIsFlipped(true)}
                  >
                    <div className={`w-full h-full transition-transform duration-500 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                      
                      {/* Front */}
                      <div className="absolute inset-0 backface-hidden glass-panel border-synora-accent/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-synora-accent/40 transition-colors shadow-xl">
                        <div className="text-synora-accent font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2"><GraduationCap className="w-4 h-4"/> Question</div>
                        <h3 className="text-2xl md:text-3xl font-medium leading-relaxed text-white">{flashcards[currentCardIndex]?.question}</h3>
                        <p className="absolute bottom-8 text-synora-text-secondary text-sm animate-pulse">Click to reveal answer</p>
                      </div>

                      {/* Back */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 glass-panel border-emerald-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
                        <div className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Answer</div>
                        <p className="text-xl md:text-2xl font-medium leading-relaxed text-white">{flashcards[currentCardIndex]?.answer}</p>
                      </div>

                    </div>
                  </div>

                  <div className={`w-full transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <div className="grid grid-cols-4 gap-3 md:gap-4">
                      <button onClick={() => handleReview(1)} className="glass-panel hover:bg-red-500/20 hover:border-red-500/50 text-red-400 border-red-500/20 py-4 rounded-xl flex flex-col items-center gap-1 transition-all group">
                        <span className="font-bold text-lg group-hover:scale-110 transition-transform">Forgot</span>
                        <span className="text-xs opacity-70">Soon</span>
                      </button>
                      <button onClick={() => handleReview(3)} className="glass-panel hover:bg-orange-500/20 hover:border-orange-500/50 text-orange-400 border-orange-500/20 py-4 rounded-xl flex flex-col items-center gap-1 transition-all group">
                        <span className="font-bold text-lg group-hover:scale-110 transition-transform">Hard</span>
                        <span className="text-xs opacity-70">Later</span>
                      </button>
                      <button onClick={() => handleReview(4)} className="glass-panel hover:bg-blue-500/20 hover:border-blue-500/50 text-blue-400 border-blue-500/20 py-4 rounded-xl flex flex-col items-center gap-1 transition-all group">
                        <span className="font-bold text-lg group-hover:scale-110 transition-transform">Good</span>
                        <span className="text-xs opacity-70">Tomorrow</span>
                      </button>
                      <button onClick={() => handleReview(5)} className="glass-panel hover:bg-emerald-500/20 hover:border-emerald-500/50 text-emerald-400 border-emerald-500/20 py-4 rounded-xl flex flex-col items-center gap-1 transition-all group">
                        <span className="font-bold text-lg group-hover:scale-110 transition-transform">Easy</span>
                        <span className="text-xs opacity-70">Days</span>
                      </button>
                    </div>
                  </div>
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
          )}

          {/* DISCOVER TAB */}
          {activeTab === 'DISCOVER' && (
            <div className="w-full max-w-5xl mx-auto mt-8 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-white tracking-tight">
                    <Compass className="w-8 h-8 text-synora-accent" /> Discover
                  </h2>
                  <p className="text-synora-text-secondary mt-2 text-lg">AI-generated concepts tailored to your knowledge graph.</p>
                </div>
                <button 
                  onClick={fetchDiscover} 
                  disabled={isLoadingDiscover}
                  className="glass-button px-4 py-2 flex items-center gap-2"
                >
                  <Sparkles className={`w-4 h-4 text-synora-accent ${isLoadingDiscover ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {isLoadingDiscover && recommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-synora-text-secondary glass-panel rounded-2xl p-12">
                  <Sparkles className="w-12 h-12 animate-pulse text-synora-accent mb-4" />
                  <p className="text-xl">Synthesizing your knowledge...</p>
                  <p className="text-sm mt-2 opacity-70">Llama 3.2 is generating unique concepts based on your graph.</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-synora-text-secondary glass-panel rounded-2xl p-12">
                  <Compass className="w-12 h-12 text-synora-border mb-4" />
                  <p className="text-xl">No recommendations yet.</p>
                  <p className="text-sm mt-2 opacity-70">Capture more knowledge to help the AI understand your taste!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 auto-rows-max gap-6 pb-8">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="glass-panel rounded-2xl grid hover:-translate-y-1 hover:shadow-2xl hover:shadow-synora-accent/10 hover:border-synora-accent/40 transition-all group overflow-hidden">
                      {/* Background Image if available */}
                      {rec.imageUrl && (
                        <>
                          <div 
                            className="col-start-1 row-start-1 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-500 blur-[2px] scale-105"
                            style={{ backgroundImage: `url(${rec.imageUrl})` }}
                          />
                          <div className="col-start-1 row-start-1 bg-gradient-to-t from-synora-bg via-synora-bg/80 to-transparent z-[1]" />
                        </>
                      )}

                      {/* Glow effect contained without clipping the main card content */}
                      <div className="col-start-1 row-start-1 overflow-hidden pointer-events-none z-[2] relative">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-synora-accent/10 rounded-full blur-3xl group-hover:bg-synora-accent/30 transition-all duration-700"></div>
                      </div>
                      
                      <div className="col-start-1 row-start-1 p-6 z-10 flex flex-col">
                        <div className="flex items-center gap-2 mb-4 shrink-0">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-lg backdrop-blur-md ${rec.type === 'SYNTHESIS' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                            {rec.type === 'SYNTHESIS' ? <><Network className="w-3 h-3 inline mr-1"/> Synthesis</> : <><Box className="w-3 h-3 inline mr-1"/> Concept</>}
                          </span>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight shrink-0 drop-shadow-md">{rec.title}</h3>
                        <p className="text-synora-text-secondary group-hover:text-white/90 transition-colors mb-6 text-lg leading-relaxed shrink-0 drop-shadow-md">{rec.description}</p>
                        
                        <div className="mt-auto shrink-0">
                          <div className="bg-synora-surface/60 backdrop-blur-xl rounded-xl p-4 mb-6 border border-synora-border/50 text-sm text-synora-text-secondary flex items-start gap-3 shadow-inner">
                            <BrainCircuit className="w-4 h-4 text-synora-accent shrink-0 mt-0.5 drop-shadow-md" />
                            <p className="drop-shadow-sm">{rec.reasoning}</p>
                          </div>
                          
                          <button 
                            onClick={() => handleExplore(rec.id)}
                            disabled={exploringId === rec.id}
                            className="w-full py-3 bg-synora-accent/90 hover:bg-synora-accent backdrop-blur-md text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-synora-accent/50 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {exploringId === rec.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Fetching Article...</>
                            ) : (
                              <><Sparkles className="w-4 h-4" /> Read Article</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default App;
