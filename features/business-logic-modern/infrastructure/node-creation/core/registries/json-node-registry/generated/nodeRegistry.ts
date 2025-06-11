
/**
 * GENERATED NODE REGISTRY
 *
 * This file is auto-generated from JSON configurations.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: 2025-06-11T22:11:15.650Z
 * Source files: 9 meta.json files
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
  "testError": {
    nodeType: "testError",
    category: "test",
    displayName: "Test Error",
    description: "Testing node for error handling and validation workflows",
    icon: "box",
    folder: "testing",
    order: 1,

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
    },
    {
        "id": "error",
        "type": "source",
        "dataType": "string",
        "position": "right"
    }
],

    // Default data (generated from schema)
    defaultData: {
    "errorMessage": "Test error",
    "shouldThrow": false,
    "errorType": "validation"
},

    // Component imports
    component: () => import("../../../../../../node-domain/test/TestError"),
    
  },
  "triggerOnToggle": {
    nodeType: "triggerOnToggle",
    category: "trigger",
    displayName: "Trigger On Toggle",
    description: "Triggers actions when toggled on/off, useful for starting workflows",
    icon: "box",
    folder: "main",
    order: 1,

    // Legacy dimensions (derived from modern size)
    iconWidth: 180,
    iconHeight: 80,
    expandedWidth: 180,
    expandedHeight: 80,

    // Modern size
    size: {
    "width": 180,
    "height": 80
},

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
    {
        "id": "trigger",
        "type": "source",
        "dataType": "boolean",
        "position": "right"
    }
],

    // Default data (generated from schema)
    defaultData: {
    "isActive": false,
    "triggerState": "inactive"
},

    // Component imports
    component: () => import("../../../../../../node-domain/trigger/TriggerOnToggle"),
    
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
    
  },
  "createTextV2": {
    nodeType: "createTextV2",
    category: "create",
    displayName: "Create Text V2",
    description: "Enhanced text creation with V2 features and improved editing",
    icon: "box",
    folder: "main",
    order: 2,

    // Legacy dimensions (derived from modern size)
    iconWidth: 260,
    iconHeight: 140,
    expandedWidth: 260,
    expandedHeight: 140,

    // Modern size
    size: {
    "width": 260,
    "height": 140
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
    "heldText": "",
    "v2Features": {}
},

    // Component imports
    component: () => import("../../../../../../node-domain/create/CreateTextV2"),
    
  },
  "createTextV2U": {
    nodeType: "createTextV2U",
    category: "create",
    displayName: "Create Text V2U",
    description: "Ultimate V2U text creation with advanced features and unified interface",
    icon: "box",
    folder: "main",
    order: 3,

    // Legacy dimensions (derived from modern size)
    iconWidth: 280,
    iconHeight: 160,
    expandedWidth: 280,
    expandedHeight: 160,

    // Modern size
    size: {
    "width": 280,
    "height": 160
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
    "heldText": "",
    "v2uFeatures": {},
    "unifiedSettings": {}
},

    // Component imports
    component: () => import("../../../../../../node-domain/create/CreateTextV2U"),
    
  },
  "testErrorV2U": {
    nodeType: "testErrorV2U",
    category: "test",
    displayName: "Test Error V2U",
    description: "Ultimate V2U testing node with advanced error simulation and debugging features",
    icon: "box",
    folder: "testing",
    order: 2,

    // Legacy dimensions (derived from modern size)
    iconWidth: 220,
    iconHeight: 120,
    expandedWidth: 220,
    expandedHeight: 120,

    // Modern size
    size: {
    "width": 220,
    "height": 120
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
    },
    {
        "id": "error",
        "type": "source",
        "dataType": "string",
        "position": "right"
    },
    {
        "id": "debug",
        "type": "source",
        "dataType": "object",
        "position": "right"
    }
],

    // Default data (generated from schema)
    defaultData: {
    "errorMessage": "Test error V2U",
    "shouldThrow": false,
    "errorType": "validation",
    "v2uFeatures": {},
    "debugInfo": {}
},

    // Component imports
    component: () => import("../../../../../../node-domain/test/TestErrorV2U"),
    
  },
  "triggerOnToggleV2U": {
    nodeType: "triggerOnToggleV2U",
    category: "trigger",
    displayName: "Trigger On Toggle V2U",
    description: "Ultimate V2U trigger with advanced toggle states and enhanced workflow control",
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
        "id": "trigger",
        "type": "source",
        "dataType": "boolean",
        "position": "right"
    },
    {
        "id": "state",
        "type": "source",
        "dataType": "string",
        "position": "right"
    }
],

    // Default data (generated from schema)
    defaultData: {
    "isActive": false,
    "triggerState": "inactive",
    "v2uFeatures": {},
    "advancedTriggers": []
},

    // Component imports
    component: () => import("../../../../../../node-domain/trigger/TriggerOnToggleV2U"),
    
  },
  "viewOutputV2U": {
    nodeType: "viewOutputV2U",
    category: "view",
    displayName: "View Output V2U",
    description: "Ultimate V2U output viewer with enhanced formatting and display options",
    icon: "box",
    folder: "main",
    order: 3,

    // Legacy dimensions (derived from modern size)
    iconWidth: 220,
    iconHeight: 120,
    expandedWidth: 220,
    expandedHeight: 120,

    // Modern size
    size: {
    "width": 220,
    "height": 120
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
    "outputValue": "",
    "v2uFormatting": {},
    "displayOptions": {}
},

    // Component imports
    component: () => import("../../../../../../node-domain/view/ViewOutputV2U"),
    
  }
};

export const NODE_TYPES = Object.keys(GENERATED_NODE_REGISTRY);
export const NODE_COUNT = NODE_TYPES.length;

// Registry statistics
export const REGISTRY_STATS = {
  generatedAt: "2025-06-11T22:11:15.650Z",
  nodeCount: NODE_COUNT,
  categoryCount: 8,
  sourceFiles: 9,
};
