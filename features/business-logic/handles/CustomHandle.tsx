import React, { useState, useCallback } from 'react'
import { Handle, type HandleProps, Position, Connection, useReactFlow } from '@xyflow/react'
import { toast } from "sonner";

// TYPE LEGEND & COLORS
const typeMap: Record<string, { label: string; color: string }> = {
  s: { label: 's', color: '#3b82f6' },      // string - blue
  n: { label: 'n', color: '#f59e42' },      // number - orange
  b: { label: 'b', color: '#10b981' },      // boolean - green
  j: { label: 'j', color: '#6366f1' },      // JSON - indigo
  a: { label: 'a', color: '#f472b6' },      // array - pink
  N: { label: 'N', color: '#a21caf' },      // Bigint - purple
  f: { label: 'f', color: '#fbbf24' },      // float - yellow
  x: { label: 'x', color: '#6b7280' },      // any - gray
  u: { label: 'u', color: '#d1d5db' },      // undefined - light gray
  S: { label: 'S', color: '#eab308' },      // symbol - gold
  '∅': { label: '∅', color: '#ef4444' },    // null - red
}

interface CustomHandleProps extends Omit<HandleProps, 'className'> {
  dataType: keyof typeof typeMap
  className?: string
}

// Type guard for Connection
function hasSourceHandle(obj: any): obj is { source: string; sourceHandle: string | null } {
  return obj && typeof obj === 'object' && 'source' in obj && 'sourceHandle' in obj
}

// Helper: parse union type string (e.g., 's|n')
export function parseTypes(typeStr?: string | null): string[] {
  if (!typeStr) return []
  return typeStr.split('|').map(t => t.trim())
}

const CustomHandle: React.FC<CustomHandleProps> = ({ dataType, className = '', position, id, ...props }) => {
  const { label, color } = typeMap[dataType] || { label: '?', color: '#6b7280' }
  const reactFlow = useReactFlow();
  const [invalid, setInvalid] = useState(false)

  // Robust type-safe connection logic
  const isValidConnection = (connection: Connection | { source?: string; sourceHandle?: string | null }) => {
    if (hasSourceHandle(connection)) {
      const { source, sourceHandle } = connection;
      if (!source || !sourceHandle) return false;
      // Find the source node
      const nodes = reactFlow.getNodes?.() || [];
      const sourceNode = nodes.find(n => n.id === source);
      if (!sourceNode) return false;
      // Get types from handle ids (support union, any, custom)
      const sourceTypes = parseTypes(sourceHandle)
      const targetTypes = parseTypes(id)
      // Allow if either side is 'x' (any)
      if (sourceTypes.includes('x') || targetTypes.includes('x')) return true
      // Allow if any type in source matches any in target
      const match = sourceTypes.some(st => targetTypes.includes(st))
      setInvalid(!match)
      return match
    }
    setInvalid(false)
    return true;
  };

  // Tooltip for invalid connection
  const tooltip = invalid ? 'Type mismatch: cannot connect these handles.' : undefined

  return (
    <Handle
      {...props}
      id={id}
      position={position}
      isValidConnection={isValidConnection}
      className={`w-5 h-5 flex items-center justify-center bg-black/20 border-[0.5px] border-white rounded-full p-1 shadow ${invalid ? 'ring-2 ring-red-500' : ''} ${className}`}
      style={{ background: color, color: '#fff', ...props.style }}
      title={tooltip}
    >
      <span
        style={{
          fontSize: '12px',
          fontWeight: 200,
          lineHeight: 1,
          pointerEvents: 'none',
          color: '#fff',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          marginBottom: '1.5px',
        }}
      >
        {label}
      </span>
    </Handle>
  )
}

export default CustomHandle 