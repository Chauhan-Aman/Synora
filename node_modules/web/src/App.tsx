import React, { useState } from 'react';
import { Sparkles, Link, Type, Loader2, CheckCircle } from 'lucide-react';

type InputType = 'URL' | 'TEXT';

function App() {
  const [inputType, setInputType] = useState<InputType>('URL');
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [artifactId, setArtifactId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsSubmitting(true);
    setStatus('idle');
    setArtifactId(null);

    try {
      const response = await fetch('http://localhost:3000/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: inputType,
          [inputType === 'URL' ? 'sourceUrl' : 'content']: inputValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit capture');
      }

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
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-synora-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-synora-accent/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-2xl z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-synora-surface rounded-2xl mb-4 border border-synora-border shadow-lg">
            <Sparkles className="w-8 h-8 text-synora-accent" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Capture Everything</h1>
          <p className="text-synora-text-secondary text-lg">
            Send links or text into your personal AI knowledge graph.
          </p>
        </div>

        <div className="glass-panel p-6 md:p-8">
          {/* Type Toggle */}
          <div className="flex bg-synora-bg p-1 rounded-xl mb-6">
            <button
              onClick={() => setInputType('URL')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                inputType === 'URL'
                  ? 'bg-synora-surface text-synora-text-primary shadow-sm'
                  : 'text-synora-text-secondary hover:text-synora-text-primary'
              }`}
            >
              <Link className="w-4 h-4" />
              URL Link
            </button>
            <button
              onClick={() => setInputType('TEXT')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                inputType === 'TEXT'
                  ? 'bg-synora-surface text-synora-text-primary shadow-sm'
                  : 'text-synora-text-secondary hover:text-synora-text-primary'
              }`}
            >
              <Type className="w-4 h-4" />
              Raw Text
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Send to Synora
                </>
              )}
            </button>
          </form>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 animate-fade-in text-emerald-400">
              <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Successfully captured!</p>
                <p className="text-sm opacity-80 mt-1">
                  Added to processing queue (ID: {artifactId?.split('-')[0]}...)
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 animate-fade-in">
              <p className="font-medium">Failed to submit capture.</p>
              <p className="text-sm opacity-80 mt-1">Make sure the backend API is running on port 3000.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
