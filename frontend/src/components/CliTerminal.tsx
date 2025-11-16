import { useState, useEffect, useRef } from 'react';
import { X, Terminal, Minimize2 } from 'lucide-react';

interface CliTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: {
    id: string;
    timestamp: string;
    nodeLabel: string;
    message: string;
    status: 'active' | 'completed' | 'error' | 'info';
  }[];
}

export function CliTerminal({ isOpen, onClose, logs }: CliTerminalProps) {
  const [animate, setAnimate] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimate(true), 50);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  const getLogPrefix = (status: string) => {
    switch (status) {
      case 'active':
        return '[INFO]';
      case 'completed':
        return '[ OK ]';
      case 'error':
        return '[ERROR]';
      default:
        return '[LOG]';
    }
  };

  const getLogColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-cyan-400';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-slate-700 shadow-2xl shadow-slate-900/50 transition-all duration-300 ${
        animate ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      style={{ height: '40vh' }}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-mono text-slate-300">CLI Terminal</span>
          <span className="text-xs font-mono text-slate-500">- Security Assessment Output</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-sm transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-sm transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="h-full overflow-y-auto p-4 font-mono text-sm bg-black"
        style={{ height: 'calc(40vh - 42px)' }}
      >
        {/* System info */}
        <div className="mb-4 text-slate-500">
          <div>$ ciso-security-assessor --version</div>
          <div className="text-slate-600">CISO Security Assessor v1.0.0</div>
          <div className="text-slate-600">System: Figma Make | Node: v18.0.0</div>
          <div className="mt-2 text-slate-500">$ ciso-security-assessor start --verbose</div>
        </div>

        {logs.length === 0 ? (
          <div className="text-slate-500">
            <div className="animate-pulse">Waiting for assessment to begin...</div>
            <div className="mt-2 text-slate-600">Type a product name to start security analysis</div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={log.id} className="animate-fadeIn flex gap-3" style={{ animationDelay: `${index * 20}ms` }}>
                <span className="text-slate-600">{log.timestamp}</span>
                <span className={getLogColor(log.status)}>{getLogPrefix(log.status)}</span>
                <span className="text-slate-300">[{log.nodeLabel}]</span>
                <span className="text-slate-400">{log.message}</span>
              </div>
            ))}
            <div className="mt-4 flex items-center gap-2 text-slate-400">
              <span className="animate-pulse">▊</span>
              <span>Awaiting next command...</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
