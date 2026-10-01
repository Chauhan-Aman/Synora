import React from 'react';
import { 
  FileText, Briefcase, MessageCircle, Mail, GraduationCap, 
  Layers, Hash, BrainCircuit, CheckSquare, Square, 
  Loader2, Sparkles, CheckCircle, Copy, Download, Printer, Rss 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../CodeBlock';

type ContentFormat = 'blog' | 'linkedin' | 'twitter' | 'newsletter' | 'paper';
type WritingStyle = 'professional' | 'conversational' | 'academic';

interface PublishTabProps {
  publishFormat: ContentFormat;
  setPublishFormat: (f: ContentFormat) => void;
  publishStyle: WritingStyle;
  setPublishStyle: (s: WritingStyle) => void;
  publishSelectedTopics: Set<string>;
  setPublishSelectedTopics: (t: Set<string>) => void;
  isPublishing: boolean;
  setIsPublishing: (v: boolean) => void;
  publishOutput: string;
  setPublishOutput: (v: React.SetStateAction<string>) => void;
  publishCopied: boolean;
  setPublishCopied: (v: boolean) => void;
  topics: {id: string, name: string, count: number}[];
  fetchWithAuth: (url: string, options?: any) => Promise<Response>;
}

export const PublishTab: React.FC<PublishTabProps> = ({
  publishFormat,
  setPublishFormat,
  publishStyle,
  setPublishStyle,
  publishSelectedTopics,
  setPublishSelectedTopics,
  isPublishing,
  setIsPublishing,
  publishOutput,
  setPublishOutput,
  publishCopied,
  setPublishCopied,
  topics,
  fetchWithAuth
}) => {
  return (
    <div className="w-full h-full flex flex-col p-4 md:p-8">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full min-h-0">
        <div className="mb-8 shrink-0">
          <h2 className="text-3xl font-bold text-white mb-2">Content Pipeline</h2>
          <p className="text-synora-text-secondary">Transform your knowledge graph into publishable content using local AI.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Panel 1: Configure */}
          <div className="lg:col-span-1 space-y-5 overflow-y-auto custom-scrollbar pr-2 pb-4">
            <div className="glass-panel p-5">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-synora-accent" /> Format</h3>
              <div className="space-y-2">
                {([
                  ['blog', 'Blog Post', FileText, 'Long-form article with sections'], 
                  ['linkedin', 'LinkedIn Post', Briefcase, 'Professional post with hashtags'], 
                  ['twitter', 'Twitter Thread', MessageCircle, '6 numbered tweets'],
                  ['newsletter', 'Newsletter', Mail, 'Engaging email issue'],
                  ['paper', 'Academic Paper', GraduationCap, 'Formal research paper']
                ] as const).map(([fmt, label, Icon, desc]) => (
                  <button key={fmt} onClick={() => setPublishFormat(fmt as ContentFormat)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${publishFormat === fmt ? 'border-synora-accent bg-synora-accent/10 text-white' : 'border-synora-border text-synora-text-secondary hover:border-synora-accent/50 hover:text-white'}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-synora-text-secondary">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel p-5">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Hash className="w-4 h-4 text-synora-accent" /> Writing Style</h3>
              <div className="space-y-2">
                {(['professional', 'conversational', 'academic'] as WritingStyle[]).map(s => (
                  <button key={s} onClick={() => setPublishStyle(s)} className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${publishStyle === s ? 'border-synora-accent bg-synora-accent/10 text-white font-medium' : 'border-synora-border text-synora-text-secondary hover:border-synora-accent/50'}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel p-5">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-synora-accent" /> Topics ({publishSelectedTopics.size} selected)</h3>
              <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {topics.length === 0 ? (
                  <p className="text-xs text-synora-text-secondary">No topics yet. Capture some content first.</p>
                ) : (
                  topics.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => {
                        const next = new Set(publishSelectedTopics);
                        if (next.has(topic.id)) next.delete(topic.id); else next.add(topic.id);
                        setPublishSelectedTopics(next);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${publishSelectedTopics.has(topic.id) ? 'bg-synora-accent/15 border border-synora-accent text-white' : 'border border-synora-border text-synora-text-secondary hover:text-white hover:border-synora-accent/50'}`}
                    >
                      {publishSelectedTopics.has(topic.id) ? <CheckSquare className="w-3.5 h-3.5 text-synora-accent shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate">{topic.name}</span>
                      <span className="ml-auto text-xs text-synora-text-secondary shrink-0">{topic.count}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <button
              disabled={isPublishing || publishSelectedTopics.size === 0}
              onClick={async () => {
                setIsPublishing(true);
                setPublishOutput('');
                const res = await fetchWithAuth(`http://localhost:3001/publish/${publishFormat}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ topicIds: Array.from(publishSelectedTopics), style: publishStyle }),
                });
                if (!res.ok || !res.body) { setIsPublishing(false); return; }
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  const parts = buffer.split('\n\n');
                  buffer = parts.pop() || '';
                  for (const part of parts) {
                    if (part.startsWith('data: ')) {
                      try {
                        const d = JSON.parse(part.slice(6));
                        if (d.type === 'text') setPublishOutput(prev => prev + d.text);
                      } catch(e) {}
                    }
                  }
                }
                setIsPublishing(false);
              }}
              className="w-full py-3 px-4 bg-synora-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-synora-accent/20"
            >
              {isPublishing ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate {publishFormat === 'blog' ? 'Blog Post' : publishFormat === 'linkedin' ? 'LinkedIn Post' : 'Twitter Thread'}</>}
            </button>
          </div>

          {/* Panel 2: Preview */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="glass-panel p-5 h-full flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  {publishFormat === 'blog' && <FileText className="w-4 h-4 text-synora-accent" />}
                  {publishFormat === 'linkedin' && <Briefcase className="w-4 h-4 text-blue-400" />}
                  {publishFormat === 'twitter' && <MessageCircle className="w-4 h-4 text-sky-400" />}
                  {publishFormat === 'newsletter' && <Mail className="w-4 h-4 text-emerald-400" />}
                  {publishFormat === 'paper' && <GraduationCap className="w-4 h-4 text-purple-400" />}
                  {publishFormat === 'blog' ? 'Blog Post Preview' : publishFormat === 'linkedin' ? 'LinkedIn Post Preview' : publishFormat === 'twitter' ? 'Twitter Thread Preview' : publishFormat === 'newsletter' ? 'Newsletter Preview' : 'Academic Paper Preview'}
                </h3>
                {publishOutput && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(publishOutput);
                        setPublishCopied(true);
                        setTimeout(() => setPublishCopied(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-synora-bg border border-synora-border rounded-lg text-xs text-synora-text-secondary hover:text-white hover:border-synora-accent/50 transition-all"
                    >
                      {publishCopied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {publishCopied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => {
                        const ext = publishFormat === 'blog' || publishFormat === 'paper' ? 'md' : 'txt';
                        const blob = new Blob([publishOutput], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `synora-${publishFormat}-${Date.now()}.${ext}`;
                        a.click(); URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-synora-bg border border-synora-border rounded-lg text-xs text-synora-text-secondary hover:text-white hover:border-synora-accent/50 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Export
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-synora-bg border border-synora-border rounded-lg text-xs text-synora-text-secondary hover:text-white hover:border-synora-accent/50 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print PDF
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {!publishOutput && !isPublishing && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-synora-text-secondary py-12">
                    <Rss className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">Select topics and click Generate to create your content.</p>
                  </div>
                )}
                {(publishOutput || isPublishing) && (
                  <div className={`prose prose-invert prose-sm max-w-none ${publishFormat !== 'blog' ? 'font-sans whitespace-pre-wrap' : ''}`}>
                    {publishFormat === 'blog' || publishFormat === 'paper' || publishFormat === 'newsletter' ? (
                      <div className="print-friendly">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock as any }}>
                          {publishOutput + (isPublishing ? '▍' : '')}
                        </ReactMarkdown>
                      </div>
                    ) : publishFormat === 'linkedin' ? (
                      <div className="bg-synora-bg border border-synora-border rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">Y</div>
                          <div>
                            <div className="text-white font-semibold text-sm">You</div>
                            <div className="text-xs text-synora-text-secondary flex items-center gap-1"><Briefcase className="w-3 h-3" /> LinkedIn</div>
                          </div>
                        </div>
                        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{publishOutput}{isPublishing ? '▍' : ''}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(publishOutput + (isPublishing ? '▍' : '')).split('\n').filter(l => l.trim()).map((tweet, i) => (
                          <div key={i} className="bg-synora-bg border border-synora-border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center"><MessageCircle className="w-3.5 h-3.5 text-white" /></div>
                              <span className="text-white font-semibold text-sm">You</span>
                              <span className="text-xs text-synora-text-secondary ml-auto">{tweet.replace(/^\d+\/\s*/, '').length}/260</span>
                            </div>
                            <p className="text-white text-sm leading-relaxed">{tweet}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

