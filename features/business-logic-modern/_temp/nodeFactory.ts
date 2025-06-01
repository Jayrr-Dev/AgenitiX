import type { AgenNode, NodeType } from '../infrastructure/flow-engine/flow-editor/types';
import { NODE_TYPE_CONFIG, NODE_ID_PREFIX } from '../infrastructure/flow-engine/flow-editor/constants';

/**
 * Creates a new node with proper default data and configuration
 */
export function createNode(
  type: NodeType,
  position: { x: number; y: number },
  customData?: Record<string, unknown>
): AgenNode {
  const config = NODE_TYPE_CONFIG[type];
  const id = `${NODE_ID_PREFIX}${Date.now()}`;
  
  const baseNode = {
    id,
    type,
    position,
    deletable: true,
    data: { ...config.defaultData, ...customData }
  };

  // Add target position for output nodes
  if (config.hasTargetPosition && config.targetPosition) {
    return {
      ...baseNode,
      targetPosition: config.targetPosition
    } as AgenNode;
  }

  return baseNode as AgenNode;
}

/**
 * Validates if a node type is supported
 */
export function isValidNodeType(type: string): type is NodeType {
  return type in NODE_TYPE_CONFIG;
}

/**
 * Gets the default data for a node type
 */
export function getNodeDefaultData(type: NodeType) {
  return NODE_TYPE_CONFIG[type].defaultData;
}

/**
 * Creates a copy of a node with new ID and offset position
 */
export function copyNode(
  originalNode: AgenNode,
  offset: { x: number; y: number } = { x: 40, y: 40 }
): AgenNode {
  const newId = `${originalNode.id}-copy-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  return {
    ...originalNode,
    id: newId,
    position: {
      x: originalNode.position.x + offset.x,
      y: originalNode.position.y + offset.y
    },
    selected: false,
    data: { ...originalNode.data }
  } as AgenNode;
} 