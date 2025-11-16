import { Info } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface GraphNodeProps {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  wittyRemark: string;
  details?: string;
  position: { x: number; y: number }; // Expects percentages (0-100)
  animationDelay?: number; // Delay in ms before node appears
}

// Encrypted background component
function EncryptedBackground({ status }: { status: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 200;
    canvas.height = 100;
    
    const chars = '01アイウエオカキクケコ</>{}[]';
    const fontSize = 8;
    const columns = Math.floor(canvas.width / fontSize);
    const rows = Math.floor(canvas.height / fontSize);
    
    let frame = 0;
    
    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)'; // slate-900 with opacity
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Get color based on status
      let color = '#475569'; // slate-600 default
      if (status === 'active') color = '#06b6d4'; // cyan-500
      else if (status === 'completed') color = '#22c55e'; // green-500
      
      ctx.fillStyle = color;
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
          // Randomize character appearance
          if (Math.random() > 0.95) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = i * fontSize;
            const y = j * fontSize + fontSize;
            const opacity = Math.random() * 0.5 + 0.1;
            
            ctx.globalAlpha = opacity;
            ctx.fillText(char, x, y);
          }
        }
      }
      
      ctx.globalAlpha = 1;
      frame++;
      
      if (frame % 3 === 0) { // Slow down animation
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => requestAnimationFrame(animate), 100);
      }
    };
    
    animate();
  }, [status]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 opacity-30"
      style={{ width: '200px', height: '100px' }}
    />
  );
}

export function GraphNode({ id, label, status, wittyRemark, details, position, animationDelay = 0 }: GraphNodeProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [animationDelay]);

  const getStatusStyle = () => {
    switch (status) {
      case 'completed':
        return {
          border: 'border-emerald-500/70',
          bg: 'bg-gradient-to-br from-slate-800 to-slate-900',
          shadow: 'shadow-lg shadow-emerald-500/20',
          dot: 'bg-emerald-400',
          ring: 'ring-emerald-400',
          glow: 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-emerald-500/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity'
        };
      case 'active':
        return {
          border: 'border-cyan-400/80',
          bg: 'bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900',
          shadow: 'shadow-lg shadow-cyan-500/20',
          dot: 'bg-cyan-400 animate-pulse',
          ring: 'ring-cyan-400 animate-ping',
          glow: 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-cyan-500/20 before:to-transparent before:animate-pulse'
        };
      case 'pending':
        return {
          border: 'border-slate-700',
          bg: 'bg-gradient-to-br from-slate-900 to-slate-950',
          shadow: 'shadow-md shadow-slate-900/50',
          dot: 'bg-slate-600',
          ring: 'ring-slate-600',
          glow: ''
        };
      case 'error':
        return {
          border: 'border-red-500/60',
          bg: 'bg-gradient-to-br from-slate-800 to-slate-900',
          shadow: 'shadow-lg shadow-red-500/10',
          dot: 'bg-red-500',
          ring: 'ring-red-500',
          glow: ''
        };
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'completed': return 'text-emerald-300';
      case 'active': return 'text-cyan-300';
      case 'pending': return 'text-slate-500';
      case 'error': return 'text-red-400';
    }
  };

  const styles = getStatusStyle();

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="absolute transition-all ease-out z-10"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        animation: 'nodeSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: 1
      }}
    >
      <style>
        {`
          @keyframes nodeSlideIn {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.3);
            }
            100% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
        `}
      </style>
      <div className={`relative border-2 rounded-sm px-3 py-2 ${styles.border} ${styles.bg} ${styles.shadow} transition-all duration-300 w-[200px] h-[100px] flex flex-col justify-center overflow-hidden ${styles.glow} hover:scale-105`}>
        {/* Encrypted background */}
        <EncryptedBackground status={status} />

        {/* Content */}
        <div className="flex items-start justify-between gap-2 relative z-10">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm text-slate-200 mb-2 line-clamp-2 leading-tight tracking-tight">{label}</div>
            <div className={`font-mono text-xs ${getTextColor()} line-clamp-2 tracking-tight`}>
              {wittyRemark}
            </div>
          </div>

          {details && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInfo(!showInfo);
              }}
              className="flex-shrink-0 p-1 hover:bg-slate-700 rounded transition-colors"
              title="More info"
            >
              <Info className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* Info panel */}
        {showInfo && details && (
          <div className="absolute top-full left-0 mt-2 w-48 p-2 border border-slate-700 text-[8px] text-slate-300 bg-slate-900 rounded-sm shadow-xl z-50 font-mono">
            {details}
          </div>
        )}
      </div>
    </div>
  );
}