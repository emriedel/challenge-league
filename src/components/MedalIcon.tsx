interface MedalIconProps {
  place: 1 | 2 | 3;
  size?: 'sm' | 'md' | 'lg';
}

export default function MedalIcon({ place, size = 'md' }: MedalIconProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colors = {
    1: {
      medal: '#FFD700',
      ribbon: '#B8860B',
      number: '#8B4513'
    },
    2: {
      medal: '#C0C0C0',
      ribbon: '#808080',
      number: '#2F4F4F'
    },
    3: {
      medal: '#CD7F32',
      ribbon: '#8B4513',
      number: '#654321'
    }
  };

  const color = colors[place];

  return (
    <svg
      className={sizeClasses[size]}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ribbon */}
      <path
        d="M8 2L12 6L16 2V8L12 12L8 8V2Z"
        fill={color.ribbon}
        stroke={color.ribbon}
        strokeWidth="0.5"
      />

      {/* Medal circle */}
      <circle
        cx="12"
        cy="16"
        r="6"
        fill={color.medal}
        stroke="#000"
        strokeWidth="0.3"
      />

      {/* Inner circle for number */}
      <circle
        cx="12"
        cy="16"
        r="4"
        fill="rgba(255,255,255,0.2)"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="0.2"
      />

      {/* Number */}
      <text
        x="12"
        y="19"
        textAnchor="middle"
        className="text-xs font-bold"
        fill={color.number}
        style={{ fontSize: '8px' }}
      >
        {place}
      </text>
    </svg>
  );
}