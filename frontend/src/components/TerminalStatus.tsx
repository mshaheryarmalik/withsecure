import { Terminal } from 'lucide-react';

interface StatusLine {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface TerminalStatusProps {
  lines: StatusLine[];
}

export function TerminalStatus({ lines }: TerminalStatusProps) {
  const getPrefix = (type: string) => {
    switch (type) {
      case 'success':
        return <span className="text-green-500">✓</span>;
      case 'warning':
        return <span className="text-yellow-500">⚠</span>;
      case 'error':
        return <span className="text-red-500">✗</span>;
      default:
        return <span className="text-blue-500">→</span>;
    }
  };

  return (
    <div className="border-t-2 border-gray-200 bg-gray-900 text-gray-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Terminal className="w-4 h-4 text-green-400" />
        <span className="text-sm text-green-400">Terminal Status</span>
      </div>
      
      <div className="font-mono text-xs space-y-1 max-h-24 overflow-y-auto">
        {lines.map((line) => (
          <div key={line.id} className="flex items-start gap-2">
            {getPrefix(line.type)}
            <span className="text-gray-300">{line.text}</span>
          </div>
        ))}
        
        {lines.length === 0 && (
          <div className="text-gray-500 text-xs">System ready</div>
        )}
      </div>
    </div>
  );
}
