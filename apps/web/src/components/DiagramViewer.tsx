import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

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
          
          // Mermaid occasionally leaves stranded error SVGs in the DOM body when it fails
          // Clean them up manually to prevent them from showing at the bottom of the screen
          document.querySelectorAll('svg[id^="dmermaid"]').forEach(el => {
            el.remove();
          });
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
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-synora-bg/80 z-20">
          <Loader2 className="w-8 h-8 animate-spin text-synora-accent" />
        </div>
      )}

      {error ? (
        <div className="p-6 text-red-400 bg-red-500/10 rounded-lg max-w-lg text-center z-10 relative">
          <p className="font-bold mb-2">Diagram Generation Failed</p>
          <p className="text-xs font-mono break-words">{error}</p>
        </div>
      ) : (
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={5}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Toolbar */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-synora-surface/80 backdrop-blur border border-synora-border p-1 rounded-lg">
                <button onClick={() => zoomOut()} className="p-1.5 hover:bg-synora-accent/20 rounded-md text-synora-text-secondary hover:text-white transition-colors" title="Zoom Out">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-synora-border mx-1"></div>
                <button onClick={() => zoomIn()} className="p-1.5 hover:bg-synora-accent/20 rounded-md text-synora-text-secondary hover:text-white transition-colors" title="Zoom In">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-synora-border mx-1"></div>
                <button onClick={() => resetTransform()} className="p-1.5 hover:bg-synora-accent/20 rounded-md text-synora-text-secondary hover:text-white transition-colors" title="Reset Zoom">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 hover:bg-synora-accent/20 rounded-md text-synora-text-secondary hover:text-white transition-colors" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>

              <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center p-8">
                <div 
                  ref={containerRef}
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                  className="mermaid-container flex items-center justify-center cursor-grab active:cursor-grabbing"
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      )}
    </div>
  );
}
