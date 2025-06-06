
/**
 * GENERATED NODE REGISTRY
 *
 * This file is auto-generated from YAML configurations.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: 2025-06-06T13:26:15.887Z
 * Source files: 5 meta.yml files
 */

export const GENERATED_NODE_REGISTRY = {
  "createText": {
    nodeType: "createText",
    category: "create",
    displayName: "Create Text",
    description: "Create and hold a text string that can be passed to other nodes",
    icon: "Type",
    folder: "main",
    order: 1,

    // Legacy dimensions
    iconWidth: 80,
    iconHeight: 80,
    expandedWidth: 200,
    expandedHeight: 120,

    // Modern size
    size: {
    "collapsed": {
        "width": "w-[80px]",
        "height": "h-[80px]"
    },
    "expanded": {
        "width": "w-[200px]"
    }
},

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
    {
        "id": "text-output",
        "type": "source",
        "dataType": "text",
        "position": "Right",
        "label": "Text Output"
    }
],
    

    // Inspector
    inspector: {
    "type": "factory",
    "priority": 1,
    "isCollapsible": false
},

    // Default data
    defaultData: {
    "text": "",
    "heldText": "",
    "isActive": false
},

    // Component imports
    component: () => import("../domain/create/createText/CreateTextNode"),
    inspectorComponent: () => import("../domain/create/createText/CreateTextInspector"),
  },
  "triggerOnToggle": {
    nodeType: "triggerOnToggle",
    category: "trigger",
    displayName: "Trigger on Toggle",
    description: "Trigger an action when the toggle state changes",
    icon: "Zap",
    folder: "main",
    order: 1,

    // Legacy dimensions
    iconWidth: 80,
    iconHeight: 80,
    expandedWidth: 180,
    expandedHeight: 120,

    // Modern size
    size: {
    "collapsed": {
        "width": "w-[80px]",
        "height": "h-[80px]"
    },
    "expanded": {
        "width": "w-[180px]"
    }
},

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
    {
        "id": "trigger-output",
        "type": "source",
        "dataType": "boolean",
        "position": "Right",
        "label": "Trigger State"
    }
],
    

    // Inspector
    inspector: {
    "type": "factory",
    "priority": 1,
    "isCollapsible": false
},

    // Default data
    defaultData: {
    "isActive": false,
    "triggerCount": 0,
    "lastTriggered": null
},

    // Component imports
    component: () => import("../domain/trigger/triggerOnToggle/TriggerOnToggleNode"),
    inspectorComponent: () => import("../domain/trigger/triggerOnToggle/TriggerOnToggleInspector"),
  },
  "dataTable": {
    nodeType: "dataTable",
    category: "data",
    displayName: "Data Table",
    description: "Display and manipulate tabular data with sorting, filtering, and pagination",
    icon: "Table",
    folder: "main",
    order: 1,

    // Legacy dimensions
    iconWidth: 120,
    iconHeight: 80,
    expandedWidth: 400,
    expandedHeight: 300,

    // Modern size
    size: {
    "collapsed": {
        "width": "w-[120px]",
        "height": "h-[80px]"
    },
    "expanded": {
        "width": "w-[400px]",
        "height": "h-[300px]"
    }
},

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
    {
        "id": "data-input",
        "type": "target",
        "dataType": "array",
        "position": "Left",
        "label": "Table Data"
    },
    {
        "id": "filtered-output",
        "type": "source",
        "dataType": "array",
        "position": "Right",
        "label": "Filtered Data"
    },
    {
        "id": "selected-output",
        "type": "source",
        "dataType": "array",
        "position": "Bottom",
        "label": "Selected Rows"
    }
],
    dynamicHandles: "./dynamicHandles/dataTableHandles",

    // Inspector
    inspector: {
    "type": "custom",
    "renderer": "./DataTableInspector",
    "priority": 2,
    "isCollapsible": true
},

    // Default data
    defaultData: {
    "columns": [
        {
            "id": "name",
            "label": "Name",
            "type": "string",
            "width": 150,
            "sortable": true,
            "filterable": true,
            "visible": true
        },
        {
            "id": "value",
            "label": "Value",
            "type": "number",
            "width": 100,
            "sortable": true,
            "filterable": true,
            "visible": true
        }
    ],
    "rows": [],
    "pagination": {
        "page": 1,
        "pageSize": 10,
        "totalRows": 0
    },
    "filters": {},
    "sorting": {
        "direction": "asc"
    },
    "selection": {
        "mode": "none",
        "selected": []
    }
},

    // Component imports
    component: () => import("../domain/data/dataTable/DataTableNode"),
    inspectorComponent: () => import("../domain/data/dataTable/DataTableInspector"),
  },
  "imageTransform": {
    nodeType: "imageTransform",
    category: "media",
    displayName: "Image Transform",
    description: "Apply transformations, filters, and effects to images with real-time preview",
    icon: "Image",
    folder: "advanced",
    order: 1,

    // Legacy dimensions
    iconWidth: 140,
    iconHeight: 100,
    expandedWidth: 480,
    expandedHeight: 400,

    // Modern size
    size: {
    "collapsed": {
        "width": "w-[140px]",
        "height": "h-[100px]"
    },
    "expanded": {
        "width": "w-[480px]",
        "height": "h-[400px]"
    }
},

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: true,

    // Handles
    handles: [
    {
        "id": "image-input",
        "type": "target",
        "dataType": "image",
        "position": "Left",
        "label": "Source Image",
        "isConnectable": true
    },
    {
        "id": "processed-output",
        "type": "source",
        "dataType": "image",
        "position": "Right",
        "label": "Processed Image",
        "isConnectable": true
    },
    {
        "id": "metadata-output",
        "type": "source",
        "dataType": "object",
        "position": "Bottom",
        "label": "Image Metadata",
        "isConnectable": true
    }
],
    dynamicHandles: "./dynamicHandles/imageTransformHandles",

    // Inspector
    inspector: {
    "type": "custom",
    "renderer": "./ImageTransformInspector",
    "priority": 3,
    "isCollapsible": true
},

    // Default data
    defaultData: {
    "sourceImage": null,
    "processedImage": null,
    "operations": [
        {
            "id": "resize",
            "type": "resize",
            "enabled": true,
            "params": {
                "width": 800,
                "height": 600,
                "maintainAspectRatio": true,
                "resizeMode": "cover"
            }
        },
        {
            "id": "brightness",
            "type": "filter",
            "enabled": false,
            "params": {
                "brightness": 1,
                "contrast": 1,
                "saturation": 1,
                "hue": 0
            }
        },
        {
            "id": "crop",
            "type": "crop",
            "enabled": false,
            "params": {
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 100,
                "unit": "percent"
            }
        }
    ],
    "processing": {
        "quality": 0.85,
        "format": "webp",
        "progressive": true,
        "preserveMetadata": false
    },
    "preview": {
        "enabled": true,
        "realTime": false,
        "showGrid": false,
        "zoom": 1
    },
    "cache": {
        "enabled": true,
        "maxSize": "50MB",
        "ttl": 3600
    }
},

    // Component imports
    component: () => import("../domain/media/imageTransform/ImageTransformNode"),
    inspectorComponent: () => import("../domain/media/imageTransform/ImageTransformInspector"),
  },
  "viewOutput": {
    nodeType: "viewOutput",
    category: "view",
    displayName: "View Output",
    description: "Display text output from connected nodes",
    icon: "Eye",
    folder: "main",
    order: 1,

    // Legacy dimensions
    iconWidth: 80,
    iconHeight: 80,
    expandedWidth: 240,
    expandedHeight: 100,

    // Modern size
    size: {
    "collapsed": {
        "width": "w-[80px]",
        "height": "h-[80px]"
    },
    "expanded": {
        "width": "w-[240px]"
    }
},

    // UI Configuration
    hasToggle: true,
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: [
    {
        "id": "text-input",
        "type": "target",
        "dataType": "text",
        "position": "Left",
        "label": "Text Input"
    }
],
    

    // Inspector
    inspector: {
    "type": "factory",
    "priority": 1,
    "isCollapsible": false
},

    // Default data
    defaultData: {
    "inputText": "",
    "displayText": "",
    "isActive": false
},

    // Component imports
    component: () => import("../domain/view/viewOutput/ViewOutputNode"),
    inspectorComponent: () => import("../domain/view/viewOutput/ViewOutputInspector"),
  }
};

export const NODE_TYPES = Object.keys(GENERATED_NODE_REGISTRY);
export const NODE_COUNT = NODE_TYPES.length;

// Registry statistics
export const REGISTRY_STATS = {
  generatedAt: "2025-06-06T13:26:15.887Z",
  nodeCount: NODE_COUNT,
  categoryCount: 8,
  sourceFiles: 5,
};
