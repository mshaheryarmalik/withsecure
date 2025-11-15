import { AlertCircle } from 'lucide-react';

interface CVECount {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface CVESummaryCardProps {
  counts: CVECount;
}

export function CVESummaryCard({ counts }: CVESummaryCardProps) {
  const badges = [
    { label: 'Critical', count: counts.critical, color: 'bg-red-100 text-red-700 border-red-200' },
    { label: 'High', count: counts.high, color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { label: 'Medium', count: counts.medium, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'Low', count: counts.low, color: 'bg-gray-100 text-gray-700 border-gray-200' },
  ];

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm mb-3">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-gray-600" />
        <span className="text-gray-900">CVE Summary</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {badges.map((badge) => (
          <div 
            key={badge.label}
            className={`px-3 py-2 border rounded-lg ${badge.color}`}
          >
            <div className="text-2xl">{badge.count}</div>
            <div className="text-xs">{badge.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
