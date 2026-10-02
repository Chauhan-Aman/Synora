// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrainCircuit, CheckCircle, Compass, FileText, GraduationCap, Key, Layers, Link, Loader2, LogOut, MessageSquare, Plus, Rss, Settings, Sparkles, X, Copy, Trash2, Edit3, Type, Box, Mic, MicOff, Search, Network, List as ListIcon, Workflow, Hash, Volume2, VolumeX, Send, Image as ImageIcon, Briefcase, MessageCircle, Mail, CheckSquare, Square, Download, Printer, Globe, Wand2, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import BrainTreeMap from '../BrainTreeMap';
import { RadialMenu, type RadialMenuItem } from '../RadialMenu';
import { DiagramViewer } from '../DiagramViewer';
import { CodeBlock } from '../CodeBlock';

export interface KnowledgeTabProps {
  activeRadialCategory: any;
  activeTab: any;
  annotations: any;
  artifactDiagram: any;
  artifacts: any;
  collections: any;
  editingTitleId: any;
  editingTitleValue: any;
  fetchKnowledge: any;
  fetchWiki: any;
  fetchWithAuth: any;
  graphContainerRef: any;
  graphData: any;
  graphDimensions: any;
  graphSearchQuery: any;
  graphSearchSelectedIndex: any;
  handleFormat: any;
  handleGenerateSummary: any;
  handleTranslate: any;
  insights: any;
  isFetchingWiki: any;
  isFormatting: any;
  isGeneratingDiagram: any;
  isGeneratingInsights: any;
  isGeneratingSummary: any;
  isLoadingKnowledge: any;
  isTranslating: any;
  knowledgeView: any;
  newAnnotation: any;
  radialCategories: any;
  renameArtifact: any;
  selectedArtifact: any;
  selectedCollectionId: any;
  selectedNode: any;
  setActiveDraftId: any;
  setActiveRadialCategory: any;
  setActiveTab: any;
  setAnnotations: any;
  setArtifactDiagram: any;
  setArtifacts: any;
  setChatQuery: any;
  setConfirmDialog: any;
  setDraftText: any;
  setDraftTitle: any;
  setEditingTitleId: any;
  setEditingTitleValue: any;
  setGraphSearchQuery: any;
  setGraphSearchSelectedIndex: any;
  setInsights: any;
  setIsGeneratingDiagram: any;
  setIsGeneratingInsights: any;
  setKnowledgeView: any;
  setNewAnnotation: any;
  setSelectedArtifact: any;
  setSelectedCollectionId: any;
  setSelectedNode: any;
  setShowAddToCollectionModal: any;
  setShowCollections: any;
  setShowNewCollectionModal: any;
  setShowWebSearches: any;
  showCollections: any;
  showToast: any;
  showWebSearches: any;
  token: any;
  wikiSummary: any;
}

export const KnowledgeTab: React.FC<KnowledgeTabProps> = ({
  activeRadialCategory, activeTab, annotations, artifactDiagram, artifacts, collections, editingTitleId, editingTitleValue, fetchKnowledge, fetchWiki, fetchWithAuth, graphContainerRef, graphData, graphDimensions, graphSearchQuery, graphSearchSelectedIndex, handleFormat, handleGenerateSummary, handleTranslate, insights, isFetchingWiki, isFormatting, isGeneratingDiagram, isGeneratingInsights, isGeneratingSummary, isLoadingKnowledge, isTranslating, knowledgeView, newAnnotation, radialCategories, renameArtifact, selectedArtifact, selectedCollectionId, selectedNode, setActiveDraftId, setActiveRadialCategory, setActiveTab, setAnnotations, setArtifactDiagram, setArtifacts, setChatQuery, setConfirmDialog, setDraftText, setDraftTitle, setEditingTitleId, setEditingTitleValue, setGraphSearchQuery, setGraphSearchSelectedIndex, setInsights, setIsGeneratingDiagram, setIsGeneratingInsights, setKnowledgeView, setNewAnnotation, setSelectedArtifact, setSelectedCollectionId, setSelectedNode, setShowAddToCollectionModal, setShowCollections, setShowNewCollectionModal, setShowWebSearches, showCollections, showToast, showWebSearches, token, wikiSummary
}) => {
  return (
    <>
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
                          {collections.map((col: any) => (
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
                          {artifacts.filter((a: any) => (showWebSearches || a.type !== 'WEB_SEARCH') && (!selectedCollectionId || a.collections?.some((c:any) => c.id === selectedCollectionId))).length === 0 ? (
                            <p className="text-synora-text-secondary py-8 text-center bg-synora-bg/30 rounded-xl border border-synora-border/50">No documents found.</p>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {artifacts.filter((a: any) => (showWebSearches || a.type !== 'WEB_SEARCH') && (!selectedCollectionId || a.collections?.some((c:any) => c.id === selectedCollectionId))).map((artifact: any) => (
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
                                    {artifact.type === 'TEXT' && artifact.collections?.some((c: any) => c.name === 'Drafts') && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDraftText(artifact.content || '');
                                          setDraftTitle(artifact.title || '');
                                          setActiveDraftId(artifact.id);
                                          setActiveTab('CREATE');
                                        }}
                                        className="text-xs px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-md text-blue-400 transition-colors flex items-center gap-1"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        Edit
                                      </button>
                                    )}
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
                                {editingTitleId === artifact.id ? (
                                  <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                                    <input
                                      id={`title-input-${artifact.id}`}
                                      autoFocus
                                      className="flex-1 bg-synora-bg border border-synora-accent/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-synora-accent/40"
                                      value={editingTitleValue}
                                      onChange={e => setEditingTitleValue(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') renameArtifact(artifact.id, editingTitleValue);
                                        if (e.key === 'Escape') setEditingTitleId(null);
                                      }}
                                    />
                                    <button onClick={() => renameArtifact(artifact.id, editingTitleValue)} className="p-1.5 rounded-lg bg-synora-accent/20 text-synora-accent hover:bg-synora-accent hover:text-white transition-colors text-xs font-bold shrink-0">Save</button>
                                    <button onClick={() => setEditingTitleId(null)} className="p-1.5 rounded-lg bg-synora-surface border border-synora-border text-synora-text-secondary hover:text-white transition-colors shrink-0">✕</button>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-2 group/title">
                                    <h4 className="text-lg font-bold text-white group-hover:text-synora-accent transition-colors break-words flex-1">{artifact.title}</h4>
                                    <button
                                      id={`rename-btn-${artifact.id}`}
                                      onClick={e => { e.stopPropagation(); setEditingTitleId(artifact.id); setEditingTitleValue(artifact.title || ''); }}
                                      className="opacity-0 group-hover/title:opacity-100 p-1 rounded-md text-synora-text-secondary hover:text-synora-accent hover:bg-synora-surface transition-all shrink-0 mt-0.5"
                                      title="Rename"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                  </div>
                                )}
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
                                setGraphSearchSelectedIndex((prev: any) => Math.min(prev + 1, filtered.length - 1));
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setGraphSearchSelectedIndex((prev: any) => Math.max(prev - 1, 0));
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
                          {editingTitleId === selectedArtifact.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                id="modal-title-input"
                                autoFocus
                                className="flex-1 bg-synora-bg border border-synora-accent/50 rounded-xl px-4 py-2 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-synora-accent/40"
                                value={editingTitleValue}
                                onChange={e => setEditingTitleValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') renameArtifact(selectedArtifact.id, editingTitleValue);
                                  if (e.key === 'Escape') setEditingTitleId(null);
                                }}
                              />
                              <button onClick={() => renameArtifact(selectedArtifact.id, editingTitleValue)} className="px-3 py-2 rounded-xl bg-synora-accent/20 text-synora-accent hover:bg-synora-accent hover:text-white transition-colors text-sm font-bold shrink-0">Save</button>
                              <button onClick={() => setEditingTitleId(null)} className="px-3 py-2 rounded-xl bg-synora-surface border border-synora-border text-synora-text-secondary hover:text-white transition-colors shrink-0">✕</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/modal-title">
                              <h2 className="text-2xl font-bold text-white max-w-2xl break-words">
                                {selectedArtifact.title || (selectedArtifact.sourceUrl ? selectedArtifact.sourceUrl.replace('synora://discovery/', 'Discovery Concept: ') : 'Unknown Document')}
                              </h2>
                              <button
                                id="modal-rename-btn"
                                onClick={() => { setEditingTitleId(selectedArtifact.id); setEditingTitleValue(selectedArtifact.title || ''); }}
                                className="opacity-0 group-hover/modal-title:opacity-100 p-1.5 rounded-lg text-synora-text-secondary hover:text-synora-accent hover:bg-synora-surface transition-all shrink-0"
                                title="Rename document"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                            </div>
                          )}
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
                              {selectedArtifact.type === 'TEXT' && selectedArtifact.collections?.some((c: any) => c.name === 'Drafts') && (
                                <button
                                  onClick={() => {
                                    setDraftText(selectedArtifact.content || '');
                                    setDraftTitle(selectedArtifact.title || '');
                                    setActiveDraftId(selectedArtifact.id);
                                    setSelectedArtifact(null);
                                    setActiveTab('CREATE');
                                  }}
                                  className="text-xs px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-md transition-colors flex items-center gap-2"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Open in Editor
                                </button>
                              )}
                              <button 
                                onClick={() => handleFormat(selectedArtifact.id)}
                                disabled={isFormatting}
                                className="text-xs px-3 py-1 bg-synora-surface hover:bg-synora-surface-hover text-white border border-synora-border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {isFormatting ? <div className="w-3 h-3 rounded-full border-2 border-synora-text-secondary border-t-transparent animate-spin" /> : <FileText className="w-3 h-3" />}
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
                              {annotations.map((ann: any) => (
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
          
    </>
  );
};