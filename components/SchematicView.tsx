import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ElectricalNode, Connection, SwitchState, ComponentType } from '../types';

interface SchematicViewProps {
  nodes: ElectricalNode[];
  connections: Connection[];
  switchStates: Record<string, SwitchState>;
  energizedNodes: Set<string>;
  earthedNodes: Set<string>;
  onToggleSwitch: (id: string) => void;
}

// Helper functions for touch geometry
function getDistance(t1: React.Touch, t2: React.Touch) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getCenter(t1: React.Touch, t2: React.Touch) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2
  };
}

const SchematicView: React.FC<SchematicViewProps> = ({
  nodes,
  connections,
  switchStates,
  energizedNodes,
  earthedNodes,
  onToggleSwitch,
}) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);

  // --- AUTO FIT LOGIC ---
  const fitSchematic = useCallback(() => {
    if (containerRef.current && nodes.length > 0) {
      const { clientWidth, clientHeight } = containerRef.current;

      if (clientWidth === 0 || clientHeight === 0) return;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      nodes.forEach(node => {
        let x1, x2, y1, y2;

        if (node.type === ComponentType.BUSBAR) {
           x1 = node.x;
           x2 = node.x + (node.width || 0);
           y1 = node.y - 30;
           y2 = node.y + 30;
        } else {
           const size = 40; 
           const labelMargin = 80;
           x1 = node.x - size - labelMargin;
           x2 = node.x + size + labelMargin;
           y1 = node.y - size;
           y2 = node.y + size + 40; 
        }

        if (x1 < minX) minX = x1;
        if (y1 < minY) minY = y1;
        if (x2 > maxX) maxX = x2;
        if (y2 > maxY) maxY = y2;
      });

      const MARGIN_X = 20;
      const MARGIN_Y = 20;
      
      const contentWidth = (maxX - minX) + (MARGIN_X * 2);
      const contentHeight = (maxY - minY) + (MARGIN_Y * 2);
      const contentCenterX = minX - MARGIN_X + contentWidth / 2;
      const contentCenterY = minY - MARGIN_Y + contentHeight / 2;

      const scaleX = clientWidth / contentWidth;
      const scaleY = clientHeight / contentHeight;
      const fitZoom = Math.min(scaleX, scaleY, 1.2) * 0.95; 

      const panX = (clientWidth / 2) - (contentCenterX * fitZoom);
      const panY = (clientHeight / 2) - (contentCenterY * fitZoom);

      setZoom(fitZoom);
      setPan({ x: panX, y: panY });
    }
  }, [nodes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fitSchematic();
    }, 100);
    return () => clearTimeout(timer);
  }, [fitSchematic]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        fitSchematic();
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [fitSchematic]);


  // --- COLORS ---
  const C_LIVE = '#FFD700'; 
  const C_DEAD = '#000000'; 
  const C_EARTH = '#008000'; 

  const getLineColor = (id1: string, id2: string) => {
    if (earthedNodes.has(id1) && earthedNodes.has(id2)) return C_EARTH;
    if (energizedNodes.has(id1) || energizedNodes.has(id2)) return C_LIVE;
    return C_DEAD;
  };

  const getComponentColor = (id: string) => {
    if (earthedNodes.has(id)) return C_EARTH;
    if (energizedNodes.has(id)) return C_LIVE;
    return C_DEAD;
  };

  const getTerminalOffsets = (type: ComponentType) => {
    switch (type) {
      case ComponentType.CIRCUIT_BREAKER: return { top: -15, bottom: 15 };
      case ComponentType.EARTH_SWITCH: return { top: -15, bottom: 10 };
      case ComponentType.TRANSFORMER: return { top: -22, bottom: 20 };
      case ComponentType.SOURCE: return { top: -15, bottom: 15 };
      case ComponentType.BUSBAR: return { top: 0, bottom: 0 };
      case ComponentType.LOAD: return { top: -10, bottom: 10 };
      default: return { top: 0, bottom: 0 };
    }
  };

  // --- MOUSE & ZOOM EVENTS ---
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      if (e.button === 1) e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => { isDragging.current = false; };
  
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    
    const zoomSensitivity = 0.1;
    const delta = e.deltaY > 0 ? (1 - zoomSensitivity) : (1 + zoomSensitivity);
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    const newPanX = mouseX - (worldX * newZoom);
    const newPanY = mouseY - (worldY * newZoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // --- TOUCH EVENTS ---
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging.current = false; 
      lastPinchDist.current = getDistance(e.touches[0], e.touches[1]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && containerRef.current && lastPinchDist.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = getDistance(t1, t2);
      
      const ratio = currentDist / lastPinchDist.current;
      const newZoom = Math.max(0.1, Math.min(5, zoom * ratio));
      
      const rect = containerRef.current.getBoundingClientRect();
      const center = getCenter(t1, t2);
      const mouseX = center.x - rect.left;
      const mouseY = center.y - rect.top;

      const worldX = (mouseX - pan.x) / zoom;
      const worldY = (mouseY - pan.y) / zoom;
      const newPanX = mouseX - (worldX * newZoom);
      const newPanY = mouseY - (worldY * newZoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
      
      lastPinchDist.current = currentDist;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    lastPinchDist.current = null;
  };

  const stopDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-white relative cursor-crosshair overflow-hidden touch-none select-none"
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
    >
      <div className="absolute top-4 right-4 bg-white border border-black p-2 shadow-sm pointer-events-none z-10 font-mono text-[10px] md:text-xs">
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-[#FFD700]"></div> LIVE</div>
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-[#000000]"></div> DEAD</div>
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-[#008000]"></div> EARTHED</div>
      </div>

      <svg width="100%" height="100%">
        <g style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
          {connections.map((conn, i) => {
            const from = nodes.find(n => n.id === conn.from);
            const to = nodes.find(n => n.id === conn.to);
            if (!from || !to) return null;
            
            const color = getLineColor(from.id, to.id);
            const fromOffsets = getTerminalOffsets(from.type);
            const toOffsets = getTerminalOffsets(to.type);

            let x1 = from.x + (from.width || 0) / 2;
            let y1 = from.y + fromOffsets.bottom; 
            let x2 = to.x + (to.width || 0) / 2;
            let y2 = to.y + toOffsets.top;

            if (from.type === ComponentType.BUSBAR) {
               x1 = x2; 
               y1 = from.y;
            }

            if (Math.abs(x1 - x2) > 1) {
                const midY = (y1 + y2) / 2;
                return (
                    <path 
                        key={i}
                        d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
                        stroke={color}
                        strokeWidth="1.5"
                        fill="none"
                    />
                );
            }

            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" />;
          })}

          {nodes.map(node => {
            const color = getComponentColor(node.id);
            const state = switchStates[node.id];

            if (node.type === ComponentType.CIRCUIT_BREAKER) {
                const isOpen = state === SwitchState.OPEN;
                return (
                    <g 
                      key={node.id} 
                      transform={`translate(${node.x}, ${node.y})`} 
                      onClick={(e) => { e.stopPropagation(); onToggleSwitch(node.id); }} 
                      onMouseDown={stopDrag}
                      onTouchStart={stopDrag}
                      className="cursor-pointer hover:opacity-70"
                    >
                        <rect x="-20" y="-30" width="40" height="60" fill="transparent" />
                        <g transform="translate(0, -15)">
                            <line x1="-3" y1="-3" x2="3" y2="3" stroke={color} strokeWidth="1.5" />
                            <line x1="-3" y1="3" x2="3" y2="-3" stroke={color} strokeWidth="1.5" />
                        </g>
                        <circle cx="0" cy="15" r="2.5" fill="white" stroke={color} strokeWidth="1.5" />
                        {isOpen ? (
                            <line x1="0" y1="15" x2="-8" y2="-10" stroke={color} strokeWidth="1.5" />
                        ) : (
                            <line x1="0" y1="15" x2="0" y2="-15" stroke={color} strokeWidth="1.5" />
                        )}
                        <text x="15" y="0" className="text-[10px] font-mono select-none font-bold" fill="black">{node.label}</text>
                        <text x="15" y="10" className="text-[8px] font-mono select-none font-bold" fill="black">
                            {isOpen ? 'OPEN' : 'CLOSED'}
                        </text>
                    </g>
                );
            }

            if (node.type === ComponentType.EARTH_SWITCH) {
                const isEarthed = state === SwitchState.EARTHED;
                const earthSymbolColor = isEarthed ? C_EARTH : C_DEAD;

                return (
                    <g 
                      key={node.id} 
                      transform={`translate(${node.x}, ${node.y})`} 
                      onClick={(e) => { e.stopPropagation(); onToggleSwitch(node.id); }} 
                      onMouseDown={stopDrag}
                      onTouchStart={stopDrag}
                      className="cursor-pointer hover:opacity-70"
                    >
                        <rect x="-30" y="-20" width="60" height="40" fill="transparent" />
                        <circle cx="0" cy="-15" r="1.5" fill="black" />
                        <circle cx="0" cy="10" r="2.5" fill="white" stroke={color} strokeWidth="1.5" />
                        {state === SwitchState.CLOSED && (
                             <line x1="0" y1="10" x2="0" y2="-15" stroke={color} strokeWidth="1.5" />
                        )}
                        {state === SwitchState.OPEN && (
                             <line x1="0" y1="10" x2="-12" y2="-8" stroke={color} strokeWidth="1.5" />
                        )}
                        {state === SwitchState.EARTHED && (
                             <line x1="0" y1="10" x2="-20" y2="10" stroke={color} strokeWidth="1.5" />
                        )}
                        <g transform="translate(-20, 10)">
                             <circle cx="0" cy="0" r="1.5" fill={earthSymbolColor} />
                             <line x1="0" y1="0" x2="0" y2="8" stroke={earthSymbolColor} strokeWidth="1.5" />
                             <g transform="translate(0, 8)">
                                <line x1="-8" y1="0" x2="8" y2="0" stroke={earthSymbolColor} strokeWidth="1.5" />
                                <line x1="-5" y1="3" x2="5" y2="3" stroke={earthSymbolColor} strokeWidth="1.5" />
                                <line x1="-2" y1="6" x2="2" y2="6" stroke={earthSymbolColor} strokeWidth="1.5" />
                             </g>
                        </g>
                        <text x="15" y="0" className="text-[10px] font-mono select-none" fill="black">{node.label}</text>
                        <text x="15" y="10" className="text-[8px] font-mono select-none text-gray-500">{state}</text>
                    </g>
                )
            }

            if (node.type === ComponentType.BUSBAR) {
                return (
                    <g key={node.id}>
                        <line x1={node.x} y1={node.y} x2={node.x + (node.width || 0)} y2={node.y} stroke={color} strokeWidth="3" />
                        <text x={node.x} y={node.y - 10} className="text-xs font-bold font-mono" fill="black">{node.label}</text>
                    </g>
                )
            }

            if (node.type === ComponentType.TRANSFORMER) {
                return (
                    <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                        <circle cx="0" cy="-10" r="12" fill="none" stroke={color} strokeWidth="1.5" />
                        <circle cx="0" cy="8" r="12" fill="none" stroke={color} strokeWidth="1.5" />
                        <text x="16" y="5" className="text-[10px] font-mono" fill="black">{node.label}</text>
                    </g>
                )
            }

            if (node.type === ComponentType.SOURCE) {
                return (
                     <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                         <rect x="-30" y="-15" width="60" height="30" fill="none" stroke={color} strokeWidth="1.5" />
                         <text x="0" y="4" textAnchor="middle" className="text-[10px] font-mono font-bold" fill="black">SUPPLY</text>
                     </g>
                )
            }

            if (node.type === ComponentType.LOAD) {
                return (
                    <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                         {/* Arrow Head */}
                        <path d="M -5 -5 L 0 5 L 5 -5 L -5 -5" fill={color} stroke={color} strokeWidth="1" />
                        <text x="10" y="4" className="text-[10px] font-mono text-gray-600" fill="black">{node.label}</text>
                    </g>
                )
            }

            if (node.type === ComponentType.CABLE) {
                 if (!node.label) return null; // Don't render empty labels
                 return (
                    <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                        <text x="5" y="0" className="text-[10px] font-mono text-gray-600" fill="black">{node.label}</text>
                    </g>
                )
            }
            
            return null;
          })}
        </g>
      </svg>
    </div>
  );
};

export default SchematicView;
