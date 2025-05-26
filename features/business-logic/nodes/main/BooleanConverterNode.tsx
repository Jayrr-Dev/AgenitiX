// BOOLEAN CONVERTER NODE COMPONENT
// Converts any input to a boolean (truthy/falsy)
import React, { useEffect } from 'react';
import { Position, useNodeConnections, useNodesData, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import CustomHandle from '../../handles/CustomHandle';

// ---------------------- TYPES ----------------------
interface BooleanConverterNodeData {
  value?: unknown;
  triggered?: boolean;
}

// ------------------- COMPONENT --------------------
const BooleanConverterNode: React.FC<NodeProps<Node<BooleanConverterNodeData & Record<string, unknown>>>> = ({ id, data }) => {
  // Get input connection (any type)
  const connections = useNodeConnections({ handleType: 'target' });
  const inputConn = connections.find(c => c.targetHandle === 'x');
  const inputNodeId = inputConn?.source;
  const inputNodesData = useNodesData(inputNodeId ? [inputNodeId] : []);
  // Try to get a value from common data keys
  const inputValue = inputNodesData.length > 0
    ? (
        inputNodesData[0].data?.value !== undefined
          ? inputNodesData[0].data?.value
          : (inputNodesData[0].data?.text !== undefined
              ? inputNodesData[0].data?.text
              : inputNodesData[0].data?.triggered)
      )
    : undefined;

  // Convert any input to boolean
  const boolValue = Boolean(inputValue);

  // Update node data for downstream nodes (set both value and triggered)
  const { updateNodeData } = useReactFlow();
  useEffect(() => {
    updateNodeData(id, { value: inputValue, triggered: boolValue });
  }, [id, inputValue, boolValue, updateNodeData]);

  // UI
  return (
    <div className="px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900 shadow border border-green-300 dark:border-green-800 flex flex-col items-center min-w-[120px]">
      {/* INPUT HANDLE (left, any type) */}
      <CustomHandle type="target" position={Position.Left} id="x" dataType="x" />
      <div className="font-semibold text-green-900 dark:text-green-100 mb-2">Boolean Converter</div>
      <div className="text-xs text-green-800 dark:text-green-200 mb-2">Output: <span className="font-mono">{String(boolValue)}</span></div>
      {/* OUTPUT HANDLE (right, boolean) */}
      <CustomHandle type="source" position={Position.Right} id="b" dataType="b" />
    </div>
  );
};

export default BooleanConverterNode; 