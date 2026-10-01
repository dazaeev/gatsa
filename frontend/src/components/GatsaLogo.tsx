import React from 'react';

export const GatsaLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ className = '', size = 'md' }) => {
  const heights = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24'
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 320 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${heights[size]} w-auto object-contain shrink-0`}
      >
        {/* Mountain Silhouette Line Art */}
        <path
          d="M20 110 L55 80 L75 92 L105 60 L135 88 L160 68 L185 85 L220 40 L250 85"
          stroke="#0F2C59"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M35 100 L55 80 L70 90 M90 75 L105 60 L120 75 M145 78 L160 68 L175 78 M195 60 L220 40 L235 62"
          stroke="#0072CE"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Financial Ascending Bar Chart */}
        <rect x="165" y="70" width="14" height="40" rx="2" fill="#0F2C59" />
        <rect x="185" y="55" width="14" height="55" rx="2" fill="#0F2C59" />
        <rect x="205" y="38" width="14" height="72" rx="2" fill="#0F2C59" />

        {/* Ascending Dynamic Curved Arrow */}
        <path
          d="M160 100 C 185 95, 210 70, 228 25"
          stroke="#0072CE"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M220 23 L229 23 L229 32"
          stroke="#0072CE"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* GATSA Brand Typography */}
        <text
          x="160"
          y="148"
          textAnchor="middle"
          fill="#0F2C59"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="42"
          letterSpacing="2"
        >
          GATSA
        </text>

        {/* Subtitle: ASESORÍA PATRIMONIAL */}
        <text
          x="160"
          y="168"
          textAnchor="middle"
          fill="#0072CE"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="11.5"
          letterSpacing="4.5"
        >
          ASESORÍA PATRIMONIAL
        </text>
        <line x1="80" y1="175" x2="240" y2="175" stroke="#0072CE" strokeWidth="1.5" />
      </svg>
    </div>
  );
};
