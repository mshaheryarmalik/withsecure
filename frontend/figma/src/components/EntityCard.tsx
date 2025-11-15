import { Package } from 'lucide-react';

interface EntityCardProps {
  name: string;
  vendor: string;
  category: string;
}

export function EntityCard({ name, vendor, category }: EntityCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg mb-3">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Package className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <div className="text-gray-900">{name}</div>
        <div className="text-sm text-gray-600">{vendor}</div>
        <div className="text-xs text-gray-500 mt-1 px-2 py-0.5 bg-white border border-gray-200 rounded inline-block">
          {category}
        </div>
      </div>
    </div>
  );
}
