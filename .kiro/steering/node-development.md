---
inclusion: always
---

# Node Development Standards

## Node Architecture Overview

AgenitiX uses a **NodeSpec System** for type-safe node definitions with automatic scaffolding and validation. The system is **extensible** with domains and categories that can be expanded as needed.

### Current Node Domains (Extensible)

```typescript
// Current Active Domains
type ActiveDomain = 
  | "create"    // Content creation and data generation
  | "view"      // Data visualization and display
  | "trigger"   // Event-driven and condition-based triggers
  | "test"      // Testing, validation, and debugging
  | "cycle"     // Loops, iterations, and repeated operations
  | "store"     // Data storage and memory management
  | "ai"        // AI model integration and processing
  | "email"     // Email communication and management
  | "time"      // Time-based operations and scheduling
  | "flow"      // Flow control and workflow management
  | "custom";   // Custom domain for specialized nodes
```

### Current Node Categories (Extensible)

```typescript
// Current Active Categories from categories.ts
export const CATEGORIES = {
  CREATE: "CREATE",     // Content creation nodes
  VIEW: "VIEW",         // Data visualization nodes  
  TRIGGER: "TRIGGER",   // Event and condition triggers
  TEST: "TEST",         // Testing and validation nodes
  CYCLE: "CYCLE",       // Loop and iteration nodes
  STORE: "STORE",       // Data storage nodes
  AI: "AI",             // AI processing nodes
  TIME: "TIME",         // Time-based operations
  FLOW: "FLOW",         // Flow control nodes
  EMAIL: "EMAIL",       // Email-specific operations
} as const;

export type NodeCategory = (typeof CATEGORIES)[keyof typeof CATEGORIES];
```

## Modern NodeSpec System

### Complete NodeSpec Structure

```typescript
// features/business-logic-modern/infrastructure/node-core/NodeSpec.ts
export interface NodeSpec {
  // Core Identification
  kind: string;                    // e.g., 'createText', 'emailAccount'
  displayName: string;             // Human-readable name
  label?: string;                  // Optional custom instance label
  category: NodeCategory;          // Functional category (CREATE, VIEW, etc.)
  
  // Visual Configuration
  size: {
    expanded: typeof EXPANDED_SIZES[keyof typeof EXPANDED_SIZES];   // VE1, VE2, FE1, etc.
    collapsed: typeof COLLAPSED_SIZES[keyof typeof COLLAPSED_SIZES]; // C1, C1W, C2, C3
  };
  
  // Data Flow
  handles: NodeHandleSpec[];       // Input/output connection points
  initialData: Record<string, any>; // Default data for new instances
  
  // Schema & Controls
  dataSchema?: z.ZodSchema<any>;   // Zod schema for type safety
  controls?: ControlsConfig;       // Auto-generated inspector controls
  
  // Inspector Configuration
  inspector: {
    key: string;                   // Inspector panel identifier
  };
  
  // Runtime & Execution
  runtime?: {
    execute?: string;              // Execution handler identifier
  };
  version?: number;                // Schema version for migrations
  
  // Memory & Caching
  memory?: NodeMemoryConfig;       // Persistent cache configuration
  
  // Metadata
  icon?: string;                   // Lucide icon name (e.g., 'Mail', 'FileText')
  author?: string;                 // Node creator
  description?: string;            // Detailed description
  feature?: string;                // Feature group (e.g., 'email', 'ai', 'base')
  tags?: string[];                 // Searchable tags
  
  // Feature Flags & Theming
  featureFlag?: FeatureFlagConfig; // Feature flag integration
  theming?: ThemingConfig;         // Dark mode overrides
  receivedData?: ReceivedDataConfig; // Data handling configuration
}
```

### Node Handle Definition

```typescript
export interface NodeHandleSpec {
  id: string;                      // Unique handle identifier
  dataType?: string;               // Legacy data type code
  tsSymbol?: string;               // TypeScript symbol for type safety
  code?: string;                   // Fallback code when tsSymbol provided
  position: "top" | "bottom" | "left" | "right";
  type: "source" | "target";
}
```

### Control Configuration System

```typescript
export interface ControlsConfig {
  autoGenerate?: boolean;          // Enable auto-generation from schema
  customFields?: ControlFieldConfig[]; // Custom field overrides
  excludeFields?: string[];        // Fields to exclude from auto-generation
  customComponent?: string;        // Complete custom control override
  fieldGroups?: Array<{           // Group related fields
    title: string;
    fields: string[];
    collapsible?: boolean;
  }>;
}
```

## Node Development Workflow

### 1. Create New Node Using Generator

```bash
# Use the Plop generator for standardized node creation
pnpm new:node

# Interactive prompts will guide you through:
# - Node kind (e.g., 'createText', 'emailReader')
# - Domain selection (create, view, trigger, test, cycle, store, ai, email, time, flow, custom)
# - Category selection (CREATE, VIEW, TRIGGER, TEST, CYCLE, STORE, AI, TIME, FLOW, EMAIL)
# - Size configuration (collapsed and expanded)
# - Icon selection from Lucide icons
# - Additional metadata
```

### 2. Current Node File Structure

```
features/business-logic-modern/node-domain/[domain]/[nodeName].node.tsx
├── [nodeName].node.tsx          # Main node component with dynamic spec
├── types.ts                     # Domain-specific type definitions (shared)
├── utils.ts                     # Domain-specific utilities (shared)
├── providers/                   # Domain-specific providers (if applicable)
└── index.ts                     # Domain exports
```

### 3. Modern Node Component Pattern

```typescript
// features/business-logic-modern/node-domain/email/emailAccount.node.tsx
import React, { memo } from "react";
import { z } from "zod";
import type { NodeProps } from "@xyflow/react";

// Core imports
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import { COLLAPSED_SIZES, EXPANDED_SIZES } from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { SafeSchemas, createSafeInitialData } from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import { useNodeData } from "@/hooks/useNodeData";

// 1️⃣ Data Schema Definition
export const EmailAccountDataSchema = z.object({
  // Configuration
  provider: z.enum(["gmail", "outlook", "imap", "smtp"]).default("gmail"),
  email: z.string().default(""),
  displayName: z.string().default(""),
  
  // Connection State
  isConfigured: z.boolean().default(false),
  isConnected: z.boolean().default(false),
  connectionStatus: z.enum(["disconnected", "connecting", "connected", "error"]).default("disconnected"),
  
  // UI State
  isEnabled: SafeSchemas.boolean(true),
  isActive: SafeSchemas.boolean(false),
  isExpanded: SafeSchemas.boolean(false),
  expandedSize: SafeSchemas.text("VE2"),
  collapsedSize: SafeSchemas.text("C2"),
  
  // Outputs
  accountOutput: z.string().default(""),
  statusOutput: SafeSchemas.boolean(false),
}).passthrough();

export type EmailAccountData = z.infer<typeof EmailAccountDataSchema>;

// 2️⃣ Dynamic Spec Function
function createDynamicSpec(data: EmailAccountData): NodeSpec {
  const expanded = EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES];
  const collapsed = COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES];

  return {
    kind: "emailAccount",
    displayName: "Email Account",
    label: "Email Account",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "trigger-input",
        code: "t",
        position: "top",
        type: "target",
        dataType: "Boolean",
      },
      {
        id: "account-output",
        code: "a",
        position: "right",
        type: "source", 
        dataType: "JSON",
      },
      {
        id: "status-output",
        code: "s",
        position: "bottom",
        type: "source",
        dataType: "Boolean",
      },
    ],
    inspector: { key: "EmailAccountInspector" },
    version: 1,
    runtime: { execute: "emailAccount_execute_v1" },
    initialData: createSafeInitialData(EmailAccountDataSchema, {
      provider: "gmail",
      email: "",
      displayName: "",
      isConfigured: false,
      isConnected: false,
      connectionStatus: "disconnected",
      accountOutput: "",
      statusOutput: false,
    }),
    dataSchema: EmailAccountDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: ["isActive", "accountOutput", "statusOutput", "connectionStatus"],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "provider", type: "select", label: "Email Provider" },
        { key: "email", type: "text", label: "Email Address", placeholder: "your.email@example.com" },
        { key: "displayName", type: "text", label: "Display Name", placeholder: "Your Name" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuMail",
    author: "Agenitix Team",
    description: "Configure and authenticate email accounts for workflow integration",
    feature: "email",
    tags: ["email", "authentication", "oauth2", "gmail", "outlook"],
    theming: {},
  };
}

// 3️⃣ Node Component
const EmailAccountNode: React.FC<NodeProps<EmailAccountData>> = memo(({ data }) => {
  const { nodeData, updateNodeData } = useNodeData<EmailAccountData>();
  
  return (
    <div className="email-account-node">
      {/* Node content here */}
    </div>
  );
});

EmailAccountNode.displayName = "EmailAccountNode";

// 4️⃣ Export with Scaffold
export default withNodeScaffold<EmailAccountData>(EmailAccountNode, createDynamicSpec);
```

## Size Configuration System

### Collapsed Sizes
```typescript
export const COLLAPSED_SIZES = {
  C1: { width: 60, height: 60 },    // Standard
  C1W: { width: 120, height: 60 },  // Wide
  C2: { width: 120, height: 120 },  // Large
  C3: { width: 180, height: 180 },  // Extra Large
} as const;
```

### Expanded Sizes
```typescript
export const EXPANDED_SIZES = {
  // Fixed sizes
  FE0: { width: 60, height: 60 },     // Fixed - Tiny
  FE1: { width: 120, height: 120 },   // Fixed - Default
  FE2: { width: 180, height: 180 },   // Fixed - Large
  FE3: { width: 240, height: 240 },   // Fixed - Extra Large
  
  // Variable heights (auto-sizing)
  VE0: { width: 60, height: "auto" },   // Variable - Tiny
  VE1: { width: 120, height: "auto" },  // Variable - Default
  VE2: { width: 180, height: "auto" },  // Variable - Large
  VE3: { width: 240, height: "auto" },  // Variable - Extra Large
} as const;
```

## Schema-Driven Development

### Safe Schema Helpers
```typescript
import { SafeSchemas, createSafeInitialData } from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";

// Use SafeSchemas for consistent defaults
const schema = z.object({
  isEnabled: SafeSchemas.boolean(true),
  isActive: SafeSchemas.boolean(false),
  isExpanded: SafeSchemas.boolean(false),
  expandedSize: SafeSchemas.text("VE2"),
  collapsedSize: SafeSchemas.text("C2"),
});

// Create safe initial data
const initialData = createSafeInitialData(schema, {
  customField: "custom value",
});
```

## Feature Flag Integration

```typescript
// In NodeSpec
featureFlag: {
  flag: "email_nodes_enabled",
  fallback: false,
  disabledMessage: "Email nodes are currently disabled",
  hideWhenDisabled: true,
  alternativeNode: "createText",
}

// In component
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/useNodeFeatureFlag";

const { isEnabled, message } = useNodeFeatureFlag(nodeSpec.featureFlag);
```

## Node Registration

Nodes are automatically discovered and registered through the file system. Each domain's `index.ts` exports available nodes:

```typescript
// features/business-logic-modern/node-domain/email/index.ts
export { default as emailAccount } from "./emailAccount.node";
export { default as emailReader } from "./emailReader.node"; 
export * from "./types";
export * from "./utils";
```

## Domain Organization

### Current Active Domains

```
features/business-logic-modern/node-domain/
├── create/          # Content creation nodes
├── view/            # Data visualization nodes
├── trigger/         # Event and condition triggers
├── test/            # Testing and debugging nodes
├── cycle/           # Loops and iterations
├── store/           # Data storage and memory
├── ai/              # AI model integration
├── email/           # Email communication
├── time/            # Time-based operations
├── flow/            # Flow control
└── index.ts         # Domain exports
```

### Adding New Domains

1. Create new domain directory
2. Add domain to generator choices in `plopfile.js`
3. Add category to `CATEGORIES` if needed
4. Update type definitions in `nodeData.ts`
5. Create domain-specific types and utilities

## File References

- **Node Core**: #[[file:features/business-logic-modern/infrastructure/node-core/]]
- **Categories Definition**: #[[file:features/business-logic-modern/infrastructure/theming/categories.ts]]
- **Size Definitions**: #[[file:features/business-logic-modern/infrastructure/theming/sizing.ts]]
- **Node Generator**: #[[file:plopfile.js]]
- **Schema Helpers**: #[[file:features/business-logic-modern/infrastructure/node-core/schema-helpers.ts]]
- **Example Nodes**: #[[file:features/business-logic-modern/node-domain/]]