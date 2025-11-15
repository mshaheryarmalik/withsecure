interface TrustScoreCardProps {
  score: number;
  label?: string;
}

export function TrustScoreCard({ score, label = "Trust Score" }: TrustScoreCardProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm mb-3">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className={`text-5xl mb-3 ${getColor(score)}`}>{score}</div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getBarColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
}
