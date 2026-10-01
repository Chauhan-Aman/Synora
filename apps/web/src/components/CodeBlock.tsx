import React, { useState } from 'react';
import { CheckCircle, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const codeText = String(children).replace(/\n$/, '');

  if (inline) {
    return <code className="bg-synora-bg px-1.5 py-0.5 rounded text-sm font-mono text-emerald-400" {...props}>{children}</code>;
  }

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-synora-border overflow-hidden my-4 shadow-lg">
      <div className="bg-synora-surface/50 px-4 py-2 text-xs font-mono border-b border-synora-border text-synora-text-secondary flex justify-between items-center">
        <span>{lang || 'Code'}</span>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(codeText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1.5 hover:text-white transition-colors py-1 px-2 rounded-md hover:bg-synora-bg"
        >
          {copied ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus as any}
        language={lang}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.875rem' }}
        {...props}
      >
        {codeText}
      </SyntaxHighlighter>
    </div>
  );
};
