import React from 'react';
import { useNodeDisplay } from '../../flow-editor/contexts/NodeDisplayContext';

interface FloatingNodeIdProps {
  nodeId: string;
  className?: string;
}

export const FloatingNodeId: React.FC<FloatingNodeIdProps> = ({ 
  nodeId, 
  className = '' 
}) => {
  const { showNodeIds } = useNodeDisplay();

  if (!showNodeIds) return null;

  return (
    <div 
      className={`
        absolute -top-4 left-1/2 transform -translate-x-1/2 
         text-[8px] px-1 py-0.5 rounded text-gray-500
        pointer-events-none z-20 font-mono whitespace-nowrap

        ${className}
      `}
      style={{ fontSize: '8px' }}
    >
      {nodeId}
    </div>
  );
}; 