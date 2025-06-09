/**
 * GENERATED NODE REGISTRY
 *
 * This file is auto-generated from JSON configurations.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: 2025-06-07T02:52:04.456Z
 * Source files: 6 meta.json files
 */

export const GENERATED_NODE_REGISTRY = {
  createText: {
    nodeType: "createText",
    category: "create",
    displayName: "Create Text",
    description:
      "Text creation node with inline editing and trigger-based output control",
    icon: "text",
    folder: "main",
    order: 1,

    // Legacy dimensions (derived from modern size)
    iconWidth: 240,
    iconHeight: 120,
    expandedWidth: 240,
    expandedHeight: 120,

    // Modern size
    size: {
      width: 240,
      height: 120,
    },

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
      {
        id: "trigger",
        type: "target",
        position: "left",
        dataType: "boolean",
        description:
          "Optional trigger input - if connected, text only outputs when trigger is active",
      },
      {
        id: "output",
        type: "source",
        position: "right",
        dataType: "string",
        description: "Text output",
      },
    ],

    // Default data (generated from schema)
    defaultData: {
      text: "",
      heldText: "",
    },

    // Component imports (removed - using factory system)
    // component: () => import("../domain/create/createText/CreateTextComponent"),
  },
  createTextV2: {
    nodeType: "createTextV2",
    category: "create",
    displayName: "Create Text V2",
    description:
      "V2 text creation node demonstrating the modern registry system with enhanced features",
    icon: "text",
    folder: "testing",
    order: 2,

    // Legacy dimensions (derived from modern size)
    iconWidth: 240,
    iconHeight: 120,
    expandedWidth: 240,
    expandedHeight: 120,

    // Modern size
    size: {
      width: 240,
      height: 120,
    },

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: true,

    // Handles (same as createText for compatibility)
    handles: [
      {
        id: "trigger",
        type: "target",
        position: "left",
        dataType: "boolean",
        description:
          "Optional trigger input - if connected, text only outputs when trigger is active (V2 Enhanced)",
      },
      {
        id: "output",
        type: "source",
        position: "right",
        dataType: "string",
        description: "Text output (V2 Enhanced)",
      },
    ],

    // Default data (enhanced with V2 metadata)
    defaultData: {
      text: "",
      heldText: "",
      _v2RegistryVersion: "2.0.0",
      _v2CreatedAt: Date.now(),
    },

    // V2 Component - uses modern factory system
    // component: () => import("../../../node-domain/create/CreateTextV2"),
  },
  createTextV2U: {
    nodeType: "createTextV2U",
    category: "create",
    displayName: "Create Text (V2U)",
    description:
      "V2U enhanced text creation node with modern defineNode() architecture and enterprise features",
    icon: "text",
    folder: "main",
    order: 3,

    // Legacy dimensions (derived from modern size)
    iconWidth: 200,
    iconHeight: 80,
    expandedWidth: 300,
    expandedHeight: 160,

    // Modern size
    size: {
      width: 200,
      height: 80,
    },

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
      {
        id: "trigger",
        type: "target",
        position: "left",
        dataType: "boolean",
        description:
          "Optional trigger input - when connected, text outputs only when trigger is active",
      },
      {
        id: "text",
        type: "source",
        position: "right",
        dataType: "string",
        description: "Text output - outputs held text when conditions are met",
      },
    ],

    // Default data (V2U enhanced)
    defaultData: {
      text: "",
      heldText: "",
      _v2uMigrated: true,
      _v2uMigrationDate: Date.now(),
    },
  },
  viewOutputV2U: {
    nodeType: "viewOutputV2U",
    category: "view",
    displayName: "View Output (V2U)",
    description:
      "V2U enhanced data viewing component with type indicators and professional visualization",
    icon: "eye",
    folder: "main",
    order: 3,

    // Legacy dimensions (derived from modern size)
    iconWidth: 180,
    iconHeight: 100,
    expandedWidth: 320,
    expandedHeight: 240,

    // Modern size
    size: {
      width: 180,
      height: 100,
    },

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
      {
        id: "input",
        type: "target",
        position: "left",
        dataType: "any",
        description:
          "Data input from any node - automatically extracts and displays values",
      },
    ],

    // Default data (V2U enhanced)
    defaultData: {
      displayedValues: [],
      _v2uMigrated: true,
      _v2uMigrationDate: Date.now(),
    },
  },
  triggerOnToggleV2U: {
    nodeType: "triggerOnToggleV2U",
    category: "utility",
    displayName: "Trigger On Toggle (V2U)",
    description:
      "V2U enhanced boolean state toggle with external triggering and accessibility features",
    icon: "toggle",
    folder: "main",
    order: 3,

    // Legacy dimensions (derived from modern size)
    iconWidth: 80,
    iconHeight: 80,
    expandedWidth: 200,
    expandedHeight: 120,

    // Modern size
    size: {
      width: 80,
      height: 80,
    },

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
      {
        id: "trigger",
        type: "target",
        position: "left",
        dataType: "boolean",
        description:
          "External trigger input - toggles state when receiving true values",
      },
      {
        id: "output",
        type: "source",
        position: "right",
        dataType: "boolean",
        description: "Boolean output - current toggle state",
      },
    ],

    // Default data (V2U enhanced)
    defaultData: {
      triggered: false,
      value: false,
      outputValue: false,
      type: "TriggerOnToggleV2U",
      label: "Toggle Trigger V2U",
      inputCount: 0,
      hasExternalInputs: false,
      _v2uMigrated: true,
      _v2uMigrationDate: Date.now(),
    },
  },
  testErrorV2U: {
    nodeType: "testErrorV2U",
    category: "testing",
    displayName: "Test Error (V2U)",
    description:
      "V2U enhanced error generation and testing with configurable error types and tracking",
    icon: "bug",
    folder: "main",
    order: 3,

    // Legacy dimensions (derived from modern size)
    iconWidth: 120,
    iconHeight: 100,
    expandedWidth: 300,
    expandedHeight: 200,

    // Modern size
    size: {
      width: 120,
      height: 100,
    },

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
      {
        id: "trigger",
        type: "target",
        position: "left",
        dataType: "boolean",
        description:
          "Trigger input - controls error generation based on trigger mode",
      },
      {
        id: "text",
        type: "source",
        position: "right",
        dataType: "string",
        description: "Error message output as text",
      },
      {
        id: "json",
        type: "source",
        position: "right",
        dataType: "object",
        description: "Error data output as JSON object",
      },
    ],

    // Default data (V2U enhanced)
    defaultData: {
      errorMessage: "Custom error message",
      errorType: "error",
      triggerMode: "trigger_on",
      isGeneratingError: false,
      text: "",
      json: "",
      _v2uMigrated: true,
      _v2uMigrationDate: Date.now(),
      _errorCount: 0,
    },
  },
  dataTable: {
    nodeType: "dataTable",
    category: "data",
    displayName: "Data Table",
    description:
      "Display and manipulate tabular data with sorting, filtering, and pagination",
    icon: "box",
    folder: "main",
    order: 0,

    // Legacy dimensions (derived from modern size)
    iconWidth: 200,
    iconHeight: 100,
    expandedWidth: 200,
    expandedHeight: 100,

    // Modern size

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
      {
        id: "data-input",
        type: "target",
        dataType: "array",
        position: "Left",
        label: "Table Data",
      },
      {
        id: "filtered-output",
        type: "source",
        dataType: "array",
        position: "Right",
        label: "Filtered Data",
      },
      {
        id: "selected-output",
        type: "source",
        dataType: "array",
        position: "Bottom",
        label: "Selected Rows",
      },
    ],

    // Default data (generated from schema)
    defaultData: {},

    // Component imports (placeholder - actual component files don't exist yet)
    // component: () => import("../domain/data/dataTable/DataTableNode"),
    // inspectorComponent: () => import("../domain/data/dataTable/DataTableInspector"),
  },
  imageTransform: {
    nodeType: "imageTransform",
    category: "media",
    displayName: "Image Transform",
    description:
      "Apply transformations, filters, and effects to images with real-time preview",
    icon: "box",
    folder: "main",
    order: 0,

    // Legacy dimensions (derived from modern size)
    iconWidth: 200,
    iconHeight: 100,
    expandedWidth: 200,
    expandedHeight: 100,

    // Modern size

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
      {
        id: "image-input",
        type: "target",
        dataType: "image",
        position: "Left",
        label: "Source Image",
        isConnectable: true,
      },
      {
        id: "processed-output",
        type: "source",
        dataType: "image",
        position: "Right",
        label: "Processed Image",
        isConnectable: true,
      },
      {
        id: "metadata-output",
        type: "source",
        dataType: "object",
        position: "Bottom",
        label: "Image Metadata",
        isConnectable: true,
      },
    ],

    // Default data (generated from schema)
    defaultData: {},

    // Component imports (placeholder - actual component files don't exist yet)
    // component: () => import("../domain/media/imageTransform/ImageTransformNode"),
    // inspectorComponent: () => import("../domain/media/imageTransform/ImageTransformInspector"),
  },
  testError: {
    nodeType: "testError",
    category: "test",
    displayName: "Test Error",
    description: "Error testing node for debugging and error state simulation",
    icon: "alert-triangle",
    folder: "testing",
    order: 1,

    // Legacy dimensions (derived from modern size)
    iconWidth: 200,
    iconHeight: 120,
    expandedWidth: 200,
    expandedHeight: 120,

    // Modern size
    size: {
      width: 200,
      height: 120,
    },

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
      {
        id: "trigger",
        type: "target",
        position: "left",
        dataType: "boolean",
        description: "Trigger input to activate error state",
      },
      {
        id: "error-output",
        type: "source",
        position: "right",
        dataType: "object",
        description: "Error state output for other nodes",
      },
    ],

    // Default data (generated from schema)
    defaultData: {
      errorMessage: "Test Error",
      errorType: "error",
      isActive: false,
      triggerCount: 0,
    },

    // Component imports (removed - using factory system)
    // component: () => import("../domain/test/testError/TestErrorComponent"),
  },
  triggerOnToggle: {
    nodeType: "triggerOnToggle",
    category: "trigger",
    displayName: "Trigger On Toggle",
    description:
      "Toggle-based trigger node that outputs boolean values on state change",
    icon: "box",
    folder: "automation",
    order: 1,

    // Legacy dimensions (derived from modern size)
    iconWidth: 200,
    iconHeight: 100,
    expandedWidth: 200,
    expandedHeight: 100,

    // Modern size

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
      {
        id: "trigger",
        type: "target",
        position: "left",
        dataType: "boolean",
        description: "Optional external trigger input",
      },
      {
        id: "output",
        type: "source",
        position: "right",
        dataType: "boolean",
        description: "Boolean trigger output",
      },
    ],

    // Default data (generated from schema)
    defaultData: {
      triggered: false,
      outputValue: false,
      toggleCount: 0,
    },

    // Component imports (removed - using factory system)
    // component: () =>
    //   import("../domain/trigger/triggerOnToggle/TriggerOnToggleComponent"),
    // inspectorComponent: () => import("../domain/trigger/triggerOnToggle/TriggerOnToggleInspector"),
  },
  viewOutput: {
    nodeType: "viewOutput",
    category: "view",
    displayName: "View Output",
    description:
      "Enhanced data viewing component displaying values from connected nodes",
    icon: "eye",
    folder: "visualization",
    order: 1,

    // Legacy dimensions (derived from modern size)
    iconWidth: 280,
    iconHeight: 200,
    expandedWidth: 280,
    expandedHeight: 200,

    // Modern size
    size: {
      width: 280,
      height: 200,
    },

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
      {
        id: "input",
        type: "target",
        position: "left",
        dataType: "any",
        description: "Input value to display",
      },
    ],

    // Default data (generated from schema)
    defaultData: {
      displayedValues: [],
    },

    // Component imports (removed - using factory system)
    // component: () => import("../domain/view/viewOutput/ViewOutputComponent"),
  },
};

export const NODE_TYPES = Object.keys(GENERATED_NODE_REGISTRY);
export const NODE_COUNT = NODE_TYPES.length;

// Registry statistics
export const REGISTRY_STATS = {
  generatedAt: "2025-06-07T02:52:04.456Z",
  nodeCount: NODE_COUNT,
  categoryCount: 8,
  sourceFiles: 6,
};
