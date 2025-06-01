import React from 'react';
import CustomHandle from '../../../handles/CustomHandle';
import type { BaseNodeData, NodeFactoryConfig } from '../types';

// TYPES
interface NodeContentProps<T extends BaseNodeData> {
  nodeState: any;
  processingState: any;
  styling: any;
  handles: any;
  enhancedConfig: NodeFactoryConfig<T>;
}

/**
 * NODE CONTENT
 * Handles content rendering and handle placement
 */
export function NodeContent<T extends BaseNodeData>({
  nodeState,
  processingState,
  styling,
  handles,
  enhancedConfig
}: NodeContentProps<T>) {
  // ERROR CALCULATION FOR RENDERING WITH VIBE MODE SUPPORT
  const renderError = styling.errorState.supportsErrorInjection && styling.errorState.finalErrorForStyling ? 
    (processingState.error || (nodeState.data as any)?.error || 'Error state active') : 
    processingState.error;

  // LOG ERROR INJECTION STATUS FOR DEBUGGING
  if (styling.errorState.supportsErrorInjection && styling.errorState.hasVibeError) {
    console.log(`🎨 [NodeContent] ${enhancedConfig.nodeType}: Rendering with error injection:`, {
      hasVibeError: styling.errorState.hasVibeError,
      errorType: (nodeState.data as any)?.errorType,
      errorMessage: (nodeState.data as any)?.error,
      finalErrorForStyling: styling.errorState.finalErrorForStyling
    });
  }

  return (
    <>
      {/* INPUT HANDLES */}
      {handles.inputHandlesFiltered.map((handle: any) => (
        <CustomHandle
          key={handle.id}
          type="target"
          position={handle.position}
          id={handle.id}
          dataType={handle.dataType}
        />
      ))}
      
      {/* COLLAPSED STATE RENDERING */}
      {!nodeState.showUI && enhancedConfig.renderCollapsed({
        data: nodeState.data,
        error: renderError,
        nodeType: enhancedConfig.nodeType,
        updateNodeData: nodeState.updateNodeData,
        id: nodeState.data.id
      })}

      {/* EXPANDED STATE RENDERING */}
      {nodeState.showUI && enhancedConfig.renderExpanded({
        data: nodeState.data,
        error: renderError,
        nodeType: enhancedConfig.nodeType,
        categoryTextTheme: styling.categoryTextTheme,
        textTheme: styling.textTheme,
        updateNodeData: nodeState.updateNodeData,
        id: nodeState.data.id
      })}

      {/* OUTPUT HANDLES */}
      {handles.outputHandles.map((handle: any) => (
        <CustomHandle
          key={handle.id}
          type="source"
          position={handle.position}
          id={handle.id}
          dataType={handle.dataType}
        />
      ))}
    </>
  );
} 