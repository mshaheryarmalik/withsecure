import { ReactNode } from 'lucide-react';

interface SystemMessageProps {
  children: ReactNode;
  icon?: ReactNode;
}

export function SystemMessage({ children, icon }: SystemMessageProps) {
  return (
    <div className="flex justify-center mb-4">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg">
        {icon}
        {children}
      </div>
    </div>
  );
}
