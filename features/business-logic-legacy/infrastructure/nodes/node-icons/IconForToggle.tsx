import React from 'react'

interface IconForToggleProps {
  isOn: boolean
  onClick: () => void
  size?: number
  disabled?: boolean
}

const IconForToggle: React.FC<IconForToggleProps> = ({ 
  isOn, 
  onClick, 
  size = 32, 
  disabled = false 
}) => {
  // Circle size
  const circleSize = size
  return (
    <button
      type="button"
      aria-pressed={isOn}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`
        flex items-center justify-center rounded-full border-2 transition-all duration-150
        shadow-md focus:outline-none
        ${isOn ? 'bg-green-500 border-green-600 shadow-inner' : 'bg-gray-200 border-gray-400'}
        ${!disabled && 'active:scale-95 active:shadow-inner'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
      `}
      style={{ width: circleSize, height: circleSize }}
      tabIndex={0}
    >
      {/* Inner circle for depth */}
      <div
        className={`rounded-full flex items-center justify-center transition-all duration-150
          ${isOn ? 'bg-green-400' : 'bg-white'}
        `}
        style={{ width: circleSize * 0.7, height: circleSize * 0.7, boxShadow: isOn ? '0 0 8px 2px rgba(34,197,94,0.3)' : '0 1px 2px rgba(0,0,0,0.08)' }}
      >
        <span
          className={`font-bold select-none text-xs ${isOn ? 'text-white' : 'text-gray-700'}`}
          style={{ fontSize: Math.max(10, circleSize * 0.28) }}
        >
          {isOn ? 'ON' : 'OFF'}
        </span>
      </div>
    </button>
  )
}

export default IconForToggle 