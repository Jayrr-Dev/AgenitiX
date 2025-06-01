import React from 'react';
import { FloatingNodeId } from '../../components/FloatingNodeId';
import { ExpandCollapseButton } from '../../components/ExpandCollapseButton';
import { DEFAULT_TEXT_NODE_SIZE } from '../constants';
import type { BaseNodeData, NodeFactoryConfig } from '../types';

// TYPES
interface NodeContainerProps<T extends BaseNodeData> {
  id: string;
  styling: any;
  nodeState: any;
  enhancedConfig: NodeFactoryConfig<T>;
  isEnterprise?: boolean;
  children: React.ReactNode;
}

/**
 * NODE CONTAINER
 * Handles the outer structure, sizing, and expand/collapse functionality
 * Enhanced with enterprise safety features
 */
export function NodeContainer<T extends BaseNodeData>({
  id,
  styling,
  nodeState,
  enhancedConfig,
  isEnterprise = false,
  children
}: NodeContainerProps<T>) {
  // NODE SIZE CALCULATION
  const nodeSize = enhancedConfig.size || DEFAULT_TEXT_NODE_SIZE;
  
  // ERROR THEME SELECTION
  const buttonTheme = styling.errorState.finalErrorForStyling 
    ? styling.buttonTheme 
    : styling.categoryButtonTheme;

  // ENTERPRISE ATTRIBUTES
  const enterpriseAttributes = isEnterprise ? {
    'data-enterprise-factory': 'true',
    'data-safe-factory': 'true'
  } : {};

  return (
    <div 
      data-id={id}
      {...enterpriseAttributes}
      className={`relative ${
        nodeState.showUI 
          ? `px-4 py-3 ${nodeSize.expanded.width}` 
          : `${nodeSize.collapsed.width} ${nodeSize.collapsed.height} flex items-center justify-center`
      } rounded-lg ${styling.categoryBaseClasses.background} shadow border ${styling.categoryBaseClasses.border} ${styling.nodeStyleClasses} ${isEnterprise ? 'enterprise-node' : ''}`}
    >
      {/* FLOATING NODE ID */}
      <FloatingNodeId nodeId={id} />
      
      {/* EXPAND/COLLAPSE BUTTON */}
      <ExpandCollapseButton
        showUI={nodeState.showUI}
        onToggle={() => nodeState.setShowUI(!nodeState.showUI)}
        className={buttonTheme}
      />

      {children}
    </div>
  );
} 