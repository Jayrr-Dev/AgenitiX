// TEXT CONVERTER NODE COMPONENT
// Converts any input to a string and outputs it
import React, { useEffect } from 'react';
import { Position, useNodeConnections, useNodesData, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import CustomHandle from '../../handles/CustomHandle';
import { getSingleInputValue, safeStringify } from '../utils/nodeUtils';

// ---------------------- TYPES ----------------------
interface TextConverterNodeData {
  value?: unknown;
}

// ------------------- COMPONENT --------------------
const TextConverterNode: React.FC<NodeProps<Node<TextConverterNodeData & Record<string, unknown>>>> = ({ id, data }) => {
  // Get input connection (any type)
  const connections = useNodeConnections({ handleType: 'target' });
  const inputConn = connections.find(c => c.targetHandle === 'x');
  const inputNodeId = inputConn?.source;
  const inputNodesData = useNodesData(inputNodeId ? [inputNodeId] : []);
  
  // Extract input value using safe utility
  const inputValue = getSingleInputValue(inputNodesData);

  // Convert any input to string with safe serialization
  let stringValue = '';
  if (inputValue !== undefined) {
    if (typeof inputValue === 'object' && inputValue !== null) {
      stringValue = safeStringify(inputValue);
      if (stringValue === 'null') stringValue = '[object]';
    } else {
      stringValue = String(inputValue);
    }
  }

  // Update node data for downstream nodes (set both value and text)
  const { updateNodeData } = useReactFlow();
  useEffect(() => {
    updateNodeData(id, { value: stringValue, text: stringValue });
  }, [id, stringValue, updateNodeData]);

  // UI
  return (
    <div className="px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900 shadow border border-blue-300 dark:border-blue-800 flex flex-col items-center min-w-[120px]">
      {/* INPUT HANDLE (left, any type) */}
      <CustomHandle type="target" position={Position.Left} id="x" dataType="x" />
      <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Text Converter</div>
      <div className="text-xs text-blue-800 dark:text-blue-200 mb-2">Output: <span className="font-mono">{stringValue}</span></div>
      {/* OUTPUT HANDLE (right, string) */}
      <CustomHandle type="source" position={Position.Right} id="s" dataType="s" />
    </div>
  );
};

export default TextConverterNode; 