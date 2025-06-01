import React from 'react'

interface IconForPulseProps {
  isPulsing: boolean
  onClick: () => void
  size?: number
  disabled?: boolean
}

const IconForPulse: React.FC<IconForPulseProps> = ({ 
  isPulsing, 
  onClick, 
  size = 32, 
  disabled = false 
}) => {
  // Circle size
  const circleSize = size
  return (
    <button
      type="button"
      aria-pressed={isPulsing}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`
        flex items-center justify-center rounded-full border-2 transition-all duration-150
        shadow-md focus:outline-none
        ${isPulsing ? 'bg-red-500 border-red-600 shadow-inner' : 'bg-gray-200 border-gray-400'}
        ${!disabled && 'active:scale-95 active:shadow-inner'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
      `}
      style={{ width: circleSize, height: circleSize }}
      tabIndex={0}
    >
      {/* Inner circle for depth */}
      <div
        className={`rounded-full flex items-center justify-center transition-all duration-150
          ${isPulsing ? 'bg-red-400' : 'bg-white'}
        `}
        style={{ width: circleSize * 0.7, height: circleSize * 0.7, boxShadow: isPulsing ? '0 0 8px 2px rgba(239,68,68,0.4)' : '0 1px 2px rgba(0,0,0,0.08)' }}
      >
        <span
          className={`font-bold select-none text-xs ${isPulsing ? 'text-white' : 'text-gray-700'}`}
          style={{ fontSize: Math.max(10, circleSize * 0.28) }}
        >
          {isPulsing ? 'Pulse' : 'Idle'}
        </span>
      </div>
    </button>
  )
}

export default IconForPulse 