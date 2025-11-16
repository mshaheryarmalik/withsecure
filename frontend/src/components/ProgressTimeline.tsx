import { Check, Circle } from 'lucide-react';

interface Step {
  label: string;
  status: 'completed' | 'active' | 'pending';
}

interface ProgressTimelineProps {
  currentPhase: string;
  steps: Step[];
}

export function ProgressTimeline({ currentPhase, steps }: ProgressTimelineProps) {
  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-xs text-gray-500 mb-2">Current: {currentPhase}</div>
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {step.status === 'completed' && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs">{step.label}</span>
                </div>
              )}
              {step.status === 'active' && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Circle className="w-4 h-4 fill-current" />
                  <span className="text-xs">{step.label}</span>
                </div>
              )}
              {step.status === 'pending' && (
                <div className="flex items-center gap-1 text-gray-400">
                  <Circle className="w-4 h-4" />
                  <span className="text-xs">{step.label}</span>
                </div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="w-4 h-px bg-gray-300"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
