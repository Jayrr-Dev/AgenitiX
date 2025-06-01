'use client'

import React from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { PiClockClockwiseFill } from "react-icons/pi";

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
    
    /* CHART CALCULATIONS --------------------------------------------------- */
    const chartSize = size * 2.1
    const center = chartSize / 2
    const radius = chartSize * 0.35
    const iconSize = chartSize * 0.5
    
    // Chart data for radial - progress represents remaining delay
    const data = [{ name: 'delay', value: pct * 100 }]
    
    return (
      <div className="relative flex items-center justify-center" style={{ width: chartSize, height: chartSize }}>
        {/* RADIAL BAR CHART */}
        <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 1, width: chartSize, height: chartSize, pointerEvents: 'none' }}>
          <RadialBarChart
            width={chartSize}
            height={chartSize}
            cx={center}
            cy={center}
            innerRadius={radius - 1}
            outerRadius={radius + 1}
            barSize={2}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: '#e5e7eb' }}
              dataKey="value"
              fill="red"
              cornerRadius={2}
            />
          </RadialBarChart>
        </div>

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
            fontSize: iconSize * 0.8,
            color: pct > 0 ? "red" : 'white',
            transition: 'color 0.2s ease-out',
            fontWeight: 'bold',
        
          }}
        >
          <PiClockClockwiseFill />

        </div>
      </div>
    )
  }
)

IconForDelay.displayName = 'IconForDelay'
export default IconForDelay
