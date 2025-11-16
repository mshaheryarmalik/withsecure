import { useEffect, useRef, useState } from 'react';
import { GraphNode } from './GraphNode';

interface Node {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  wittyRemark: string;
  details?: string;
  position: { x: number; y: number };
}

interface Edge {
  from: string;
  to: string;
}

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeMove?: (nodeId: string, position: { x: number; y: number }) => void;
  onCanvasPan?: (deltaX: number, deltaY: number) => void;
}

export function GraphCanvas({ nodes, edges, onNodeMove, onCanvasPan }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const [animationProgress, setAnimationProgress] = useState<{ [key: string]: number }>({});
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [wittyRemarkIndex, setWittyRemarkIndex] = useState(0);
  const autoPanRef = useRef<boolean>(true); // Enable auto-panning by default

  const GRID_SIZE = 10; // Grid cell size in pixels (very granular for precision)

  const wittyRemarks = [
    "🔐 Scanning the dark web for your secrets...",
    "🤖 Training AI on your vulnerabilities...",
    "🕵️ Investigating suspicious dependencies...",
    "⚡ Hacking the mainframe...",
    "🎯 Targeting attack vectors...",
    "🔬 Analyzing threat landscape...",
  ];

  // Cycle through witty remarks every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWittyRemarkIndex((prev) => (prev + 1) % wittyRemarks.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Animate new edges
  useEffect(() => {
    const newAnimationProgress = { ...animationProgress };
    let hasNewEdge = false;

    edges.forEach((edge) => {
      const edgeKey = `${edge.from}-${edge.to}`;
      if (!animationProgress[edgeKey]) {
        newAnimationProgress[edgeKey] = 0;
        hasNewEdge = true;
      }
    });

    if (hasNewEdge) {
      setAnimationProgress(newAnimationProgress);
    }
  }, [edges]);

  // Animation loop for edges
  useEffect(() => {
    if (Object.keys(animationProgress).length === 0) return;

    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      const newAnimationProgress = { ...animationProgress };
      let needsUpdate = false;

      for (const edgeKey in animationProgress) {
        if (animationProgress[edgeKey] < 1) {
          // Animate over 1000ms
          const newProgress = Math.min(1, animationProgress[edgeKey] + deltaTime / 1000);
          newAnimationProgress[edgeKey] = newProgress;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        setAnimationProgress(newAnimationProgress);
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationProgress]);

  // Calculate manhattan routing path
  const getManhattanPath = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    nodeRadius: number
  ): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    
    // Determine direction
    const dx = toX - fromX;
    const dy = toY - fromY;
    
    // Start point (edge of from node)
    const startX = fromX + (dx > 0 ? nodeRadius : dx < 0 ? -nodeRadius : 0);
    const startY = fromY + (dy > 0 ? nodeRadius : dy < 0 ? -nodeRadius : 0);
    
    // End point (edge of to node)
    const endX = toX - (dx > 0 ? nodeRadius : dx < 0 ? -nodeRadius : 0);
    const endY = toY - (dy > 0 ? nodeRadius : dy < 0 ? -nodeRadius : 0);
    
    points.push({ x: startX, y: startY });
    
    // Calculate midpoints for manhattan routing
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    // Simple 3-segment path
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal primary
      points.push({ x: midX, y: startY });
      points.push({ x: midX, y: endY });
    } else {
      // Vertical primary
      points.push({ x: startX, y: midY });
      points.push({ x: endX, y: midY });
    }
    
    points.push({ x: endX, y: endY });
    
    return points;
  };

  // Draw smooth corners between line segments
  const drawRoundedPath = (
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    radius: number,
    progress: number
  ) => {
    if (points.length < 2) return { totalLength: 0, drawnLength: 0 };
    
    // Calculate total path length
    let totalLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }
    
    const targetLength = totalLength * progress;
    let drawnLength = 0;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const afterNext = points[i + 2];
      
      const segmentLength = Math.sqrt(
        Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2)
      );
      
      if (drawnLength + segmentLength <= targetLength) {
        // Draw full segment
        if (afterNext) {
          // Draw line to point before corner
          const dx1 = next.x - current.x;
          const dy1 = next.y - current.y;
          const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
          const cornerDist = Math.min(radius, len1 / 2);
          
          const beforeCornerX = next.x - (dx1 / len1) * cornerDist;
          const beforeCornerY = next.y - (dy1 / len1) * cornerDist;
          
          ctx.lineTo(beforeCornerX, beforeCornerY);
          
          // Draw rounded corner
          const dx2 = afterNext.x - next.x;
          const dy2 = afterNext.y - next.y;
          const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          const afterCornerDist = Math.min(radius, len2 / 2);
          
          const afterCornerX = next.x + (dx2 / len2) * afterCornerDist;
          const afterCornerY = next.y + (dy2 / len2) * afterCornerDist;
          
          ctx.quadraticCurveTo(next.x, next.y, afterCornerX, afterCornerY);
        } else {
          ctx.lineTo(next.x, next.y);
        }
        drawnLength += segmentLength;
      } else {
        // Draw partial segment
        const remainingLength = targetLength - drawnLength;
        const t = remainingLength / segmentLength;
        const partialX = current.x + (next.x - current.x) * t;
        const partialY = current.y + (next.y - current.y) * t;
        ctx.lineTo(partialX, partialY);
        drawnLength = targetLength;
        break;
      }
    }
    
    return { totalLength, drawnLength, lastPoint: drawnLength >= totalLength ? points[points.length - 1] : null };
  };

  // Draw edges with animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;

    // Set canvas size to match container
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Set canvas resolution (accounts for high DPI displays)
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas - no arrows needed
    ctx.clearRect(0, 0, width, height);

    // NO ARROW DRAWING - just clear canvas for nodes to be visible
  }, [nodes, edges, dimensions, animationProgress, panOffset]);

  const handleNodeDrag = (nodeId: string, position: { x: number; y: number }) => {
    if (onNodeMove) {
      // Snap to grid
      const snappedX = Math.round(position.x / (GRID_SIZE / dimensions.width * 100)) * (GRID_SIZE / dimensions.width * 100);
      const snappedY = Math.round(position.y / (GRID_SIZE / dimensions.height * 100)) * (GRID_SIZE / dimensions.height * 100);
      
      // Clamp to canvas bounds
      let clampedX = Math.max(5, Math.min(95, snappedX));
      let clampedY = Math.max(5, Math.min(95, snappedY));
      
      // Check for collisions with other nodes
      const NODE_SIZE_PERCENT = 6; // Approximate node size in percentage
      const COLLISION_PADDING = 2; // Extra spacing to prevent overlap
      
      for (const node of nodes) {
        if (node.id === nodeId) continue; // Skip self
        
        const dx = Math.abs(clampedX - node.position.x);
        const dy = Math.abs(clampedY - node.position.y);
        
        // If nodes are too close, don't update position
        if (dx < NODE_SIZE_PERCENT + COLLISION_PADDING && dy < NODE_SIZE_PERCENT + COLLISION_PADDING) {
          return; // Collision detected, don't move
        }
      }
      
      onNodeMove(nodeId, { x: clampedX, y: clampedY });
    }
  };

  const handlePanStart = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
    if (onCanvasPan) {
      onCanvasPan(panOffset.x, panOffset.y);
    }
  };

  // Auto-pan to center on active node (or first node on initial load)
  useEffect(() => {
    if (!containerRef.current || dimensions.width === 0 || nodes.length === 0) return;
    
    // Find active node, or use first node if no active node
    const activeNode = nodes.find(n => n.status === 'active') || nodes[0];
    if (!activeNode) return;

    // Calculate where the node currently is in pixels
    const nodePixelX = (activeNode.position.x / 100) * dimensions.width;
    
    // Calculate the center of the viewport
    const viewportCenterX = dimensions.width / 2;
    
    // Calculate the offset needed to center the node
    const targetOffsetX = viewportCenterX - nodePixelX;
    
    // Smoothly animate to the new offset
    setPanOffset(prev => ({
      x: targetOffsetX,
      y: 0 // Keep Y at 0 since all nodes are centered vertically
    }));
  }, [nodes, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* Subtle grid background - Dark theme */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `
          linear-gradient(to right, rgba(71, 85, 105, 0.3) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(71, 85, 105, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
      }}></div>
      
      {/* Canvas dragging overlay */}
      <div
        className={`absolute inset-0 z-5 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        {/* Canvas for edges */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-0"
        />
        
        {/* Render nodes with sequential animation */}
        <div className="absolute inset-0" style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transition: isPanning ? 'none' : 'transform 0.2s ease-out'
        }}>
          {nodes.map((node, index) => (
            <GraphNode
              key={node.id}
              id={node.id}
              label={node.label}
              status={node.status}
              wittyRemark={node.wittyRemark}
              details={node.details}
              position={node.position}
              animationDelay={index * 300}
            />
          ))}
        </div>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              {/* Minimal spinner */}
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-3 border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-3 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              
              {/* Witty remark */}
              <div className="space-y-2">
                <p className="text-slate-400">Initializing Security Matrix...</p>
                <p className="text-xs text-slate-500 italic">
                  {wittyRemarks[wittyRemarkIndex]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}