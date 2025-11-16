import { ArrowRight } from 'lucide-react';

interface AlternativeCardProps {
  name: string;
  vendor: string;
  score: number;
  comparison: string;
}

export function AlternativeCard({ name, vendor, score, comparison }: AlternativeCardProps) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-gray-900">{name}</div>
          <div className="text-sm text-gray-600">{vendor}</div>
        </div>
        <div className="text-2xl text-green-600">{score}</div>
      </div>
      <div className="text-sm text-gray-500 mb-2">{comparison}</div>
      <div className="flex items-center gap-1 text-sm text-blue-600">
        <span>View details</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
}
