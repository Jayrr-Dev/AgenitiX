import React from 'react';
import { FloatingNodeId } from '../../components/FloatingNodeId';
import { ExpandCollapseButton } from '../../components/ExpandCollapseButton';
import { 
  DEFAULT_TEXT_NODE_SIZE, 
  DEFAULT_LOGIC_NODE_SIZE,
  DEFAULT_TRIGGER_NODE_SIZE,
  TRIGGER_NODE_PATTERNS 
} from '../constants';
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
 * GET SMART DEFAULT SIZE
 * Automatically pick the right default size based on node type
 */
function getSmartDefaultSize(nodeType: string) {
  // Check if it's a trigger node
  if (TRIGGER_NODE_PATTERNS.some(pattern => nodeType.toLowerCase().includes(pattern))) {
    return DEFAULT_TRIGGER_NODE_SIZE;
  }
  
  // Check if it's a logic node (small icon-based)
  if (nodeType.toLowerCase().includes('logic')) {
    return DEFAULT_LOGIC_NODE_SIZE;
  }
  
  // Default to text node size for everything else
  return DEFAULT_TEXT_NODE_SIZE;
}

/**
 * NODE CONTAINER
 * Handles the outer structure, sizing, and expand/collapse functionality
 * Enhanced with enterprise safety features and smart size detection
 */
export function NodeContainer<T extends BaseNodeData>({
  id,
  styling,
  nodeState,
  enhancedConfig,
  isEnterprise = false,
  children
}: NodeContainerProps<T>) {
  // SMART NODE SIZE CALCULATION
  const nodeSize = enhancedConfig.size || getSmartDefaultSize(enhancedConfig.nodeType);
  
  // ERROR THEME SELECTION
  const buttonTheme = styling.errorState.finalErrorForStyling 
    ? styling.buttonTheme 
    : styling.categoryButtonTheme;

  // ENTERPRISE ATTRIBUTES
  const enterpriseAttributes = isEnterprise ? {
    'data-enterprise-factory': 'true',
    'data-safe-factory': 'true'
  } : {};

  // DEBUG ERROR INJECTION STATE
  if (styling.errorState.hasVibeError || styling.errorState.finalErrorForStyling) {
    console.log(`🎨 [NodeContainer] ${enhancedConfig.nodeType} ${id}: Applying error styling:`, {
      hasVibeError: styling.errorState.hasVibeError,
      finalErrorForStyling: styling.errorState.finalErrorForStyling,
      errorType: styling.errorState.finalErrorType,
      nodeStyleClasses: styling.nodeStyleClasses,
      supportsErrorInjection: styling.errorState.supportsErrorInjection
    });
  }

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