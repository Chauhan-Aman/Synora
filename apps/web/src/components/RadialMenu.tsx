import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

  useEffect(() => {
    setMounted(true);
    
    // Close on escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // If too many items, limit to top 12 for the wheel to remain usable
  const displayItems = items.slice(0, 12);
  const numItems = displayItems.length;
  
  // Dimensions
  const size = 600;
  const center = size / 2;
  const innerRadius = 90;
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
          
          <text 
            x={center} 
            y={center - 10} 
            fill="#ffffff" 
            fontSize="18" 
            fontWeight="bold" 
            textAnchor="middle"
          >
            {title}
          </text>
          
          <text 
            x={center} 
            y={center + 15} 
            fill="#94a3b8" 
            fontSize="12" 
            textAnchor="middle"
          >
            {displayItems.length} items
          </text>
        </svg>

        {/* Close button at center */}
        <button 
          onClick={onClose}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-8 text-synora-text-secondary hover:text-white bg-synora-surface/50 hover:bg-red-500/80 rounded-full p-2 transition-all border border-transparent hover:border-red-400 z-10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {items.length > 12 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-synora-surface/80 backdrop-blur border border-synora-border px-6 py-3 rounded-full text-sm text-synora-text-secondary shadow-lg">
          Showing top 12 items. {items.length - 12} more hidden.
        </div>
      )}
    </div>
  );
}
