/**
 * NODE RENDER DEBUGGER - Specialized debugging for node components
 *
 * This utility specifically tracks node components that might cause maximum depth errors.
 * It provides detailed logging for node re-renders and helps identify infinite loops.
 *
 * • Tracks node component re-renders with detailed context
 * • Identifies infinite loops in dynamic spec creation
 * • Monitors useNodeData hook usage
 * • Logs prop changes that trigger re-renders
 *
 * Keywords: node-debugging, maximum-depth, infinite-loops, render-tracking
 */

import React from "react";

// Debug state to track render cycles
const renderCounts = new Map<string, number>();
const lastRenderTime = new Map<string, number>();
const renderStack = new Set<string>();

/**
 * Debug wrapper for node components to track re-renders
 */
export function debugNodeRender<T extends React.ComponentType<any>>(
  Component: T,
  componentName: string
): T {
  if (process.env.NODE_ENV !== "development") {
    return Component;
  }

  const DebuggedComponent = React.forwardRef<any, any>((props, ref) => {
    const componentId = `${componentName}-${props.id || "unknown"}`;
    const currentTime = Date.now();

    // Check for infinite loop
    if (renderStack.has(componentId)) {
      console.error(`🔄 INFINITE LOOP DETECTED in ${componentName}:`, {
        componentId,
        props: props.data,
        renderCount: renderCounts.get(componentId) || 0,
        timeSinceLastRender:
          currentTime - (lastRenderTime.get(componentId) || 0),
      });
    }

    // Track render cycle
    renderStack.add(componentId);
    const renderCount = (renderCounts.get(componentId) || 0) + 1;
    renderCounts.set(componentId, renderCount);
    lastRenderTime.set(componentId, currentTime);

    // Log excessive re-renders
    if (renderCount > 10) {
      console.warn(`⚠️ EXCESSIVE RE-RENDERS in ${componentName}:`, {
        componentId,
        renderCount,
        props: props.data,
        timeSinceLastRender:
          currentTime - (lastRenderTime.get(componentId) || 0),
      });
    }

    // Log every render in development
    console.log(`🔄 ${componentName} render #${renderCount}:`, {
      componentId,
      props: props.data,
      selected: props.selected,
      timeSinceLastRender: currentTime - (lastRenderTime.get(componentId) || 0),
    });

    // Clean up render stack after component renders
    setTimeout(() => {
      renderStack.delete(componentId);
    }, 0);

    return React.createElement(Component, { ...props, ref });
  });

  DebuggedComponent.displayName = `Debugged${componentName}`;
  return DebuggedComponent as unknown as T;
}

/**
 * Debug hook for useNodeData to track data changes
 */
export function debugNodeData(nodeId: string, data: any, prevData: any) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (data !== prevData) {
    console.log(`📊 Node data changed for ${nodeId}:`, {
      nodeId,
      prevData,
      newData: data,
      changedKeys: Object.keys(data || {}).filter(
        (key) => data[key] !== prevData?.[key]
      ),
    });
  }
}

/**
 * Debug hook for dynamic spec creation
 */
export function debugDynamicSpec(nodeId: string, spec: any, prevSpec: any) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (spec !== prevSpec) {
    console.log(`🔧 Dynamic spec changed for ${nodeId}:`, {
      nodeId,
      prevSpec: prevSpec?.handles?.length,
      newSpec: spec?.handles?.length,
      specKeys: Object.keys(spec || {}),
    });
  }
}

/**
 * Reset debug counters (useful for testing)
 */
export function resetDebugCounters() {
  renderCounts.clear();
  lastRenderTime.clear();
  renderStack.clear();
  console.log("🧹 Debug counters reset");
}
