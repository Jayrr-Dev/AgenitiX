import type { NodeCategory } from "@/features/business-logic-modern/infrastructure/theming/categories";
import type {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import type { z } from "zod";

/**
 * Control field configuration for custom control overrides
 */
export interface ControlFieldConfig {
  key: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "boolean"
    | "select"
    | "url"
    | "email"
    | "color"
    | "date"
    | "json";
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: Array<{ value: unknown; label: string }>;
  };
  ui?: {
    rows?: number; // For textarea
    step?: number; // For number inputs
    multiline?: boolean;
    showPreview?: boolean;
  };
}

/**
 * Control configuration for automatic control generation
 */
export interface ControlsConfig {
  /** Enable automatic control generation from schema */
  autoGenerate?: boolean;
  /** Custom field overrides for specific schema properties */
  customFields?: ControlFieldConfig[];
  /** Fields to exclude from auto-generation */
  excludeFields?: string[];
  /** Custom control component for complete override */
  customComponent?: string;
  /** Group related fields together */
  fieldGroups?: Array<{
    title: string;
    fields: string[];
    collapsible?: boolean;
  }>;
}

/**
 * Defines the static contract for a node handle (an input or output port).
 */
export interface NodeHandleSpec {
  /** Unique handle id */
  id: string;
  /** Legacy single-letter data type code (mutually exclusive with tsSymbol) */
  dataType?: string;
  /** New dual-contract system: optional TypeScript symbol referencing real type */
  tsSymbol?: string;
  /** Optional fallback code when tsSymbol provided */
  code?: string;
  position: "top" | "bottom" | "left" | "right";
  type: "source" | "target";
}

/**
 * Defines the static, serializable contract for every node in the system.
 * This object is the single source of truth for a node's metadata and configuration.
 */
export interface NodeSpec {
  /**
   * The unique, machine-readable type for the node. (e.g., 'createText', 'viewCsv')
   */
  kind: string;

  /**
   * The human-readable label shown in the node's header and the sidebar.
   */
  displayName: string;

  /**
   * The functional category the node belongs to. Drives color, folder, and theming.
   */
  category: NodeCategory;

  /**
   * The sizing contract for the node's visual representation.
   */
  size: {
    expanded: (typeof EXPANDED_SIZES)[keyof typeof EXPANDED_SIZES];
    collapsed: (typeof COLLAPSED_SIZES)[keyof typeof COLLAPSED_SIZES];
  };

  /**
   * An array defining all input and output handles for the node.
   */
  handles: NodeHandleSpec[];

  /**
   * The key for the inspector panel associated with this node.
   */
  inspector: {
    key: string;
  };

  /**
   * The default data properties for a new instance of this node.
   */
  initialData: Record<string, any>;

  /**
   * NEW: Reference to the Zod schema for automatic control generation
   * This enables the system to introspect the schema and generate appropriate controls
   */
  dataSchema?: z.ZodSchema<any>;

  /**
   * NEW: Control configuration for the Node Inspector
   * Enables automatic control generation with customization options
   */
  controls?: ControlsConfig;

  /**
   * Schema version of the node spec. Increment only on breaking changes to
   * data shape or behaviour so migration scripts know when to run.
   */
  version?: number;

  /**
   * OPTIONAL: key that identifies the runtime executor for this node when
   * it runs on the worker queue. Keeping it serialisable (string) avoids
   * bundling functions inside JSON.
   */
  runtime?: {
    /** Identifier used by the execution engine to look up a handler. */
    execute?: string;
  };
}
