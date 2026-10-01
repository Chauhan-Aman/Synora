import React from 'react';
import { Loader2, CheckCircle, GraduationCap } from 'lucide-react';

export const LearnTab = (props: any) => {
  const {
    activeTab, isLoadingLearn, flashcards, currentCardIndex, isFlipped, setIsFlipped, handleReview
  } = props;

  return (
    <>
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
        fetchWithAuth('http://localhost:3001/knowledge/topics'),
        fetchWithAuth('http://localhost:3001/knowledge/entities'),
        fetchWithAuth('http://localhost:3001/knowledge/graph'),
        fetchWithAuth('http://localhost:3001/knowledge/artifacts'),
        fetchWithAuth('http://localhost:3001/knowledge/collections'),
        fetchWithAuth('http://localhost:3001/knowledge/insights')
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
        
        response = await fetchWithAuth('http://localhost:3001/capture/upload', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetchWithAuth('http://localhost:3001/capture', {
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
  };

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

  const handleProofread = async () => {
    if (!draftText.trim() || isProofreading) return;
    setIsProofreading(true);
    try {
      const res = await fetchWithAuth('http://localhost:3001/create/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftText, model: modelConfig })
      });
      const data = await res.json();
      if (data.proofreadText) {
        setDraftText(data.proofreadText);
      }
    } catch (error) {
      console.error("Error proofreading document:", error);
    } finally {
      setIsProofreading(false);
    }
  };

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
                  <input type="url" placeholder="https://example.com/article or https://youtube.com/watch?v=..." className="glass-input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={isSubmitting} required />
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
                  <button onClick={() => { setKnowledgeView('LIST'); setSelectedArtifact(null); setArtifactDiagram(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${knowledgeView === 'LIST' ? 'bg-synora-surface text-synora-text-primary shadow-sm' : 'text-synora-text-secondary hover:text-synora-text-primary'}`}>
                    <ListIcon className="w-4 h-4" /> List
                  </button>
                  <button onClick={() => { setKnowledgeView('GRAPH'); setSelectedArtifact(null); setArtifactDiagram(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${knowledgeView === 'GRAPH' ? 'bg-synora-surface text-synora-text-primary shadow-sm' : 'text-synora-text-secondary hover:text-synora-text-primary'}`}>
                    <Network className="w-4 h-4" /> Graph
                  </button>
                  <button onClick={() => { setKnowledgeView('INSIGHTS'); setSelectedArtifact(null); setArtifactDiagram(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${knowledgeView === 'INSIGHTS' ? 'bg-synora-surface text-synora-text-primary shadow-sm' : 'text-synora-text-secondary hover:text-synora-text-primary'}`}>
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
                                        if (collections.length === 0) return showToast("Create a collection first!", "error");
                                        setShowAddToCollectionModal({ artifactId: artifact.id });
                                      }}
                                      className="text-xs px-2 py-1 bg-synora-bg hover:bg-synora-accent/20 rounded-md text-synora-text-secondary hover:text-synora-accent transition-colors"
                                    >
                                      + Col
                                    </button>
                                    <span className="text-xs text-synora-text-secondary whitespace-nowrap">{new Date(artifact.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <h4 className="text-lg font-bold text-white group-hover:text-synora-accent transition-colors break-words">{artifact.title}</h4>
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
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                              {radialCategories.map((cat: any) => (
                                <button 
                                  key={cat.id}
                                  onClick={() => setActiveRadialCategory(cat)}
                                  className="group flex flex-col bg-synora-surface border border-synora-border hover:border-synora-accent/80 rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-synora-accent/10 relative overflow-hidden h-[160px]"
                                >
                                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-synora-accent/10 rounded-full blur-2xl group-hover:bg-synora-accent/20 transition-all"></div>
                                  <div className="flex items-center justify-between mb-auto relative z-10 w-full">
                                    <span className="bg-synora-bg border border-synora-border px-3 py-1 rounded-full text-xs font-bold text-synora-accent tracking-wider">
                                      {cat.items.length} ITEMS
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-synora-bg border border-synora-border flex items-center justify-center group-hover:scale-110 group-hover:border-synora-accent/50 transition-all shrink-0 ml-2">
                                      <Network className="w-4 h-4 text-synora-text-secondary group-hover:text-synora-accent" />
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-start w-full mt-2 relative z-10">
                                    <h4 className="text-lg font-bold text-white text-left line-clamp-2 leading-tight mb-1 w-full" title={cat.title}>{cat.title}</h4>
                                    <p className="text-xs text-synora-text-secondary text-left line-clamp-1 w-full">Click to explore in radial wheel</p>
                                  </div>
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
                              const res = await fetchWithAuth('http://localhost:3001/knowledge/insights/generate', { method: 'POST' });
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
                              <div className={`absolute top-0 left-0 w-full h-1 ${insight.type === 'GAP' ? 'bg-orange-500' : insight.type === 'EVOLUTION' ? 'bg-purple-500' : 'bg-red-500'}`}></div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mb-3 inline-block ${
                                insight.type === 'GAP' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                                insight.type === 'EVOLUTION' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {insight.type === 'GAP' ? 'KNOWLEDGE GAP' : insight.type === 'EVOLUTION' ? 'TEMPORAL EVOLUTION' : 'CONFLICT DETECTED'}
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
                        <BrainTreeMap
                          graphData={graphData}
                          onNodeClick={(node: any) => setSelectedNode(node)}
                          selectedNodeId={selectedNode?.id}
                          width={graphDimensions.width}
                          height={graphDimensions.height}
                        />
                      )}
                      
                      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none bg-synora-surface/80 backdrop-blur px-3 py-2 rounded-lg border border-synora-border">
                         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-synora-text-secondary font-medium">Documents</span></div>
                         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500"></div><span className="text-xs text-synora-text-secondary font-medium">Topics</span></div>
                         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs text-synora-text-secondary font-medium">Entities</span></div>
                      </div>

                      {/* Graph Search Bar */}
                      <div className="absolute top-4 right-4 z-10 w-64">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-2.5 text-synora-text-secondary" />
                          <input 
                            type="text"
                            placeholder="Search nodes..."
                            value={graphSearchQuery}
                            onChange={e => {
                              setGraphSearchQuery(e.target.value);
                              setGraphSearchSelectedIndex(0);
                            }}
                            onKeyDown={e => {
                              const filtered = graphData.nodes.filter(n => n.name.toLowerCase().includes(graphSearchQuery.toLowerCase()));
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setGraphSearchSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setGraphSearchSelectedIndex(prev => Math.max(prev - 1, 0));
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (filtered[graphSearchSelectedIndex]) {
                                  const node = filtered[graphSearchSelectedIndex];
                                  setSelectedNode(node);
                                  setGraphSearchQuery("");
                                }
                              }
                            }}
                            className="w-full bg-synora-surface/90 backdrop-blur border border-synora-border rounded-lg pl-9 pr-3 py-2 text-sm focus:border-synora-accent outline-none text-white shadow-lg"
                          />
                        </div>
                        {graphSearchQuery.trim() && (() => {
                          const filtered = graphData.nodes.filter(n => n.name.toLowerCase().includes(graphSearchQuery.toLowerCase()));
                          return (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-synora-surface border border-synora-border rounded-lg shadow-xl max-h-64 overflow-y-auto custom-scrollbar">
                              {filtered.map((node, index) => (
                                <button
                                  key={node.id}
                                  onClick={() => {
                                    setSelectedNode(node);
                                    setGraphSearchQuery("");
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm border-b border-synora-border/50 last:border-0 truncate transition-colors ${graphSearchSelectedIndex === index ? 'bg-synora-accent/20' : 'hover:bg-synora-accent/10'}`}
                                >
                                  {node.name}
                                </button>
                              ))}
                              {filtered.length === 0 && (
                                <div className="p-3 text-sm text-synora-text-secondary text-center">No nodes found</div>
                              )}
                            </div>
                          );
                        })()}
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
                            setSelectedArtifact(null);
                            setArtifactDiagram(null);
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
                          <h2 className="text-2xl font-bold text-white max-w-2xl break-words">
                            {selectedArtifact.title || (selectedArtifact.sourceUrl ? selectedArtifact.sourceUrl.replace('synora://discovery/', 'Discovery Concept: ') : 'Unknown Document')}
                          </h2>
                          <p className="text-sm text-synora-text-secondary mt-1">{new Date(selectedArtifact.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Delete Document',
                                message: 'Are you sure you want to permanently delete this document? This action cannot be undone and will remove it from your knowledge graph.',
                                onConfirm: async () => {
                                  try {
                                    const res = await fetch(`http://localhost:3001/capture/${selectedArtifact.id}`, {
                                      method: 'DELETE',
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                      setArtifacts(artifacts.filter((a: any) => a.id !== selectedArtifact.id));
                                      setSelectedArtifact(null);
                                      setArtifactDiagram(null);
                                      fetchKnowledge(); // refresh graph
                                      showToast('Document deleted successfully', 'success');
                                    }
                                  } catch (e) {
                                    console.error('Failed to delete', e);
                                    showToast('Failed to delete document', 'error');
                                  }
                                }
                              });
                            }}
                            className="glass-button p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Delete Document"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedArtifact(null);
                              setArtifactDiagram(null);
                            }} 
                            className="glass-button p-2"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full flex flex-col gap-8 pb-16">
                        
                        {/* Diagram Generation */}
                        <div className="shrink-0 flex items-center justify-between bg-synora-surface border border-synora-border p-4 rounded-xl">
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Workflow className="w-4 h-4 text-synora-accent"/> Visual Knowledge Diagram</h3>
                            <p className="text-xs text-synora-text-secondary mt-1">Use AI to generate a structural map of this document</p>
                          </div>
                          <button
                            onClick={async () => {
                              if (isGeneratingDiagram) return;
                              setIsGeneratingDiagram(true);
                              try {
                                const response = await fetch(`http://localhost:3001/visuals/diagram`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                  body: JSON.stringify({ text: selectedArtifact.content || (selectedArtifact.summary?.text || selectedArtifact.summary) || '' })
                                });
                                const data = await response.json();
                                setArtifactDiagram(data.diagram);
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setIsGeneratingDiagram(false);
                              }
                            }}
                            disabled={isGeneratingDiagram}
                            className="px-4 py-2 bg-synora-accent hover:bg-synora-accent-hover text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {isGeneratingDiagram ? <><Loader2 className="w-4 h-4 animate-spin"/> Generating...</> : <><Sparkles className="w-4 h-4"/> Generate Map</>}
                          </button>
                        </div>

                        {artifactDiagram && (
                          <div className="h-[400px] w-full shrink-0">
                            <DiagramViewer code={artifactDiagram} className="w-full h-full" />
                          </div>
                        )}

                        {selectedArtifact.summary ? (
                          <div className="bg-synora-accent/10 border border-synora-accent/20 p-6 rounded-2xl shrink-0">
                            <h3 className="text-sm font-bold text-synora-accent uppercase mb-3 flex items-center justify-between">
                              <span className="flex items-center gap-2"><Sparkles className="w-4 h-4"/> AI Summary</span>
                            </h3>
                            <p className="text-lg leading-relaxed text-white/90">{typeof selectedArtifact.summary === 'string' ? selectedArtifact.summary : selectedArtifact.summary?.text}</p>
                          </div>
                        ) : (
                          <div className="bg-synora-surface/50 border border-synora-border border-dashed p-6 rounded-2xl shrink-0 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-synora-text-secondary uppercase flex items-center gap-2"><Sparkles className="w-4 h-4"/> AI Summary</h3>
                            <button
                              onClick={() => handleGenerateSummary(selectedArtifact.id)}
                              disabled={isGeneratingSummary}
                              className="px-4 py-2 bg-synora-accent hover:bg-synora-accent-hover text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                              {isGeneratingSummary ? <><Loader2 className="w-4 h-4 animate-spin"/> Generating...</> : <><Sparkles className="w-4 h-4"/> Generate Summary</>}
                            </button>
                          </div>
                        )}
                        <div className="shrink-0">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-synora-text-secondary uppercase flex items-center gap-2"><FileText className="w-4 h-4"/> Full Document Content</h3>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleFormat(selectedArtifact.id)}
                                disabled={isFormatting}
                                className="text-xs px-3 py-1 bg-synora-surface hover:bg-synora-surface-hover text-white border border-synora-border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {isFormatting ? <div className="w-3 h-3 rounded-full border-2 border-synora-text-secondary border-t-transparent animate-spin" /> : <Edit3 className="w-3 h-3" />}
                                Format Document
                              </button>
                              <button 
                                onClick={() => handleTranslate(selectedArtifact.id)}
                                disabled={isTranslating}
                                className="text-xs px-3 py-1 bg-synora-accent/10 hover:bg-synora-accent/20 text-synora-accent border border-synora-accent/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {isTranslating ? <div className="w-3 h-3 rounded-full border-2 border-synora-accent border-t-transparent animate-spin" /> : <Globe className="w-3 h-3" />}
                                Translate to English
                              </button>
                            </div>
                          </div>
                          <div className="bg-synora-surface border border-synora-border p-6 rounded-2xl font-serif text-lg leading-loose text-white/80 markdown-prose prose-invert prose-p:text-white/80 prose-headings:text-white prose-a:text-synora-accent prose-strong:text-white prose-ul:text-white/80 max-w-none">
                            {selectedArtifact.content ? (
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedArtifact.content}
                              </ReactMarkdown>
                            ) : (
                              "No content available. It might still be processing, or this was a URL scrape without raw content saved."
                            )}
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

                        <div className="shrink-0">
                          <h3 className="text-sm font-bold text-synora-text-secondary uppercase mb-4 flex items-center gap-2"><Edit3 className="w-4 h-4"/> Annotations</h3>
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="Add an annotation..."
                                value={newAnnotation}
                                onChange={e => setNewAnnotation(e.target.value)}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && newAnnotation.trim()) {
                                    const res = await fetch(`http://localhost:3001/annotations/artifact/${selectedArtifact.id}`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                      body: JSON.stringify({ text: newAnnotation.trim() })
                                    });
                                    if (res.ok) {
                                      const created = await res.json();
                                      setAnnotations([created, ...annotations]);
                                      setNewAnnotation('');
                                    }
                                  }
                                }}
                                className="flex-1 bg-synora-surface border border-synora-border rounded-lg px-4 py-2 text-sm focus:border-synora-accent outline-none"
                              />
                              <button 
                                onClick={async () => {
                                  if (!newAnnotation.trim()) return;
                                  const res = await fetch(`http://localhost:3001/annotations/artifact/${selectedArtifact.id}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({ text: newAnnotation.trim() })
                                  });
                                  if (res.ok) {
                                    const created = await res.json();
                                    setAnnotations([created, ...annotations]);
                                    setNewAnnotation('');
                                  }
                                }}
                                className="px-4 py-2 bg-synora-surface border border-synora-border hover:border-synora-accent text-synora-text-secondary hover:text-white rounded-lg transition-colors"
                              >
                                Add
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              {annotations.map(ann => (
                                <div key={ann.id} className="bg-synora-surface/50 border border-synora-border p-3 rounded-lg flex items-start justify-between group">
                                  <p className="text-sm text-white/90">{ann.text}</p>
                                  <button 
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: 'Delete Annotation',
                                        message: 'Are you sure you want to delete this annotation?',
                                        onConfirm: async () => {
                                          try {
                                            const res = await fetch(`http://localhost:3001/annotations/${ann.id}`, {
                                              method: 'DELETE',
                                              headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            if (res.ok) {
                                              setAnnotations(annotations.filter(a => a.id !== ann.id));
                                              showToast('Annotation deleted', 'success');
                                            }
                                          } catch (e) {
                                            console.error('Failed to delete annotation', e);
                                            showToast('Failed to delete annotation', 'error');
                                          }
                                        }
                                      });
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-synora-text-secondary hover:text-red-400 transition-all shrink-0 ml-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              {annotations.length === 0 && (
                                <p className="text-sm text-synora-text-secondary italic">No annotations yet.</p>
                              )}
                            </div>
                          </div>
                        </div>
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
    </>
  );
};
