/**
 * Create Text Node - API Reference
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
 * - Icon: LuFileText
 * - Author: Agenitix Team
 * - Feature: base
 * 
 * Theming & Design:
 * - Category: CREATE
 * - Design Tokens: var(--node-create-bg), var(--node-create-border), var(--node-node-text)
 * - Responsive:  Desktop optimized
 * - Accessibility:  Focus Management supported
 */

import React from 'react';
import { z } from 'zod';
import type { NodeProps } from '@xyflow/react';

// Node Data Schema
export const CreateTextDataSchema = z.object({
  /** Required string field (default: "") */
  text: z.string().default(""),
  /** Required boolean field (default: false) */
  isActive: z.boolean().default(false),
  /** Required boolean field (default: false) */
  isExpanded: z.boolean().default(false),
});

// Type inference from schema
export type CreateTextData = z.infer<typeof CreateTextDataSchema>;

// Node Specification
export const createTextSpec = {
  kind: 'createText',
  displayName: 'Create Text',
  category: 'CREATE',
  size: {
    expanded: { width: 120, height: 120 },
    collapsed: { width: 60, height: 60 }
  },
  version: 1,
  runtime: { execute: "createText_execute_v1" },
  
  handles: [
    { id: "json-input", code: "j", position: "top", type: "JSON" },
    { id: "input", code: "j", position: "left", type: "Boolean" },
    { id: "output", code: "j", position: "right", type: "String" },
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
  },
  icon: 'LuFileText',
  author: 'Agenitix Team',
  description: 'The Create Text node provides functionality for create operations in the CREATE category.',
  feature: 'base',
};

// Node Component
export const CreateTextNode = ({ data, id }: NodeProps) => {
  // Your node component implementation
  return React.createElement('div', null, 'Node content goes here');
};

// Export for use in other modules
export default CreateTextNode;
