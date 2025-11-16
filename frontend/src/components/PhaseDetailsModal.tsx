import { useEffect, useState } from 'react';
import { X, Check, AlertCircle, Clock, Info } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface Step {
  id: string;
  message: string;
  detail: string;
  optional?: boolean;
  sources?: string[];
  status?: 'pending' | 'active' | 'completed' | 'error' | 'skipped';
  duration?: number;
}

interface PhaseDetailsModalProps {
  phase: {
    id: string;
    name: string;
    description: string;
    steps: Step[];
    status: 'pending' | 'active' | 'completed' | 'error';
  };
  onClose: () => void;
}

export function PhaseDetailsModal({ phase, onClose }: PhaseDetailsModalProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 50);
  }, []);

  const getStepIcon = (step: Step) => {
    switch (step.status) {
      case 'active':
        return (
          <div className="relative">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
          </div>
        );
      case 'completed':
        return (
          <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-black" />
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
        );
      case 'skipped':
        return (
          <div className="w-6 h-6 border-2 border-slate-700 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 border-2 border-slate-600 rounded-full flex items-center justify-center bg-slate-700/30">
            <Clock className="w-3 h-3 text-slate-500" />
          </div>
        );
    }
  };

  const getStepBorderColor = (step: Step) => {
    switch (step.status) {
      case 'active':
        return 'border-yellow-500/50';
      case 'completed':
        return 'border-green-500/50';
      case 'error':
        return 'border-red-500/50';
      default:
        return 'border-slate-600/50';
    }
  };

  return (
    <Tooltip.Provider>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
            animate ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={`relative w-full max-w-2xl bg-black border border-slate-800 rounded-sm shadow-2xl max-h-[80vh] overflow-hidden transition-all duration-500 ${
            animate ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-black border-b border-slate-800 px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-mono bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent mb-2">
                  {phase.name}
                </h2>
                <p className="text-sm text-slate-400 font-mono">{phase.description}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-900 rounded-sm transition-colors border border-slate-800 hover:border-slate-700"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Content - Vertical Timeline */}
          <div className="overflow-y-auto max-h-[calc(80vh-120px)] px-6 py-6">
            <div className="relative">
              {/* Timeline line - color based on phase status */}
              <div className={`absolute left-[11px] top-8 bottom-8 w-0.5 ${
                phase.status === 'completed' ? 'bg-green-500/30' :
                phase.status === 'active' ? 'bg-yellow-500/30' :
                phase.status === 'error' ? 'bg-red-500/30' :
                'bg-slate-800'
              }`}></div>

              {/* Steps */}
              <div className="space-y-6">
                {phase.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="relative animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Timeline node */}
                    <div className="absolute left-0 top-0 z-10">
                      {getStepIcon(step)}
                    </div>

                    {/* Step card */}
                    <div className={`ml-12 border ${getStepBorderColor(step)} rounded-sm bg-slate-950 p-4 hover:bg-slate-900 transition-all group`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-mono text-slate-200">
                              {step.message}
                            </h3>
                            {step.optional && (
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <span className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-slate-400 rounded-sm border border-slate-700">
                                    OPTIONAL
                                  </span>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-sm shadow-xl max-w-xs"
                                    sideOffset={5}
                                  >
                                    <p className="text-xs font-mono text-slate-300">
                                      This step is optional and may be skipped if data is unavailable
                                    </p>
                                    <Tooltip.Arrow className="fill-slate-700" />
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono">{step.detail}</p>
                        </div>

                        {step.duration && step.status === 'completed' && (
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <div className="flex items-center gap-1 text-xs text-slate-600 font-mono ml-2">
                                <Clock className="w-3 h-3" />
                                {step.duration}ms
                              </div>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-sm shadow-xl"
                                sideOffset={5}
                              >
                                <p className="text-xs font-mono text-slate-300">
                                  Processing time: {step.duration}ms
                                </p>
                                <Tooltip.Arrow className="fill-slate-700" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        )}
                      </div>

                      {/* Sources */}
                      {step.sources && step.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-500 font-mono uppercase tracking-wide">
                              Data Sources
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {step.sources.map((source, idx) => (
                              <Tooltip.Root key={idx}>
                                <Tooltip.Trigger asChild>
                                  <span className="px-2 py-1 text-xs font-mono bg-slate-900 text-slate-400 rounded-sm border border-slate-800 hover:border-slate-700 transition-colors cursor-help">
                                    {source}
                                  </span>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-sm shadow-xl"
                                    sideOffset={5}
                                  >
                                    <p className="text-xs font-mono text-slate-300">
                                      Data collected from {source}
                                    </p>
                                    <Tooltip.Arrow className="fill-slate-700" />
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-black border-t border-slate-800 px-6 py-4">
            <div className="flex items-center justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200 rounded-sm hover:from-slate-600 hover:to-slate-700 transition-all text-sm font-mono border border-slate-700"
              >
                Close
              </button>
            </div>
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
            animation: fadeIn 0.5s ease-out forwards;
            opacity: 0;
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    </Tooltip.Provider>
  );
}
