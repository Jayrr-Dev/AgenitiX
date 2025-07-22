/**
 * createText Node - API Reference
 * 
 * Infrastructure Integration Status:
 * - Sidebar: Integrated
 * - Inspector: Integrated
 * - Memory: Not configured
 * 
 * Node Specification:
 * - Size: 120×120px (Default expanded) / 60×60px (Standard collapsed)
 * - Version: 1
 * - Runtime: createText_execute_v1
 * 
 * Theming & Design:
 * - Category: CREATE
 * - Design Tokens: var(--node-create-bg), var(--node-create-border), var(--node-node-text)
 * - Responsive:  Desktop optimized
 * - Accessibility:  Focus Management supported
 */

import { z } from 'zod';
import type { NodeProps } from '@xyflow/react';

// Node Data Interface
export interface createTextData {
  /** Required string field (default: "") */
  text: string;
  /** Required boolean field (default: false) */
  isActive: boolean;
  /** Required boolean field (default: false) */
  isExpanded: boolean;
}

// Node Specification
export const createTextSpec = {
  kind: 'createText',
  displayName: 'createText',
  category: 'CREATE',
  size: {
    expanded: { width: 120, height: 120 },
    collapsed: { width: 60, height: 60 }
  },
  version: 1,
  runtime: { execute: "createText_execute_v1" },
  
  handles: [
    { id: "json-input", code: "j", position: "top", type: "JSON" },
    { id: "activate", code: "b", position: "left", type: "boolean" },
    { id: "output", code: "s", position: "right", type: "string" },
  ],
  inspector: {
    key: 'createTextInspector'
  },
  initialData: {
    text: "",
    isActive: false,
    isExpanded: false,
  },
  controls: {
    autoGenerate: true,
    excludeFields: ["isActive"],
    customFields: []
  }
};

// Data Schema
export const createTextDataSchema = z.object({
  text: z.string().default(""),
  isActive: z.boolean().default(false),
  isExpanded: z.boolean().default(false),
});

// Type inference from schema
export type createTextData = z.infer<typeof createTextDataSchema>;

// Node Component
export const createTextNode = ({ data, id }: NodeProps<createTextData>) => {
  // Your node component implementation
  return (
    <div>
      {/* Node content goes here */}
    </div>
  );
};

// Export for use in other modules
export default createTextNode;
