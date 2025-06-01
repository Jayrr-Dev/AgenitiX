import React from 'react'

interface IconForTriggerProps {
  isOn: boolean
  onClick: () => void
  size?: number
  disabled?: boolean
}

const IconForTrigger: React.FC<IconForTriggerProps> = ({ 
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
        ${isOn ? 'bg-green-600' : 'bg-gray-300'}
        ${isOn ? 'border-green-500' : 'border-gray-400'}
        ${!disabled && 'active:scale-95 active:shadow-inner'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
      `}
      style={{ width: circleSize, height: circleSize }}
      tabIndex={0}
    >
      {/* Inner circle for depth */}
      <div
        className={`rounded-full flex items-center justify-center transition-all duration-150 bg-gray-100`}
        style={{ width: circleSize * 0.7, height: circleSize * 0.7, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
      >
        <svg width={circleSize * 0.5} height={circleSize * 0.5} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill={isOn ? '#22c55e' : '#d1d5db'} />
        </svg>
      </div>
    </button>
  )
}

export default IconForTrigger 