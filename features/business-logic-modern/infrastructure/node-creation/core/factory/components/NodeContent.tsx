/**
 * NODE CONTENT COMPONENT - Dynamic content rendering for factory nodes
 *
 * • Renders node-specific content based on factory configuration
 * • Supports dynamic layouts with conditional rendering systems
 * • Provides advanced button systems and interactive controls
 * • Integrates with JSON processing and input field handling
 * • Manages content state and real-time updates efficiently
 *
 * Keywords: node-content, dynamic-rendering, factory-config, conditional-rendering, json-processing
 */

"use client";

import UltimateTypesafeHandle from "@/features/business-logic-modern/infrastructure/node-creation/systems/ui/node-handles/UltimateTypesafeHandle";
import React from "react";
import type { BaseNodeData, NodeFactoryConfig } from "../types";
import {
  calculateRenderError,
  logErrorInjectionState,
} from "../utils/ui/conditionalRendering";

// ============================================================================
// UTILITY FUNCTIONS FOR STABLE KEYS
// ============================================================================

/**
 * Generate stable keys for React components to prevent reconciliation issues
 */
function generateStableKey(
  prefix: string,
  id: string,
  suffix?: string
): string {
  const parts = [prefix, id, suffix].filter(Boolean);
  return parts.join("-");
}

/**
 * Ensure handles have stable keys based on their properties
 */
function getHandleKey(handle: any, type: "input" | "output"): string {
  return `${type}-handle-${handle.id}-${handle.position || "default"}`;
}

// Simple Error Boundary to catch React reconciliation errors
class NodeRenderErrorBoundary extends React.Component<
  { children: React.ReactNode; nodeType: string },
  { hasError: boolean; errorInfo?: string }
> {
  constructor(props: { children: React.ReactNode; nodeType: string }) {
    super(props);
    this.state = { hasError: false, errorInfo: undefined };
  }

  static getDerivedStateFromError(error: Error) {
    // Specifically handle React reconciliation errors
    if (
      error.message?.includes("Expected static flag was missing") ||
      error.message?.includes("reconciliation") ||
      error.message?.includes("fiber")
    ) {
      console.warn(
        "[NodeRenderErrorBoundary] React reconciliation error detected:",
        error.message
      );
    }
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn(
      `[NodeContent] Caught render error for ${this.props.nodeType}:`,
      error,
      errorInfo
    );

    // Log specific React reconciliation issues
    if (error.message?.includes("Expected static flag was missing")) {
      console.warn(
        "[NodeRenderErrorBoundary] This is a React reconciliation error. Component structure may be unstable."
      );
    }
  }

  componentDidUpdate(prevProps: {
    children: React.ReactNode;
    nodeType: string;
  }) {
    // Reset error state if props change (allows recovery)
    if (
      this.state.hasError &&
      (prevProps.nodeType !== this.props.nodeType ||
        prevProps.children !== this.props.children)
    ) {
      this.setState({ hasError: false, errorInfo: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-xs text-red-500 p-2 bg-red-50 border border-red-200 rounded">
          <div>⚠️ Render Error - Please refresh</div>
          {this.state.errorInfo && (
            <div className="text-xs opacity-70 mt-1">
              {this.state.errorInfo.slice(0, 100)}...
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// NODE CONTENT COMPONENT TYPES
// ============================================================================

interface NodeContentProps<T extends BaseNodeData> {
  id: string;
  nodeState: any;
  processingState: any;
  styling: any;
  handles: any;
  enhancedConfig: NodeFactoryConfig<T>;
}

// ============================================================================
// NODE CONTENT COMPONENT
// ============================================================================

/**
 * NODE CONTENT
 * Handles content rendering and handle placement
 * Refactored with early returns and extracted conditional logic
 */
export const NodeContent = React.memo(function NodeContent<
  T extends BaseNodeData,
>({
  id,
  nodeState,
  processingState,
  styling,
  handles,
  enhancedConfig,
}: NodeContentProps<T>) {
  // ========================================================================
  // ERROR STATE CALCULATION WITH EXTRACTED LOGIC
  // ========================================================================

  const renderError = calculateRenderError(
    processingState.error,
    nodeState.data,
    styling.errorState.supportsErrorInjection
  );

  // ========================================================================
  // DEBUG LOGGING WITH EXTRACTED LOGIC
  // ========================================================================

  logErrorInjectionState(
    enhancedConfig.nodeType,
    nodeState.data.id,
    styling.errorState
  );

  // ========================================================================
  // RENDER NODE CONTENT - Stabilized structure for React reconciliation
  // ========================================================================

  return (
    <React.Fragment key={generateStableKey("node-content", id)}>
      {/* INPUT HANDLES SECTION */}
      <InputHandlesSection
        key={generateStableKey("input-handles", id)}
        handles={handles.inputHandlesFiltered}
        handleOpacities={handles.handleOpacities || {}}
      />

      {/* COLLAPSED STATE SECTION */}
      <CollapsedStateSection
        key={generateStableKey("collapsed", id)}
        showUI={nodeState.showUI}
        enhancedConfig={enhancedConfig}
        nodeState={nodeState}
        renderError={renderError}
        id={id}
      />

      {/* EXPANDED STATE SECTION */}
      <ExpandedStateSection
        key={generateStableKey("expanded", id)}
        showUI={nodeState.showUI}
        enhancedConfig={enhancedConfig}
        nodeState={nodeState}
        styling={styling}
        renderError={renderError}
        id={id}
      />

      {/* OUTPUT HANDLES SECTION */}
      <OutputHandlesSection
        key={generateStableKey("output-handles", id)}
        handles={handles.outputHandles}
        handleOpacities={handles.handleOpacities || {}}
      />
    </React.Fragment>
  );
});

// ============================================================================
// EXTRACTED RENDERING COMPONENTS
// ============================================================================

/**
 * INPUT HANDLES SECTION
 * Renders input handles with opacity support
 */
const InputHandlesSection = React.memo(function InputHandlesSection({
  handles,
  handleOpacities,
}: {
  handles: any[];
  handleOpacities: Record<string, number>;
}) {
  // EARLY RETURN: No input handles
  if (!handles || handles.length === 0) {
    return null;
  }

  return (
    <React.Fragment>
      {handles.map((handle: any) => {
        const opacity = handleOpacities[handle.id] || 1.0;
        return (
          <UltimateTypesafeHandle
            key={getHandleKey(handle, "input")}
            type="target"
            position={handle.position}
            id={handle.id}
            dataType={handle.dataType}
            style={{ opacity }}
          />
        );
      })}
    </React.Fragment>
  );
});

/**
 * COLLAPSED STATE SECTION
 * Renders collapsed state with early return
 */
const CollapsedStateSection = React.memo(function CollapsedStateSection({
  showUI,
  enhancedConfig,
  nodeState,
  renderError,
  id,
}: {
  showUI: boolean;
  enhancedConfig: any;
  nodeState: any;
  renderError: string | null;
  id: string;
}) {
  // EARLY RETURN: UI is expanded - return consistent structure
  if (showUI) {
    return <React.Fragment key={generateStableKey("collapsed-empty", id)} />;
  }

  try {
    return (
      <React.Fragment key={generateStableKey("collapsed-content", id)}>
        {enhancedConfig.renderCollapsed({
          data: nodeState.data,
          error: renderError,
          nodeType: enhancedConfig.nodeType,
          updateNodeData: nodeState.updateNodeData,
          id: id,
        })}
      </React.Fragment>
    );
  } catch (error) {
    console.warn(`[CollapsedStateSection] Render error for node ${id}:`, error);
    return (
      <React.Fragment key={generateStableKey("collapsed-error", id)}>
        <div className="text-xs text-red-500 p-1">⚠️ Render Error</div>
      </React.Fragment>
    );
  }
});

/**
 * EXPANDED STATE SECTION
 * Renders expanded state with early return
 */
const ExpandedStateSection = React.memo(function ExpandedStateSection({
  showUI,
  enhancedConfig,
  nodeState,
  styling,
  renderError,
  id,
}: {
  showUI: boolean;
  enhancedConfig: any;
  nodeState: any;
  styling: any;
  renderError: string | null;
  id: string;
}) {
  // EARLY RETURN: UI is collapsed - return consistent structure
  if (!showUI) {
    return <React.Fragment key={generateStableKey("expanded-empty", id)} />;
  }

  try {
    return (
      <React.Fragment key={generateStableKey("expanded-content", id)}>
        <NodeRenderErrorBoundary nodeType={enhancedConfig.nodeType}>
          {enhancedConfig.renderExpanded({
            data: nodeState.data,
            error: renderError,
            nodeType: enhancedConfig.nodeType,
            categoryTextTheme: styling.categoryTextTheme,
            textTheme: styling.textTheme,
            updateNodeData: nodeState.updateNodeData,
            id: id,
          })}
        </NodeRenderErrorBoundary>
      </React.Fragment>
    );
  } catch (error) {
    console.warn(`[ExpandedStateSection] Render error for node ${id}:`, error);
    return (
      <React.Fragment key={generateStableKey("expanded-error", id)}>
        <div className="text-xs text-red-500 p-1">⚠️ Render Error</div>
      </React.Fragment>
    );
  }
});

/**
 * OUTPUT HANDLES SECTION
 * Renders output handles with opacity support
 */
const OutputHandlesSection = React.memo(function OutputHandlesSection({
  handles,
  handleOpacities,
}: {
  handles: any[];
  handleOpacities: Record<string, number>;
}) {
  // EARLY RETURN: No output handles
  if (!handles || handles.length === 0) {
    return null;
  }

  return (
    <React.Fragment>
      {handles.map((handle: any) => {
        const opacity = handleOpacities[handle.id] || 1.0;
        return (
          <UltimateTypesafeHandle
            key={getHandleKey(handle, "output")}
            type="source"
            position={handle.position}
            id={handle.id}
            dataType={handle.dataType}
            style={{ opacity }}
          />
        );
      })}
    </React.Fragment>
  );
});
