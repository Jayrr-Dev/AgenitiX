import type { NodeCategory } from '@/features/business-logic-modern/infrastructure/theming/categories';
import type { COLLAPSED_SIZES, EXPANDED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';

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
  position: 'top' | 'bottom' | 'left' | 'right';
  type: 'source' | 'target';
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
} 