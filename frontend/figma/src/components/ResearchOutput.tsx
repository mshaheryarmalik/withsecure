import { useEffect, useRef } from 'react';
import { FileSearch, Sparkles } from 'lucide-react';

interface ResearchMessage {
  id: string;
  type: 'thinking' | 'finding' | 'analysis' | 'result';
  content: string;
  timestamp: string;
}

interface ResearchOutputProps {
  messages: ResearchMessage[];
}

export function ResearchOutput({ messages }: ResearchOutputProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'thinking':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'finding':
        return <FileSearch className="w-4 h-4 text-blue-500" />;
      case 'analysis':
        return <span className="text-amber-500">🔍</span>;
      case 'result':
        return <span className="text-green-500">✓</span>;
      default:
        return null;
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'thinking':
        return 'text-purple-700';
      case 'finding':
        return 'text-blue-700';
      case 'analysis':
        return 'text-amber-700';
      case 'result':
        return 'text-green-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-white border-l-2 border-gray-200">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h2 className="text-sm text-gray-900">Deep Research Output</h2>
      </div>
      
      <div className="space-y-3 font-mono text-xs">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-2 group">
            <div className="flex-shrink-0 mt-1">
              {getIcon(message.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-gray-400">{message.timestamp}</span>
                <span className={`uppercase text-xs ${getTextColor(message.type)}`}>
                  {message.type}
                </span>
              </div>
              <div className="text-gray-700 leading-relaxed">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Waiting for research to begin...</p>
          </div>
        )}
        
        <div ref={endRef} />
      </div>
    </div>
  );
}
