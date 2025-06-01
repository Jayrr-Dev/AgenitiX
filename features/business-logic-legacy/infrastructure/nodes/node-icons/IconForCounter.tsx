export const IconForCounter = () => {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="#DBEAFE"
        stroke="#3B82F6"
        strokeWidth="3"
      />
      
      {/* Counter display background */}
      <rect
        x="25"
        y="35"
        width="50"
        height="20"
        rx="4"
        fill="#1E40AF"
        stroke="#1D4ED8"
        strokeWidth="1"
      />
      
      {/* Counter number */}
      <text
        x="50"
        y="48"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="white"
        fontFamily="monospace"
      >
        123
      </text>
      
      {/* Up arrow */}
      <path
        d="M35 25 L40 20 L45 25"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Down arrow */}
      <path
        d="M55 75 L60 80 L65 75"
        stroke="#EF4444"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Plus symbol */}
      <g stroke="#10B981" strokeWidth="2" strokeLinecap="round">
        <line x1="35" y1="15" x2="45" y2="15" />
        <line x1="40" y1="10" x2="40" y2="20" />
      </g>
      
      {/* Minus symbol */}
      <line
        x1="55"
        y1="85"
        x2="65"
        y2="85"
        stroke="#EF4444"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Step indicator dots */}
      <circle cx="20" cy="50" r="2" fill="#6B7280" />
      <circle cx="80" cy="50" r="2" fill="#6B7280" />
      <circle cx="20" cy="45" r="1.5" fill="#9CA3AF" />
      <circle cx="80" cy="45" r="1.5" fill="#9CA3AF" />
      <circle cx="20" cy="55" r="1.5" fill="#9CA3AF" />
      <circle cx="80" cy="55" r="1.5" fill="#9CA3AF" />
    </svg>
  );
};

export default IconForCounter; 