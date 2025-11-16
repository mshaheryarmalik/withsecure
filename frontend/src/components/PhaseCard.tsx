import { useState, useRef, useEffect } from 'react';
import { Search, BarChart3, Shield, Brain, ChevronRight } from 'lucide-react';

interface PhaseCardProps {
  phase: {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'active' | 'completed' | 'error';
    progress?: number;
  };
  position: { x: number; y: number };
  onClick: () => void;
  isProcessing?: boolean;
}

const phaseIcons = {
  phase_1: Search,
  phase_2: BarChart3,
  phase_3: Shield,
  phase_4: Brain,
};

export function PhaseCard({ phase, position, onClick, isProcessing = false }: PhaseCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [statusIndex, setStatusIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const statusMessages = [
    phase.name,
    phase.description.substring(0, 40) + '...',
    phase.status === 'active' ? 'Processing...' : phase.status === 'completed' ? 'Complete' : 'Pending'
  ];

  // Rotating status text
  useEffect(() => {
    if (phase.status !== 'active') return;
    
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [phase.status, statusMessages.length]);

  // Encrypted matrix background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match card
    canvas.width = 256; // w-64 = 16rem = 256px
    canvas.height = 128; // h-32 = 8rem = 128px

    // Characters for encryption effect
    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω';
    const fontSize = 10;
    
    // Initialize drops
    const drops: number[] = [];
    for (let i = 0; i < canvas.width / fontSize; i++) {
      drops[i] = Math.random() * -20;
    }

    const draw = () => {
      // Semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Calculate distance from mouse
        const dx = mousePosition.x - x;
        const dy = mousePosition.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = isHovered ? 100 : 50;

        // Character and color based on mouse proximity
        let char = chars[Math.floor(Math.random() * chars.length)];
        let opacity = isHovered ? 0.15 : 0.05;
        
        if (distance < maxDistance && isHovered) {
          opacity = 0.6 - (distance / maxDistance) * 0.5;
          // More visible near cursor
          ctx.fillStyle = `rgba(148, 163, 184, ${opacity})`;
        } else {
          ctx.fillStyle = `rgba(71, 85, 105, ${opacity})`;
        }

        ctx.fillText(char, x, y);

        // Reset drop randomly
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePosition, isHovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const Icon = phaseIcons[phase.id as keyof typeof phaseIcons] || Shield;
  const shouldShowProcessingGlow =
    isProcessing && (phase.status === 'active' || phase.status === 'pending');

  const getStatusColor = () => {
    switch (phase.status) {
      case 'active':
        return 'from-slate-400 to-slate-500';
      case 'completed':
        return 'from-slate-500 to-slate-600';
      case 'error':
        return 'from-red-400 to-red-500';
      default:
        return 'from-slate-700 to-slate-800';
    }
  };

  const getBorderColor = () => {
    switch (phase.status) {
      case 'active':
        return 'border-slate-600';
      case 'completed':
        return 'border-slate-700';
      case 'error':
        return 'border-red-600';
      default:
        return 'border-slate-800';
    }
  };

  return (
    <div
      ref={cardRef}
      className="absolute transition-all duration-500"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`group relative w-64 h-32 bg-black/60 backdrop-blur-xl border ${getBorderColor()} rounded-sm cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-slate-700/50 hover:border-slate-600`}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Granular gradient background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 via-slate-800/20 to-slate-900/30 pointer-events-none"></div>
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(circle at 70% 30%, rgba(71, 85, 105, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 30% 70%, rgba(51, 65, 85, 0.15) 0%, transparent 50%)
          `
        }}></div>

        {/* Encrypted matrix background canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none opacity-80"
        />

        {/* Processing glow overlay */}
        {shouldShowProcessingGlow && (
          <div className="processing-glow-border"></div>
        )}

        {/* Enhanced glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-700/5 via-transparent to-slate-900/10 pointer-events-none group-hover:from-slate-600/10 group-hover:to-slate-800/15 transition-all duration-500"></div>

        {/* Animated border glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className={`absolute inset-0 bg-gradient-to-r ${getStatusColor()} blur-xl opacity-20`}></div>
        </div>

        {/* Subtle inner border highlight */}
        <div className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
          boxShadow: 'inset 0 0 20px rgba(148, 163, 184, 0.1)'
        }}></div>

        {/* Content */}
        <div className="relative h-full flex flex-col p-4 z-10">
          {/* Header with icon */}
          <div className="flex items-start justify-between mb-2">
            <div className={`p-2 bg-gradient-to-br ${getStatusColor()} rounded-sm shadow-lg border border-slate-700/50 group-hover:border-slate-600/50 transition-all`}>
              <Icon className="w-5 h-5 text-black" />
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              {phase.status === 'active' && (
                <div className="relative">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-slate-400 rounded-full animate-ping"></div>
                </div>
              )}
              {phase.status === 'completed' && (
                <div className="w-2 h-2 bg-slate-500 rounded-full shadow-lg shadow-slate-500/50"></div>
              )}
              {phase.status === 'error' && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Phase name with gradient on hover */}
          <h3 className="text-sm font-mono text-slate-300 group-hover:text-slate-200 mb-1 tracking-wide transition-colors">
            {phase.name}
          </h3>

          {/* Rotating status text */}
          <div className="flex-1 flex items-end">
            <p className="text-xs font-mono text-slate-500 group-hover:text-slate-400 transition-all duration-500 line-clamp-2">
              {statusMessages[statusIndex]}
            </p>
          </div>

          {/* Progress bar */}
          {phase.status === 'active' && phase.progress !== undefined && (
            <div className="mt-3 h-0.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full bg-gradient-to-r ${getStatusColor()} transition-all duration-500 relative`}
                style={{ width: `${phase.progress}%` }}
              >
                <div className="w-full h-full bg-gradient-to-r from-transparent via-slate-300 to-transparent animate-shimmer"></div>
              </div>
            </div>
          )}

          {phase.status === 'completed' && (
            <div className="mt-3 h-0.5 bg-slate-700 rounded-full shadow-inner"></div>
          )}
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
      </div>
    </div>
  );
}