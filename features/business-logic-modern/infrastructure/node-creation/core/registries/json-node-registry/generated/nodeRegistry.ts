
/**
 * GENERATED NODE REGISTRY
 *
 * This file is auto-generated from JSON configurations.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: 2025-06-11T21:58:54.759Z
 * Source files: 2 meta.json files
 */

export const GENERATED_NODE_REGISTRY = {
  "createText": {
    nodeType: "createText",
    category: "create",
    displayName: "Create Text",
    description: "Text creation with inline editing",
    icon: "box",
    folder: "main",
    order: 1,

    // Legacy dimensions (derived from modern size)
    iconWidth: 240,
    iconHeight: 120,
    expandedWidth: 240,
    expandedHeight: 120,

    // Modern size
    size: {
    "width": 240,
    "height": 120
},

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
    {
        "id": "trigger",
        "type": "target",
        "dataType": "boolean",
        "position": "left"
    },
    {
        "id": "output",
        "type": "source",
        "dataType": "string",
        "position": "right"
    }
],

    // Default data (generated from schema)
    defaultData: {
    "text": "",
    "heldText": ""
},

    // Component imports
    component: () => import("../../../../../../node-domain/create/CreateText"),
    
  },
  "viewOutput": {
    nodeType: "viewOutput",
    category: "view",
    displayName: "View Output",
    description: "Display output data in a formatted view",
    icon: "box",
    folder: "main",
    order: 2,

    // Legacy dimensions (derived from modern size)
    iconWidth: 200,
    iconHeight: 100,
    expandedWidth: 200,
    expandedHeight: 100,

    // Modern size
    size: {
    "width": 200,
    "height": 100
},

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
    {
        "id": "input",
        "type": "target",
        "dataType": "string",
        "position": "left"
    }
],

    // Default data (generated from schema)
    defaultData: {
    "outputValue": ""
},

    // Component imports
    component: () => import("../../../../../../node-domain/view/ViewOutput"),
    
  }
};

export const NODE_TYPES = Object.keys(GENERATED_NODE_REGISTRY);
export const NODE_COUNT = NODE_TYPES.length;

// Registry statistics
export const REGISTRY_STATS = {
  generatedAt: "2025-06-11T21:58:54.759Z",
  nodeCount: NODE_COUNT,
  categoryCount: 8,
  sourceFiles: 2,
};
