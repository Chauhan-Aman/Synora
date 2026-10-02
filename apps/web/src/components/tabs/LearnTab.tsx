// @ts-nocheck
import React from 'react';
import { BrainCircuit, CheckCircle, Compass, FileText, GraduationCap, Key, Layers, Link, Loader2, LogOut, MessageSquare, Plus, Rss, Settings, Sparkles, X, Copy, Trash2, Edit3, Type, Box, Mic, MicOff, Search, Network, List as ListIcon, Workflow, Hash, Volume2, VolumeX, Send, Image as ImageIcon, Briefcase, MessageCircle, Mail, CheckSquare, Square, Download, Printer, Globe, Wand2, Save, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface LearnTabProps {
  activeTab: any;
  currentCardIndex: any;
  flashcards: any;
  handleReview: any;
  isFlipped: any;
  isLoadingLearn: any;
  setIsFlipped: any;
}

export const LearnTab: React.FC<LearnTabProps> = ({
  activeTab, currentCardIndex, flashcards, handleReview, isFlipped, isLoadingLearn, setIsFlipped
}) => {
  return (
    <>
{/* LEARN TAB */}
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