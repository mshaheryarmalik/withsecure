import { Info } from 'lucide-react';
import { useState } from 'react';

interface ProcessNodeProps {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  wittyRemark: string;
  details?: string;
}

export function ProcessNode({ label, status, wittyRemark, details }: ProcessNodeProps) {
  const [showInfo, setShowInfo] = useState(false);

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-600 shadow-green-200';
      case 'active':
        return 'bg-blue-500 border-blue-600 shadow-blue-200 animate-pulse';
      case 'pending':
        return 'bg-yellow-500 border-yellow-600 shadow-yellow-200';
      case 'error':
        return 'bg-red-500 border-red-600 shadow-red-200';
      default:
        return 'bg-gray-400 border-gray-500 shadow-gray-200';
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-700';
      case 'active':
        return 'text-blue-700';
      case 'pending':
        return 'text-yellow-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const getCardStyle = () => {
    switch (status) {
      case 'completed':
        return 'border-green-300 bg-gradient-to-br from-white to-green-50 hover:shadow-lg';
      case 'active':
        return 'border-blue-400 bg-gradient-to-br from-white to-blue-50 hover:shadow-xl shadow-blue-100';
      case 'pending':
        return 'border-yellow-300 bg-gradient-to-br from-white to-yellow-50';
      case 'error':
        return 'border-red-300 bg-gradient-to-br from-white to-red-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-3">
        {/* Enhanced Status dot */}
        <div className="relative">
          <div className={`w-4 h-4 rounded-full border-2 ${getStatusColor()} shadow-md`}></div>
          {status === 'active' && (
            <div className="absolute inset-0 w-4 h-4 rounded-full bg-blue-500 animate-ping opacity-75"></div>
          )}
        </div>
        
        {/* Enhanced Node card */}
        <div className={`flex-1 border-2 rounded-xl px-5 py-4 shadow-md transition-all duration-300 ${getCardStyle()}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm text-gray-900 mb-1.5">{label}</div>
              <div className={`text-xs italic ${getTextColor()}`}>{wittyRemark}</div>
            </div>
            
            {details && (
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-1.5 hover:bg-white/80 rounded-lg transition-colors"
                title="More info"
              >
                <Info className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          
          {showInfo && details && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 bg-white/50 rounded-lg p-3">
              {details}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}