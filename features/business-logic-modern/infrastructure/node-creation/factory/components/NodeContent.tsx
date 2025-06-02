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

import CustomHandle from "@node-creation/node-handles/TypesafeHandle";
import type { BaseNodeData, NodeFactoryConfig } from "../types";
import {
  calculateRenderError,
  logErrorInjectionState,
} from "../utils/conditionalRendering";

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
export function NodeContent<T extends BaseNodeData>({
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
  // RENDER NODE CONTENT
  // ========================================================================

  return (
    <>
      {/* INPUT HANDLES SECTION */}
      <InputHandlesSection handles={handles.inputHandlesFiltered} />

      {/* COLLAPSED STATE SECTION */}
      <CollapsedStateSection
        showUI={nodeState.showUI}
        enhancedConfig={enhancedConfig}
        nodeState={nodeState}
        renderError={renderError}
        id={id}
      />

      {/* EXPANDED STATE SECTION */}
      <ExpandedStateSection
        showUI={nodeState.showUI}
        enhancedConfig={enhancedConfig}
        nodeState={nodeState}
        styling={styling}
        renderError={renderError}
        id={id}
      />

      {/* OUTPUT HANDLES SECTION */}
      <OutputHandlesSection handles={handles.outputHandles} />
    </>
  );
}

// ============================================================================
// EXTRACTED RENDERING COMPONENTS
// ============================================================================

/**
 * INPUT HANDLES SECTION
 * Renders input handles with early return
 */
function InputHandlesSection({ handles }: { handles: any[] }) {
  // EARLY RETURN: No input handles
  if (!handles || handles.length === 0) {
    return null;
  }

  // DEBUG: Log handle data to see what's being passed
  console.log("🎨 [InputHandlesSection] Rendering handles:", handles);

  return (
    <>
      {handles.map((handle: any) => {
        console.log(`🎨 [InputHandle] Rendering handle ${handle.id}:`, {
          dataType: handle.dataType,
          position: handle.position,
          type: "target",
        });

        return (
          <CustomHandle
            key={handle.id}
            type="target"
            position={handle.position}
            id={handle.id}
            dataType={handle.dataType}
          />
        );
      })}
    </>
  );
}

/**
 * COLLAPSED STATE SECTION
 * Renders collapsed state with early return
 */
function CollapsedStateSection({
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
  // EARLY RETURN: UI is expanded
  if (showUI) {
    return null;
  }

  return (
    <>
      {enhancedConfig.renderCollapsed({
        data: nodeState.data,
        error: renderError,
        nodeType: enhancedConfig.nodeType,
        updateNodeData: nodeState.updateNodeData,
        id: id,
      })}
    </>
  );
}

/**
 * EXPANDED STATE SECTION
 * Renders expanded state with early return
 */
function ExpandedStateSection({
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
  // EARLY RETURN: UI is collapsed
  if (!showUI) {
    return null;
  }

  return (
    <>
      {enhancedConfig.renderExpanded({
        data: nodeState.data,
        error: renderError,
        nodeType: enhancedConfig.nodeType,
        categoryTextTheme: styling.categoryTextTheme,
        textTheme: styling.textTheme,
        updateNodeData: nodeState.updateNodeData,
        id: id,
      })}
    </>
  );
}

/**
 * OUTPUT HANDLES SECTION
 * Renders output handles with early return
 */
function OutputHandlesSection({ handles }: { handles: any[] }) {
  // EARLY RETURN: No output handles
  if (!handles || handles.length === 0) {
    return null;
  }

  // DEBUG: Log handle data to see what's being passed
  console.log("🎨 [OutputHandlesSection] Rendering handles:", handles);

  return (
    <>
      {handles.map((handle: any) => {
        console.log(`🎨 [OutputHandle] Rendering handle ${handle.id}:`, {
          dataType: handle.dataType,
          position: handle.position,
          type: "source",
        });

        return (
          <CustomHandle
            key={handle.id}
            type="source"
            position={handle.position}
            id={handle.id}
            dataType={handle.dataType}
          />
        );
      })}
    </>
  );
}
