# Node Creation Guide - Step by Step

Complete guide for creating new nodes in the Agenitix flow editor using the modern architecture.

---

## Overview

The modern node creation system provides:

- ✅ **Factory-Based Architecture** - Use `createNodeComponent` for consistent node creation
- ✅ **Registry Integration** - Automatic registration with enhanced metadata support
- ✅ **Category System** - Organized by categories (create, automation, media, etc.)
- ✅ **Toggle States** - Built-in ICON and EXPANDED state management
- ✅ **Error Handling** - Comprehensive error injection and Vibe Mode support
- ✅ **TypeScript Integration** - Full type safety with modern interfaces

---

## Step-by-Step Node Creation Process

### Step 1: Create Your Node Component

Create your node file in the appropriate domain directory:

```typescript
// features/business-logic-modern/node-domain/[category]/YourNewNode.tsx

/**
 * YOUR NEW NODE - Brief description of functionality
 *
 * • First key feature bullet point
 * • Second key feature bullet point
 * • Third key feature bullet point
 * • Fourth key feature bullet point
 * • Fifth key feature bullet point
 *
 * Keywords: relevant, keywords, for, your, node
 */

"use client";

import { Position } from "@xyflow/react";
import React from "react";

// FACTORY IMPORTS
import {
  createNodeComponent,
  type BaseNodeData,
} from "../../infrastructure/node-creation/factory/NodeFactory";

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

interface YourNewNodeData extends BaseNodeData {
  // YOUR CUSTOM PROPERTIES
  customText: string;
  isEnabled: boolean;
  count: number;

  // VIBE MODE ERROR INJECTION (Optional)
  isErrorState?: boolean;
  errorType?: "warning" | "error" | "critical";
  error?: string;
}

// ============================================================================
// NODE CONFIGURATION
// ============================================================================

const YourNewNode = createNodeComponent<YourNewNodeData>({
  // BASIC CONFIGURATION
  nodeType: "yourNewNode", // Must be unique and camelCase
  category: "create", // Choose: create, automation, media, test, integrations, misc
  displayName: "Your New Node",

  // DEFAULT DATA
  defaultData: {
    customText: "",
    isEnabled: true,
    count: 0,
  },

  // HANDLES CONFIGURATION
  handles: [
    // INPUT HANDLES (Left side)
    { id: "trigger", dataType: "b", position: Position.Left, type: "target" },
    { id: "input", dataType: "s", position: Position.Left, type: "target" },

    // OUTPUT HANDLES (Right side)
    { id: "output", dataType: "s", position: Position.Right, type: "source" },
    { id: "count", dataType: "n", position: Position.Right, type: "source" },
  ],

  // PROCESSING LOGIC
  processLogic: ({ data, connections, nodesData, updateNodeData, id, setError }) => {
    try {
      // YOUR NODE LOGIC HERE
      // Get input values from connected nodes
      const inputValue = getSingleInputValue(nodesData);

      // Process the data
      const processedText = data.isEnabled ?
        `${data.customText}: ${inputValue || ""}` : "";

      // Update the node's output
      updateNodeData(id, {
        text: processedText,
        count: data.count + 1
      });

      // Clear any errors
      setError(null);
    } catch (error) {
      console.error(`YourNewNode ${id} - Processing error:`, error);
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  },

  // COLLAPSED STATE (ICON: 60x60px or 120x60px for text nodes)
  renderCollapsed: ({ data, error, updateNodeData, id }) => {
    const hasError = error || data.isErrorState;

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
        <div className={`text-xs font-semibold ${hasError ? 'text-red-600' : ''}`}>
          {hasError ? "Error" : "Your Node"}
        </div>
        {hasError ? (
          <div className="text-xs text-red-600 text-center">
            {error || data.error || "Error state"}
          </div>
        ) : (
          <div className="text-xs text-gray-600 text-center">
            {data.customText || "Ready"}
          </div>
        )}
      </div>
    );
  },

  // EXPANDED STATE (120x120px)
  renderExpanded: ({ data, error, categoryTextTheme, updateNodeData, id }) => {
    const hasError = error || data.isErrorState;

    return (
      <div className="flex flex-col w-full h-full p-2">
        {/* HEADER */}
        <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
          {hasError ? "Error" : "Your New Node"}
        </div>

        {hasError ? (
          /* ERROR DISPLAY */
          <div className="text-red-600 text-xs">
            {error || data.error || "Error state active"}
          </div>
        ) : (
          /* CONTROLS */
          <div className="flex flex-col gap-2 text-xs">
            <input
              type="text"
              value={data.customText}
              onChange={(e) => updateNodeData(id, { customText: e.target.value })}
              className="border rounded px-1 py-0.5 text-xs"
              placeholder="Enter text..."
            />
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={data.isEnabled}
                onChange={(e) => updateNodeData(id, { isEnabled: e.target.checked })}
              />
              <span>Enabled</span>
            </div>
            <div>Count: {data.count}</div>
          </div>
        )}
      </div>
    );
  },
});

// ============================================================================
// UTILITY FUNCTIONS (if needed)
// ============================================================================

function getSingleInputValue(nodesData: any[]): any {
  if (!nodesData || nodesData.length === 0) return null;
  const firstNode = nodesData[0];
  if (!firstNode?.data) return null;

  // Look for common output properties
  return firstNode.data.text || firstNode.data.value || firstNode.data.output || null;
}

export default YourNewNode;
```

### Step 2: Register Node in Registry

Add your node to the modern node registry:

```typescript
// features/business-logic-modern/infrastructure/node-creation/node-registry/nodeRegistry.ts

// Add your import
import YourNewNode from "@/features/business-logic-modern/node-domain/[category]/YourNewNode";

// Add to MODERN_NODE_REGISTRY
export const MODERN_NODE_REGISTRY: Record<
  NodeType,
  EnhancedNodeRegistration<any>
> = {
  // ... existing nodes ...

  yourNewNode: {
    component: YourNewNode,
    displayName: "Your New Node",
    category: "create", // Match your node's category
    folder: "create", // Folder for organization
    hasOutput: true, // Set to true if node produces output
    hasControls: true, // Set to true if node has controls in inspector
    defaultData: {
      customText: "",
      isEnabled: true,
      count: 0,
    },
    description: "Brief description of what your node does",
    keywords: ["keyword1", "keyword2", "keyword3"],
  },

  // ... rest of registry ...
};
```

### Step 3: Add Node Type to Constants

Add your node type to the TypeScript constants:

```typescript
// features/business-logic-modern/infrastructure/flow-engine/types/nodeData.ts

export type NodeType =
  | "createText"
  // ... existing types ...
  | "yourNewNode"; // Add your node type here
// ... rest of types

// Add data interface
export interface YourNewNodeData extends BaseNodeData {
  customText: string;
  isEnabled: boolean;
  count: number;
  isErrorState?: boolean;
  errorType?: "warning" | "error" | "critical";
  error?: string;
}
```

### Step 4: Add to Sidebar

Your node will automatically appear in the sidebar based on its category registration in the registry. No manual sidebar configuration needed with the modern system.

### Step 5: Configure Inspector (Optional)

If your node needs custom inspector controls, add them:

```typescript
// features/business-logic-modern/infrastructure/node-inspector/NodeInspector.tsx

// In the inspector switch statement, add your case:
case "yourNewNode": {
  const nodeData = selectedNode.data as YourNewNodeData;

  return (
    <div className="space-y-4">
      <NodeControls.TextInput
        label="Custom Text"
        value={nodeData.customText}
        onChange={(value) => updateNodeData(selectedNode.id, { customText: value })}
      />

      <NodeControls.Checkbox
        label="Enabled"
        checked={nodeData.isEnabled}
        onChange={(checked) => updateNodeData(selectedNode.id, { isEnabled: checked })}
      />

      <NodeControls.NumberInput
        label="Count"
        value={nodeData.count}
        onChange={(value) => updateNodeData(selectedNode.id, { count: value })}
        min={0}
      />
    </div>
  );
}
```

---

## Node Categories and Styling

### Available Categories

- **`create`** - Blue theme - Input and creation nodes
- **`automation`** - Green theme - Triggers, timers, cycles
- **`media`** - Purple theme - Text, image, media processing
- **`test`** - Orange theme - Testing and debugging nodes
- **`integrations`** - Teal theme - External service connections
- **`misc`** - Gray theme - Utility and helper nodes

### Node Dimensions

- **ICON State (Collapsed):**

  - Standard nodes: `60px × 60px`
  - Text-based nodes: `120px × 60px`

- **EXPANDED State:**
  - Standard: `120px × 120px`
  - Custom sizes supported with CSS

### Toggle Button

All factory nodes automatically include the toggle button:

- **`⦿`** - ICON state (collapsed)
- **`⦾`** - EXPANDED state

---

## Handle Configuration

### Handle Data Types

- **`s`** - String (blue)
- **`n`** - Number (orange)
- **`b`** - Boolean (green)
- **`j`** - JSON (indigo)
- **`a`** - Array (pink)
- **`f`** - Float (yellow)
- **`x`** - Any (gray)

### Handle Example

```typescript
handles: [
  // Input handles (left side)
  { id: "trigger", dataType: "b", position: Position.Left, type: "target" },
  { id: "text", dataType: "s", position: Position.Left, type: "target" },

  // Output handles (right side)
  { id: "output", dataType: "s", position: Position.Right, type: "source" },
  { id: "count", dataType: "n", position: Position.Right, type: "source" },
];
```

---

## Common Patterns

### Error Handling with Vibe Mode

```typescript
// In your processLogic
try {
  // Your processing logic
  setError(null); // Clear errors on success
} catch (error) {
  console.error(`NodeName ${id} - Error:`, error);
  setError(error instanceof Error ? error.message : "Unknown error");
}

// In your render functions, check for errors
const hasError = error || data.isErrorState;
const errorMessage = error || data.error || "Error state";
```

### Trigger-Based Processing

```typescript
// Get trigger connections
const triggerConnections = connections.filter(
  (c) => c.targetHandle === "trigger"
);
const triggerValue = getSingleInputValue(nodesData);
const isTriggered = isTruthyValue(triggerValue);

// Conditional output based on trigger
const shouldOutput = triggerConnections.length === 0 || isTriggered;
```

### Input Validation

```typescript
// Validate input data
if (typeof data.text !== "string") {
  throw new Error("Invalid text input");
}

if (data.text.length > 100000) {
  throw new Error("Text too long (max 100,000 characters)");
}
```

---

## Testing Your Node

1. **Run the development server**
2. **Check the sidebar** - Your node should appear in the appropriate category
3. **Drag onto canvas** - Test both ICON and EXPANDED states
4. **Connect handles** - Verify input/output behavior
5. **Test error states** - Use Vibe Mode to inject errors
6. **Inspector controls** - Verify all controls work correctly

---

## Troubleshooting

### Node Not Appearing in Sidebar

- Check registry registration
- Verify node type is added to constants
- Ensure category is valid

### Inspector Not Working

- Add `useEffect` to sync inputs with node data
- Check `hasControls: true` in registry
- Verify inspector case statement

### Handle Connections Not Working

- Check handle IDs match your logic
- Verify data types are correct
- Ensure processLogic handles connections properly

### Toggle State Issues

- Factory automatically handles toggle - don't override
- Use `renderCollapsed` and `renderExpanded` appropriately
- Check CSS dimensions match requirements

---

## File Locations Summary

1. **Node Component:** `features/business-logic-modern/node-domain/[category]/YourNewNode.tsx`
2. **Registry:** `features/business-logic-modern/infrastructure/node-creation/node-registry/nodeRegistry.ts`
3. **Types:** `features/business-logic-modern/infrastructure/flow-engine/types/nodeData.ts`
4. **Inspector:** `features/business-logic-modern/infrastructure/node-inspector/NodeInspector.tsx`

---

_This guide reflects the current modern architecture. Legacy patterns are deprecated._
