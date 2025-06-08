/**
 * CREATE TEXT TEMPLATE - Template for text creation nodes
 *
 * • Provides standardized template for creating text-based nodes
 * • Implements common text node patterns and configurations
 * • Supports customizable text input and output handling
 * • Features reusable component structure for text node types
 * • Integrates with factory systems for consistent node creation
 *
 * Keywords: text-template, node-template, text-nodes, standardized, reusable, factory
 */

"use client";

import {
  registerNode,
  type EnterpriseNodeConfig,
} from "../../../depreciated/BulletproofNodeBase";

// ============================================================================
// DATA INTERFACE - SINGLE SOURCE OF TRUTH
// ============================================================================

interface CreateTextData {
  text: string; // User input (replaces heldText)
  output: string; // Computed output
  isEnabled: boolean; // Enable/disable state
  maxLength: number; // Text limit
}

// ============================================================================
// VALIDATION LOGIC - PURE FUNCTION
// ============================================================================

function validateCreateText(data: CreateTextData): string | null {
  if (data.text.length > data.maxLength) {
    return `Text too long (${data.text.length}/${data.maxLength})`;
  }
  return null;
}

// ============================================================================
// COMPUTATION LOGIC - PURE FUNCTION (NO SIDE EFFECTS)
// ============================================================================

function computeCreateText(
  data: CreateTextData,
  inputs: Record<string, any>
): Partial<CreateTextData> {
  // Handle trigger input
  const isTriggered = inputs.trigger === true;

  // Compute output based on state and inputs
  const output =
    data.isEnabled && (isTriggered || !inputs.trigger) ? data.text : "";

  return { output };
}

// ============================================================================
// RENDER COMPONENT - PURE COMPONENT
// ============================================================================

function renderCreateText({
  data,
  isExpanded,
  onUpdate,
  onToggle,
  error,
}: {
  data: CreateTextData;
  isExpanded: boolean;
  onUpdate: (updates: Partial<CreateTextData>) => void;
  onToggle: () => void;
  error?: string;
}) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-2 bg-red-50 border border-red-200 rounded">
        <button onClick={onToggle} className="text-lg mb-1">
          {isExpanded ? "⦿" : "⦾"}
        </button>
        <div className="text-xs text-red-600 text-center">{error}</div>
      </div>
    );
  }

  if (!isExpanded) {
    // COLLAPSED VIEW (60x60)
    return (
      <div className="flex flex-col items-center justify-center w-15 h-15 p-2">
        <button onClick={onToggle} className="text-lg mb-1">
          ⦾
        </button>
        <div className="text-xs font-medium text-center truncate w-full">
          {data.text || "Text"}
        </div>
      </div>
    );
  }

  // EXPANDED VIEW (120x120)
  return (
    <div className="flex flex-col w-30 h-30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Create Text</span>
        <button onClick={onToggle} className="text-lg">
          ⦿
        </button>
      </div>

      <textarea
        value={data.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="Enter text..."
        className="flex-1 p-2 text-xs border rounded resize-none"
        style={{ minHeight: "60px" }}
      />

      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.isEnabled}
            onChange={(e) => onUpdate({ isEnabled: e.target.checked })}
            className="mr-1"
          />
          Enabled
        </label>
        <span className="text-gray-500">
          {data.text.length}/{data.maxLength}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// NODE CONFIGURATION - DECLARATIVE & TYPE-SAFE
// ============================================================================

const createTextConfig: EnterpriseNodeConfig<CreateTextData> = {
  // IDENTITY
  nodeType: "createText",
  displayName: "Create Text",
  category: "input",

  // DATA
  defaultData: {
    text: "",
    output: "",
    isEnabled: true,
    maxLength: 1000,
  },

  // VALIDATION
  validate: validateCreateText,

  // COMPUTATION
  compute: computeCreateText,

  // PORTS (Auto-generated handles)
  inputPorts: [{ id: "trigger", label: "Trigger", dataType: "boolean" }],
  outputPorts: [{ id: "output", label: "Text", dataType: "string" }],

  // RENDERING
  renderNode: renderCreateText,

  // INSPECTOR (Auto-generated from data)
  inspectorConfig: {
    groups: [
      {
        title: "Text Settings",
        fields: [
          { key: "text", type: "text", label: "Text Content" },
          { key: "isEnabled", type: "boolean", label: "Enabled" },
          {
            key: "maxLength",
            type: "number",
            label: "Max Length",
            min: 1,
            max: 10000,
          },
        ],
      },
    ],
  },
};

// ============================================================================
// REGISTRATION - SINGLE LINE
// ============================================================================

export const CreateTextNode = registerNode(createTextConfig);
