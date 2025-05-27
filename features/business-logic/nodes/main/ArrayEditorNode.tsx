// ARRAY EDITOR NODE COMPONENT
// Takes an array as input, allows editing items (including objects), and outputs the array
import React, { useEffect, useState } from 'react';
import { Position, useNodeConnections, useNodesData, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import CustomHandle from '../../handles/CustomHandle';

// ---------------------- TYPES ----------------------
interface ArrayEditorNodeData {
  value?: unknown[];
}

// ------------------- RECURSIVE FIELD COMPONENT --------------------
// Reuse the recursive field logic for arrays/objects/primitives
interface ArrayEditorFieldProps {
  path: string[];
  value: unknown;
  onChange: (path: string[], value: unknown) => void;
  depth?: number;
}

const ArrayEditorField: React.FC<ArrayEditorFieldProps> = ({ path, value, onChange, depth = 0 }) => {
  if (Array.isArray(value)) {
    const isObjectArray = value.length > 0 && value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
    return (
      <div style={{ marginLeft: depth * 16 }}>
        <span className="font-mono min-w-[60px] text-xs">[{path[path.length-1] ?? ''}]</span>
        <div className="flex flex-col gap-1">
          {value.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-0.5 border-l-2 border-blue-300 pl-2 mb-1">
              {isObjectArray && (
                <div className="text-xs font-bold text-blue-700 dark:text-blue-200 mb-0.5">Item {idx}</div>
              )}
              <div className="flex items-center gap-1">
                <ArrayEditorField
                  path={[...path, String(idx)]}
                  value={item}
                  onChange={onChange}
                  depth={depth + 1}
                />
                <button
                  type="button"
                  className="text-xs text-red-500 px-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                  title="Remove item"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const arr = [...value];
                    arr.splice(idx, 1);
                    onChange(path, arr);
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="text-xs text-blue-600 px-1 mt-1 border border-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
            title="Add item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const newItem = isObjectArray ? {} : '';
              onChange(path, [...value, newItem]);
            }}
          >
            + Add Item
          </button>
        </div>
      </div>
    );
  }
  if (typeof value === 'object' && value !== null) {
    const key = path[path.length - 1];
    return (
      <div style={{ marginLeft: depth * 16 }}>
        {key !== undefined && (
          <span className="font-mono min-w-[60px] text-xs">{key}:</span>
        )}
        <div className="flex flex-col gap-1">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <ArrayEditorField
              key={k}
              path={[...path, k]}
              value={v}
              onChange={onChange}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    );
  }
  const key = path[path.length - 1];
  return (
    <label className="flex items-center gap-2 text-xs px-1 py-0.5" style={{ marginLeft: depth * 16 }}>
      <span className="font-mono min-w-[60px]">{key}:</span>
      <input
        type="text"
        className="w-full rounded border px-1 text-xs bg-white dark:bg-black"
        value={String(value)}
        onChange={e => onChange(path, e.target.value)}
      />
    </label>
  );
};

// ------------------- COMPONENT --------------------
const ArrayEditorNode: React.FC<NodeProps<Node<ArrayEditorNodeData & Record<string, unknown>>>> = ({ id, data }) => {
  // Get input connection (any type)
  const connections = useNodeConnections({ handleType: 'target' });
  const inputConn = connections.find(c => c.targetHandle === 'a');
  const inputNodeId = inputConn?.source;
  const inputNodesData = useNodesData(inputNodeId ? [inputNodeId] : []);
  // Use .value if present, else .text, else .triggered
  const inputValue = inputNodesData.length > 0
    ? (
        inputNodesData[0].data?.value !== undefined
          ? inputNodesData[0].data?.value
          : (inputNodesData[0].data?.text !== undefined
              ? inputNodesData[0].data?.text
              : inputNodesData[0].data?.triggered)
      )
    : data.value ?? [];

  // Only allow editing if input is an array
  const [localArr, setLocalArr] = useState<unknown[]>(
    Array.isArray(inputValue) ? [...inputValue] : []
  );

  // Sync local state with input changes
  useEffect(() => {
    if (Array.isArray(inputValue)) {
      setLocalArr([...inputValue]);
    }
  }, [inputValue]);

  // Update node data for downstream nodes
  const { updateNodeData } = useReactFlow();
  useEffect(() => {
    if (JSON.stringify(localArr) !== JSON.stringify(data.value)) {
      updateNodeData(id, { value: localArr });
    }
  }, [id, localArr, updateNodeData, data.value]);

  // Handler for editing values (deep update, supports arrays/objects)
  const handleChange = (path: string[], value: unknown) => {
    setLocalArr((prev) => {
      // Handle root array case (empty path)
      if (path.length === 0) {
        return Array.isArray(value) ? [...value] : prev;
      }

      const clone = JSON.parse(JSON.stringify(prev));
      let curr: any = clone;
      
      // Navigate to the parent of the target
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (Array.isArray(curr)) {
          curr = curr[Number(key)];
        } else {
          const nextKey = path[i + 1];
          if (typeof curr[key] !== 'object' || curr[key] === null) {
            curr[key] = !isNaN(Number(nextKey)) ? [] : {};
          }
          curr = curr[key];
        }
      }
      
      // Set the final value
      const lastKey = path[path.length - 1];
      if (Array.isArray(curr) && !isNaN(Number(lastKey))) {
        curr[Number(lastKey)] = value;
      } else {
        curr[lastKey] = value;
      }
      
      return clone;
    });
  };

  // UI
  return (
    <div className="px-3 py-3 rounded bg-blue-50 dark:bg-blue-900 shadow border border-blue-300 dark:border-blue-800 flex flex-col items-center min-w-[180px]">
      {/* INPUT HANDLE (left, Array only) */}
      <CustomHandle type="target" position={Position.Left} id="a" dataType="a" />
      {/* OUTPUT HANDLE (right, Array only) */}
      <CustomHandle type="source" position={Position.Right} id="a" dataType="a" />
      <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Array Editor</div>
      {localArr.length === 0 ? (
        <div className="text-xs text-blue-800 dark:text-blue-200 italic">No array input</div>
      ) : (
        <div className="flex flex-col gap-1 w-full">
          <ArrayEditorField
            path={[]}
            value={localArr}
            onChange={handleChange}
          />
        </div>
      )}
    </div>
  );
};

export default ArrayEditorNode; 