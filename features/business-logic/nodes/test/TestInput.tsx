// INPUT TESTER NODE COMPONENT
// Lets user select a test value to output (undefined, null, string, array, object, etc.)
import {
  Position,
  useNodeConnections,
  useNodesData,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import React, { useEffect, useState } from "react";
import CustomHandle from "../../handles/TypesafeHandle";
import { useFlowStore } from "../../stores/flowStore";
import { FloatingNodeId } from "../components/FloatingNodeId";

// ---------------------- TYPES ----------------------
interface InputTesterNodeData {
  value?: unknown;
}

// ------------------- TEST VALUES -------------------
const TEST_VALUES = [
  { label: "undefined", value: undefined },
  { label: "null", value: null },
  { label: "empty string", value: "" },
  { label: "string", value: "hello world" },
  { label: "array", value: [1, 2, 3] },
  { label: "object", value: { foo: "bar" } },
  {
    label: "object array",
    value: [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ],
  },
  { label: "json", value: { a: 1, b: [2, 3], c: { d: "e" } } },
  {
    label: "complex json",
    value: {
      user: {
        id: 12345,
        profile: {
          name: "John Doe",
          email: "john.doe@example.com",
          avatar: "https://api.example.com/avatars/12345.jpg",
          preferences: {
            theme: "dark",
            notifications: {
              email: true,
              push: false,
              sms: true,
            },
            privacy: {
              showEmail: false,
              showPhone: true,
              allowAnalytics: true,
            },
          },
        },
        roles: ["user", "premium"],
        permissions: {
          read: ["posts", "comments", "profiles"],
          write: ["posts", "comments"],
          admin: [],
        },
        metadata: {
          createdAt: "2023-01-15T10:30:00Z",
          lastLogin: "2024-01-20T14:22:33Z",
          loginCount: 247,
          ipAddress: "192.168.1.100",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
      posts: [
        {
          id: "post_001",
          title: "Getting Started with React Flow",
          content: "This is a comprehensive guide...",
          tags: ["react", "javascript", "tutorial"],
          stats: { views: 1250, likes: 89, comments: 23 },
          published: true,
          publishedAt: "2024-01-18T09:15:00Z",
        },
        {
          id: "post_002",
          title: "Advanced TypeScript Patterns",
          content: "Exploring complex type systems...",
          tags: ["typescript", "patterns", "advanced"],
          stats: { views: 892, likes: 156, comments: 41 },
          published: false,
          publishedAt: null,
        },
      ],
      settings: {
        api: {
          version: "v2.1",
          endpoints: {
            users: "/api/v2/users",
            posts: "/api/v2/posts",
            auth: "/api/v2/auth",
          },
          rateLimit: {
            requests: 1000,
            window: "1h",
            burst: 50,
          },
        },
        features: {
          enableComments: true,
          enableLikes: true,
          enableSharing: false,
          betaFeatures: ["ai-suggestions", "real-time-collab"],
        },
      },
    },
  },
  { label: "integer", value: 42 },
  { label: "negative integer", value: -42 },
  { label: "zero", value: 0 },
  { label: "NaN", value: NaN },
  { label: "float", value: 3.14159 },
  { label: "bigint", value: BigInt(9007199254740991) },
  { label: "date", value: new Date("2023-01-01T12:00:00Z") },
  { label: "true", value: true },
  { label: "false", value: false },
];

// ------------------- COMPONENT --------------------
const InputTesterNode: React.FC<
  NodeProps<Node<InputTesterNodeData & Record<string, unknown>>>
> = ({ id, data }) => {
  const [showUI, setShowUI] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = TEST_VALUES[selectedIdx];

  // Check for boolean input connection
  const connections = useNodeConnections({ handleType: "target" });
  const boolConn = connections.find((c) => c.targetHandle === "b");
  const boolInputNodeId = boolConn?.source;
  const boolInputNodesData = useNodesData(
    boolInputNodeId ? [boolInputNodeId] : []
  );
  const boolInput =
    boolInputNodesData.length > 0
      ? boolInputNodesData[0].data?.triggered
      : undefined;

  // Update node data for downstream nodes
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  useEffect(() => {
    let outputValue;
    if (typeof boolInput === "boolean") {
      if (boolInput) {
        outputValue = selected.value;
      } else {
        // Clear value based on type
        const v = selected.value;
        if (typeof v === "string") outputValue = "";
        else if (Array.isArray(v)) outputValue = [];
        else if (typeof v === "object" && v !== null && typeof v !== "bigint")
          outputValue = {};
        else if (typeof v === "number") outputValue = null;
        else if (typeof v === "boolean") outputValue = false;
        else if (typeof v === "bigint") outputValue = null;
        else outputValue = null;
      }
    } else {
      outputValue = selected.value;
    }
    const patch: Record<string, unknown> = { value: outputValue };
    if (typeof outputValue === "boolean") patch.triggered = outputValue;
    if (typeof outputValue === "string") patch.text = outputValue;
    updateNodeData(id, patch);
  }, [id, selected, boolInput, boolInputNodesData, updateNodeData]);

  // Split test values into two columns for expanded state
  const midpoint = Math.ceil(TEST_VALUES.length / 2);
  const leftColumn = TEST_VALUES.slice(0, midpoint);
  const rightColumn = TEST_VALUES.slice(midpoint);

  return (
    <div
      className={`relative ${showUI ? "px-2 py-2 min-w-[220px] w-[240px]" : "w-[120px] h-[60px] flex items-center justify-center"} rounded-lg bg-gray-50 dark:bg-gray-900 shadow border border-gray-300 dark:border-gray-800`}
    >
      {/* Floating Node ID */}
      <FloatingNodeId nodeId={id} />

      {/* TOGGLE BUTTON (top-left) */}
      <button
        aria-label={showUI ? "Collapse node" : "Expand node"}
        title={showUI ? "Collapse" : "Expand"}
        onClick={() => setShowUI((v) => !v)}
        className="absolute top-1 left-1 cursor-pointer z-10 w-2 h-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-gray-300 dark:border-gray-800 text-xs hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors shadow"
        type="button"
      >
        {showUI ? "⦿" : "⦾"}
      </button>

      {/* INPUT HANDLE (left, boolean) */}
      <CustomHandle
        type="target"
        position={Position.Left}
        id="b"
        dataType="b"
      />

      {/* COLLAPSED: Show dropdown in ICON form (120x60px) */}
      {!showUI && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Input Tester
          </div>
          <div
            className="nodrag w-full"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <select
              className="w-full px-1 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(parseInt(e.target.value))}
            >
              {TEST_VALUES.map((item, idx) => (
                <option key={idx} value={idx}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          {typeof boolInput === "boolean" && (
            <div className="text-xs absolute bottom-0 right-1 text-green-600 dark:text-green-400 mt-1 animate-pulse">
              ●
            </div>
          )}
        </div>
      )}

      {/* EXPANDED: Full radio button UI */}
      {showUI && (
        <div className="flex flex-col items-center w-full">
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-xs flex items-center justify-between w-full">
            <span>Input Tester</span>
            {typeof boolInput === "boolean" && (
              <span className="text-xs text-green-600 dark:text-green-400">
                ● Active
              </span>
            )}
          </div>

          {/* TWO COLUMN LAYOUT */}
          <div className="flex gap-2 w-full">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-0.5 flex-1">
              {leftColumn.map((item, idx) => (
                <label
                  key={item.label}
                  className="flex items-center gap-1 cursor-pointer text-[10px] px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                  <input
                    type="radio"
                    name={`input-tester-${id}`}
                    checked={selectedIdx === idx}
                    onChange={() => setSelectedIdx(idx)}
                    className="accent-blue-500 h-3 w-3 flex-shrink-0"
                  />
                  <span className="font-mono truncate">{item.label}</span>
                  {selectedIdx === idx && (
                    <span className="text-green-600 text-xs flex-shrink-0">
                      ✔
                    </span>
                  )}
                </label>
              ))}
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-0.5 flex-1">
              {rightColumn.map((item, idx) => {
                const actualIdx = idx + midpoint;
                return (
                  <label
                    key={item.label}
                    className="flex items-center gap-1 cursor-pointer text-[10px] px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
                  >
                    <input
                      type="radio"
                      name={`input-tester-${id}`}
                      checked={selectedIdx === actualIdx}
                      onChange={() => setSelectedIdx(actualIdx)}
                      className="accent-blue-500 h-3 w-3 flex-shrink-0"
                    />
                    <span className="font-mono truncate">{item.label}</span>
                    {selectedIdx === actualIdx && (
                      <span className="text-green-600 text-xs flex-shrink-0">
                        ✔
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* OUTPUT HANDLE (right, any type) */}
      <CustomHandle
        type="source"
        position={Position.Right}
        id="x"
        dataType="x"
      />
    </div>
  );
};

export default InputTesterNode;
