/**
 * NODE SCAFFOLD COMPONENT - Base structure for all node components
 *
 * • Provides consistent base styling and structure for all node types
 * • Integrates with node theming system for category-based styling
 * • Handles node selection states and hover effects with semantic tokens
 * • Supports proper accessibility and keyboard navigation
 * • Maintains visual consistency across the entire node system
 *
 * Keywords: node-scaffold, base-structure, theming, selection-states, accessibility
 */

import React, { useMemo } from "react";
import { Position } from "@xyflow/react";
import { ExpandCollapseButton } from "./ExpandCollapseButton";
import { FloatingNodeId } from "./FloatingNodeId";
import TypeSafeHandle from "./handles/TypeSafeHandle";
import { getNodeMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
import { useNodeStyleClasses, useCategoryTheme } from "@/features/business-logic-modern/infrastructure/theming/stores/nodeStyleStore";
import type { NodeSpecMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
import { NodeHeader } from "./NodeHeader";

interface NodeScaffoldProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  nodeId: string;
  nodeType: string;
  showNodeId?: boolean;
  isSelected?: boolean;
  isError?: boolean;
  isActive?: boolean;
  onSelect?: () => void;
}

/**
 * @typedef {object} NodeScaffoldProps
 * @property {string} title - The title of the node.
 * @property {React.ReactNode} children - The content of the node.
 * @property {string} [className] - Additional classes for the node container.
 * @property {boolean} isCollapsed - Whether the node is collapsed.
 * @property {() => void} onToggleCollapse - Function to toggle collapse state.
 * @property {string} nodeId - The ID of the node.
 * @property {string} nodeType - The type of the node.
 * @property {boolean} [showNodeId] - Whether to show the floating node ID.
 * @property {boolean} [isSelected] - Whether the node is selected.
 * @property {boolean} [isError] - Whether the node has an error.
 * @property {boolean} [isActive] - Whether the node is active.
 * @property {() => void} [onSelect] - Function to select the node.
 */

/**
 * A reusable scaffold component for creating nodes with consistent styling and handle placement.
 * @param {NodeScaffoldProps} props
 */
export const NodeScaffold: React.FC<NodeScaffoldProps> = ({
  title,
  children,
  className = "",
  isCollapsed,
  onToggleCollapse,
  nodeId,
  nodeType,
  showNodeId,
  isSelected = false,
  isError = false,
  isActive = false,
  onSelect,
}) => {
  const meta = getNodeMetadata(nodeType);
  type HandleSpec = NodeSpecMetadata['handles'][number];
  const handles: HandleSpec[] = (meta?.handles ?? []) as HandleSpec[];
  
  // Get theming from the theming system
  const categoryTheme = useCategoryTheme(nodeType);
  const nodeStyleClasses = useNodeStyleClasses(isSelected, isError, isActive);
  
  // Build the styling classes with memoization
  const nodeClasses = useMemo(() => {
    const baseClasses = [
      "relative pt-4 rounded-lg border shadow-md",
      nodeStyleClasses, // Includes hover, selection, error, and activation styles
    ];
    
    // Apply category-based theming if available
    if (categoryTheme) {
      baseClasses.push(
        categoryTheme.background.light,
        categoryTheme.background.dark,
        categoryTheme.border.light,
        categoryTheme.border.dark
      );
    } else {
      // Fallback to basic styling
      baseClasses.push("bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700");
    }
    
    // Add any additional custom classes
    if (className) {
      baseClasses.push(className);
    }
    
    return baseClasses.join(" ");
  }, [nodeStyleClasses, categoryTheme, className]);

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onSelect) {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      className={`
        ${nodeClasses}
        ${onSelect ? "cursor-pointer hover:bg-node-view-hover hover:border-node-view-hover" : ""}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? "button" : undefined}
    >
      <NodeHeader title={title} />
      {showNodeId && (
        <FloatingNodeId 
          nodeId={nodeId} 
          position={{ x: 0, y: 0 }} 
          onClose={() => {}} 
        />
      )}
      <ExpandCollapseButton showUI={!isCollapsed} onToggle={onToggleCollapse} size="sm" />
      {handles.map((handle: HandleSpec) => (
        <TypeSafeHandle
          key={handle.id}
          type={handle.type}
          position={handle.position as Position}
          id={handle.id}
          dataType={handle.dataType}
          nodeId={nodeId}
        />
      ))}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}; 