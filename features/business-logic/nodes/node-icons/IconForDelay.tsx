'use client'

import React from 'react'

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */
interface IconForDelayProps {
  /** 1 = full delay remaining, 0 = finished */
  progress: number
  /** Icon size in px – default 24 */
  size?: number
  /** Active ring colour – default orange */
  color?: string
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */
const IconForDelay: React.FC<IconForDelayProps> = React.memo(
  ({ progress, size = 24, color = '#ea580c' }) => {
    /* PROGRESS CALCULATION ------------------------------------------------- */
    const pct = Math.max(0, Math.min(1, progress))
    
    /* SVG CALCULATIONS ----------------------------------------------------- */
    const chartSize = size
    const center = chartSize / 2
    const radius = chartSize * 0.35
    const strokeWidth = Math.max(2, size * 0.08) // Responsive stroke width
    const circumference = 2 * Math.PI * radius
    
    // For countdown: when pct=1 (full delay), show full ring (offset=0)
    // when pct=0 (finished), show no ring (offset=circumference)
    const strokeDashoffset = circumference - (pct * circumference)
    
    const iconSize = chartSize * 0.4

    return (
      <div className="relative flex items-center justify-center" style={{ width: chartSize, height: chartSize }}>
        {/* SVG COUNTDOWN RING */}
        <svg 
          width={chartSize} 
          height={chartSize} 
          style={{ position: 'absolute', left: 0, top: 0, zIndex: 1 }}
        >
          {/* Background circle */}
          <circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill="none" 
            stroke="#e5e7eb" 
            strokeWidth={strokeWidth}
          />
          
          {/* Progress circle */}
          {pct > 0 && (
            <circle 
              cx={center} 
              cy={center} 
              r={radius} 
              fill="none" 
              stroke={color} 
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
                transition: 'stroke-dashoffset 0.1s ease-out'
              }}
            />
          )}
        </svg>

        {/* CENTER CLOCK ICON */}
        <div 
          style={{
            position: 'absolute',
            left: center - iconSize / 2,
            top: center - iconSize / 2,
            width: iconSize,
            height: iconSize,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: iconSize * 0.6,
            color: pct > 0 ? color : '#9ca3af',
            transition: 'color 0.2s ease-out'
          }}
        >
          ⏱
        </div>
      </div>
    )
  }
)

IconForDelay.displayName = 'IconForDelay'
export default IconForDelay
