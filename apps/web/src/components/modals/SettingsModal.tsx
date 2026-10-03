// @ts-nocheck
import React, { useState } from 'react';
import { Settings, X, BrainCircuit, Key } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelConfig: string;
  setModelConfig: (val: string) => void;
  userPreferences: string;
  setUserPreferences: (val: string) => void;
  handleLogout: () => void;
  isSavingPreferences: boolean;
  setIsSavingPreferences: (val: boolean) => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<any>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, modelConfig, setModelConfig, userPreferences, setUserPreferences,
  handleLogout, isSavingPreferences, setIsSavingPreferences, fetchWithAuth
}) => {
  const [wipeConfirmText, setWipeConfirmText] = React.useState('');
  const [isWiping, setIsWiping] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="max-w-3xl w-full mx-auto glass-panel p-6 md:p-8 relative max-h-full flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-synora-text-secondary hover:text-white bg-synora-bg rounded-full border border-synora-border transition-colors hover:border-synora-accent/50 z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-6 border-b border-synora-border pb-4 pr-12 shrink-0">
          <Settings className="w-6 h-6 text-synora-accent" />
          <h2 className="text-2xl font-bold">Settings & Configuration</h2>
        </div>

        <div className="space-y-8 overflow-y-auto custom-scrollbar pr-2 pb-4 flex-1 min-h-0">
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-synora-accent" /> Synora Model
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
                <option value="auto">Auto (Task-based Selection) - Recommended</option>
                <option value="llama3.1">llama3.1 (Llama 3.1 8B Instruct)</option>
                <option value="llama3.2">llama3.2 (Fast & Lightweight)</option>
                <option value="deepseek-coder-v2">deepseek-coder-v2 (Coding & Technical)</option>
                <option value="gemma2">gemma2 (Creative & Drafting)</option>
                <option value="qwen2.5">qwen2.5 (Multilingual)</option>
              </select>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-synora-accent" /> AI Personality & Custom Instructions
            </h3>
            <div className="bg-synora-surface/50 border border-synora-border rounded-xl p-5">
              <p className="text-sm text-synora-text-secondary mb-4">
                Tell Synora how you want it to behave. (e.g. "Always answer like a pirate", "Keep answers short", "Prefer Python code").
              </p>
              <textarea
                className="w-full glass-input bg-synora-bg/80 outline-none focus:border-synora-accent text-sm p-3 min-h-[100px] resize-y custom-scrollbar"
                placeholder="Enter your preferences here..."
                value={userPreferences}
                onChange={(e) => setUserPreferences(e.target.value)}
              />
              <div className="flex justify-end mt-4">
                <button
                  disabled={isSavingPreferences}
                  onClick={async () => {
                    setIsSavingPreferences(true);
                    try {
                      await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/profile`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ preferences: userPreferences })
                      });
                      onClose(); // Close modal on success
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsSavingPreferences(false);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${isSavingPreferences ? 'bg-synora-border text-synora-text-secondary cursor-not-allowed' : 'bg-synora-accent text-white hover:bg-synora-accent/90 shadow-lg shadow-synora-accent/20'}`}
                >
                  {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
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

          <section>
            <h3 className="text-lg font-semibold text-red-500 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </h3>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
              <p className="text-sm text-red-400 mb-4">
                Wipe out your entire knowledge base. This will delete all artifacts, topics, chunks, and insights. This action cannot be undone.
              </p>

              <div className="space-y-3">
                <label className="text-xs text-synora-text-secondary block">
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={wipeConfirmText}
                    onChange={(e) => setWipeConfirmText(e.target.value)}
                    className="flex-1 glass-input bg-synora-bg/80 outline-none focus:border-red-500 text-sm p-2"
                    placeholder="DELETE"
                  />
                  <button
                    disabled={wipeConfirmText.trim() !== 'DELETE' || isWiping}
                    onClick={async () => {
                      setIsWiping(true);
                      try {
                        await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/knowledge/wipe`, {
                          method: 'DELETE'
                        });
                        window.location.reload();
                      } catch (e) {
                        console.error(e);
                        setIsWiping(false);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 ${wipeConfirmText.trim() !== 'DELETE' ? 'bg-synora-border text-synora-text-secondary cursor-not-allowed opacity-50' : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20'}`}
                  >
                    {isWiping ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Wipe Data'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
