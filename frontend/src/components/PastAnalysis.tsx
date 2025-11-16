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
}

interface PastAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (analysis: PastAnalysisData) => void;
}

export function PastAnalysis({ isOpen, onClose, onSelectAnalysis }: PastAnalysisProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimate(true), 50);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  const pastAnalyses: PastAnalysisData[] = [
    {
      id: '1',
      product: 'Apache Log4j 2.14',
      vendor: 'Apache',
      timestamp: '2 hours ago',
      status: 'completed',
      trustScore: 67,
      criticalCVEs: 3,
    },
    {
      id: '2',
      product: 'Okta Identity Cloud',
      vendor: 'Okta',
      timestamp: '5 hours ago',
      status: 'completed',
      trustScore: 85,
      criticalCVEs: 0,
    },
    {
      id: '3',
      product: 'MongoDB Enterprise',
      vendor: 'MongoDB Inc.',
      timestamp: 'Yesterday',
      status: 'completed',
      trustScore: 78,
      criticalCVEs: 1,
    },
    {
      id: '4',
      product: 'Terraform',
      vendor: 'HashiCorp',
      timestamp: '2 days ago',
      status: 'completed',
      trustScore: 82,
      criticalCVEs: 0,
    },
    {
      id: '5',
      product: 'Jenkins CI/CD',
      vendor: 'Jenkins',
      timestamp: '3 days ago',
      status: 'completed',
      trustScore: 71,
      criticalCVEs: 2,
    },
  ];

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getTrustScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

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
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(circle at 80% 30%, rgba(71, 85, 105, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 20% 70%, rgba(51, 65, 85, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.1) 0%, transparent 70%)
          `
        }}></div>
        
        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-700/5 via-transparent to-slate-900/10 pointer-events-none group-hover:from-slate-600/10 group-hover:to-slate-800/15 transition-all duration-500"></div>
        
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
        }}></div>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md border-b border-slate-700 px-6 py-4 relative">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-mono bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent mb-2">
                Past Analyses
              </h2>
              <p className="text-sm text-slate-400 font-mono">Recent security assessments</p>
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
          <div className="space-y-3">
            {pastAnalyses.map((analysis, index) => (
              <button
                key={analysis.id}
                className="w-full text-left p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-sm transition-all hover:shadow-lg hover:shadow-slate-700/30 group animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => onSelectAnalysis(analysis)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-mono text-slate-200 group-hover:text-slate-100 transition-colors truncate">
                      {analysis.product}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">{analysis.vendor}</p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <Shield className="w-4 h-4 text-slate-600" />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="px-2 py-1.5 bg-slate-900 rounded-sm border border-slate-800">
                    <div className="text-xs text-slate-500 font-mono mb-1">Trust Score</div>
                    <div className={`text-lg font-mono ${getTrustScoreTextColor(analysis.trustScore)}`}>
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

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                  <Clock className="w-3 h-3" />
                  {analysis.timestamp}
                </div>
              </button>
            ))}
          </div>

          {/* Empty state for no analyses */}
          {pastAnalyses.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Shield className="w-16 h-16 text-slate-700 mb-4" />
              <p className="text-sm text-slate-400 font-mono">No past analyses</p>
              <p className="text-xs text-slate-500 mt-2 font-mono">Your assessments will appear here</p>
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