// @ts-nocheck
import React from 'react';
import { BrainCircuit, CheckCircle, Compass, FileText, GraduationCap, Key, Layers, Link, Loader2, LogOut, MessageSquare, Plus, Rss, Settings, Sparkles, X, Copy, Trash2, Edit3, Type, Box, Mic, MicOff, Search, Network, List as ListIcon, Workflow, Hash, Volume2, VolumeX, Send, Image as ImageIcon, Briefcase, MessageCircle, Mail, CheckSquare, Square, Download, Printer, Globe, Wand2, Save, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

export interface DiscoverTabProps {
  activeTab: any;
  customTopic: any;
  divingId: any;
  exploringId: any;
  fetchDiscover: any;
  handleCustomTopic: any;
  handleDiveDeeper: any;
  handleExplore: any;
  handleLoadMore: any;
  isGeneratingCustom: any;
  isLoadingDiscover: any;
  nestedRecommendations: any;
  recommendations: any;
  setCustomTopic: any;
  tasteProfile: any;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({
  activeTab, customTopic, divingId, exploringId, fetchDiscover, handleCustomTopic, handleDiveDeeper, handleExplore, handleLoadMore, isGeneratingCustom, isLoadingDiscover, nestedRecommendations, recommendations, setCustomTopic, tasteProfile
}) => {
  return (
    <>
{/* DISCOVER TAB */}
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

              <form onSubmit={handleCustomTopic} className="mb-8 shrink-0 flex items-center gap-3">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Request a specific topic to explore..."
                  className="flex-1 bg-synora-surface/80 border border-synora-border/50 rounded-xl px-4 py-3 text-white placeholder-synora-text-secondary/50 focus:border-synora-accent outline-none shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!customTopic.trim() || isGeneratingCustom}
                  className="glass-button px-6 py-3 whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
                >
                  {isGeneratingCustom ? <Sparkles className="w-4 h-4 animate-spin text-synora-accent" /> : <Search className="w-4 h-4 text-synora-accent" />}
                  Explore Custom
                </button>
              </form>

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

              {recommendations.length > 0 && (
                <div className="flex justify-center pb-12 shrink-0">
                  <button 
                    onClick={handleLoadMore}
                    disabled={isLoadingDiscover}
                    className="glass-button px-8 py-3 flex items-center gap-2 group hover:shadow-[0_0_20px_rgba(167,139,250,0.3)] transition-all"
                  >
                    <Sparkles className={`w-5 h-5 text-synora-accent group-hover:scale-110 transition-transform ${isLoadingDiscover ? 'animate-spin' : ''}`} />
                    Generate More Ideas
                  </button>
                </div>
              )}
            </div>
          )}

          
    </>
  );
};