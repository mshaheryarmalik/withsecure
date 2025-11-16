import { Check, Loader2, Search } from 'lucide-react';

interface MCPStatusProps {
  tool: string;
  status: 'searching' | 'completed';
  resultText?: string;
}

export function MCPStatus({ tool, status, resultText }: MCPStatusProps) {
  return (
    <div className="text-sm mb-2">
      {status === 'searching' && (
        <div className="flex items-center gap-2 text-blue-600">
          <Search className="w-4 h-4 animate-pulse" />
          <span>Searching with {tool}...</span>
        </div>
      )}
      {status === 'completed' && resultText && (
        <div className="flex items-center gap-2 text-green-600">
          <Check className="w-4 h-4" />
          <span>{resultText}</span>
        </div>
      )}
    </div>
  );
}
