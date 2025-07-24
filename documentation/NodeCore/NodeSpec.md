# NodeSpec Documentation

## Overview

The `NodeSpec` system is the **core contract and blueprint** for all nodes in the flow engine. This documentation is **auto-generated** from the actual source code in `NodeSpec.ts`.

## 📊 Auto-Generated Analysis

- **Interfaces Found**: 4
- **Types Defined**: 0
- **Constants**: 0
- **Last Updated**: 7/23/2025, 7:43:19 PM

## 🔍 Interface Analysis


### ControlFieldConfig

Control field configuration for custom control overrides


**Properties:**

- **key** (`string`) - Required
- **type** (`| "text"
		| "textarea"
		| "number"
		| "boolean"
		| "select"
		| "url"
		| "email"
		| "color"
		| "date"
		| "json"`) - Required
- **label** (`string`) - Optional
- **placeholder** (`string`) - Optional
- **description** (`string`) - Optional
- **required** (`boolean`) - Optional
- **validation** (`{
		min?: number;
		max?: number;
		pattern?: string;
		options?: Array<{ value: unknown; label: string }>;
	}`) - Optional
- **ui** (`{
		rows?: number; // For textarea
		step?: number; // For number inputs
		multiline?: boolean;
		showPreview?: boolean;
	}`) - Optional


### ControlsConfig

Control configuration for automatic control generation


**Properties:**

- **autoGenerate** (`boolean`) - Optional - Enable automatic control generation from schema
- **customFields** (`ControlFieldConfig[]`) - Optional - Custom field overrides for specific schema properties
- **excludeFields** (`string[]`) - Optional - Fields to exclude from auto-generation
- **customComponent** (`string`) - Optional - Custom control component for complete override
- **fieldGroups** (`Array<{
		title: string;
		fields: string[];
		collapsible?: boolean;
	}>`) - Optional - Group related fields together


### NodeHandleSpec

Defines the static contract for a node handle (an input or output port).


**Properties:**

- **id** (`string`) - Required - Unique handle id
- **dataType** (`string`) - Optional - Legacy single-letter data type code (mutually exclusive with tsSymbol)
- **tsSymbol** (`string`) - Optional - New dual-contract system: optional TypeScript symbol referencing real type
- **code** (`string`) - Optional - Optional fallback code when tsSymbol provided
- **position** (`"top" | "bottom" | "left" | "right"`) - Required
- **type** (`"source" | "target"`) - Required


### NodeSpec

Defines the static, serializable contract for every node in the system. This object is the single source of truth for a node's metadata and configuration.


**Properties:**

- **kind** (`string`) - Required - The unique, machine-readable type for the node. (e.g., 'createText', 'viewCsv')
- **displayName** (`string`) - Required - The human-readable label shown in the node's header and the sidebar.
- **label** (`string`) - Optional - OPTIONAL: Custom label for the node instance (can be edited by user) If not provided, defaults to displayName
- **category** (`NodeCategory`) - Required - The functional category the node belongs to. Drives color, folder, and theming.
- **size** (`{
		expanded: (typeof EXPANDED_SIZES)[keyof typeof EXPANDED_SIZES];
		collapsed: (typeof COLLAPSED_SIZES)[keyof typeof COLLAPSED_SIZES];
	}`) - Required - The sizing contract for the node's visual representation.
- **handles** (`NodeHandleSpec[]`) - Required - An array defining all input and output handles for the node.
- **inspector** (`{
		key: string;
	}`) - Required - The key for the inspector panel associated with this node.
- **initialData** (`Record<string, any>`) - Required - The default data properties for a new instance of this node.
- **dataSchema** (`z.ZodSchema<any>`) - Optional - NEW: Reference to the Zod schema for automatic control generation This enables the system to introspect the schema and generate appropriate controls
- **controls** (`ControlsConfig`) - Optional - NEW: Control configuration for the Node Inspector Enables automatic control generation with customization options
- **version** (`number`) - Optional - Schema version of the node spec. Increment only on breaking changes to data shape or behaviour so migration scripts know when to run.
- **runtime** (`{
		/** Identifier used by the execution engine to look up a handler. */
		execute?: string;
	}`) - Optional - OPTIONAL: key that identifies the runtime executor for this node when it runs on the worker queue. Keeping it serialisable (string) avoids bundling functions inside JSON.
- **memory** (`NodeMemoryConfig`) - Optional - OPTIONAL: Memory configuration for this node's persistent cache
- **icon** (`string`) - Optional - OPTIONAL: Icon identifier for the node (e.g., 'FileText', 'Mail', 'Bot') Used for visual representation in the sidebar and node header
- **author** (`string`) - Optional - OPTIONAL: Creator or author of the node Used for attribution and tracking node ownership
- **description** (`string`) - Optional - OPTIONAL: Detailed description of what the node does Used for tooltips, documentation, and help text
- **feature** (`string`) - Optional - OPTIONAL: The feature or module this node belongs to Examples: 'base', 'email', 'agents', 'ai', 'database', 'api' Used for organization, filtering, and feature-based grouping
- **tags** (`string[]`) - Optional - OPTIONAL: Array of tags for categorizing and filtering the node Examples: ['text', 'formatting', 'content'], ['api', 'external', 'auth'] Used for search, filtering, and organization beyond domain/category
- **theming** (`{
		/** Dark mode background color override */
		bgDark?: string;
		/** Dark mode border color override */
		borderDark?: string;
		/** Dark mode border hover color override */
		borderHoverDark?: string;
		/** Dark mode text color override */
		textDark?: string;
		/** Dark mode secondary text color override */
		textSecondaryDark?: string;
		/** Dark mode background hover color override */
		bgHoverDark?: string;
	}`) - Optional - OPTIONAL: Dark mode theming configuration Override default dark mode colors for this specific node
- **receivedData** (`{
		/** Whether the node can receive data from connected nodes */
		enabled?: boolean;
		/** How to display received data (text, json, raw, etc.) */
		displayMode?: "text" | "json" | "raw" | "formatted";
		/** Whether to show received data in collapsed state */
		showInCollapsed?: boolean;
		/** Custom formatting function for received data */
		formatData?: (data: any) => string;
	}`) - Optional - OPTIONAL: Received data configuration Defines how the node handles and displays received data from connected nodes


## 🏷️ Type Definitions



## 📋 Usage Statistics

- **Total Interfaces**: 4
- **Total Types**: 0
- **Required Properties**: 12
- **Optional Properties**: 27

## 🔗 Integration Points

This documentation is automatically generated from:
- **Source File**: `features/business-logic-modern/infrastructure/node-core/NodeSpec.ts`
- **Last Analysis**: 7/23/2025, 7:43:19 PM
- **TypeScript Version**: 5.7.2

---

*This documentation is auto-generated from the actual source code. Any changes to NodeSpec.ts will be reflected in the next generation.*
