interface ShieldLogoProps {
  className?: string;
}

export function ShieldLogo({ className = "w-6 h-6" }: ShieldLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#e2e8f0', stopOpacity: 1 }} />
          <stop offset="35%" style={{ stopColor: '#cbd5e1', stopOpacity: 1 }} />
          <stop offset="65%" style={{ stopColor: '#94a3b8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#64748b', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="shieldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }} />
          <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path
        d="M12 2L4 6V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V6L12 2Z"
        fill="url(#shieldGradient)"
        filter="url(#glow)"
      />
      <path
        d="M12 2L4 6V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V6L12 2Z"
        fill="url(#shieldHighlight)"
        style={{ mixBlendMode: 'overlay' }}
      />
      <path
        d="M12 2L4 6V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V6L12 2Z"
        fill="none"
        stroke="rgba(226, 232, 240, 0.3)"
        strokeWidth="0.5"
      />
    </svg>
  );
}