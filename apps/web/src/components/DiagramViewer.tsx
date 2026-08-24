import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
});

interface DiagramViewerProps {
  code: string;
  className?: string;
}

export function DiagramViewer({ code, className = '' }: DiagramViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const renderDiagram = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        
        if (isMounted) {
          setSvgContent(svg);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Mermaid Render Error:", err);
          setError(err.message || 'Failed to render diagram');
          setLoading(false);
        }
      }
    };

    if (code) {
      renderDiagram();
    }

    return () => {
      isMounted = false;
    };
  }, [code]);

  return (
    <div className={isFullscreen ? "fixed inset-0 z-[100] w-full h-full bg-synora-bg flex flex-col items-center justify-center" : `relative flex flex-col items-center justify-center bg-synora-bg border border-synora-border rounded-xl overflow-hidden ${className}`}>
      
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-synora-surface/80 backdrop-blur border border-synora-border p-1 rounded-lg">
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 hover:bg-synora-accent/20 rounded-md text-synora-text-secondary hover:text-white transition-colors" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-synora-text-secondary w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1.5 hover:bg-synora-accent/20 rounded-md text-synora-text-secondary hover:text-white transition-colors" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-synora-border mx-1"></div>
        <button onClick={() => setZoom(1)} className="p-1.5 hover:bg-synora-accent/20 rounded-md text-synora-text-secondary hover:text-white transition-colors" title="Reset Zoom">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 hover:bg-synora-accent/20 rounded-md text-synora-text-secondary hover:text-white transition-colors" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-synora-bg/80 z-20">
          <Loader2 className="w-8 h-8 animate-spin text-synora-accent" />
        </div>
      )}

      {error ? (
        <div className="p-6 text-red-400 bg-red-500/10 rounded-lg max-w-lg text-center">
          <p className="font-bold mb-2">Diagram Generation Failed</p>
          <p className="text-xs font-mono break-words">{error}</p>
        </div>
      ) : (
        <div 
          className="w-full h-full overflow-auto custom-scrollbar flex items-center justify-center p-8"
        >
          <div 
            ref={containerRef}
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="mermaid-container transition-transform duration-200 origin-center"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>
      )}
    </div>
  );
}
