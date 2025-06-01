'use client'

import React from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
interface IconForToggleCyclesProps {
  progress: number // 0 to 1
  onToggle: () => void
  isRunning: boolean
  label: string
  size?: number // px, default 100
  color?: string // radial color
}

// -----------------------------------------------------------------------------
// ICON FOR CYCLES COMPONENT
// -----------------------------------------------------------------------------
const IconForToggleCycles: React.FC<IconForToggleCyclesProps> = ({ progress, onToggle, isRunning, label, size = 100, color = '#10b981' }) => {
  // Clamp progress between 0 and 1
  const pct = Math.max(0, Math.min(1, progress))
  // Chart data for radial
  const data = [{ name: 'cycle', value: pct * 100 }]
  // Chart size
  const chartSize = size
  const center = chartSize / 2
  const radius = chartSize * 0.35
  const buttonRadius = chartSize * 0.22

  return (
    <div className="relative flex flex-col items-center">
      {/* ICON CONTAINER: relative for stacking */}
      <div style={{ position: 'relative', width: chartSize, height: chartSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* SQUARE BACKGROUND */}
        <svg width={chartSize} height={chartSize} style={{ position: 'absolute', left: 0, top: 0, zIndex: 0 }}>
          <rect x={0} y={0} width={chartSize} height={chartSize} rx={chartSize * 0.12} fill="#E5E7EB" stroke="#9CA3AF" strokeWidth={2} />
        </svg>
        {/* RADIAL BAR CHART */}
        <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 1, width: chartSize, height: chartSize, pointerEvents: 'none' }}>
          <RadialBarChart
            width={chartSize}
            height={chartSize}
            cx={center}
            cy={center}
            innerRadius={radius - 8}
            outerRadius={radius + 8}
            barSize={2}
            data={data}
            startAngle={90}
            endAngle={-360}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background
              dataKey="value"
            //   cornerRadius={8}
              fill={color}
            />
          </RadialBarChart>
        </div>
        {/* CENTER BUTTON */}
        <button
          onClick={onToggle}
          style={{
            position: 'absolute',
            left: center - buttonRadius,
            top: center - buttonRadius,
            width: buttonRadius * 2,
            height: buttonRadius * 2,
            borderRadius: '50%',
            background: isRunning ? color : '#fff',
            border: `2px solid ${color}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: size * 0.18,
            color: isRunning ? '#fff' : color,
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}
          aria-label={isRunning ? 'Stop cycle' : 'Start cycle'}
        >
          {isRunning ? (
            // Pause SVG icon
            <svg 
              width={size * 0.18} 
              height={size * 0.18} 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            // Play SVG icon
            <svg 
              width={size * 0.24} 
              height={size * 0.24} 
              viewBox="0 0 24 24" 
              fill="currentColor"
              className="mr-0"
            >
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      </div>
      {/* LABEL */}
      <div className="absolute top-0 mt-1 text-xs font-medium text-gray-700 dark:text-gray-500 text-center" style={{ width: chartSize }}>{label}</div>
    </div>
  )
}

export default IconForToggleCycles
