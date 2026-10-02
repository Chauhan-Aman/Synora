import React from 'react';
import { Link, Type, Box, Mic, MicOff, Loader2, Sparkles, CheckCircle } from 'lucide-react';

export interface CaptureTabProps {
  inputType: 'URL' | 'TEXT' | 'FILE' | 'VOICE';
  setInputType: React.Dispatch<React.SetStateAction<'URL' | 'TEXT' | 'FILE' | 'VOICE'>>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  selectedFile: File | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  isSubmitting: boolean;
  status: 'idle' | 'success' | 'error' | 'loading';
  artifactId: string | null;
  handleCaptureSubmit: (e: React.FormEvent) => Promise<void>;
  isListening: boolean;
  toggleListening: () => void;
}

export const CaptureTab: React.FC<CaptureTabProps> = ({
  inputType,
  setInputType,
  inputValue,
  setInputValue,
  selectedFile,
  setSelectedFile,
  isSubmitting,
  status,
  artifactId,
  handleCaptureSubmit,
  isListening,
  toggleListening,
}) => {
  return (
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
  );
};
