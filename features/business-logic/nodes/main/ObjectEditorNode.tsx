// OBJECT EDITOR NODE COMPONENT
// Takes a JSON object as input, mirrors the keys, and allows editing the values
import React, { useEffect, useState } from 'react';
import { Position, useNodeConnections, useNodesData, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import CustomHandle from '../../handles/CustomHandle';

// ---------------------- TYPES ----------------------
interface ObjectEditorNodeData {
  value?: Record<string, unknown>;
}

// ------------------- RECURSIVE FIELD COMPONENT --------------------
// Renders a field for a key/value, recursing for nested objects and arrays
interface JsonEditorFieldProps {
  path: string[];
  value: unknown;
  onChange: (path: string[], value: unknown) => void;
  depth?: number;
}

const JsonEditorField: React.FC<JsonEditorFieldProps> = ({ path, value, onChange, depth = 0 }) => {
  // Handle arrays
  if (Array.isArray(value)) {
    // Check if this is an array of objects (all items are objects, not null, not arrays)
    const isObjectArray = value.length > 0 && value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
    return (
      <div style={{ marginLeft: depth * 16 }}>
        <span className="font-mono min-w-[60px] text-xs">[{path[path.length-1] ?? ''}]</span>
        <div className="flex flex-col gap-1">
          {value.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-0.5 border-l-2 border-yellow-300 pl-2 mb-1">
              {isObjectArray && (
                <div className="text-xs font-bold text-yellow-700 dark:text-yellow-200 mb-0.5">Item {idx}</div>
              )}
              <div className="flex items-center gap-1">
                <JsonEditorField
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
                    // Remove item at idx
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
            className="text-xs text-green-600 px-1 mt-1 border border-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900"
            title="Add item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Add {} for object arrays, '' for others
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
  // If value is an object (not array/null), render nested fields with key label
  if (typeof value === 'object' && value !== null) {
    const key = path[path.length - 1];
    return (
      <div style={{ marginLeft: depth * 16 }}>
        {key !== undefined && (
          <span className="font-mono min-w-[60px] text-xs">{key}:</span>
        )}
        <div className="flex flex-col gap-1">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <JsonEditorField
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
  // Otherwise, render an input for primitives
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
const ObjectEditorNode: React.FC<NodeProps<Node<ObjectEditorNodeData & Record<string, unknown>>>> = ({ id, data }) => {
  // Get input connection (any type)
  const connections = useNodeConnections({ handleType: 'target' });
  const inputConn = connections.find(c => c.targetHandle === 'j');
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
    : data.value ?? {};

  // Only allow editing if input is an object
  const [localObj, setLocalObj] = useState<Record<string, unknown>>(
    typeof inputValue === 'object' && inputValue !== null && !Array.isArray(inputValue)
      ? { ...inputValue }
      : {}
  );

  // Sync local state with input changes
  useEffect(() => {
    if (typeof inputValue === 'object' && inputValue !== null && !Array.isArray(inputValue)) {
      setLocalObj({ ...inputValue });
    }
  }, [inputValue]);

  // Update node data for downstream nodes
  const { updateNodeData } = useReactFlow();
  useEffect(() => {
    // Only update if localObj is different from data.value
    if (JSON.stringify(localObj) !== JSON.stringify(data.value)) {
      updateNodeData(id, { value: localObj });
    }
  }, [id, localObj, updateNodeData, data.value]);

  // Handler for editing values (deep update, supports arrays)
  const handleChange = (path: string[], value: unknown) => {
    setLocalObj((prev) => {
      // Handle root object case (empty path)
      if (path.length === 0) {
        return typeof value === 'object' && value !== null && !Array.isArray(value) 
          ? { ...value } 
          : prev;
      }

      // Deep clone and set value at path (support arrays)
      const clone = JSON.parse(JSON.stringify(prev));
      let curr: any = clone;
      
      // Navigate to the parent of the target
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (Array.isArray(curr)) {
          curr = curr[Number(key)];
        } else {
          // If next key is a number, treat as array
          const nextKey = path[i + 1];
          if (typeof curr[key] !== 'object' || curr[key] === null) {
            // If next is number, make array, else object
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
    <div className="px-3 py-3 rounded bg-yellow-50 dark:bg-yellow-900 shadow border border-yellow-300 dark:border-yellow-800 flex flex-col items-center min-w-[180px]">
      {/* INPUT HANDLE (left, JSON only) */}
      <CustomHandle type="target" position={Position.Left} id="j" dataType="j" />
      {/* OUTPUT HANDLE (right, JSON only) */}
      <CustomHandle type="source" position={Position.Right} id="j" dataType="j" />
      <div className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Object Editor</div>
      {Object.keys(localObj).length === 0 ? (
        <div className="text-xs text-yellow-800 dark:text-yellow-200 italic">No object input</div>
      ) : (
        <div className="flex flex-col gap-1 w-full">
          {Object.entries(localObj).map(([key, value]) => (
            <JsonEditorField
              key={key}
              path={[key]}
              value={value}
              onChange={handleChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjectEditorNode; 