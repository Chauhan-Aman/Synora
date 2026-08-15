import React, { useState, useEffect } from 'react';
import { Sparkles, Link, Type, Loader2, CheckCircle, BrainCircuit, Hash, Box } from 'lucide-react';

type InputType = 'URL' | 'TEXT';
type Tab = 'CAPTURE' | 'KNOWLEDGE';

interface Topic {
  id: string;
  name: string;
  count: number;
}

interface Entity {
  id: string;
  name: string;
  type: string;
  count: number;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('CAPTURE');
  
  // Capture State
  const [inputType, setInputType] = useState<InputType>('URL');
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [artifactId, setArtifactId] = useState<string | null>(null);

  // Knowledge State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);

  useEffect(() => {
    if (activeTab === 'KNOWLEDGE') {
      fetchKnowledge();
    }
  }, [activeTab]);

  const fetchKnowledge = async () => {
    setIsLoadingKnowledge(true);
    try {
      const [topicsRes, entitiesRes] = await Promise.all([
        fetch('http://localhost:3000/knowledge/topics'),
        fetch('http://localhost:3000/knowledge/entities')
      ]);
      const topicsData = await topicsRes.json();
      const entitiesData = await entitiesRes.json();
      setTopics(topicsData);
      setEntities(entitiesData);
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-synora-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-synora-accent/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl z-10 animate-fade-in flex flex-col items-center">
        
        {/* Header & Tabs */}
        <div className="text-center mb-8 w-full max-w-2xl">
          <div className="inline-flex items-center justify-center p-3 bg-synora-surface rounded-2xl mb-4 border border-synora-border shadow-lg">
            <Sparkles className="w-8 h-8 text-synora-accent" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Synora Engine</h1>
          
          <div className="flex bg-synora-surface/50 backdrop-blur-md p-1.5 rounded-2xl border border-synora-border shadow-xl w-full max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('CAPTURE')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'CAPTURE'
                  ? 'bg-synora-bg text-synora-text-primary shadow-md border border-synora-border/50'
                  : 'text-synora-text-secondary hover:text-synora-text-primary'
              }`}
            >
              <Link className="w-4 h-4" /> Capture
            </button>
            <button
              onClick={() => setActiveTab('KNOWLEDGE')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'KNOWLEDGE'
                  ? 'bg-synora-bg text-synora-text-primary shadow-md border border-synora-border/50'
                  : 'text-synora-text-secondary hover:text-synora-text-primary'
              }`}
            >
              <BrainCircuit className="w-4 h-4" /> Knowledge Graph
            </button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="w-full animate-fade-in">
          {activeTab === 'CAPTURE' ? (
            <div className="max-w-2xl mx-auto glass-panel p-6 md:p-8">
              <div className="flex bg-synora-bg p-1 rounded-xl mb-6">
                <button
                  onClick={() => setInputType('URL')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    inputType === 'URL'
                      ? 'bg-synora-surface text-synora-text-primary shadow-sm'
                      : 'text-synora-text-secondary hover:text-synora-text-primary'
                  }`}
                >
                  <Link className="w-4 h-4" /> URL Link
                </button>
                <button
                  onClick={() => setInputType('TEXT')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    inputType === 'TEXT'
                      ? 'bg-synora-surface text-synora-text-primary shadow-sm'
                      : 'text-synora-text-secondary hover:text-synora-text-primary'
                  }`}
                >
                  <Type className="w-4 h-4" /> Raw Text
                </button>
              </div>

              <form onSubmit={handleCaptureSubmit} className="space-y-4">
                <div>
                  {inputType === 'URL' ? (
                    <input
                      type="url"
                      placeholder="https://example.com/article"
                      className="glass-input"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  ) : (
                    <textarea
                      placeholder="Paste your text snippet here..."
                      className="glass-input min-h-[120px] resize-y"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !inputValue.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" /> Send to Synora
                    </>
                  )}
                </button>
              </form>

              {status === 'success' && (
                <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 animate-fade-in text-emerald-400">
                  <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Successfully captured!</p>
                    <p className="text-sm opacity-80 mt-1">
                      Check the Knowledge Graph tab to see the AI extractions (ID: {artifactId?.split('-')[0]}).
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* KNOWLEDGE GRAPH TAB */
            <div className="w-full glass-panel p-6 md:p-8 animate-fade-in">
              {isLoadingKnowledge ? (
                <div className="flex flex-col items-center justify-center py-20 text-synora-text-secondary">
                  <Loader2 className="w-10 h-10 animate-spin text-synora-accent mb-4" />
                  <p>Loading Knowledge Graph...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Topics Column */}
                  <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-synora-border pb-4">
                      <Hash className="w-5 h-5 text-synora-accent" /> Extracted Topics
                    </h2>
                    {topics.length === 0 ? (
                      <p className="text-synora-text-secondary py-8 text-center bg-synora-bg/30 rounded-xl border border-synora-border/50">No topics extracted yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {topics.map(topic => (
                          <div key={topic.id} className="group relative flex items-center gap-2 bg-synora-surface border border-synora-border hover:border-synora-accent/50 rounded-full px-4 py-2 transition-all duration-300 hover:shadow-lg hover:shadow-synora-accent/10 cursor-default hover:-translate-y-0.5">
                            <span className="font-medium text-synora-text-primary group-hover:text-synora-accent transition-colors">{topic.name}</span>
                            <span className="flex items-center justify-center bg-synora-bg text-synora-text-secondary text-xs font-bold rounded-full w-6 h-6 border border-synora-border group-hover:border-synora-accent/30 group-hover:text-synora-text-primary transition-all">
                              {topic.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Entities Column */}
                  <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-synora-border pb-4">
                      <Box className="w-5 h-5 text-synora-accent" /> Named Entities
                    </h2>
                    {entities.length === 0 ? (
                      <p className="text-synora-text-secondary py-8 text-center bg-synora-bg/30 rounded-xl border border-synora-border/50">No entities extracted yet.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {entities.map(entity => (
                          <div key={entity.id} className="flex items-center justify-between bg-synora-surface border border-synora-border hover:border-synora-accent/50 rounded-xl p-3 transition-all duration-300 hover:shadow-md cursor-default">
                            <div className="flex flex-col">
                              <span className="font-bold text-synora-text-primary">{entity.name}</span>
                              <span className="text-xs text-synora-accent font-medium tracking-wide uppercase mt-0.5">{entity.type}</span>
                            </div>
                            <div className="text-sm font-medium text-synora-text-secondary bg-synora-bg px-3 py-1 rounded-full border border-synora-border">
                              {entity.count} captures
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
