import { useState, useRef, useEffect } from 'react';
import { PhaseCard } from './PhaseCard';
import { PhaseDetailsModal } from './PhaseDetailsModal';
import { ContextMenu } from './ContextMenu';
import { FileText, Shield, RotateCcw, Trash2, Download, Link2, Copy, Share2 } from 'lucide-react';

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
  onRerunAnalysis?: () => void;
  onClearAnalysis?: () => void;
  onDownloadPDF?: () => void;
  currentQuery?: string;
}

export function PhaseCanvas({ phases, reportReady, onViewReport, onRerunAnalysis, onClearAnalysis, onDownloadPDF, currentQuery }: PhaseCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [wittyRemarkIndex, setWittyRemarkIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const mousePos = useRef({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Detect if mobile device
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || windowWidth < 768;
  };

  const GRID_SIZE = 10;

  const wittyRemarks = [
    "Scanning the dark web for your secrets...",
    "Training AI on your vulnerabilities...",
    "Investigating suspicious dependencies...",
    "Hacking the mainframe...",
    "Targeting attack vectors...",
    "Analyzing threat landscape...",
  ];

  // Cycle through witty remarks every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWittyRemarkIndex((prev) => (prev + 1) % wittyRemarks.length);
    }, 3000);
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
          
          // Color based on status
          const fromPhase = phases[i];
          const toPhase = phases[i + 1];
          
          if (fromPhase.status === 'completed' && toPhase.status === 'active') {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
            ctx.lineWidth = 2;
          } else if (fromPhase.status === 'completed' && toPhase.status === 'completed') {
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
            ctx.lineWidth = 2;
          } else {
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
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
    const isMobileDevice = isMobile();
    
    if (isMobileDevice) {
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

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    // Disable context menu on mobile
    if (isMobile()) {
      return;
    }
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCopyReportLink = async () => {
    const link = `${window.location.origin}/report/${currentQuery || 'analysis'}`;
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        console.log('Report link copied to clipboard');
      } else {
        // Fallback for older browsers or non-secure contexts
        fallbackCopyTextToClipboard(link);
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Try fallback method if modern API fails
      fallbackCopyTextToClipboard(link);
    }
  };

  const handleCopyResults = async () => {
    const results = `Security Assessment Results for ${currentQuery}\n\nPhases Completed: ${phases.filter(p => p.status === 'completed').length}/${phases.length}\nReport Ready: ${reportReady ? 'Yes' : 'No'}`;
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(results);
        console.log('Results copied to clipboard');
      } else {
        // Fallback for older browsers or non-secure contexts
        fallbackCopyTextToClipboard(results);
      }
    } catch (err) {
      console.error('Failed to copy results:', err);
      // Try fallback method if modern API fails
      fallbackCopyTextToClipboard(results);
    }
  };

  // Fallback copy method for when Clipboard API is not available
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea invisible and out of viewport
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        console.log('Fallback: Text copied to clipboard');
      } else {
        console.error('Fallback: Unable to copy');
      }
    } catch (err) {
      console.error('Fallback: Copy failed', err);
    }
    
    document.body.removeChild(textArea);
  };

  const contextMenuItems = [
    {
      icon: <RotateCcw className="w-4 h-4" />,
      label: 'Re-run Analysis',
      onClick: () => onRerunAnalysis?.(),
      disabled: !currentQuery || phases.length === 0,
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'View Report',
      onClick: () => onViewReport?.(),
      disabled: !reportReady,
    },
    {
      icon: <Download className="w-4 h-4" />,
      label: 'Download PDF Report',
      onClick: () => onDownloadPDF?.(),
      disabled: !reportReady,
      divider: true,
    },
    {
      icon: <Copy className="w-4 h-4" />,
      label: 'Copy Results',
      onClick: handleCopyResults,
      disabled: phases.length === 0,
    },
    {
      icon: <Link2 className="w-4 h-4" />,
      label: 'Copy Report Link',
      onClick: handleCopyReportLink,
      disabled: !reportReady,
    },
    {
      icon: <Share2 className="w-4 h-4" />,
      label: 'Share Results',
      onClick: () => {
        if (navigator.share && reportReady) {
          navigator.share({
            title: `Security Assessment: ${currentQuery}`,
            text: `Check out this security assessment report for ${currentQuery}`,
            url: window.location.href,
          }).catch(() => {});
        }
      },
      disabled: !reportReady || !navigator.share,
      divider: true,
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: 'Clear Analysis',
      onClick: () => onClearAnalysis?.(),
      disabled: phases.length === 0,
      danger: true,
    },
  ];

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-black overflow-hidden"
      onContextMenu={handleContextMenu}
    >
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
          <div className="text-center max-w-md mx-auto">
            {/* Large Shield Icon */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <Shield className="w-full h-full text-slate-700 opacity-40" strokeWidth={1.5} />
            </div>
            
            {/* Instructions */}
            <div className="space-y-3">
              <h3 className="text-lg font-mono bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent">
                Ready for Security Assessment
              </h3>
              <p className="text-sm text-slate-400 font-mono leading-relaxed">
                Enter a product name, vendor, or software asset in the search box above to begin automated security analysis
              </p>
              <div className="mt-6 space-y-2">
                <p className="text-xs text-slate-500 font-mono uppercase tracking-wide">Example Queries:</p>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-600 font-mono">• Apache Log4j 2.14</span>
                  <span className="text-xs text-slate-600 font-mono">• Okta Identity Cloud</span>
                  <span className="text-xs text-slate-600 font-mono">• MongoDB Enterprise</span>
                </div>
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

      {/* Context menu - Desktop only */}
      {contextMenu && !isMobile() && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}