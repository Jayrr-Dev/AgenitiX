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
  // Smaller, more compact toggle switch proportions
  const toggleWidth = size * 1.2
  const toggleHeight = size * 0.6
  const circleSize = toggleHeight * 0.75
  const padding = (toggleHeight - circleSize) / 2

  return (
    <div 
      className="flex items-center justify-center cursor-pointer select-none"
      onClick={disabled ? undefined : onClick}
      style={{ width: toggleWidth, height: size }}
    >
      {/* Toggle Switch Container */}
      <div
        className={`
          relative transition-all duration-300 ease-in-out
          ${isOn 
            ? 'bg-green-500 shadow-lg' 
            : 'bg-gray-400 shadow-md'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
        `}
        style={{ 
          width: toggleWidth, 
          height: toggleHeight,
          borderRadius: toggleHeight / 2,
          boxShadow: disabled ? 'none' : `0 2px 6px ${isOn ? 'rgba(34, 197, 94, 0.4)' : 'rgba(107, 114, 128, 0.4)'}`
        }}
      >
        {/* Toggle Circle */}
        <div
          className={`
            absolute rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out
            border-2 border-gray-200
          `}
          style={{
            width: circleSize,
            height: circleSize,
            top: padding,
            left: isOn ? toggleWidth - circleSize - padding : padding,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
        />

        {/* ON/OFF Labels - very small for compact toggle */}
        <div className="absolute inset-0 flex items-center justify-between text-white font-bold pointer-events-none">
          <span 
            className={`ml-1 transition-opacity duration-300 ${isOn ? 'opacity-100' : 'opacity-0'}`}
            style={{ fontSize: Math.max(6, toggleHeight * 0.25) }}
          >
            ON
          </span>
          <span 
            className={`mr-1 transition-opacity duration-300 ${!isOn ? 'opacity-100' : 'opacity-0'}`}
            style={{ fontSize: Math.max(6, toggleHeight * 0.25) }}
          >
            OFF
          </span>
        </div>
      </div>
    </div>
  )
}

export default IconForToggle 