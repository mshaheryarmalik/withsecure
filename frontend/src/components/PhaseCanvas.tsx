import { useState, useRef, useEffect } from 'react';
import { PhaseCard } from './PhaseCard';
import { PhaseDetailsModal } from './PhaseDetailsModal';
import { FileText, Search, Brain } from 'lucide-react';

// Add fade-in animation style
const fadeInStyle = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fadeIn {
    animation: fadeIn 0.8s ease-out forwards;
  }
`;

interface Phase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
  steps: any[];
}

interface PhaseCanvasProps {
  phases: Phase[];
  reportReady?: boolean;
  onViewReport?: () => void;
}

export function PhaseCanvas({ phases, reportReady, onViewReport }: PhaseCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const mousePos = useRef({ x: 0, y: 0 });

  const GRID_SIZE = 10;

  const wittyRemarks = [
    "🔍 Ready to dissect your software's digital DNA...",
    "🛡️ Your security assessment awaits, brave explorer...",
    "⚡ Waiting for a product name like a detective waits for clues...",
    "🎯 Enter a product and watch the magic happen...",
    "🧠 Our AI is ready to analyze your security posture...",
    "🔐 Your next security assessment is just a search away...",
    "💡 Pro tip: We've analyzed thousands of products. Yours could be next!",
    "🎪 Welcome to the security assessment circus! Enter a product to start...",
    "🚀 Ready to launch your security investigation?",
    "🎨 We turn security data into beautiful insights...",
    "🔬 Our security microscope is calibrated and ready...",
    "📊 Waiting to generate your personalized security report...",
    "🎭 The stage is set. Enter your product to begin the show...",
    "🌊 Dive into the depths of security analysis...",
    "🎯 Precision security assessment, coming right up...",
    "✨ Your security insights are just one product name away...",
    "🎪 Step right up! Enter a product for a security deep-dive...",
    "🔮 We predict security risks. Enter a product to see how...",
    "🎨 Crafting security assessments, one product at a time...",
    "🚀 Ready to explore the security universe? Enter a product...",
  ];

  const [wittyRemarkIndex, setWittyRemarkIndex] = useState(0);

  // Cycle through witty remarks every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWittyRemarkIndex((prev) => (prev + 1) % wittyRemarks.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
      setWindowWidth(window.innerWidth);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Set canvas size
  useEffect(() => {
    if (canvasRef.current && dimensions.width && dimensions.height) {
      canvasRef.current.width = dimensions.width;
      canvasRef.current.height = dimensions.height;
    }
  }, [dimensions]);

  // Mouse tracking for encrypted background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mousePos.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  // Draw connections between phases
  useEffect(() => {
    if (!canvasRef.current || !dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections between phase cards
      if (phases.length > 1) {
        const positions = getPhasePositions();
        
        for (let i = 0; i < phases.length - 1; i++) {
          const fromPos = positions[i];
          const toPos = positions[i + 1];

          const fromX = (canvas.width * fromPos.x) / 100;
          const fromY = (canvas.height * fromPos.y) / 100;
          const toX = (canvas.width * toPos.x) / 100;
          const toY = (canvas.height * toPos.y) / 100;

          // Connection line
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          
          // Color based on status with color scheme
          const fromPhase = phases[i];
          const toPhase = phases[i + 1];
          
          if (fromPhase.status === 'completed' && toPhase.status === 'active') {
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)'; // Yellow for active
            ctx.lineWidth = 2;
          } else if (fromPhase.status === 'completed' && toPhase.status === 'completed') {
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)'; // Green for completed
            ctx.lineWidth = 2;
          } else if (fromPhase.status === 'error' || toPhase.status === 'error') {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // Red for error
            ctx.lineWidth = 2;
          } else {
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)'; // Grey for pending
            ctx.lineWidth = 1;
          }
          
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Arrow head
          if (fromPhase.status === 'completed' || fromPhase.status === 'active') {
            const angle = Math.atan2(toY - fromY, toX - fromX);
            const arrowSize = 8;
            
            ctx.beginPath();
            ctx.moveTo(toX, toY);
            ctx.lineTo(
              toX - arrowSize * Math.cos(angle - Math.PI / 6),
              toY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              toX - arrowSize * Math.cos(angle + Math.PI / 6),
              toY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phases, dimensions, windowWidth]);

  const getPhasePositions = () => {
    // 2x2 grid layout for desktop, top-down for mobile
    const isMobile = windowWidth < 768;
    
    if (isMobile) {
      // Top-down layout for mobile
      return [
        { x: 50, y: 15 },  // Phase 1
        { x: 50, y: 35 },  // Phase 2
        { x: 50, y: 55 },  // Phase 3
        { x: 50, y: 75 },  // Phase 4
      ];
    } else {
      // 2x2 grid layout for desktop
      return [
        { x: 30, y: 35 },  // Top left - Phase 1
        { x: 70, y: 35 },  // Top right - Phase 2
        { x: 30, y: 65 },  // Bottom left - Phase 3
        { x: 70, y: 65 },  // Bottom right - Phase 4
      ];
    }
  };

  const positions = getPhasePositions();

  return (
    <>
      <style>{fadeInStyle}</style>
      <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
      {/* Dotted grid background */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(100, 116, 139, 0.4) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      ></div>

      {/* Canvas for connections */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Phase cards */}
      <div className="absolute inset-0">
        {phases.map((phase, index) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            position={positions[index] || { x: 50, y: 50 }}
            onClick={() => setSelectedPhase(phase)}
          />
        ))}
      </div>

      {/* Empty state */}
      {phases.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-lg mx-auto px-4 flex flex-col items-center">
            {/* Brain Icon */}
            <div className="relative w-[32rem] h-[32rem] mb-8 flex items-center justify-center">
              <Brain className="w-64 h-64 text-white drop-shadow-[0_0_20px_rgba(255,255,255,1)] animate-bounce" />
            </div>
            
            {/* Witty Remarks */}
            <div className="w-full">
              <div className="min-h-[80px] flex items-center justify-center">
                <p className="text-lg md:text-xl font-mono text-slate-100 leading-relaxed animate-fadeIn px-4">
                  {wittyRemarks[wittyRemarkIndex]}
                </p>
              </div>
              
              {/* Subtle hint */}
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <p className="text-xs text-slate-400 font-mono italic">
                  💡 Tip: Try entering a product name, vendor, SHA1 hash, or URL above
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase details modal */}
      {selectedPhase && (
        <PhaseDetailsModal
          phase={selectedPhase}
          onClose={() => setSelectedPhase(null)}
        />
      )}

      {/* Report ready button */}
      {reportReady && onViewReport && (
        <button
          className="absolute bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600"
          onClick={onViewReport}
        >
          <FileText className="inline-block mr-2" />
          View Report
        </button>
      )}
    </div>
    </>
  );
}