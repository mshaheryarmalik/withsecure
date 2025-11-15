import { Info } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GraphNodeProps {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  wittyRemark: string;
  details?: string;
  position: { x: number; y: number }; // Expects percentages (0-100)
}

export function GraphNode({ label, status, wittyRemark, details, position }: GraphNodeProps) {
  const [showInfo, setShowInfo] = useState(false);

  const getStatusStyle = () => {
    switch (status) {
      case 'completed':
        return {
          border: 'border-emerald-400',
          bg: 'bg-gradient-to-br from-emerald-900/80 to-green-900/80 backdrop-blur-sm',
          shadow: 'shadow-lg shadow-emerald-500/30',
          dot: 'bg-emerald-400',
          ring: 'ring-emerald-400'
        };
      case 'active':
        return {
          border: 'border-cyan-400',
          bg: 'bg-gradient-to-br from-cyan-900/80 to-blue-900/80 backdrop-blur-sm',
          shadow: 'shadow-xl shadow-cyan-500/50',
          dot: 'bg-cyan-400 animate-pulse',
          ring: 'ring-cyan-400 animate-ping'
        };
      case 'pending':
        return {
          border: 'border-yellow-400',
          bg: 'bg-gradient-to-br from-yellow-900/80 to-orange-900/80 backdrop-blur-sm',
          shadow: 'shadow-md shadow-yellow-500/30',
          dot: 'bg-yellow-400',
          ring: 'ring-yellow-400'
        };
      case 'error':
        return {
          border: 'border-red-400',
          bg: 'bg-gradient-to-br from-red-900/80 to-rose-900/80 backdrop-blur-sm',
          shadow: 'shadow-lg shadow-red-500/30',
          dot: 'bg-red-400',
          ring: 'ring-red-400'
        };
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'completed': return 'text-emerald-300';
      case 'active': return 'text-cyan-300';
      case 'pending': return 'text-yellow-300';
      case 'error': return 'text-red-300';
    }
  };

  const styles = getStatusStyle();

  return (
    <div
      className="absolute transition-all duration-500 ease-out animate-fadeIn z-10"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className={`relative border-2 rounded-lg px-2 py-1.5 ${styles.border} ${styles.bg} ${styles.shadow} transition-all duration-300 min-w-[90px] max-w-[110px] hover:scale-105`}>
        {/* Status indicator */}
        <div className="absolute -top-1 -right-1">
          <div className={`w-3 h-3 rounded-full ${styles.dot} border-2 border-slate-900 ${styles.shadow}`}>
            {status === 'active' && (
              <div className={`absolute inset-0 rounded-full ${styles.ring} opacity-75`}></div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] text-slate-100 mb-0.5 line-clamp-2">{label}</div>
            <div className={`text-[7px] italic ${getTextColor()} line-clamp-1`}>
              {wittyRemark}
            </div>
          </div>

          {details && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex-shrink-0 p-0.5 hover:bg-white/10 rounded transition-colors"
              title="More info"
            >
              <Info className="w-2.5 h-2.5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Info panel */}
        {showInfo && details && (
          <div className="mt-1 pt-1 border-t border-slate-600/50 text-[7px] text-slate-300 bg-slate-800/70 rounded p-1">
            {details}
          </div>
        )}
      </div>
    </div>
  );
}