/**
 * Type definitions for the Modern Node Registry.
 */

// This is a comprehensive type based on the actual structure of the `meta.json` files.
export interface NodeMetadata {
  nodeType: string;
  category: string;
  displayName: string;
  description: string;
  component: string;
  icon: string;
  ui: {
    size: {
      width: number;
      height: number;
    };
    defaultCollapsed: boolean;
  };
  sidebar: {
    folder: string;
    order: number;
  };
  handles: {
    id: string;
    type: string;
    dataType: string;
    position: string;
  }[];
  data: {
    [key: string]: {
      type: string;
      default: any;
    };
  };
} 