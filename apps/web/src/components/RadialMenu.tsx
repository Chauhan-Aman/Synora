import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface RadialMenuItem {
  id: string;
  label: string;
  count?: number;
  data?: any;
  color?: string;
}

interface RadialMenuProps {
  items: RadialMenuItem[];
  title: string;
  onClose: () => void;
  onSelect: (item: RadialMenuItem) => void;
}

export function RadialMenu({ items, title, onClose, onSelect }: RadialMenuProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // Close on escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Pagination logic
  const PAGE_SIZE = 8;
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const displayItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const numItems = displayItems.length;
  
  // Dimensions
  const size = 600;
  const center = size / 2;
  const innerRadius = 115; // Increased to give more room in the center
  const outerRadius = 280;
  
  // When only 1 item, it should take up the whole circle.
  // We use 359.9 instead of 360 to avoid SVG rendering bugs with full circle paths
  const anglePerItem = numItems === 1 ? 359.9 : 360 / numItems;

  const getWedgePath = (index: number) => {
    const startAngle = index * anglePerItem;
    // Add small gap by subtracting 1 degree from end angle (unless there's only 1 item)
    const endAngle = startAngle + anglePerItem - (numItems > 1 ? 1 : 0);
    
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    
    // For hover effect, slightly increase outer radius
    const currentOuterRadius = hoveredIndex === index ? outerRadius + 10 : outerRadius;
    
    const x1 = center + Math.cos(startRad) * currentOuterRadius;
    const y1 = center + Math.sin(startRad) * currentOuterRadius;
    const x2 = center + Math.cos(endRad) * currentOuterRadius;
    const y2 = center + Math.sin(endRad) * currentOuterRadius;
    
    const x3 = center + Math.cos(endRad) * innerRadius;
    const y3 = center + Math.sin(endRad) * innerRadius;
    const x4 = center + Math.cos(startRad) * innerRadius;
    const y4 = center + Math.sin(startRad) * innerRadius;
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return [
      `M ${x1} ${y1}`,
      `A ${currentOuterRadius} ${currentOuterRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
  };

  const getLabelPosition = (index: number) => {
    const midAngle = index * anglePerItem + (anglePerItem / 2);
    const midRad = (midAngle - 90) * (Math.PI / 180);
    const labelRadius = innerRadius + (outerRadius - innerRadius) * 0.6; // Slightly more towards outer edge
    return {
      x: center + Math.cos(midRad) * labelRadius,
      y: center + Math.sin(midRad) * labelRadius,
      angle: midAngle
    };
  };

  if (numItems === 0) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${mounted ? 'bg-synora-bg/80 backdrop-blur-md opacity-100' : 'bg-transparent opacity-0'}`}>
      
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Wheel Container */}
      <div className={`relative transition-all duration-500 transform ${mounted ? 'scale-100 rotate-0' : 'scale-50 -rotate-45 opacity-0'}`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-2xl">
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
            </radialGradient>
          </defs>

          {/* Central Glow */}
          <circle cx={center} cy={center} r={innerRadius * 1.5} fill="url(#centerGlow)" className="animate-pulse" />

          {/* Slices */}
          {displayItems.map((item, i) => {
            const isHovered = hoveredIndex === i;
            const path = getWedgePath(i);
            const labelPos = getLabelPosition(i);
            
            // Adjust text rotation to always be readable
            let textRotation = labelPos.angle;
            if (textRotation > 90 && textRotation < 270) {
              textRotation -= 180;
            }

            return (
              <g 
                key={item.id}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Wedge shape */}
                <path 
                  d={path} 
                  fill={isHovered ? (item.color || '#8b5cf6') : 'rgba(30, 41, 59, 0.7)'}
                  stroke={isHovered ? '#ffffff' : 'rgba(148, 163, 184, 0.2)'}
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all duration-300 backdrop-blur-xl"
                  style={{ transformOrigin: `${center}px ${center}px` }}
                />
                
                {/* Text Label */}
                <text 
                  x={labelPos.x} 
                  y={labelPos.y} 
                  fill={isHovered ? '#ffffff' : '#cbd5e1'}
                  fontSize={numItems > 8 ? "12" : "14"}
                  fontWeight={isHovered ? "bold" : "normal"}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${textRotation}, ${labelPos.x}, ${labelPos.y})`}
                  className="pointer-events-none transition-colors duration-200"
                >
                  {item.label.length > 20 ? item.label.substring(0, 18) + '...' : item.label}
                </text>
                
                {/* Optional Count Badge underneath text */}
                {item.count && (
                  <text
                    x={labelPos.x} 
                    y={labelPos.y + 16} 
                    fill={isHovered ? 'rgba(255,255,255,0.8)' : 'rgba(148, 163, 184, 0.6)'}
                    fontSize="10"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    transform={`rotate(${textRotation}, ${labelPos.x}, ${labelPos.y})`}
                    className="pointer-events-none transition-colors duration-200"
                  >
                    ({item.count})
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Central Hub */}
          <circle 
            cx={center} 
            cy={center} 
            r={innerRadius - 5} 
            fill="#0f172a" 
            stroke="rgba(139, 92, 246, 0.5)" 
            strokeWidth="2" 
          />
          
          <foreignObject x={center - (innerRadius - 5)} y={center - (innerRadius - 5)} width={(innerRadius - 5) * 2} height={(innerRadius - 5) * 2}>
            <div className="w-full h-full flex flex-col items-center justify-center relative px-2">
              <span className="text-white font-bold text-sm sm:text-base text-center leading-tight break-words mb-1 line-clamp-2">
                {title}
              </span>
              <span className="text-[#94a3b8] text-xs">
                {items.length} items
              </span>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-3 mt-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(0, p - 1)); }}
                    disabled={page === 0}
                    className={`p-1.5 rounded-full transition-all ${page === 0 ? 'text-synora-border cursor-not-allowed opacity-30' : 'text-synora-text-secondary hover:text-white bg-synora-surface/80 hover:bg-synora-accent hover:shadow-lg border border-synora-border hover:border-synora-accent/50'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-synora-accent/80 font-medium text-[10px]">
                    {page + 1} / {totalPages}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(totalPages - 1, p + 1)); }}
                    disabled={page === totalPages - 1}
                    className={`p-1.5 rounded-full transition-all ${page === totalPages - 1 ? 'text-synora-border cursor-not-allowed opacity-30' : 'text-synora-text-secondary hover:text-white bg-synora-surface/80 hover:bg-synora-accent hover:shadow-lg border border-synora-border hover:border-synora-accent/50'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Close button at center bottom */}
              <button 
                onClick={onClose}
                className="mt-3 text-synora-text-secondary hover:text-white bg-synora-surface/50 hover:bg-red-500/80 rounded-full p-2 transition-all border border-transparent hover:border-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </foreignObject>
        </svg>
      </div>
    </div>
  );
}
