// @ts-nocheck
import React from 'react';
import { BrainCircuit, CheckCircle, Compass, FileText, GraduationCap, Key, Layers, Link, Loader2, LogOut, MessageSquare, Plus, Rss, Settings, Sparkles, X, Copy, Trash2, Edit3, Type, Box, Mic, MicOff, Search, Network, List as ListIcon, Workflow, Hash, Volume2, VolumeX, Send, Image as ImageIcon, Briefcase, MessageCircle, Mail, CheckSquare, Square, Download, Printer, Globe, Wand2, Save, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { RichTextEditor } from '../RichTextEditor';
import { ProceduralCover } from '../ProceduralCover';

export interface CreateTabProps {
  activeTab: any;
  coverData: any;
  draftContext: any;
  draftText: any;
  draftTitle: any;
  handleApprove: any;
  handleGenerateCover: any;
  handleGenerateParagraph: any;
  handleProofread: any;
  handleReject: any;
  handleRewrite: any;
  handleSaveDraft: any;
  isGeneratingCover: any;
  isGeneratingParagraph: any;
  isProofreading: any;
  isRevising: any;
  isSavingDraft: any;
  revisionPrompt: any;
  setCoverData: any;
  setDraftText: any;
  setDraftTitle: any;
  setRevisionPrompt: any;
  setSuggestedParagraph: any;
  suggestedParagraph: any;
}

export const CreateTab: React.FC<CreateTabProps> = ({
  activeTab, coverData, draftContext, draftText, draftTitle, handleApprove, handleGenerateCover, handleGenerateParagraph, handleProofread, handleReject, handleRewrite, handleSaveDraft, isGeneratingCover, isGeneratingParagraph, isProofreading, isRevising, isSavingDraft, revisionPrompt, setCoverData, setDraftText, setDraftTitle, setRevisionPrompt, setSuggestedParagraph, suggestedParagraph
}) => {
  return (
    <>
{/* CREATE TAB */}
          {/* CREATE TAB */}
          {activeTab === 'CREATE' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full mt-4 pb-8 max-w-7xl mx-auto w-full px-4 md:px-0">
              
              {/* Left Column: Editor */}
              <div className="flex-1 flex flex-col glass-panel p-6 rounded-2xl h-full border-synora-border shadow-2xl relative">
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2 shrink-0">
                    <FileText className="w-5 h-5 text-synora-accent" />
                    Editor
                  </h2>
                  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar w-full xl:w-auto pb-1 xl:pb-0">
                    <button
                      onClick={handleSaveDraft}
                      disabled={isSavingDraft || draftText.trim().length < 10}
                      className="flex items-center gap-2 px-3 py-1.5 bg-synora-surface border border-synora-border hover:border-synora-accent/50 text-white rounded-lg transition-all disabled:opacity-50 text-xs font-bold whitespace-nowrap shrink-0 shadow-sm"
                      title="Save as Note in Knowledge Graph"
                    >
                      {isSavingDraft ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="w-4 h-4 text-blue-400" /> Save Note</>
                      )}
                    </button>
                  </div>
                </div>
                
                {coverData && (
                  <div className="mb-6 relative group">
                    <ProceduralCover
                      title="My Article"
                      theme={coverData.theme}
                      gradient={coverData.gradient}
                      patternOpacity={coverData.patternOpacity}
                      mood={coverData.mood}
                      className="w-full h-48 md:h-64"
                    />
                    <button 
                      onClick={() => setCoverData(null)}
                      className="absolute top-4 right-4 bg-black/50 hover:bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="mb-4 px-1">
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Document Title (Optional)"
                    className="w-full bg-transparent border-b border-synora-border/50 text-xl font-semibold text-white placeholder:text-synora-text-secondary/50 focus:outline-none focus:border-synora-accent/50 pb-2 transition-colors"
                  />
                </div>
                <RichTextEditor 
                  content={draftText} 
                  onChange={setDraftText} 
                  placeholder="Start writing your draft here..." 
                  footer={
                    <>
                    <button
                      onClick={handleGenerateCover}
                      disabled={isGeneratingCover || draftText.trim().length < 20}
                      className="flex items-center gap-2 px-3 py-1.5 bg-synora-surface border border-synora-border hover:border-synora-accent/50 text-white rounded-lg transition-all disabled:opacity-50 text-xs font-bold whitespace-nowrap shrink-0"
                    >
                      {isGeneratingCover ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating Cover...</>
                      ) : (
                        <><ImageIcon className="w-4 h-4 text-synora-accent" /> Generate Cover</>
                      )}
                    </button>
                    <button
                      onClick={handleGenerateParagraph}
                      disabled={isGeneratingParagraph || draftText.trim().length < 20}
                      className="flex items-center gap-2 px-3 py-1.5 bg-synora-accent hover:bg-synora-accent-hover text-white rounded-lg transition-all disabled:opacity-50 text-xs font-bold whitespace-nowrap shrink-0"
                    >
                      {isGeneratingParagraph ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Co-Writing...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Draft Next Paragraph</>
                      )}
                    </button>
                    <button
                      onClick={handleProofread}
                      disabled={isProofreading || draftText.trim().length < 10}
                      className="flex items-center gap-2 px-3 py-1.5 bg-synora-surface border border-synora-border hover:border-synora-accent/50 text-white rounded-lg transition-all disabled:opacity-50 text-xs font-bold whitespace-nowrap shrink-0"
                    >
                      {isProofreading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Polishing...</>
                      ) : (
                        <><Wand2 className="w-4 h-4 text-emerald-400" /> Proofread</>
                      )}
                    </button>
                    </>
                  }
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
                        <p className="text-xs text-synora-text-secondary line-clamp-2 leading-relaxed mb-3">
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

          
    </>
  );
};