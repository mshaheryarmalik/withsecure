import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ResearchUnit {
  name: string;
  progress: number;
  status: string;
}

interface ResearchUnitProgressProps {
  units: ResearchUnit[];
}

export function ResearchUnitProgress({ units }: ResearchUnitProgressProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-sm text-gray-700 hover:text-gray-900"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span>Running {units.length} parallel research units...</span>
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-3">
          {units.map((unit, index) => (
            <div key={index} className="pl-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">{unit.name}</span>
                <span className="text-xs text-gray-500">{unit.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${unit.progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{unit.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
