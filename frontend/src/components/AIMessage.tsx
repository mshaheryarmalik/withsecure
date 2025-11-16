import { ReactNode } from 'react';

interface AIMessageProps {
  children: ReactNode;
  showProgress?: boolean;
  progressElement?: ReactNode;
}

export function AIMessage({ children, showProgress, progressElement }: AIMessageProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%]">
        {showProgress && progressElement && (
          <div className="mb-2">
            {progressElement}
          </div>
        )}
        <div className="px-4 py-3 bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
