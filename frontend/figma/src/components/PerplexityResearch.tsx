import { useEffect, useRef } from 'react';
import { Terminal, Activity } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeLabel: string;
  message: string;
  status: 'active' | 'completed' | 'error' | 'info';
}

interface PerplexityResearchProps {
  logs: LogEntry[];
}

export function PerplexityResearch({ logs }: PerplexityResearchProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-cyan-400 bg-cyan-950/50 border border-cyan-500/30';
      case 'completed': return 'text-emerald-400 bg-emerald-950/50 border border-emerald-500/30';
      case 'error': return 'text-red-400 bg-red-950/50 border border-red-500/30';
      default: return 'text-slate-400 bg-slate-800/50 border border-slate-600/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '⚡';
      case 'completed': return '✓';
      case 'error': return '✗';
      default: return '•';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-cyan-500/20 px-6 py-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg border border-cyan-500/30">
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs text-cyan-400 uppercase tracking-wide">Activity Log</div>
            <div className="text-sm text-slate-300">Real-time Processing</div>
          </div>
          {logs.length > 0 && (
            <div className="ml-auto flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">{logs.length} events</span>
            </div>
          )}
        </div>
      </div>

      {/* Log Entries */}
      <div className="px-4 py-4">
        {logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="animate-fadeIn bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/30 transition-all p-3"
              >
                {/* Timestamp and Status */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${getStatusColor(log.status)}`}>
                    {getStatusIcon(log.status)}
                  </span>
                  <span className="text-xs text-slate-500">{log.timestamp}</span>
                </div>
                
                {/* Message Only */}
                <div className="text-sm text-slate-200 leading-relaxed">
                  {log.message}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
              <Terminal className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-sm text-slate-400">Waiting for analysis to begin...</p>
            <p className="text-xs text-slate-500 mt-2">Activity logs will appear here</p>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}