import { useRef, useEffect } from 'react';

import mermaid from 'mermaid';

interface MermaidViewerProps {
  chart: string;
}

export function MermaidViewer({ chart }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });

    const renderChart = async () => {
      if (containerRef.current && chart) {
        try {
          containerRef.current.innerHTML = '';
          const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart);
          containerRef.current.innerHTML = svg;
        } catch (error) {
          console.error("Failed to render Mermaid chart:", error);
          if (containerRef.current) {
            containerRef.current.innerHTML = `<div class="text-red-400 p-4 border border-red-500/30 rounded-lg">Failed to render diagram.</div>`;
          }
        }
      }
    };

    renderChart();
  }, [chart]);

  return (
    <div className="w-full overflow-auto bg-black/20 rounded-xl p-4 border border-synora-border/50">
      <div ref={containerRef} className="flex justify-center items-center min-h-[300px]" />
    </div>
  );
}



