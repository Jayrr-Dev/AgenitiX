// TEXT CONVERTER NODE COMPONENT
// Converts any input to a string and outputs it
import React, { useEffect } from 'react';
import { Position, useNodeConnections, useNodesData, type NodeProps, type Node } from '@xyflow/react';
import CustomHandle from '../../handles/CustomHandle';
import { getSingleInputValue, safeStringify, extractNodeValue } from '../utils/nodeUtils';
import type { AgenNode } from '../../flow-editor/types';
import { useFlowStore } from '../../stores/flowStore';

// ---------------------- TYPES ----------------------
interface TextConverterNodeData {
  value?: unknown;
  text?: string;
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

  // Convert any input to string
  let stringValue = '';
  
  if (inputValue !== undefined) {
    // Handle special number values
    if (typeof inputValue === 'number') {
      if (Number.isNaN(inputValue)) {
        stringValue = 'NaN';
      } else if (!Number.isFinite(inputValue)) {
        stringValue = inputValue > 0 ? 'Infinity' : '-Infinity';
      } else {
        stringValue = String(inputValue);
      }
    }
    // Handle objects (including arrays)
    else if (typeof inputValue === 'object' && inputValue !== null) {
      try {
        // Try to stringify with proper formatting
        stringValue = JSON.stringify(inputValue, (key, value) => {
          // Handle BigInt
          if (typeof value === 'bigint') {
            return value.toString() + 'n';
          }
          // Handle Date objects
          if (value instanceof Date) {
            return value.toISOString();
          }
          // Handle RegExp objects
          if (value instanceof RegExp) {
            return value.toString();
          }
          // Handle Error objects
          if (value instanceof Error) {
            return {
              name: value.name,
              message: value.message,
              stack: value.stack
            };
          }
          return value;
        }, 2);
      } catch (error) {
        // If JSON.stringify fails (e.g., circular reference), use a fallback
        if (error instanceof Error && error.message.includes('circular')) {
          stringValue = '[Circular Object]';
        } else {
          stringValue = '[Complex Object]';
        }
      }
    }
    // Handle null
    else if (inputValue === null) {
      stringValue = 'null';
    }
    // Handle all other primitive types
    else {
      stringValue = String(inputValue);
    }
  }

  // Update node data for downstream nodes (set both value and text)
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  useEffect(() => {
    updateNodeData(id, { value: inputValue, text: stringValue });
  }, [id, inputValue, stringValue, updateNodeData]);

  // UI
  return (
    <div className="px-4 py-3 rounded-lg bg-purple-50 dark:bg-purple-900 shadow border border-purple-300 dark:border-purple-800 flex flex-col items-center min-w-[120px]">
      {/* INPUT HANDLE (left, any type) */}
      <CustomHandle type="target" position={Position.Left} id="x" dataType="x" />
      <div className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Text Converter</div>
      <div className="text-xs text-purple-800 dark:text-purple-200 mb-2 text-center break-words max-w-[100px]">
        {stringValue || 'No input'}
      </div>
      {/* OUTPUT HANDLE (right, string) */}
      <CustomHandle type="source" position={Position.Right} id="s" dataType="s" />
    </div>
  );
};

export default TextConverterNode; 