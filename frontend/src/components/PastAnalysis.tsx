import { useState, useEffect } from 'react';
import { X, Clock, Shield, ChevronLeft } from 'lucide-react';

export interface PastAnalysisData {
  id: string;
  product: string;
  vendor: string;
  timestamp: string;
  status: string;
  trustScore: number;
  criticalCVEs: number;
  // Allow additional fields via structural typing
  [key: string]: unknown;
}

interface PastAnalysisProps {
  analyses: PastAnalysisData[];
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (analysis: PastAnalysisData) => void;
}

function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const divisions: { amount: number; name: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, name: 'seconds' },
    { amount: 60, name: 'minutes' },
    { amount: 24, name: 'hours' },
    { amount: 7, name: 'days' },
    { amount: 4.34524, name: 'weeks' },
    { amount: 12, name: 'months' },
    { amount: Number.POSITIVE_INFINITY, name: 'years' },
  ];

  let duration = diffSec;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.name);
    }
    duration /= division.amount;
  }
  return timestamp;
}

export function PastAnalysis({ analyses, isOpen, onClose, onSelectAnalysis }: PastAnalysisProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimate(true), 50);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          animate ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-96 bg-black backdrop-blur-xl border-r border-slate-700 shadow-2xl z-50 transition-transform duration-300 overflow-hidden group ${
          animate ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Granular gradient background */}
        <div className="absolute inset-0 bg-gradient-to-bl from-slate-900/40 via-slate-800/30 to-slate-900/40 pointer-events-none"></div>
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `
            radial-gradient(circle at 80% 30%, rgba(71, 85, 105, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 20% 70%, rgba(51, 65, 85, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.1) 0%, transparent 70%)
          `,
          }}
        ></div>

        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-700/5 via-transparent to-slate-900/10 pointer-events-none group-hover:from-slate-600/10 group-hover:to-slate-800/15 transition-all duration-500"></div>

        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
          }}
        ></div>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md border-b border-slate-700 px-6 py-4 relative">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-mono bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent mb-2">
                Past Analyses
              </h2>
              <p className="text-sm text-slate-400 font-mono">
                Recent security assessments
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-900 rounded-sm transition-colors border border-slate-800 hover:border-slate-700"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full pb-20 px-6 py-4">
          {analyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Shield className="w-16 h-16 text-slate-700 mb-4" />
              <p className="text-sm text-slate-400 font-mono">No past analyses yet</p>
              <p className="text-xs text-slate-500 mt-2 font-mono">
                Run an assessment to build your history
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((analysis, index) => (
                <button
                  key={analysis.id}
                  className="w-full text-left p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-sm transition-all hover:shadow-lg hover:shadow-slate-700/30 group animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => onSelectAnalysis(analysis)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-mono text-slate-200 group-hover:text-slate-100 transition-colors truncate">
                        {analysis.product}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono truncate">
                        {analysis.vendor}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <Shield className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="px-2 py-1.5 bg-slate-900 rounded-sm border border-slate-800">
                      <div className="text-xs text-slate-500 font-mono mb-1">Trust Score</div>
                      <div className={`text-lg font-mono ${analysis.trustScore >= 80 ? 'text-green-400' : analysis.trustScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {analysis.trustScore}
                      </div>
                    </div>
                    <div className="px-2 py-1.5 bg-slate-900 rounded-sm border border-slate-800">
                      <div className="text-xs text-slate-500 font-mono mb-1">Critical CVEs</div>
                      <div className={`text-lg font-mono ${analysis.criticalCVEs > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {analysis.criticalCVEs}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(analysis.timestamp)}</span>
                    <span className="text-slate-700">•</span>
                    <span className="uppercase tracking-wide text-slate-500">
                      {analysis.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
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
          animation: fadeIn 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
}