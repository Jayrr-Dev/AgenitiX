/**
 * Node Manifest
 *
 * This file acts as a central registry for all modern node components.
 * It imports each node's main React component and exports them in a
 * `nodeTypes` object that React Flow can consume.
 */
import type { Node, NodeProps } from "@xyflow/react";
import type { ComponentType } from "react";

import CreateTextV2U from "./create/CreateTextV2U";
import TestErrorV2U from "./test/TestErrorV2U";
import TriggerOnToggleV2U from "./trigger/TriggerOnToggleV2U";
import ViewOutputV2U from "./view/ViewOutputV2U";

// This type assertion is the key to solving the complex TypeScript errors.
// It tells TypeScript to treat our custom node components as valid React Flow nodes.
export const nodeTypes: Record<string, ComponentType<NodeProps>> = {
  createTextV2U: CreateTextV2U as ComponentType<NodeProps<Node>>,
  viewOutputV2U: ViewOutputV2U as ComponentType<NodeProps<Node>>,
  triggerOnToggleV2U: TriggerOnToggleV2U as ComponentType<NodeProps<Node>>,
  testErrorV2U: TestErrorV2U as ComponentType<NodeProps<Node>>,
}; 