// INPUT TESTER NODE COMPONENT
// Lets user select a test value to output (undefined, null, string, array, object, etc.)
import React, { useState, useEffect } from 'react';
import { Position, useNodeConnections, useNodesData, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import CustomHandle from '../../handles/CustomHandle';

// ---------------------- TYPES ----------------------
interface InputTesterNodeData {
  value?: unknown;
}

// ------------------- TEST VALUES -------------------
const TEST_VALUES = [
  { label: 'undefined', value: undefined },
  { label: 'null', value: null },
  { label: 'empty string', value: '' },
  { label: 'string', value: 'hello world' },
  { label: 'array', value: [1, 2, 3] },
  { label: 'object', value: { foo: 'bar' } },
  { label: 'object array', value: [ { id: 1, name: 'A' }, { id: 2, name: 'B' } ] },
  { label: 'json', value: { a: 1, b: [2, 3], c: { d: 'e' } } },
  { 
    label: 'complex json', 
    value: {
      user: {
        id: 12345,
        profile: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          avatar: 'https://api.example.com/avatars/12345.jpg',
          preferences: {
            theme: 'dark',
            notifications: {
              email: true,
              push: false,
              sms: true
            },
            privacy: {
              showEmail: false,
              showPhone: true,
              allowAnalytics: true
            }
          }
        },
        roles: ['user', 'premium'],
        permissions: {
          read: ['posts', 'comments', 'profiles'],
          write: ['posts', 'comments'],
          admin: []
        },
        metadata: {
          createdAt: '2023-01-15T10:30:00Z',
          lastLogin: '2024-01-20T14:22:33Z',
          loginCount: 247,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      posts: [
        {
          id: 'post_001',
          title: 'Getting Started with React Flow',
          content: 'This is a comprehensive guide...',
          tags: ['react', 'javascript', 'tutorial'],
          stats: { views: 1250, likes: 89, comments: 23 },
          published: true,
          publishedAt: '2024-01-18T09:15:00Z'
        },
        {
          id: 'post_002',
          title: 'Advanced TypeScript Patterns',
          content: 'Exploring complex type systems...',
          tags: ['typescript', 'patterns', 'advanced'],
          stats: { views: 892, likes: 156, comments: 41 },
          published: false,
          publishedAt: null
        }
      ],
      settings: {
        api: {
          version: 'v2.1',
          endpoints: {
            users: '/api/v2/users',
            posts: '/api/v2/posts',
            auth: '/api/v2/auth'
          },
          rateLimit: {
            requests: 1000,
            window: '1h',
            burst: 50
          }
        },
        features: {
          enableComments: true,
          enableLikes: true,
          enableSharing: false,
          betaFeatures: ['ai-suggestions', 'real-time-collab']
        }
      }
    }
  },
  { label: 'integer', value: 42 },
  { label: 'negative integer', value: -42 },
  { label: 'zero', value: 0 },
  { label: 'NaN', value: NaN },
  { label: 'float', value: 3.14159 },
  { label: 'bigint', value: BigInt(9007199254740991) },
  { label: 'date', value: new Date('2023-01-01T12:00:00Z') },
  { label: 'true', value: true },
  { label: 'false', value: false },
];

// ------------------- COMPONENT --------------------
const InputTesterNode: React.FC<NodeProps<Node<InputTesterNodeData & Record<string, unknown>>>> = ({ id, data }) => {
  // State for selected test value index
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = TEST_VALUES[selectedIdx];

  // Check for boolean input connection
  const connections = useNodeConnections({ handleType: 'target' });
  const boolConn = connections.find(c => c.targetHandle === 'b');
  const boolInputNodeId = boolConn?.source;
  const boolInputNodesData = useNodesData(boolInputNodeId ? [boolInputNodeId] : []);
  const boolInput = boolInputNodesData.length > 0 ? boolInputNodesData[0].data?.triggered : undefined;

  // Output: use boolean input if present, else selected test value
  const outputValue = typeof boolInput === 'boolean' ? boolInput : selected.value;

  // Update node data for downstream nodes
  const { updateNodeData } = useReactFlow();
  useEffect(() => {
    let outputValue;
    if (typeof boolInput === 'boolean') {
      if (boolInput) {
        outputValue = selected.value;
      } else {
        // Clear value based on type
        const v = selected.value;
        if (typeof v === 'string') outputValue = '';
        else if (Array.isArray(v)) outputValue = [];
        else if (typeof v === 'object' && v !== null && typeof v !== 'bigint') outputValue = {};
        else if (typeof v === 'number') outputValue = null;
        else if (typeof v === 'boolean') outputValue = false;
        else if (typeof v === 'bigint') outputValue = null;
        else outputValue = null;
      }
    } else {
      outputValue = selected.value;
    }
    const patch: Record<string, unknown> = { value: outputValue };
    if (typeof outputValue === 'boolean') patch.triggered = outputValue;
    if (typeof outputValue === 'string') patch.text = outputValue;
    updateNodeData(id, patch);
  }, [id, selected, boolInput, boolInputNodesData, updateNodeData]);

  // Split test values into two columns
  const midpoint = Math.ceil(TEST_VALUES.length / 2);
  const leftColumn = TEST_VALUES.slice(0, midpoint);
  const rightColumn = TEST_VALUES.slice(midpoint);

  // UI
  return (
    <div className="px-2 py-2 rounded bg-gray-50 dark:bg-gray-900 shadow border border-gray-300 dark:border-gray-800 flex flex-col items-center min-w-[220px] w-[240px]">
      {/* INPUT HANDLE (left, boolean) */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />
      {/* OUTPUT HANDLE (right, any type) */}
      <CustomHandle type="source" position={Position.Right} id="x" dataType="x" />
      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-xs">Input Tester</div>
      
      {/* TWO COLUMN LAYOUT */}
      <div className="flex gap-2 w-full">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-0.5 flex-1">
          {leftColumn.map((item, idx) => (
            <label key={item.label} className="flex items-center gap-1 cursor-pointer text-[10px] px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800">
              <input
                type="radio"
                name={`input-tester-${id}`}
                checked={selectedIdx === idx}
                onChange={() => setSelectedIdx(idx)}
                className="accent-blue-500 h-3 w-3 flex-shrink-0"
              />
              <span className="font-mono truncate">{item.label}</span>
              {selectedIdx === idx && <span className="text-green-600 text-xs flex-shrink-0">✔</span>}
            </label>
          ))}
        </div>
        
        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-0.5 flex-1">
          {rightColumn.map((item, idx) => {
            const actualIdx = idx + midpoint;
            return (
              <label key={item.label} className="flex items-center gap-1 cursor-pointer text-[10px] px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800">
                <input
                  type="radio"
                  name={`input-tester-${id}`}
                  checked={selectedIdx === actualIdx}
                  onChange={() => setSelectedIdx(actualIdx)}
                  className="accent-blue-500 h-3 w-3 flex-shrink-0"
                />
                <span className="font-mono truncate">{item.label}</span>
                {selectedIdx === actualIdx && <span className="text-green-600 text-xs flex-shrink-0">✔</span>}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InputTesterNode; 