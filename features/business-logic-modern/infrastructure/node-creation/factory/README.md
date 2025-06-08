# Node Factory System 🏭

## Overview

The Node Factory System is a sophisticated, layered architecture that provides unified node creation and management for the business logic platform. It integrates JSON-driven registry data with type-safe factory patterns to create consistent, validated nodes.

## 🏗️ Architecture

The factory system uses a **multi-layer delegation pattern** for creating node **data**. It also includes a parallel system for creating node **components** (their visual representation). This ensures separation of concerns, backward compatibility, and extensibility:

**Node Data Creation Flow:**

```
Application Code
       ↓
   factory/index.ts (Export Aliases)
       ↓
nodeFactoryIntegrated.ts (Delegation Layer)
       ↓
jsonRegistryAdapter.ts (Adapter Layer)
       ↓
JsonRegistryAdapter Class (Singleton Implementation)
       ↓
JSON Registry Cache (Data Source)
```

The system is split into two primary responsibilities:

1.  **Node Data Factory** (`utils/nodeFactory.ts`, `utils/nodeFactoryIntegrated.ts`): Responsible for creating the plain JavaScript object (`AgenNode`) that represents a node's data, state, and configuration. It is the foundational, low-level data constructor.
2.  **Node Component Factory** (`NodeFactory.tsx`): Responsible for taking the `AgenNode` data object and rendering it as a visual, interactive React component. It handles all the UI, state management, and performance optimizations for the visual layer, leveraging a sophisticated set of hooks and safety layers.

### Key Architectural Patterns

- **Data/Component Split**: The clear separation between the data model (`AgenNode`) and its visual representation (React Component) allows for independent testing and development.
- **Singleton JSON Adapter**: The `JsonRegistryAdapter` provides a single, efficient source of truth for all node configurations, loaded from the JSON registry.
- **Modular Hooks System**: The `NodeFactory.tsx` component uses a hierarchy of custom hooks (`useNodeProcessing`, `useNodeState`, etc.), each with a single responsibility, to manage the complex logic of a node.
- **Enterprise Safety Layers**: A core abstraction (`SafeStateLayer`, `SafeDataFlowController`) that provides atomic, immutable state updates and manages inter-node data flow rules.
- **State Machine for Visuals**: The `UltraFastPropagationEngine` implements a deterministic finite automaton (state machine) to manage the visual state of nodes (inactive, pending, active), ensuring predictable and instantaneous feedback.

### Key Components

- **`index.ts`** - Main export interface and public API
- **`utils/nodeFactoryIntegrated.ts`** - **High-level factory**. Integration wrapper that combines the JSON registry with the core node creation logic. This is the intended entry point for creating node data.
- **`adapters/jsonRegistryAdapter.ts`** - Singleton adapter for JSON data that bridges the factory with the JSON registry.
- **`NodeFactory.tsx`** - **React Component Factory**. A sophisticated system for creating the visual, interactive React components that render the nodes. It integrates the Safety Layers, Propagation Engine, and modular hooks.
- **`visuals/UltraFastPropagationEngine.tsx`** - A deterministic state machine that manages the visual lifecycle of nodes (inactive, pending, active) for instantaneous and reliable feedback.
- **`hooks/useNodeProcessing.ts`** - The central orchestrator hook that composes multiple smaller, focused hooks to manage a node's entire processing pipeline.
- **`types/`** - TypeScript interfaces and type definitions
- **`constants/`** - Shared constants and configuration
- **`hooks/`** - A collection of reusable React hooks, each handling a specific piece of node functionality (state, connections, styling, etc.).
- **`utils/nodeFactory.ts`** - **Core Data Utility**. The foundational, low-level utility for constructing the basic `AgenNode` data object. It provides pure functions for creating and manipulating node data structures.

## 🚀 Quick Start

### Creating a Node

```typescript
import { NodeFactory } from "@factory";

// Create a text creation node
const textNode = NodeFactory.createNode("createText", { x: 100, y: 100 });

// Create with custom data
const customNode = NodeFactory.createNode(
  "createText",
  { x: 200, y: 200 },
  { text: "Hello World", showUI: true }
);
```

### Validating Node Types

```typescript
import { NodeFactory } from "@factory";

if (NodeFactory.isValidNodeType("createText")) {
  console.log("✅ CreateText is supported");
}

// Get available node types
const nodeTypes = NodeFactory.getValidNodeTypes();
```

### Getting Node Configuration

```typescript
import { NodeFactory } from "@factory";

// Get handles for connection validation
const handles = NodeFactory.getNodeHandles("createText");

// Get complete metadata
const metadata = NodeFactory.getNodeMetadata("createText");

// Get default data structure
const defaults = NodeFactory.getNodeDefaultData("createText");
```

## 📊 Data Flow Example: CreateText Node

Let's trace through creating a `CreateText` node to understand the complete flow:

### 1. JSON Registry Source Data

```json
{
  "createText": {
    "nodeType": "createText",
    "category": "create",
    "displayName": "Create Text",
    "description": "Text creation node with inline editing and trigger-based output control",
    "icon": "text",
    "iconWidth": 240,
    "iconHeight": 120,
    "hasToggle": true,
    "isEnabled": true,
    "handles": [
      {
        "id": "trigger",
        "type": "target",
        "position": "left",
        "dataType": "boolean",
        "description": "Optional trigger input"
      },
      {
        "id": "output",
        "type": "source",
        "position": "right",
        "dataType": "string",
        "description": "Text output"
      }
    ],
    "defaultData": {
      "text": "",
      "heldText": ""
    }
  }
}
```

### 2. Application Code

```typescript
// Sidebar.tsx or any component
import { NodeFactory } from "@factory";

const newNode = NodeFactory.createNode("createText", { x: 100, y: 100 });
```

### 3. Factory Processing Chain

**Layer 1 - Export Alias (`index.ts`):**

```typescript
export { IntegratedNodeFactory as NodeFactory } from "./utils/nodeFactoryIntegrated";
```

**Layer 2 - Integration Wrapper (`nodeFactoryIntegrated.ts`):**

```typescript
export function createNode(type, position, customData) {
  return JsonNodeFactory.createNode(type, position, customData);
}
```

**Layer 3 - JSON Factory Interface (`jsonRegistryAdapter.ts`):**

```typescript
export const JsonNodeFactory = {
  createNode: (nodeType, position, customData) =>
    jsonRegistryAdapter.createNode(nodeType, position, customData),
};
```

**Layer 4 - Singleton Implementation (`JsonRegistryAdapter` class):**

```typescript
public createNode(nodeType, position, customData): AgenNode | null {
  const config = this.registryCache["createText"]; // Lookup JSON data

  return {
    id: "node_1703123456_789",
    type: "createText",
    position: { x: 100, y: 100 },
    deletable: true,
    targetPosition: "top",
    data: {
      text: "",        // From JSON defaultData
      heldText: "",    // From JSON defaultData
      showUI: false,   // Factory defaults
      isActive: false, // Factory defaults
      ...customData    // Any overrides
    }
  };
}
```

### 4. Final Created Node

The output of the data factory is a plain JavaScript object:

```typescript
{
  id: "node_1703123456_789",
  type: "createText",
  position: { x: 100, y: 100 },
  deletable: true,
  targetPosition: "top",
  data: {
    text: "",
    heldText: "",
    showUI: false,
    isActive: false
  }
}
```

This data object is then passed to the **Component Factory** (`NodeFactory.tsx`) to be rendered as a visual node.

## 🧩 Component & Data Integration

The factory system has two distinct parts that work together: the **Data Factory** and the **Component Factory**.

1.  **Data Factory (`nodeFactoryIntegrated.ts` -> `nodeFactory.ts`)**: Creates the `AgenNode` data object.
2.  **Component Factory (`NodeFactory.tsx`)**: Creates the visual React component for that data.

The `createNodeComponent()` function in `NodeFactory.tsx` is used to define the rendering logic and behavior for a specific node type. It links the component to the data configuration in the JSON registry.

```typescript
// CreateText.tsx
const CreateText = createNodeComponent<CreateTextData>({
  nodeType: "createText", // Links to JSON registry
  category: "create",
  displayName: "Create Text",
  defaultData: { text: "", heldText: "" }, // Matches JSON
  handles: nodeHandles, // Loaded from JSON registry
  processLogic: ({ data, connections, updateNodeData, id }) => {
    // Business logic for text processing
  },
  renderCollapsed: ({ data, updateNodeData, id }) => {
    // Compact view with inline editing
  },
  renderExpanded: ({ data, updateNodeData, id }) => {
    // Full view with textarea controls
  },
});
```

## 📁 Directory Structure

```
factory/
├── README.md                    # This documentation
├── index.ts                     # Main exports and public API
├── NodeFactory.tsx              # React component factory system
├── PERFORMANCE_GUIDE.md         # Performance optimization guide
├── adapters/                    # Integration adapters
│   └── jsonRegistryAdapter.ts   # JSON registry singleton adapter
├── components/                  # Reusable factory components
│   ├── NodeContainer.tsx        # Node wrapper component
│   └── NodeContent.tsx          # Node content component
├── constants/                   # Shared constants and config
│   ├── handles.ts              # Handle configurations
│   ├── sizes.ts                # Size standards
│   └── index.ts                # Main constants, including runtime auto-sync with JSON registry
├── helpers/                     # Utility helper functions
├── hooks/                       # Modular React hooks for all node logic
│   ├── useNodeProcessing.ts    # Orchestrates all other processing hooks
│   ├── useNodeState.ts         # Manages local state for a node component
│   ├── useNodeConnections.ts   # Gathers and processes connection data from xyflow
│   ├── useActivationCalculation.ts # Determines if a node should be active
│   └── ...and many more         # Each hook has a single, clear responsibility
├── integrations/                # System integrations
│   └── factoryIntegration.ts   # Factory integration utilities
├── templates/                   # Node templates and patterns
├── testing/                     # Testing utilities and mocks
├── types/                       # TypeScript type definitions
│   ├── connections.ts          # Connection type safety
│   └── index.ts                # Main factory types
├── utils/                       # Core utility functions
│   ├── nodeFactory.ts          # Core data utility for basic node object creation
│   ├── nodeFactoryIntegrated.ts # High-level factory integrating the JSON registry
│   ├── jsonProcessor.ts        # JSON processing utilities
│   ├── propagationEngine.ts    # Data flow propagation
│   ├── cacheManager.ts         # Performance caching
│   ├── handleDiagnostics.ts    # Handle debugging tools
│   └── handleTestUtils.ts      # Handle testing utilities
└── visuals/                     # Visual enhancement systems
    └── UltraFastPropagationEngine.tsx # Deterministic state machine for visual feedback
```

## 🎯 Key Concepts

### Singleton Pattern

The `JsonRegistryAdapter` uses the singleton pattern to ensure a single source of truth for node configurations and optimal memory usage.

### Delegation Pattern

Each layer delegates responsibility to the next, creating clean separation of concerns and enabling easy testing and modification.

### Type Safety

The entire system is built with TypeScript to ensure compile-time validation and prevent runtime errors.

### JSON-Driven Configuration

All node metadata, handles, and defaults come from JSON registry files, enabling data-driven development. The factory automatically syncs with this registry at runtime via the functions in `constants/index.ts`.

### Backward Compatibility

The layered architecture ensures existing code continues to work while enabling new features.

## ✨ Enterprise Features & Performance

The factory system is built with numerous advanced features to ensure performance, stability, and testability.

### Enterprise Safety Layers

- **`SafeStateLayer`**: Manages atomic state updates using Immer for guaranteed immutability.
- **`SafeDataFlowController`**: Manages inter-node communication rules to validate and control data flow.

### Ultra-Fast Propagation Engine (UFPE)

- A deterministic state machine that manages the visual lifecycle of nodes: `INACTIVE` -> `PENDING_ACTIVATION` -> `ACTIVE` -> `PENDING_DEACTIVATION`.
- This ensures visual feedback is instantaneous and decoupled from the main React render loop, providing a highly responsive user experience.

### Advanced Rendering Optimizations

- **GPU Acceleration**: High-frequency nodes (like triggers and cycles) can have their visual updates offloaded to the GPU.
- **Custom Scheduling**: A per-canvas `requestAnimationFrame` scheduler avoids head-of-line blocking and ensures smooth animations across multiple flow canvases.
- **Intersection Observer "Parking"**: Nodes that are off-screen are "parked," meaning their props and effects are frozen to save CPU cycles.
- **Idle-Time Hydration**: Heavy or complex nodes are deferred and mounted only when the browser is idle, preventing them from blocking the First Contentful Paint.

### Memory Management

- **Object Pooling**: Re-uses objects for frequent allocations (like styles and handles) to reduce garbage collection pressure.
- **`WeakRef` & `FinalizationRegistry`**: Used in safety layers and other parts of the system to prevent memory leaks by allowing garbage collection of objects that are no longer referenced.

### Optimized Text Input

- To solve text input lag in nodes like `CreateText`, a suite of `useOptimizedTextInput` hooks were developed.
- These hooks use smart debouncing, local state for immediate feedback, and performance monitoring to ensure a smooth typing experience.
- For more details, see the [Performance Optimization Guide](./PERFORMANCE_GUIDE.md).

## 🔧 Advanced Usage

### Custom Node Creation

```typescript
import { JsonNodeFactory } from "@factory";

// Direct adapter access for advanced use cases
const advancedNode = JsonNodeFactory.createNode(
  "createText",
  { x: 100, y: 100 },
  {
    text: "Custom text",
    showUI: true,
    isActive: true,
    customProperty: "advanced",
  }
);
```

### Node Manipulation

```typescript
import { NodeFactory } from "@factory";

// Copy a node with offset
const copiedNode = NodeFactory.copyNode(originalNode, { x: 50, y: 50 });

// Toggle UI state
const toggledNode = NodeFactory.toggleNodeUI(originalNode);

// Get node size based on state
const size = NodeFactory.getNodeSize("createText", true); // expanded state
```

### Validation and Debugging

```typescript
import { NodeFactory } from "@factory";

// Validate node type
if (!NodeFactory.isValidNodeType("unknownType")) {
  console.error("Invalid node type");
}

// Get configuration for debugging
const config = NodeFactory.getNodeConfig("createText");
console.log("Node config:", config);

// Get handles for connection validation
const handles = NodeFactory.getNodeHandles("createText");
console.log("Available handles:", handles);
```

## 🚀 Performance Features

- **Singleton Caching** - Registry data cached for optimal lookup performance
- **Object Pooling** - Reusable objects for hot-path allocations
- **Memory Management** - WeakRef and FinalizationRegistry for cleanup
- **Lazy Loading** - Components and data loaded on demand
- **GPU Acceleration** - Visual updates optimized with custom schedulers
- **State Machine Visuals** - The UFPE provides instant visual feedback outside the React render cycle.
- **Debounced Inputs** - Optimized text input hooks prevent performance cascades.

## 🧪 Testing

The factory system includes comprehensive testing utilities:

```typescript
import {
  diagnoseHandles,
  testNodeCreation,
} from "@factory/utils/handleTestUtils";

// Browser console debugging
diagnoseHandles(); // Full system diagnosis
testNodeCreation(); // Test node creation pipeline
```

## 📈 Monitoring

Factory operations can be monitored and debugged:

```typescript
// Get registry statistics
const stats = jsonRegistryAdapter.getRegistryStats();
console.log("Registry stats:", stats);

// Performance monitoring
import { getCacheStats } from "@factory/utils/cacheManager";
console.log("Cache performance:", getCacheStats());
```

## 🔗 Related Systems

- **JSON Registry** - Provides node metadata and configuration
- **Node Domain** - Contains React components for node rendering
- **Flow Engine** - Manages node connections and data flow
- **Business Logic** - Orchestrates the entire node system

---

This factory system enables consistent, type-safe, and performant node creation while maintaining flexibility for future enhancements. The layered architecture ensures that changes can be made at any level without breaking existing functionality.
