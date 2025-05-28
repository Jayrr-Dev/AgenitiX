import React from 'react';
import { NodeType } from '../types';

interface NodeOutputProps {
  output: string | null;
  nodeType: NodeType;
}

export const NodeOutput: React.FC<NodeOutputProps> = ({ output, nodeType }) => {
  return (
    <div className="text-xs space-y-1">
      <div className="font-semibold text-gray-700 dark:text-gray-300">Output:</div>
      <div className={`font-mono break-all bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 border ${
        nodeType === 'turnToUppercase' ? 'text-sky-600 dark:text-sky-400' : 'text-gray-700 dark:text-gray-300'
      }`}>
        {output || <span className="text-gray-400 italic">—</span>}
      </div>
    </div>
  );
}; 