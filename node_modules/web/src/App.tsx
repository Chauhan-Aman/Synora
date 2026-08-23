import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Link, Type, Loader2, CheckCircle, BrainCircuit, Hash, Box, MessageSquare, Send, Network, List as ListIcon, X, LogOut, Key, GraduationCap, Compass, FileText, Mic, MicOff, VolumeX, Volume2, Settings, Layers, Plus, ExternalLink } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import { RadialMenu, type RadialMenuItem } from './components/RadialMenu';
import { RichTextEditor } from './components/RichTextEditor';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("React Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#220000', color: '#ffaaaa', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1>React Crashed!</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

type InputType = 'URL' | 'TEXT' | 'FILE' | 'VOICE';
type Tab = 'CAPTURE' | 'KNOWLEDGE' | 'LEARN' | 'CHAT' | 'DISCOVER' | 'CREATE' | 'SETTINGS';

interface Topic { id: string; name: string; count: number; }
interface Entity { id: string; name: string; type: string; count: number; }
interface Artifact { id: string; title?: string; sourceUrl: string; type: string; status: string; content?: string; summary?: string; createdAt: string; topics: {id: string, name: string}[] }
interface ChatMessage { role: 'user' | 'assistant'; content: string; sources?: string[]; agentLogs?: { action: string; status: 'pending'|'done'|'error'; message: string }[]; }

function App() {
  // Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem('synora_token'));
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('CAPTURE');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
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
  const [knowledgeView, setKnowledgeView] = useState<'LIST' | 'GRAPH' | 'INSIGHTS'>('LIST');
  const [showWebSearches, setShowWebSearches] = useState(false);
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

  // Phase 15: Knowledge State
  const [collections, setCollections] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState<{artifactId: string} | null>(null);
  const [showCollections, setShowCollections] = useState(true);


  // Chat State
  const [chatQuery, setChatQuery] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [forceWebSearch, setForceWebSearch] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: "Hi! I'm your local AI. Ask me anything about the links and notes you've captured in your private Knowledge Graph!"
  }]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Learn State
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoadingLearn, setIsLoadingLearn] = useState(false);

  // Discover State
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [nestedRecommendations, setNestedRecommendations] = useState<Record<string, any[]>>({});
  const [tasteProfile, setTasteProfile] = useState<string | null>(null);
  const [isLoadingDiscover, setIsLoadingDiscover] = useState(false);
  const [exploringId, setExploringId] = useState<string | null>(null);
  const [divingId, setDivingId] = useState<string | null>(null);

  // Create State
  const [draftText, setDraftText] = useState("");
  const [draftContext, setDraftContext] = useState<any[]>([]);
  const [isGeneratingParagraph, setIsGeneratingParagraph] = useState(false);
  const [suggestedParagraph, setSuggestedParagraph] = useState<string>("");
  const [revisionPrompt, setRevisionPrompt] = useState<string>("");
  const [isRevising, setIsRevising] = useState(false);
  const draftTimeoutRef = useRef<any>(null);
  const [modelConfig, setModelConfig] = useState(localStorage.getItem('synora_model') || 'llama3.2');

  useEffect(() => {
    localStorage.setItem('synora_model', modelConfig);
  }, [modelConfig]);

  useEffect(() => {
    if (token && activeTab === 'KNOWLEDGE') fetchKnowledge();
    if (token && activeTab === 'LEARN') fetchLearn();
    if (token && activeTab === 'DISCOVER') fetchDiscover();
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab !== 'CREATE' || !token) return;
    
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    
    draftTimeoutRef.current = setTimeout(async () => {
      if (draftText.trim().length < 20) {
        setDraftContext([]);
        return;
      }
      try {
        const res = await fetchWithAuth('http://localhost:3000/create/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft: draftText })
        });
        const data = await res.json();
        setDraftContext(data.context || []);
      } catch (e) {
        console.error(e);
      }
    }, 1500);
    
    return () => clearTimeout(draftTimeoutRef.current);
  }, [draftText, activeTab, token]);

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
            setInputValue(prev => prev + transcript + ' ');
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
      const [topicsRes, entitiesRes, graphRes, artifactsRes, collectionsRes, insightsRes] = await Promise.all([
        fetchWithAuth('http://localhost:3000/knowledge/topics'),
        fetchWithAuth('http://localhost:3000/knowledge/entities'),
        fetchWithAuth('http://localhost:3000/knowledge/graph'),
        fetchWithAuth('http://localhost:3000/knowledge/artifacts'),
        fetchWithAuth('http://localhost:3000/knowledge/collections'),
        fetchWithAuth('http://localhost:3000/knowledge/insights')
      ]);
      const topicsData = await topicsRes.json();
      const entitiesData = await entitiesRes.json();
      const graphDataJson = await graphRes.json();
      const artifactsData = await artifactsRes.json();
      const collectionsData = await collectionsRes.json();
      const insightsData = await insightsRes.json();

      setTopics(topicsRes.ok ? topicsData : []);
      setEntities(entitiesRes.ok ? entitiesData : []);
      setGraphData(graphRes.ok ? graphDataJson : { nodes: [], links: [] });
      setArtifacts(artifactsRes.ok ? artifactsData : []);
      setCollections(collectionsRes.ok ? collectionsData : []);
      setInsights(insightsRes.ok ? insightsData : []);
      
      if (!topicsRes.ok) console.error("Topics Error:", topicsData);
      if (!entitiesRes.ok) console.error("Entities Error:", entitiesData);
      if (!graphRes.ok) console.error("Graph Error:", graphDataJson);
      if (!artifactsRes.ok) console.error("Artifacts Error:", artifactsData);
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
      const [feedRes, profileRes] = await Promise.all([
        fetchWithAuth('http://localhost:3000/discovery/feed'),
        fetchWithAuth('http://localhost:3000/discovery/taste-profile')
      ]);
      if (feedRes.ok) setRecommendations(await feedRes.json());
      if (profileRes.ok) setTasteProfile((await profileRes.json()).profile);
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

  const handleDiveDeeper = async (id: string) => {
    setDivingId(id);
    try {
      const res = await fetchWithAuth(`http://localhost:3000/discovery/${id}/dive-deeper`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to dive deeper');
      const data = await res.json();
      setNestedRecommendations(prev => ({
        ...prev,
        [id]: data
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setDivingId(null);
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
            type: inputType === 'VOICE' ? 'TEXT' : inputType,
            [inputType === 'URL' ? 'sourceUrl' : 'content']: inputValue,
            model: modelConfig
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
        body: JSON.stringify({ query: userMessage, history: chatHistory, forceWebSearch, model: modelConfig }),
      });

      if (!response.ok) throw new Error('Failed to fetch chat response');

      const data = await response.json();
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        sources: data.sources,
        agentLogs: data.agentLogs
      }]);
      
      // Auto-speak response if enabled
      if (isVoiceEnabled) {
        speakText(data.response);
      }
      
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

  const handleGenerateParagraph = async () => {
    if (!draftText.trim() || isGeneratingParagraph) return;
    setIsGeneratingParagraph(true);
    try {
      const res = await fetchWithAuth('http://localhost:3000/create/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftText, context: draftContext, model: modelConfig })
      });
      const data = await res.json();
      if (data.nextParagraph) {
        setSuggestedParagraph(data.nextParagraph);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingParagraph(false);
    }
  };

  const handleApprove = () => {
    setDraftText(prev => {
      // If it's an empty editor, just set the paragraph
      if (!prev || prev === '<p></p>') {
        return `<p>${suggestedParagraph}</p>`;
      }
      
      // If the draft ends with a paragraph tag, inject the new text inside it
      // so that it flows continuously instead of starting a new block.
      const trimmed = prev.trim();
      if (trimmed.endsWith('</p>')) {
        return trimmed.slice(0, -4) + ' ' + suggestedParagraph + '</p>';
      }
      
      return prev + ' ' + suggestedParagraph;
    });
    setSuggestedParagraph("");
    setRevisionPrompt("");
  };

  const handleReject = () => {
    setSuggestedParagraph("");
    setRevisionPrompt("");
  };

  const handleRewrite = async () => {
    if (!suggestedParagraph.trim() || !revisionPrompt.trim() || isRevising) return;
    setIsRevising(true);
    try {
      const res = await fetchWithAuth('http://localhost:3000/create/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftText, suggestedParagraph, instructions: revisionPrompt, context: draftContext, model: modelConfig })
      });
      const data = await res.json();
      if (data.nextParagraph) {
        setSuggestedParagraph(data.nextParagraph);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRevising(false);
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

      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <button 
          onClick={() => setIsSettingsOpen(true)} 
          className="flex items-center justify-center w-10 h-10 bg-synora-surface border border-synora-border rounded-lg text-synora-text-secondary hover:text-white hover:border-synora-accent/50 transition-colors shadow-lg"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
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
          
          <div className="flex bg-synora-surface/50 backdrop-blur-md p-1.5 rounded-2xl border border-synora-border shadow-xl w-full mx-auto max-w-4xl overflow-x-auto custom-scrollbar">
            {(['CAPTURE', 'KNOWLEDGE', 'LEARN', 'CHAT', 'DISCOVER', 'CREATE'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex min-w-[100px] items-center justify-center gap-2 py-3 px-2 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-synora-bg text-synora-text-primary shadow-md border border-synora-border/50 scale-100'
                    : 'text-synora-text-secondary hover:text-synora-text-primary scale-95'
                }`}
              >
                {tab === 'CAPTURE' && <Link className="w-4 h-4 shrink-0" />}
                {tab === 'KNOWLEDGE' && <BrainCircuit className="w-4 h-4 shrink-0" />}
                {tab === 'LEARN' && <GraduationCap className="w-4 h-4 shrink-0" />}
                {tab === 'CHAT' && <MessageSquare className="w-4 h-4 shrink-0" />}
                {tab === 'DISCOVER' && <Compass className="w-4 h-4 shrink-0" />}
                {tab === 'CREATE' && <FileText className="w-4 h-4 shrink-0" />}
                <span className="truncate">{tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
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
                <button onClick={() => setInputType('VOICE')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-200 ${inputType === 'VOICE' ? 'bg-synora-surface text-synora-text-primary shadow-sm text-red-400 hover:text-red-300' : 'text-synora-text-secondary hover:text-red-400/80'}`}>
                  <Mic className="w-4 h-4" /> Voice
                </button>
              </div>

              <form onSubmit={handleCaptureSubmit} className="space-y-4">
                {inputType === 'URL' ? (
                  <input type="url" placeholder="https://example.com/article" className="glass-input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={isSubmitting} required />
                ) : inputType === 'TEXT' ? (
                  <textarea placeholder="Paste your text snippet here..." className="glass-input min-h-[120px] resize-y" value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={isSubmitting} required />
                ) : inputType === 'FILE' ? (
                  <div className="glass-input min-h-[120px] flex items-center justify-center border-dashed border-2 hover:border-synora-accent/50 transition-colors relative">
                    <input type="file" accept=".pdf,image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} disabled={isSubmitting} required />
                    <div className="text-center pointer-events-none">
                      <p className="font-medium text-synora-text-primary">{selectedFile ? selectedFile.name : 'Click or Drag file to upload'}</p>
                      <p className="text-xs text-synora-text-secondary mt-1">Supports PDF, PNG, JPG, WEBP</p>
                    </div>
                  </div>
                ) : (
                  <div className="glass-input min-h-[120px] flex flex-col items-center justify-center relative py-6">
                    {isListening ? (
                      <button type="button" onClick={toggleListening} className="p-4 bg-red-500/20 text-red-500 rounded-full animate-pulse border border-red-500/50">
                        <MicOff className="w-8 h-8" />
                      </button>
                    ) : (
                      <button type="button" onClick={toggleListening} className="p-4 bg-synora-surface hover:bg-synora-bg border border-synora-border text-white rounded-full transition-colors">
                        <Mic className="w-8 h-8" />
                      </button>
                    )}
                    <p className="mt-4 text-sm text-synora-text-secondary">
                      {isListening ? "Listening... click to stop" : "Click to record Voice Note"}
                    </p>
                    {inputValue && (
                      <div className="mt-4 w-full p-3 bg-synora-bg/50 rounded-lg text-sm text-white break-words border border-synora-border/50 max-h-32 overflow-y-auto">
                        {inputValue}
                      </div>
                    )}
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
                    <ListIcon className="w-4 h-4" /> List
                  </button>
                  <button onClick={() => setKnowledgeView('GRAPH')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${knowledgeView === 'GRAPH' ? 'bg-synora-surface text-synora-text-primary shadow-sm' : 'text-synora-text-secondary hover:text-synora-text-primary'}`}>
                    <Network className="w-4 h-4" /> Graph
                  </button>
                  <button onClick={() => setKnowledgeView('INSIGHTS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${knowledgeView === 'INSIGHTS' ? 'bg-synora-surface text-synora-text-primary shadow-sm' : 'text-synora-text-secondary hover:text-synora-text-primary'}`}>
                    <Sparkles className="w-4 h-4" /> Insights
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
                    <div className={`grid grid-cols-1 gap-6 h-full overflow-y-auto custom-scrollbar pr-2 ${
                      showCollections 
                        ? 'lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr]' 
                        : 'lg:grid-cols-[1fr_1.5fr]'
                    }`}>
                      {/* Collections Column */}
                      {showCollections && (
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-synora-text-secondary whitespace-nowrap">
                            <Layers className="w-5 h-5 text-synora-accent shrink-0" /> 
                            <span className="truncate">Collections</span>
                            <div className="ml-auto flex items-center gap-1 shrink-0">
                              <button onClick={() => setShowNewCollectionModal(true)} className="text-xs px-2 py-1 bg-synora-accent/20 text-synora-accent rounded-lg hover:bg-synora-accent hover:text-white transition-colors" title="New Collection">
                                <Plus className="w-4 h-4" />
                              </button>
                              <button onClick={() => setShowCollections(false)} className="text-xs px-2 py-1 bg-synora-surface border border-synora-border text-synora-text-secondary rounded-lg hover:bg-synora-bg hover:text-white transition-colors" title="Hide Collections">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </h3>
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => setSelectedCollectionId(null)}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${selectedCollectionId === null ? 'bg-synora-surface border-synora-accent/50 text-white shadow-sm' : 'bg-synora-bg border-synora-border text-synora-text-secondary hover:border-synora-accent/30 hover:text-white'}`}
                          >
                            <span className="font-medium truncate mr-2">All Documents</span>
                            <span className="bg-synora-bg px-2 py-0.5 rounded-full text-[10px] shrink-0">{artifacts.length}</span>
                          </button>
                          {collections.map(col => (
                            <button 
                              key={col.id}
                              onClick={() => setSelectedCollectionId(col.id)}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${selectedCollectionId === col.id ? 'bg-synora-surface border-synora-accent/50 text-white shadow-sm' : 'bg-synora-bg border-synora-border text-synora-text-secondary hover:border-synora-accent/30 hover:text-white'}`}
                            >
                              <span className="font-medium truncate mr-2">{col.name}</span>
                              <span className="bg-synora-bg px-2 py-0.5 rounded-full text-[10px] shrink-0">{col.artifacts?.length || 0}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      )}


                      {/* Documents / Artifacts Column */}
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-synora-text-secondary whitespace-nowrap">
                          {!showCollections && (
                            <button onClick={() => setShowCollections(true)} className="mr-2 p-1 bg-synora-surface border border-synora-border rounded-lg hover:border-synora-accent/50 text-synora-text-secondary hover:text-white transition-colors shrink-0" title="Show Collections">
                              <Layers className="w-5 h-5" />
                            </button>
                          )}
                          <FileText className="w-5 h-5 text-synora-accent shrink-0" /> 
                          <span className="truncate">Documents</span>
                          <button 
                            onClick={() => setShowWebSearches(!showWebSearches)}
                            className="ml-auto text-xs px-3 py-1 bg-synora-surface border border-synora-border rounded-lg hover:border-synora-accent/50 text-synora-text-secondary hover:text-white transition-colors shrink-0 whitespace-nowrap"
                          >
                            {showWebSearches ? 'Hide Web' : 'Show Web'}
                          </button>
                        </h3>
                        <div className="flex flex-col gap-4 pr-2 pb-8">
                          {artifacts.filter(a => (showWebSearches || a.type !== 'WEB_SEARCH') && (!selectedCollectionId || a.collections?.some((c:any) => c.id === selectedCollectionId))).length === 0 ? (
                            <p className="text-synora-text-secondary py-8 text-center bg-synora-bg/30 rounded-xl border border-synora-border/50">No documents found.</p>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {artifacts.filter(a => (showWebSearches || a.type !== 'WEB_SEARCH') && (!selectedCollectionId || a.collections?.some((c:any) => c.id === selectedCollectionId))).map((artifact: any) => (
                                <div 
                                  key={artifact.id} 
                                  onClick={() => setSelectedArtifact(artifact)}
                                  className="flex flex-col bg-synora-surface border border-synora-border hover:border-synora-accent/50 rounded-xl p-4 cursor-pointer hover:-translate-y-0.5 transition-all group"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${artifact.type === 'URL' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : artifact.type === 'PDF' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                      {artifact.type}
                                    </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (collections.length === 0) return alert("Create a collection first!");
                                        setShowAddToCollectionModal({ artifactId: artifact.id });
                                      }}
                                      className="text-xs px-2 py-1 bg-synora-bg hover:bg-synora-accent/20 rounded-md text-synora-text-secondary hover:text-synora-accent transition-colors"
                                    >
                                      + Col
                                    </button>
                                    <span className="text-xs text-synora-text-secondary whitespace-nowrap">{new Date(artifact.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <h4 className="text-lg font-bold text-white group-hover:text-synora-accent transition-colors truncate">{artifact.title}</h4>
                                <p className="text-sm text-synora-text-secondary line-clamp-2">{artifact.summary || artifact.content?.substring(0, 150)}</p>
                              </div>
                            ))}
                          </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Knowledge Categories for Radial Menu */}
                      {!showCollections && (
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-synora-text-secondary whitespace-nowrap">
                            <Compass className="w-5 h-5 text-synora-accent shrink-0" /> 
                            <span className="truncate">Knowledge Hub</span>
                          </h3>
                          {radialCategories.length === 0 ? (
                            <p className="text-synora-text-secondary py-8 text-center bg-synora-bg/30 rounded-xl border border-synora-border/50">Your knowledge graph is empty.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
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
                      )}
                    </div>
                  ) : knowledgeView === 'INSIGHTS' ? (
                    <div className="w-full h-full p-6 bg-synora-bg/50 border border-synora-border rounded-xl overflow-y-auto custom-scrollbar">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-synora-text-primary">
                          <Sparkles className="w-6 h-6 text-synora-accent" /> AI Knowledge Insights
                        </h3>
                        <button 
                          onClick={async () => {
                            setIsGeneratingInsights(true);
                            try {
                              const res = await fetchWithAuth('http://localhost:3000/knowledge/insights/generate', { method: 'POST' });
                              if (res.ok) setInsights(await res.json());
                            } catch(e) { console.error(e) }
                            setIsGeneratingInsights(false);
                          }}
                          disabled={isGeneratingInsights}
                          className="flex items-center gap-2 px-4 py-2 bg-synora-accent text-white rounded-lg font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                        >
                          {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                          Generate Insights
                        </button>
                      </div>
                      {insights.length === 0 ? (
                        <p className="text-synora-text-secondary py-8 text-center bg-synora-surface rounded-xl border border-synora-border/50">No insights generated yet. Click generate to analyze your knowledge!</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {insights.map(insight => (
                            <div key={insight.id} className="bg-synora-surface border border-synora-border p-6 rounded-xl relative overflow-hidden group">
                              <div className={`absolute top-0 left-0 w-full h-1 ${insight.type === 'GAP' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mb-3 inline-block ${insight.type === 'GAP' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {insight.type === 'GAP' ? 'KNOWLEDGE GAP' : 'CONFLICT DETECTED'}
                              </span>
                              <h4 className="text-lg font-bold text-white mb-2 leading-snug">{insight.title}</h4>
                              <p className="text-sm text-synora-text-secondary leading-relaxed mb-4">{insight.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {insight.sources.map((src: string) => (
                                  <span key={src} className="text-xs bg-synora-bg px-2 py-1 rounded-md text-synora-text-secondary border border-synora-border">{src}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
                  <div className="w-full flex flex-col gap-2 mb-6 px-2">
                    <div className="w-full flex justify-between items-center">
                      <span className="text-synora-text-secondary font-medium text-sm">Review Progress</span>
                      <span className="text-synora-accent font-bold">{currentCardIndex + 1} / {flashcards.length}</span>
                    </div>
                    <div className="w-full bg-synora-surface border border-synora-border rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-synora-accent h-full rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${((currentCardIndex) / flashcards.length) * 100}%` }}
                      />
                    </div>
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
                      
                      {msg.agentLogs && msg.agentLogs.length > 0 && (
                        <div className="mt-4 bg-synora-bg border border-synora-border rounded-xl overflow-hidden">
                          <details className="group">
                            <summary className="flex items-center gap-2 p-3 cursor-pointer text-xs font-bold text-synora-accent hover:bg-synora-surface/50 transition-colors list-none select-none">
                              <BrainCircuit className="w-4 h-4" /> Agentic Workflow ({msg.agentLogs.length} steps)
                              <span className="ml-auto transform group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-3 pt-0 border-t border-synora-border space-y-2">
                              {msg.agentLogs.map((log, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  {log.status === 'done' ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
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
          )}

          {/* DISCOVER TAB */}
          {activeTab === 'DISCOVER' && (
            <div className="w-full max-w-5xl mx-auto mt-4 pt-4 flex flex-col h-full overflow-y-auto custom-scrollbar pr-2">
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

              {tasteProfile && (
                <div className="mb-8 p-6 glass-panel rounded-2xl bg-gradient-to-r from-synora-accent/10 to-transparent border-l-4 border-l-synora-accent shrink-0 shadow-lg">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-synora-accent"/> Your Taste Profile</h3>
                  <p className="text-synora-text-primary leading-relaxed">{tasteProfile}</p>
                </div>
              )}

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
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleExplore(rec.id)}
                              disabled={exploringId === rec.id}
                              className="flex-1 py-3 bg-synora-accent/90 hover:bg-synora-accent backdrop-blur-md text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-synora-accent/50 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                            >
                              {exploringId === rec.id ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Fetching...</>
                              ) : (
                                <><Sparkles className="w-4 h-4" /> Read</>
                              )}
                            </button>
                            <button
                              onClick={() => handleDiveDeeper(rec.id)}
                              disabled={divingId === rec.id}
                              className="flex-1 py-3 bg-synora-surface/80 hover:bg-synora-surface border border-synora-border backdrop-blur-md text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                            >
                              {divingId === rec.id ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Diving...</>
                              ) : (
                                <><Network className="w-4 h-4" /> Dive Deeper</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Nested Rabbit Hole Recommendations */}
                      {nestedRecommendations[rec.id] && (
                        <div className="ml-8 mt-4 pl-4 border-l-2 border-synora-accent/30 flex flex-col gap-4 animate-fade-in">
                          {nestedRecommendations[rec.id].map(nested => (
                            <div key={nested.id} className="glass-panel p-4 rounded-xl border border-synora-border flex flex-col gap-2 relative bg-synora-bg/50">
                              <div className="absolute -left-6 top-6 w-4 h-0.5 bg-synora-accent/30" />
                              <div className="flex items-start gap-3">
                                {nested.imageUrl ? (
                                  <img src={nested.imageUrl} alt={nested.title} className="w-16 h-16 rounded-lg object-cover opacity-80" />
                                ) : (
                                  <div className="w-16 h-16 rounded-lg bg-synora-surface/80 flex items-center justify-center"><Box className="w-6 h-6 text-synora-accent opacity-50"/></div>
                                )}
                                <div className="flex-1">
                                  <h4 className="font-bold text-white text-sm line-clamp-1">{nested.title}</h4>
                                  <p className="text-synora-text-secondary text-xs line-clamp-2 mt-1">{nested.description}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button 
                                  onClick={() => handleExplore(nested.id)}
                                  disabled={exploringId === nested.id}
                                  className="flex-1 py-2 bg-synora-accent/80 hover:bg-synora-accent text-white rounded-lg transition-all text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                  {exploringId === nested.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Read
                                </button>
                                <button
                                  onClick={() => handleDiveDeeper(nested.id)}
                                  disabled={divingId === nested.id}
                                  className="flex-1 py-2 bg-synora-surface border border-synora-border hover:bg-synora-surface/80 text-white rounded-lg transition-all text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                  {divingId === nested.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Network className="w-3 h-3" />} Dive
                                </button>
                              </div>

                              {nestedRecommendations[nested.id] && (
                                <div className="ml-4 mt-3 pl-3 border-l-2 border-synora-accent/30 flex flex-col gap-3">
                                  {nestedRecommendations[nested.id].map(deepNested => (
                                    <div key={deepNested.id} className="p-3 bg-synora-surface rounded-lg border border-synora-border text-xs flex flex-col gap-2">
                                      <h5 className="font-bold text-white">{deepNested.title}</h5>
                                      <button 
                                        onClick={() => handleExplore(deepNested.id)}
                                        disabled={exploringId === deepNested.id}
                                        className="py-1.5 bg-synora-accent text-white rounded w-full transition-all flex items-center justify-center gap-1"
                                      >
                                        <Sparkles className="w-3 h-3" /> Read
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CREATE TAB */}
          {activeTab === 'CREATE' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full mt-4 pb-8 max-w-7xl mx-auto w-full px-4 md:px-0">
              
              {/* Left Column: Editor */}
              <div className="flex-1 flex flex-col glass-panel p-6 rounded-2xl h-full border-synora-border shadow-2xl relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-synora-accent" />
                    Editor
                  </h2>
                  <button
                    onClick={handleGenerateParagraph}
                    disabled={isGeneratingParagraph || draftText.trim().length < 20}
                    className="flex items-center gap-2 px-4 py-2 bg-synora-accent hover:bg-synora-accent-hover text-white rounded-lg transition-all disabled:opacity-50 text-sm font-medium"
                  >
                    {isGeneratingParagraph ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Co-Writing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Draft Next Paragraph</>
                    )}
                  </button>
                </div>
                
                <RichTextEditor 
                  content={draftText} 
                  onChange={setDraftText} 
                  placeholder="Start writing your essay, blog post, or ideas here...\n\nAs you type, Synora will automatically surface relevant notes and articles from your knowledge graph in the sidebar to the right." 
                />

                {/* SUGGESTED DRAFT PANEL */}
                {suggestedParagraph && (
                  <div className="mt-4 p-4 border border-synora-accent/50 bg-synora-accent/10 rounded-xl flex flex-col gap-3 animate-fade-in shadow-lg shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-synora-accent flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Suggested Draft
                      </span>
                      <div className="flex gap-2">
                        <button onClick={handleReject} className="px-3 py-1 text-xs font-bold rounded-lg bg-synora-surface border border-synora-border hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all">Reject</button>
                        <button onClick={handleApprove} className="px-3 py-1 text-xs font-bold rounded-lg bg-synora-accent hover:bg-synora-accent-hover text-white transition-all shadow-md">Approve & Merge</button>
                      </div>
                    </div>
                    
                    <textarea 
                      value={suggestedParagraph}
                      onChange={(e) => setSuggestedParagraph(e.target.value)}
                      className="w-full bg-synora-bg/50 border border-synora-accent/30 rounded-lg p-3 text-sm font-mono text-synora-text-primary resize-none outline-none focus:border-synora-accent min-h-[100px]"
                    />

                    <div className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        value={revisionPrompt}
                        onChange={(e) => setRevisionPrompt(e.target.value)}
                        placeholder="Suggest changes (e.g. 'Make it more formal')"
                        className="flex-1 bg-synora-bg/50 border border-synora-border rounded-lg px-3 py-2 text-sm outline-none focus:border-synora-accent"
                        onKeyDown={(e) => e.key === 'Enter' && handleRewrite()}
                      />
                      <button 
                        onClick={handleRewrite}
                        disabled={!revisionPrompt.trim() || isRevising}
                        className="px-3 py-2 bg-synora-surface border border-synora-border rounded-lg text-sm font-medium hover:text-white hover:border-synora-accent/50 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {isRevising ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                        Rewrite
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Dynamic Context */}
              <div className="w-full lg:w-96 flex flex-col gap-4 h-full shrink-0">
                <div className="glass-panel p-4 rounded-xl border border-synora-border flex items-center gap-2 shadow-lg mb-2">
                  <BrainCircuit className="w-5 h-5 text-synora-accent animate-pulse" />
                  <span className="font-semibold text-sm">Active Context</span>
                  <span className="text-xs text-synora-text-secondary ml-auto">{draftContext.length} items found</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {draftContext.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-synora-text-secondary opacity-50 p-6 text-center">
                      <Link className="w-8 h-8 mb-2" />
                      <p className="text-sm">Type at least a sentence to see relevant knowledge automatically appear here.</p>
                    </div>
                  ) : (
                    draftContext.map((artifact) => (
                      <div key={artifact.id} className="bg-synora-surface/80 backdrop-blur border border-synora-border/50 rounded-xl p-4 hover:border-synora-accent/30 transition-colors shadow-md">
                        <div className="flex items-start gap-2 mb-2">
                          <Box className="w-4 h-4 text-synora-accent shrink-0 mt-0.5" />
                          <h4 className="font-semibold text-sm line-clamp-2 leading-tight">{artifact.title || 'Untitled Knowledge'}</h4>
                        </div>
                        <p className="text-xs text-synora-text-secondary line-clamp-4 leading-relaxed mb-3">
                          {artifact.summary || artifact.content || 'No summary available.'}
                        </p>
                        <a 
                          href={artifact.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-synora-accent hover:underline flex items-center gap-1 opacity-80"
                        >
                          <Compass className="w-3 h-3" />
                          Source
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS MODAL */}
          {isSettingsOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="max-w-3xl w-full mx-auto glass-panel p-6 md:p-8 relative">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="absolute top-4 right-4 p-2 text-synora-text-secondary hover:text-white bg-synora-bg rounded-full border border-synora-border transition-colors hover:border-synora-accent/50"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-8 border-b border-synora-border pb-4 pr-12">
                  <Settings className="w-6 h-6 text-synora-accent" />
                  <h2 className="text-2xl font-bold">Settings & Configuration</h2>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-synora-accent" /> Local AI Model
                    </h3>
                    <div className="bg-synora-surface/50 border border-synora-border rounded-xl p-5">
                      <p className="text-sm text-synora-text-secondary mb-4">
                        Select which Ollama model Synora should use for knowledge extraction, charting, and drafting. 
                        Ensure you have run <code className="bg-synora-bg px-1.5 py-0.5 rounded text-synora-accent">ollama pull &lt;model&gt;</code> before selecting it here.
                      </p>
                      <select 
                        value={modelConfig} 
                        onChange={(e) => setModelConfig(e.target.value)}
                        className="w-full glass-input bg-synora-bg/80 outline-none focus:border-synora-accent text-sm"
                      >
                        <option value="llama3.2">llama3.2 (Default - Fast & Efficient)</option>
                        <option value="llama3.1">llama3.1 (Higher accuracy)</option>
                        <option value="mistral">mistral (Alternative)</option>
                        <option value="phi3">phi3 (Lightweight)</option>
                      </select>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Key className="w-5 h-5 text-synora-accent" /> Account
                    </h3>
                    <div className="bg-synora-surface/50 border border-synora-border rounded-xl p-5 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">Logged in</p>
                        <p className="text-sm text-synora-text-secondary">Your knowledge graph is synced and secure.</p>
                      </div>
                      <button onClick={handleLogout} className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium">
                        Log Out
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Modals */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-synora-surface border border-synora-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <Layers className="w-5 h-5 text-synora-accent" /> New Collection
              </h3>
              <button onClick={() => setShowNewCollectionModal(false)} className="text-synora-text-secondary hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-synora-text-secondary mb-1">Collection Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  className="w-full bg-synora-bg border border-synora-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-synora-accent transition-colors"
                  placeholder="e.g. Machine Learning"
                  onKeyDown={async e => {
                    if (e.key === 'Enter' && newCollectionName.trim()) {
                      const res = await fetchWithAuth('http://localhost:3000/knowledge/collections', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: newCollectionName.trim() })
                      });
                      if (res.ok) {
                        fetchKnowledge();
                        setShowNewCollectionModal(false);
                        setNewCollectionName('');
                      }
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowNewCollectionModal(false)}
                  className="px-4 py-2 rounded-lg font-medium text-synora-text-secondary hover:text-white hover:bg-synora-bg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={!newCollectionName.trim()}
                  onClick={async () => {
                    const res = await fetchWithAuth('http://localhost:3000/knowledge/collections', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: newCollectionName.trim() })
                    });
                    if (res.ok) {
                      fetchKnowledge();
                      setShowNewCollectionModal(false);
                      setNewCollectionName('');
                    }
                  }}
                  className="px-4 py-2 bg-synora-accent text-white rounded-lg font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  Create Collection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddToCollectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-synora-surface border border-synora-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <Plus className="w-5 h-5 text-synora-accent" /> Add to Collection
              </h3>
              <button onClick={() => setShowAddToCollectionModal(null)} className="text-synora-text-secondary hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {collections.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-synora-text-secondary mb-4">You don't have any collections yet.</p>
                <button 
                  onClick={() => {
                    setShowAddToCollectionModal(null);
                    setShowNewCollectionModal(true);
                  }}
                  className="px-4 py-2 bg-synora-bg border border-synora-border text-white rounded-lg hover:border-synora-accent transition-colors"
                >
                  Create your first collection
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {collections.map(col => (
                  <button
                    key={col.id}
                    onClick={async () => {
                      await fetchWithAuth(`http://localhost:3000/knowledge/artifacts/${showAddToCollectionModal.artifactId}/collections`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ collectionId: col.id })
                      });
                      fetchKnowledge();
                      setShowAddToCollectionModal(null);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-synora-bg border border-synora-border rounded-lg hover:border-synora-accent hover:bg-synora-accent/5 transition-all text-left group"
                  >
                    <span className="font-medium text-white group-hover:text-synora-accent transition-colors">{col.name}</span>
                    <span className="text-xs text-synora-text-secondary bg-synora-surface px-2 py-1 rounded-full">{col.artifacts?.length || 0} items</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
