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
}

export function GraphCanvas({ nodes, edges }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [wittyRemarkIndex, setWittyRemarkIndex] = useState(0);

  const wittyRemarks = [
    '"Coffee brewing... I mean, threat intel loading!"',
    '"Teaching AI to find bugs faster than devs create them..."',
    '"Warming up the vulnerability scanner... beep boop!"',
    '"Consulting with my security crystal ball..."'
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

  // Draw edges
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

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (edges.length === 0 || nodes.length === 0) return;

    // Node radius (half of node width ~100px)
    const nodeRadius = 50;

    // Draw each edge
    edges.forEach((edge) => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (!fromNode || !toNode) return;

      // Calculate center positions (matching GraphNode percentage positioning)
      const fromCenterX = (fromNode.position.x / 100) * width;
      const fromCenterY = (fromNode.position.y / 100) * height;
      const toCenterX = (toNode.position.x / 100) * width;
      const toCenterY = (toNode.position.y / 100) * height;

      // Calculate angle between nodes
      const dx = toCenterX - fromCenterX;
      const dy = toCenterY - fromCenterY;
      const angle = Math.atan2(dy, dx);

      // Calculate start and end points at node edges
      const startX = fromCenterX + Math.cos(angle) * nodeRadius;
      const startY = fromCenterY + Math.sin(angle) * nodeRadius;
      const endX = toCenterX - Math.cos(angle) * nodeRadius;
      const endY = toCenterY - Math.sin(angle) * nodeRadius;

      // Calculate control points for bezier curve
      const distance = Math.sqrt(dx * dx + dy * dy);
      const controlOffset = Math.min(distance * 0.25, 80);
      
      const cp1X = startX + Math.cos(angle) * controlOffset;
      const cp1Y = startY + Math.sin(angle) * controlOffset;
      const cp2X = endX - Math.cos(angle) * controlOffset;
      const cp2Y = endY - Math.sin(angle) * controlOffset;

      // Draw the curve
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);

      // Apply gradient
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)'); // cyan-500
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.8)'); // blue-500
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.8)'); // purple-500
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw arrowhead
      const arrowSize = 10;
      const arrowAngle = Math.atan2(endY - cp2Y, endX - cp2X);

      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = 'rgba(139, 92, 246, 1)'; // purple-500
      ctx.fill();
    });
  }, [nodes, edges, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `
          linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}></div>
      
      {/* Canvas for edges */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />
      
      {/* Render nodes */}
      {nodes.map((node) => (
        <GraphNode
          key={node.id}
          id={node.id}
          label={node.label}
          status={node.status}
          wittyRemark={node.wittyRemark}
          details={node.details}
          position={node.position}
        />
      ))}

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {/* 3D rotating shield spinner */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-spin"></div>
              
              {/* Middle rotating ring - opposite direction */}
              <div className="absolute inset-2 border-4 border-blue-500/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              
              {/* Inner rotating ring */}
              <div className="absolute inset-4 border-4 border-purple-500/30 rounded-full animate-spin" style={{ animationDuration: '2.5s' }}></div>
              
              {/* Center pulsing core */}
              <div className="absolute inset-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full animate-pulse flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Orbiting dots */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
                <div className="absolute top-0 left-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full -translate-x-1/2 shadow-lg shadow-cyan-400/50"></div>
              </div>
              <div className="absolute inset-2 animate-spin" style={{ animationDuration: '2s', animationDelay: '0.66s' }}>
                <div className="absolute top-0 left-1/2 w-2.5 h-2.5 bg-blue-500 rounded-full -translate-x-1/2 shadow-lg shadow-blue-500/50"></div>
              </div>
              <div className="absolute inset-4 animate-spin" style={{ animationDuration: '2s', animationDelay: '1.33s' }}>
                <div className="absolute top-0 left-1/2 w-2.5 h-2.5 bg-cyan-500 rounded-full -translate-x-1/2 shadow-lg shadow-cyan-500/50"></div>
              </div>
            </div>
            
            {/* Witty remark */}
            <div className="space-y-2">
              <p className="text-xl text-cyan-400 animate-pulse">🔐 Initializing Security Matrix...</p>
              <p className="text-sm text-slate-400 italic">
                {wittyRemarks[wittyRemarkIndex]}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}