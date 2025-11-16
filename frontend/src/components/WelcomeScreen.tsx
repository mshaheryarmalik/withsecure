import { useEffect, useState, useRef } from 'react';
import { Lock } from 'lucide-react';
import { ShieldLogo } from './ShieldLogo';

interface WelcomeScreenProps {
  onEnter: () => void;
}

export function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [textRevealed, setTextRevealed] = useState(false);
  const [entering, setEntering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  // Loading simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setLoading(false);
            setTextRevealed(true);
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Encrypted background animation with cursor tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Characters for encryption effect - alphanumeric and Greek
    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω';
    const fontSize = 14;
    
    // Initialize drops
    const drops: number[] = [];
    for (let i = 0; i < canvas.width / fontSize; i++) {
      drops[i] = Math.random() * -100;
    }

    const draw = () => {
      // Semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Calculate distance from mouse
        const dx = mousePos.current.x - x;
        const dy = mousePos.current.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 200;

        // Character and color based on mouse proximity
        let char = chars[Math.floor(Math.random() * chars.length)];
        let opacity = 0.1;
        
        if (distance < maxDistance) {
          opacity = 0.8 - (distance / maxDistance) * 0.7;
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
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleEnter = () => {
    setEntering(true);
    setTimeout(() => {
      onEnter();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden">
      {/* Animated encrypted background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />

      {/* Content */}
      <div className={`relative z-10 text-center transition-all duration-1000 ${entering ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {loading ? (
          /* Loading State */
          <div className="space-y-8 animate-fadeIn">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 blur-xl opacity-30 animate-pulse">
                  <ShieldLogo className="w-20 h-20" />
                </div>
                <ShieldLogo className="w-20 h-20 relative" />
              </div>
            </div>

            {/* Loading text */}
            <div className="space-y-4">
              <h1 className="text-4xl font-mono bg-gradient-to-r from-slate-300 to-slate-500 bg-clip-text text-transparent">
                CISO SECURITY VAULT
              </h1>
              <div className="space-y-2">
                <p className="text-sm text-slate-400 font-mono uppercase tracking-wider">
                  Initializing Security Protocols
                </p>
                
                {/* Progress bar */}
                <div className="w-80 mx-auto">
                  <div className="h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="w-full h-full bg-gradient-to-r from-transparent via-slate-300 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 font-mono">{progress}%</div>
                </div>
              </div>

              {/* Loading messages */}
              <div className="h-6 mt-4">
                <p className="text-xs text-slate-500 font-mono animate-pulse">
                  {progress < 30 && "Loading encryption modules..."}
                  {progress >= 30 && progress < 60 && "Establishing secure connection..."}
                  {progress >= 60 && progress < 90 && "Verifying authentication protocols..."}
                  {progress >= 90 && "Security systems ready"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Welcome Screen */
          <div className={`space-y-8 ${textRevealed ? 'animate-fadeIn' : 'opacity-0'}`}>
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute inset-0 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity">
                  <ShieldLogo className="w-20 h-20" />
                </div>
                <ShieldLogo className="w-20 h-20 relative drop-shadow-2xl" />
              </div>
            </div>

            {/* Title with encrypted reveal */}
            <div className="space-y-3">
              <h1 className="text-5xl font-mono bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-clip-text text-transparent tracking-tight">
                CISO SECURITY ASSESSOR
              </h1>
              <p className="text-lg text-slate-400 font-mono tracking-wide">
                Advanced Threat Intelligence & Vulnerability Analysis
              </p>
            </div>

            {/* Features - Pill badges */}
            <div className="flex items-center justify-center gap-3 my-8">
              {[
                { icon: '🔐', label: 'Encrypted Analysis' },
                { icon: '⚡', label: 'Real-time Scanning' },
                { icon: '🛡️', label: 'Threat Detection' }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-950/50 border border-slate-800 rounded-full hover:border-slate-700 hover:bg-slate-900/50 transition-all group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="text-sm">{feature.icon}</span>
                  <span className="text-xs text-slate-400 font-mono group-hover:text-slate-300 transition-colors" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Enter button */}
            <div className="mt-12">
              <button
                onClick={handleEnter}
                className="group relative px-8 py-4 bg-black border border-slate-700 rounded-sm overflow-hidden hover:scale-105 transition-all duration-300"
              >
                {/* Silver gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 opacity-50"></div>
                
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded-sm blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>

                <div className="relative flex items-center gap-3">
                  <Lock className="w-5 h-5 text-slate-400 group-hover:text-slate-300 transition-colors" />
                  <span className="text-lg font-mono bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent group-hover:from-slate-200 group-hover:to-slate-300 transition-all">
                    ENTER VAULT
                  </span>
                </div>
              </button>

              <p className="mt-4 text-xs text-slate-600 font-mono">
                Hover over the canvas to reveal hidden data streams
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}