import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useKnowledge } from './hooks/useKnowledge';
import { useCapture } from './hooks/useCapture';
import { useChat } from './hooks/useChat';
import { useCreate } from './hooks/useCreate';
import { usePublish } from './hooks/usePublish';
import { useDiscover } from './hooks/useDiscover';
import { useLearn } from './hooks/useLearn';
import { BrainCircuit, CheckCircle, Compass, FileText, GraduationCap, Key, Layers, Link, Loader2, LogOut, MessageSquare, Plus, Rss, Settings, Sparkles, X, Copy, Trash2, Edit3, Type, Box, Mic, MicOff, Search, Network, List as ListIcon, Workflow, Hash, Volume2, VolumeX, Send, Image as ImageIcon, Briefcase, MessageCircle, Mail, CheckSquare, Square, Download, Printer, Globe, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import BrainTreeMap from './components/BrainTreeMap';
import { RadialMenu, type RadialMenuItem } from './components/RadialMenu';
import { RichTextEditor } from './components/RichTextEditor';
import { ProceduralCover } from './components/ProceduralCover';
import { DiagramViewer } from './components/DiagramViewer';
import { CaptureTab } from './components/tabs/CaptureTab';
import { PublishTab } from './components/tabs/PublishTab';
import { DiscoverTab } from './components/tabs/DiscoverTab';
import { ChatTab } from './components/tabs/ChatTab';
import { KnowledgeTab } from './components/tabs/KnowledgeTab';
import { LearnTab } from './components/tabs/LearnTab';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { NewCollectionModal } from './components/modals/NewCollectionModal';
import { AddToCollectionModal } from './components/modals/AddToCollectionModal';
import { CreateTab } from './components/tabs/CreateTab';
import { CodeBlock } from './components/CodeBlock';

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
type Tab = 'CAPTURE' | 'KNOWLEDGE' | 'LEARN' | 'CHAT' | 'DISCOVER' | 'CREATE' | 'PUBLISH' | 'SETTINGS';
type ContentFormat = 'blog' | 'linkedin' | 'twitter' | 'newsletter' | 'paper';
type WritingStyle = 'professional' | 'conversational' | 'academic';

interface Topic { id: string; name: string; count: number; }
interface Entity { id: string; name: string; type: string; count: number; }
interface Artifact { id: string; title?: string; sourceUrl: string; type: string; status: string; content?: string; summary?: string; createdAt: string; topics: {id: string, name: string}[]; collections?: any[] }
interface ChatMessage { role: 'user' | 'assistant'; content: string; sources?: string[]; agentLogs?: { action: string; status: 'pending'|'done'|'error'; message: string }[]; }

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const codeText = String(children).replace(/\n$/, '');

  if (inline) {
    return <code className="bg-synora-bg px-1.5 py-0.5 rounded text-sm font-mono text-emerald-400" {...props}>{children}</code>;
  }

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-synora-border overflow-hidden my-4 shadow-lg">
      <div className="bg-synora-surface/50 px-4 py-2 text-xs font-mono border-b border-synora-border text-synora-text-secondary flex justify-between items-center">
        <span>{lang || 'Code'}</span>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(codeText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1.5 hover:text-white transition-colors py-1 px-2 rounded-md hover:bg-synora-bg"
        >
          {copied ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus as any}
        language={lang}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.875rem' }}
        {...props}
      >
        {codeText}
      </SyntaxHighlighter>
    </div>
  );
};

function App() {
  // Authentication State
  
  
  
  
  
  
  
  

  const {
    token, authMode, setAuthMode, email, setEmail, password, setPassword, authError, setAuthError,
    isAuthenticating, userPreferences, setUserPreferences, isSavingPreferences, savePreferences,
    isSettingsOpen, setIsSettingsOpen, fetchWithAuth, handleLogin, handleRegister, handleLogout
  } = useAuth();
  const {
    artifacts, setArtifacts, graphData, setGraphData, isLoadingKnowledge, setIsLoadingKnowledge,
    knowledgeView, setKnowledgeView, showWebSearches, setShowWebSearches, selectedNode, setSelectedNode,
    graphSearchQuery, setGraphSearchQuery, graphSearchSelectedIndex, setGraphSearchSelectedIndex,
    artifactDiagram, setArtifactDiagram, isGeneratingDiagram, setIsGeneratingDiagram,
    selectedArtifact, setSelectedArtifact, annotations, setAnnotations, newAnnotation, setNewAnnotation,
    collections, setCollections, insights, setInsights, isGeneratingInsights, setIsGeneratingInsights,
    selectedCollectionId, setSelectedCollectionId, showNewCollectionModal, setShowNewCollectionModal,
    newCollectionName, setNewCollectionName, showAddToCollectionModal, setShowAddToCollectionModal,
    showCollections, setShowCollections, wikiSummary, setWikiSummary, isFetchingWiki, setIsFetchingWiki,
    graphDimensions, setGraphDimensions, fetchKnowledge, fetchWiki, handleGenerateSummary,
    handleFormat, handleTranslate
  } = useKnowledge(token, activeTab, fetchWithAuth, showToast, graphContainerRef);
  const {
    inputType, setInputType, inputValue, setInputValue,
    selectedFile, setSelectedFile, isSubmitting, setIsSubmitting,
    status, setStatus, artifactId, setArtifactId, handleCaptureSubmit
  } = useCapture(token, fetchWithAuth, fetchKnowledge, showToast, isListening, toggleListening);
  const {
    chatQuery, setChatQuery, isChatting, setIsChatting, forceWebSearch, setForceWebSearch,
    chatHistory, setChatHistory, currentSessionId, setCurrentSessionId, chatSessions, setChatSessions,
    editingSessionId, setEditingSessionId, editingTitle, setEditingTitle, isListening, setIsListening,
    isSpeaking, setIsSpeaking, isVoiceEnabled, setIsVoiceEnabled, chatEndRef, loadSession,
    renameSession, deleteSession, handleChatSubmit, stopSpeaking, speak, toggleListening
  } = useChat(token, fetchWithAuth);
  const {
    draftText, setDraftText, coverData, setCoverData, isGeneratingCover, setIsGeneratingCover,
    draftContext, setDraftContext, isGeneratingParagraph, setIsGeneratingParagraph,
    isProofreading, setIsProofreading, suggestedParagraph, setSuggestedParagraph,
    revisionPrompt, setRevisionPrompt, isRevising, setIsRevising, modelConfig, setModelConfig,
    handleProofread, handleRevise, generateCover, generateNextParagraph
  } = useCreate(token, fetchWithAuth, showToast);
  const {
    publishFormat, setPublishFormat, publishStyle, setPublishStyle,
    publishSelectedTopics, setPublishSelectedTopics, publishOutput, setPublishOutput,
    isPublishing, setIsPublishing, publishCopied, setPublishCopied
  } = usePublish();

  const {
    discoverQuery, setDiscoverQuery, isDiscovering, setIsDiscovering,
    discoveryResults, setDiscoveryResults
  } = useDiscover();

  const {
    flashcards, setFlashcards, currentCardIndex, setCurrentCardIndex,
    isFlipped, setIsFlipped, isLoadingLearn, setIsLoadingLearn
  } = useLearn();





  
  const [activeTab, setActiveTab] = useState<Tab>('CAPTURE');
  
  
  // Capture State

  // Knowledge State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [isTranslating, setIsTranslating] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // Smart Folders & Annotations State

  // Publish State

  const [activeRadialCategory, setActiveRadialCategory] = useState<{ id: string, title: string, items: RadialMenuItem[] } | null>(null);

  useEffect(() => {
    setWikiSummary(null);
  }, [selectedNode]);

  useEffect(() => {
    if (selectedArtifact && token) {
      fetch(`http://localhost:3001/annotations/artifact/${selectedArtifact.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setAnnotations(Array.isArray(data) ? data : []))
      .catch(console.error);
    } else {
      setAnnotations([]);
    }
  }, [selectedArtifact, token]);

  ;

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


  // Chat State
    role: 'assistant',
    content: "Hi! I'm Synora. Ask me anything about the links and notes you've captured in your private Knowledge Graph!"
  }]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice State
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Learn State

  // Discover State
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [tasteProfile, setTasteProfile] = useState<string | null>(null);
  const [isLoadingDiscover, setIsLoadingDiscover] = useState(false);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [nestedRecommendations, setNestedRecommendations] = useState<Record<string, any[]>>({});
  const [exploringId, setExploringId] = useState<string | null>(null);
  const [divingId, setDivingId] = useState<string | null>(null);

  // Create Studio State
  const draftTimeoutRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('synora_model', modelConfig);
  }, [modelConfig]);

  useEffect(() => {
    if (token && activeTab === 'KNOWLEDGE') fetchKnowledge();
    if (token && activeTab === 'LEARN') fetchLearn();
    if (token && activeTab === 'DISCOVER') fetchDiscover();
    if (token && activeTab === 'PUBLISH') fetchKnowledge();
  }, [activeTab, token]);

  useEffect(() => {
    if (token) {
      fetchWithAuth('http://localhost:3001/auth/profile')
        .then(res => res.json())
        .then(data => setUserPreferences(data.preferences || ''))
        .catch(err => console.error('Failed to fetch profile', err));
    }
  }, [token]);

  useEffect(() => {
    if (activeTab !== 'CREATE' || !token) return;
    
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    
    draftTimeoutRef.current = setTimeout(async () => {
      if (draftText.trim().length < 20) {
        setDraftContext([]);
        return;
      }
      try {
        const res = await fetchWithAuth('http://localhost:3001/create/context', {
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDialog && confirmDialog.isOpen) {
          setConfirmDialog(null);
        } else if (selectedArtifact) {
          setSelectedArtifact(null);
          setArtifactDiagram(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog, selectedArtifact]);

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

  ;

  ;

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
      const res = await fetch(`http://localhost:3001${endpoint}`, {
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

  ;

  ;

  const fetchLearn = async () => {
    setIsLoadingLearn(true);
    try {
      const res = await fetchWithAuth('http://localhost:3001/learn/due');
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
        fetchWithAuth('http://localhost:3001/discovery/feed'),
        fetchWithAuth('http://localhost:3001/discovery/taste-profile')
      ]);
      if (feedRes.ok) setRecommendations(await feedRes.json());
      if (profileRes.ok) setTasteProfile((await profileRes.json()).profile);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDiscover(false);
    }
  };

  const handleLoadMore = async () => {
    setIsLoadingDiscover(true);
    try {
      const res = await fetchWithAuth('http://localhost:3001/discovery/generate-more', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(prev => [...prev, ...data]);
      }
    } finally {
      setIsLoadingDiscover(false);
    }
  };

  const handleCustomTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim() || isGeneratingCustom) return;
    setIsGeneratingCustom(true);
    showToast("Generating custom exploration...", "info");
    try {
      const res = await fetchWithAuth('http://localhost:3001/discovery/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: customTopic })
      });
      if (res.ok) {
        showToast("Custom concept sent for processing!", "success");
        setCustomTopic('');
      } else {
        throw new Error('Failed to generate custom topic');
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to generate custom topic", "error");
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const handleTranslate = async (artifactId: string) => {
    setIsTranslating(true);
    showToast("Translating to English...", "info");
    try {
      const res = await fetchWithAuth(`http://localhost:3001/capture/${artifactId}/translate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Translation failed');
      const updatedArtifact = await res.json();
      
      setSelectedArtifact(prev => prev ? { ...prev, ...updatedArtifact } : updatedArtifact);
      
      // Update the artifacts list
      setArtifacts(prev => prev.map(a => a.id === artifactId ? { ...a, ...updatedArtifact } : a));
      showToast("Translation complete!", "success");
    } catch (err) {
      console.error(err);
      showToast("Translation failed. Ensure Ollama is running.", "error");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFormat = async (artifactId: string) => {
    setIsFormatting(true);
    showToast("Formatting document...", "info");
    try {
      const res = await fetchWithAuth(`http://localhost:3001/capture/${artifactId}/format`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Formatting failed');
      const updatedArtifact = await res.json();
      
      setSelectedArtifact(prev => prev ? { ...prev, ...updatedArtifact } : updatedArtifact);
      setArtifacts(prev => prev.map(a => a.id === artifactId ? { ...a, ...updatedArtifact } : a));
      showToast("Formatting complete!", "success");
    } catch (err) {
      console.error(err);
      showToast("Formatting failed. Ensure Ollama is running.", "error");
    } finally {
      setIsFormatting(false);
    }
  };

  const handleGenerateSummary = async (artifactId: string) => {
    setIsGeneratingSummary(true);
    showToast("Generating AI Summary...", "info");
    try {
      const res = await fetchWithAuth(`http://localhost:3001/capture/${artifactId}/summary`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Summary generation failed');
      const updatedArtifact = await res.json();
      
      setSelectedArtifact(prev => prev ? { ...prev, ...updatedArtifact } : updatedArtifact);
      setArtifacts(prev => prev.map(a => a.id === artifactId ? { ...a, ...updatedArtifact } : a));
      showToast("Summary generation complete!", "success");
    } catch (err) {
      console.error(err);
      showToast("Summary generation failed. Ensure Ollama is running.", "error");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleExplore = async (id: string) => {
    setExploringId(id);
    try {
      const res = await fetchWithAuth(`http://localhost:3001/discovery/${id}/explore`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to explore');
      setRecommendations(prev => prev.filter(r => r.id !== id));
      showToast("Artifact generated and sent for processing! Check your Knowledge Graph soon.", "success");
    } catch (err) {
      console.error(err);
    } finally {
      setExploringId(null);
    }
  };

  const handleDiveDeeper = async (id: string) => {
    setDivingId(id);
    try {
      const res = await fetchWithAuth(`http://localhost:3001/discovery/${id}/dive-deeper`, { method: 'POST' });
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
      await fetchWithAuth(`http://localhost:3001/learn/review/${card.id}`, {
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

  ;

  ;

  const handleGenerateParagraph = async () => {
    if (!draftText.trim() || isGeneratingParagraph) return;
    setIsGeneratingParagraph(true);
    try {
      const res = await fetchWithAuth('http://localhost:3001/create/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftText, context: draftContext, model: modelConfig })
      });
      const data = await res.json();
      if (data.nextParagraph) {
        setSuggestedParagraph(data.nextParagraph);
      }
    } catch (error) {
      console.error("Error generating paragraph:", error);
    } finally {
      setIsGeneratingParagraph(false);
    }
  };

  ;

  const handleGenerateCover = async () => {
    if (!draftText.trim() || isGeneratingCover) return;
    setIsGeneratingCover(true);
    try {
      const response = await fetch(`http://localhost:3001/visuals/cover-theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: 'My Article', content: draftText })
      });
      const data = await response.json();
      setCoverData(data);
    } catch (error) {
      console.error("Error generating cover:", error);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleApprove = () => {
    setDraftText(prev => {
      // If it's an empty editor, just set the paragraph
      if (!prev || prev === '<p></p>') {
        return `<p>${suggestedParagraph}</p>`;
      }
      
      let joiner = ' ';
      if (/^[.,;!?]/.test(suggestedParagraph)) {
        joiner = '';
      }
      
      // If the draft ends with a paragraph tag, inject the new text inside it
      // so that it flows continuously instead of starting a new block.
      const trimmed = prev.trim();
      if (trimmed.endsWith('</p>')) {
        let base = trimmed.slice(0, -4);
        if (joiner === '') base = base.trimEnd();
        return base + joiner + suggestedParagraph + '</p>';
      }
      
      let base = prev;
      if (joiner === '') base = base.trimEnd();
      return base + joiner + suggestedParagraph;
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
      const res = await fetchWithAuth('http://localhost:3001/create/rewrite', {
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
      
      {/* Global Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-4 z-[200] px-4 py-2 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-2 animate-fade-in ${
          toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
          'bg-synora-surface/80 border-synora-border text-white'
        }`}>
          {toast.type === 'error' && <X className="w-4 h-4" />}
          {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
          {toast.type === 'info' && <MessageCircle className="w-4 h-4 text-synora-accent" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Global Confirm Modal */}
      <ConfirmModal 
        isOpen={!!(confirmDialog && confirmDialog.isOpen)}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
        onConfirm={() => {
          if (confirmDialog) confirmDialog.onConfirm();
          setConfirmDialog(null);
        }}
        onCancel={() => setConfirmDialog(null)}
      />
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
      
      {/* Global Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-4 z-[200] px-4 py-2 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-2 animate-fade-in ${
          toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
          'bg-synora-surface/80 border-synora-border text-white'
        }`}>
          {toast.type === 'error' && <X className="w-4 h-4" />}
          {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
          {toast.type === 'info' && <MessageCircle className="w-4 h-4 text-synora-accent" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Global Confirm Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center animate-fade-in p-4">
          <div className="bg-synora-surface border border-synora-border shadow-2xl rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-synora-text-secondary mb-6 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-sm font-medium text-synora-text-secondary hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
            {(['CAPTURE', 'KNOWLEDGE', 'LEARN', 'CHAT', 'DISCOVER', 'CREATE', 'PUBLISH'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedArtifact(null); setArtifactDiagram(null); }}
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
                {tab === 'PUBLISH' && <Rss className="w-4 h-4 shrink-0" />}
                <span className="truncate">{tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="w-full flex-1 overflow-hidden animate-fade-in flex flex-col min-h-0">
          
          {/* CAPTURE TAB */}
          {activeTab === 'CAPTURE' && (
            <CaptureTab
              inputType={inputType}
              setInputType={setInputType}
              inputValue={inputValue}
              setInputValue={setInputValue}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              isSubmitting={isSubmitting}
              isListening={isListening}
              toggleListening={toggleListening}
              handleCaptureSubmit={handleCaptureSubmit}
              status={status}
              artifactId={artifactId}
            />
          )}
          {/* KNOWLEDGE TAB */}
          {activeTab === 'KNOWLEDGE' && (
            <KnowledgeTab {...{
              activeTab, setKnowledgeView, knowledgeView, setSelectedArtifact, setArtifactDiagram,
              isLoadingKnowledge, graphContainerRef, showCollections, setShowNewCollectionModal,
              setShowCollections, setSelectedCollectionId, selectedCollectionId, artifacts,
              collections, showWebSearches, setShowWebSearches, showToast, setShowAddToCollectionModal,
              radialCategories, activeRadialCategory, setActiveRadialCategory, isGeneratingInsights,
              setIsGeneratingInsights, fetchWithAuth, setInsights, insights, graphDimensions,
              graphData, setSelectedNode, selectedNode, graphSearchQuery, setGraphSearchQuery,
              graphSearchSelectedIndex, setGraphSearchSelectedIndex, wikiSummary, fetchWiki,
              isFetchingWiki, setChatQuery, setActiveTab, token, setConfirmDialog, fetchKnowledge,
              isGeneratingDiagram, setIsGeneratingDiagram, artifactDiagram, handleGenerateSummary,
              isGeneratingSummary, setDraftText, setActiveDraftId, handleFormat, isFormatting,
              handleTranslate, isTranslating, newAnnotation, setNewAnnotation, annotations,
              setAnnotations
            }} />
          )}
                    {/* LEARN TAB */}
          {activeTab === 'LEARN' && (
            <LearnTab {...{
              activeTab, isLoadingLearn, flashcards, currentCardIndex, 
              isFlipped, setIsFlipped, handleReview
            }} />
          )}

          {/* CHAT TAB (RAG) */}
          {activeTab === 'CHAT' && (
            <ChatTab
              setCurrentSessionId={setCurrentSessionId}
              setChatHistory={setChatHistory}
              chatSessions={chatSessions}
              currentSessionId={currentSessionId}
              editingSessionId={editingSessionId}
              loadSession={loadSession}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              renameSession={renameSession}
              setEditingSessionId={setEditingSessionId}
              deleteSession={deleteSession}
              chatHistory={chatHistory as any}
              isChatting={isChatting}
              chatEndRef={chatEndRef}
              forceWebSearch={forceWebSearch}
              setForceWebSearch={setForceWebSearch}
              isVoiceEnabled={isVoiceEnabled}
              setIsVoiceEnabled={setIsVoiceEnabled}
              chatQuery={chatQuery}
              setChatQuery={setChatQuery}
              handleChatSubmit={handleChatSubmit}
              isSpeaking={isSpeaking}
              stopSpeaking={stopSpeaking}
              toggleListening={toggleListening}
              isListening={isListening}
            />
          )}
          {/* DISCOVER TAB */}
          {activeTab === 'DISCOVER' && (
            <DiscoverTab
              discoverQuery={discoverQuery}
              setDiscoverQuery={setDiscoverQuery}
              handleDiscover={handleDiscover}
              isDiscovering={isDiscovering}
              discoveryResults={discoveryResults}
              setSelectedArtifact={setSelectedArtifact}
              setArtifactDiagram={setArtifactDiagram}
              token={token}
              showToast={showToast}
              fetchKnowledge={fetchKnowledge}
              setActiveTab={setActiveTab}
            />
          )}
          {/* CREATE TAB */}
          {activeTab === 'CREATE' && (
            <CreateTab {...{
              activeTab, saveDraft, draftText, setDraftText, activeDraftId,
              artifacts, isDraftSaving, draftTitle, setDraftTitle,
              isTitleGenerating, handleAITitle, hasGeneratedTitle,
              showSuggestions, draftSuggestions, isGeneratingSuggestions,
              applySuggestion, showAIEditor, setShowAIEditor,
              aiEditorInstruction, setAiEditorInstruction, isAiEditing,
              handleAiEditorSubmit, setShowSuggestions, handleSuggestEdits,
              handleFormatting, handlePublish, isPublishing, setActiveDraftId
            }} />
          )}
          {/* SETTINGS MODAL */}
          <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            modelConfig={modelConfig}
            setModelConfig={setModelConfig}
            userPreferences={userPreferences}
            setUserPreferences={setUserPreferences}
            handleLogout={handleLogout}
            isSavingPreferences={isSavingPreferences}
            setIsSavingPreferences={setIsSavingPreferences}
            fetchWithAuth={fetchWithAuth}
          />
{/* Modals */}
      <NewCollectionModal 
        isOpen={showNewCollectionModal}
        onClose={() => setShowNewCollectionModal(false)}
        newCollectionName={newCollectionName}
        setNewCollectionName={setNewCollectionName}
        fetchWithAuth={fetchWithAuth}
        fetchKnowledge={fetchKnowledge}
      />

      <AddToCollectionModal 
        isOpen={!!showAddToCollectionModal}
        onClose={() => setShowAddToCollectionModal(null)}
        collections={collections}
        artifactId={showAddToCollectionModal?.artifactId || ''}
        fetchWithAuth={fetchWithAuth}
        fetchKnowledge={fetchKnowledge}
        onOpenNewCollection={() => setShowNewCollectionModal(true)}
      />
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




