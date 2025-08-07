/**
 * UNIFIED NODE SCAFFOLD - Complete structural and theming system
 *
 * • Handles ALL structural styling: borders, sizing, shadows, category theming
 * • Manages interactive states: hover, selection, activation, error
 * • Integrates with design system tokens for consistency
 * • Node components focus ONLY on content and layout
 * • Single source of truth for node appearance
 *
 * Keywords: node-scaffold, structural-styling, theming, interactive-states, design-system
 */

import TypeSafeHandle from "@/components/nodes/handles/TypeSafeHandle";
import {
  useCategoryThemeWithSpec,
  useNodeStyleClasses,
} from "@/features/business-logic-modern/infrastructure/theming/stores/nodeStyleStore";
import { debugNodeData } from "@/lib/debug-node-renders";
import type { NodeProps, Position } from "@xyflow/react";
import { useUpdateNodeInternals } from "@xyflow/react";
import { useTheme } from "next-themes";
import React from "react";
import NodeErrorBoundary from "./ErrorBoundary";
import type { NodeSpec } from "./NodeSpec";
import NodeTelemetry from "./NodeTelemetry";
import { NodeToastContainer } from "./NodeToast";
import { globalNodeMemoryManager } from "./nodeMemory";
import { getNodePlugins } from "./plugins/nodePluginRegistry";
import { runServerActions } from "./serverActions/serverActionRegistry";

/**
 * Utility to get CSS custom property value from the DOM
 * This allows us to inject Tailwind classes from tokens.json
 */
const getInjectableClasses = (cssVar: string): string => {
  if (typeof window === "undefined") {
    return "";
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
  return value || "";
};

/**
 * Enhanced scaffold wrapper that provides complete structural styling
 * while delegating content rendering to the wrapped node component.
 *
 * RESPONSIBILITIES:
 * • Structural styling (borders, shadows, sizing, rounded corners)
 * • Category-based theming (backgrounds, border colors)
 * • Interactive states (hover, selection, activation, error)
 * • Handle positioning and rendering
 * • Design system token integration
 * • Modern UI effects (gradients, enhanced shadows, transitions)
 */
const NodeScaffoldWrapper = ({
  children,
  style,
  className,
  spec,
  isDisabled = false,
  nodeId,
  isExpanded,
  expandedSize,
  collapsedSize,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
  className?: string;
  spec: NodeSpec;
  isDisabled?: boolean;
  nodeId?: string;
  isExpanded?: boolean;
  expandedSize?: string;
  collapsedSize?: string;
}) => {
  // Get theme for dark mode detection
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Ensure client-side rendering to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Get injectable classes for core node styling
  const wrapperClasses = getInjectableClasses(
    "--core-coreNode-classes-wrapper"
  );
  const containerClasses = getInjectableClasses(
    "--core-coreNode-classes-container"
  );
  const borderClasses = getInjectableClasses("--core-coreNode-classes-border");

  // Build complete structural styling with modern enhancements
  const structuralClasses = [
    // Base structural classes with modern border radius and transitions
    "relative rounded-[12px] transition-all duration-300 ease-out",
    // Base shadow effect that won't conflict with glow effects
    !isDisabled && "shadow-lg",
    // Injectable classes from tokens
    wrapperClasses,
    containerClasses,
    borderClasses,
    // Theme classes from parent (includes selection, hover, activation glow effects)
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Get custom theming if available
  const customTheming = spec.theming;
  const isDarkMode = mounted && resolvedTheme === "dark";
  const categoryLower = spec.category.toLowerCase();

  // Complete style object with all structural properties including modern effects
  const completeStyle: React.CSSProperties = {
    ...style,
    // Scaffold handles ALL border styling
    borderWidth: `var(--node-${categoryLower}-border-width)`,
    borderStyle: "solid",
    // Enhanced border radius for modern look
    borderRadius: "var(--node-global-modern-radius)",
    // Use custom theming if available and in dark mode, otherwise fall back to tokens
    borderColor:
      isDarkMode && customTheming?.borderDark
        ? customTheming.borderDark
        : `var(--node-${categoryLower}-border)`,
    // Modern gradient backgrounds - the CSS variable automatically changes in dark mode
    background: isDisabled
      ? `var(--node-global-disabled-gradient), var(--node-${categoryLower}-bg-gradient)`
      : `var(--node-${categoryLower}-bg-gradient)`,
    // Enhanced shadows for depth - dark mode gets layered shadows with inset highlights
    // Note: boxShadow intentionally removed to allow CSS classes (selection glow) to take precedence
    // Shadow effects are now handled entirely through CSS custom properties and classes
    // Ensure proper layering
    position: "relative",
    // Modern smooth transitions for all properties
    transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    // Add backdrop filter for glass effect (optional) - reduced when disabled
    backdropFilter: isDisabled ? "blur(4px)" : "blur(8px)",
    // Reduced opacity for disabled state
    opacity: isDisabled ? "var(--node-global-disabled-opacity)" : "1",
    // Prevent interaction when disabled
    pointerEvents: isDisabled ? "none" : "auto",
  };

  // Feature flag to control hover lift effect
  const ENABLE_HOVER_LIFT = false; // Set to true to enable lift effect

  return (
    <div
      className={structuralClasses}
      style={completeStyle}
      data-expanded={isExpanded}
      data-expanded-size={expandedSize}
      data-collapsed-size={collapsedSize}
      data-current-size={isExpanded ? expandedSize : collapsedSize}
      // Enhanced hover effects - only when not disabled and feature flag is enabled
      // Note: boxShadow effects removed to prevent conflicts with selection glow
      onMouseEnter={
        isDisabled || !ENABLE_HOVER_LIFT
          ? undefined
          : (e) => {
              const target = e.currentTarget;
              target.style.transform = "translateY(-2px) scale(1.01)";
            }
      }
      onMouseLeave={
        isDisabled || !ENABLE_HOVER_LIFT
          ? undefined
          : (e) => {
              const target = e.currentTarget;
              target.style.transform = "translateY(0) scale(1)";
            }
      }
    >
      {children}
    </div>
  );
};

/**
 * A Higher-Order Component that wraps a node's UI component.
 * It reads the static NodeSpec to apply standard features like sizing, theming,
 * error boundaries, analytics hooks, and glow effects.
 *
 * @param spec The static NodeSpec object for the node.
 * @param Component The node's raw React UI component.
 * @returns A complete, production-ready node component with theming integration.
 */
export function withNodeScaffold(
  spec: NodeSpec,
  Component: React.FC<NodeProps>
) {
  // Debug the spec creation to track maximum depth errors
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 withNodeScaffold called with spec:", {
      specKind: spec.kind,
      handlesCount: spec.handles?.length || 0,
      size: spec.size,
    });
  }

  // The returned component is what React Flow will render.
  const WrappedComponent = (props: NodeProps) => {
    // Debug node data changes
    const prevDataRef = React.useRef(props.data);
    React.useEffect(() => {
      debugNodeData(props.id, props.data, prevDataRef.current);
      prevDataRef.current = props.data;
    }, [props.data, props.id]);
    // Get ReactFlow's updateNodeInternals hook
    const updateNodeInternals = useUpdateNodeInternals();

    // Force re-render when handle overrides change by creating a unique key
    const handleOverrides = (props.data as any)?.handleOverrides;

    const handleKey = React.useMemo(() => {
      // Avoid JSON.stringify on every render - just use array length and first item
      if (!handleOverrides || !Array.isArray(handleOverrides)) return "default";
      return `${handleOverrides.length}-${handleOverrides[0]?.handleId || "none"}`;
    }, [handleOverrides]);

    // Update ReactFlow's internal handle positions when overrides change
    React.useEffect(() => {
      // Always update when handleOverrides changes (including when it becomes empty or undefined)
      // This ensures handles revert to original positions when overrides are removed
      updateNodeInternals(props.id);
      // Handle position debug info available: {overrideCount, overrides}
    }, [handleOverrides, props.id, updateNodeInternals]);
    // Extract React Flow state for theming
    const isSelected = props.selected;
    const isError = false; // TODO: Extract from node data or validation state
    const isActive = (props.data as any)?.isActive;
    const isDisabled = (props.data as any)?.isEnabled === false;

    // Get theming classes from the theming system
    const nodeStyleClasses = useNodeStyleClasses(isSelected, isError, isActive);
    const categoryTheme = useCategoryThemeWithSpec(spec.kind, spec);

    // Build the complete className with theming, basically combining all style classes
    const themeClasses = React.useMemo(() => {
      const baseClasses = [
        nodeStyleClasses, // Includes hover, selection, error, and activation glow effects
      ];

      // Apply category-based theming if available, basically the visual category styling
      if (categoryTheme) {
        baseClasses.push(
          categoryTheme.background.light,
          categoryTheme.background.dark,
          categoryTheme.border.light,
          categoryTheme.border.dark
        );
      }

      return baseClasses.join(" ");
    }, [nodeStyleClasses, categoryTheme]);

    // Extract expanded state from component data or use collapsed as default
    // Node components manage isExpanded through their data schema and useNodeData hook
    const isExpanded = (props.data as any)?.isExpanded;
    const currentSize = isExpanded ? spec.size.expanded : spec.size.collapsed;

    const sizeConfig = currentSize as any;
    const style: React.CSSProperties = {
      minWidth:
        typeof sizeConfig.width === "number"
          ? `${sizeConfig.width}px`
          : sizeConfig.width,
      minHeight:
        typeof sizeConfig.minHeight === "number"
          ? `${sizeConfig.minHeight}px`
          : typeof sizeConfig.height === "number"
            ? `${sizeConfig.height}px`
            : sizeConfig.height,
      width:
        typeof sizeConfig.width === "number"
          ? `${sizeConfig.width}px`
          : sizeConfig.width,
      height:
        sizeConfig.height === "auto"
          ? "auto"
          : typeof sizeConfig.height === "number"
            ? `${sizeConfig.height}px`
            : sizeConfig.height,
    };

    // Calculate handle positioning for multiple handles on same side with dynamic overrides
    const handlesByPosition = React.useMemo(() => {
      const grouped: Record<string, typeof spec.handles> = {};
      const allHandles = spec.handles || [];

      // Create map for quick override lookup, basically a fast position finder
      const overrideMap = new Map<string, string>();
      if (handleOverrides) {
        handleOverrides.forEach(
          (override: { handleId: string; position: string }) => {
            overrideMap.set(override.handleId, override.position);
          }
        );
      }

      allHandles.forEach((handle) => {
        // Use override position if available, otherwise use default, basically the actual position to use
        const pos = overrideMap.get(handle.id) || handle.position;
        if (!grouped[pos]) {
          grouped[pos] = [];
        }
        grouped[pos].push(handle);
      });
      return grouped;
    }, [spec.handles, handleOverrides]); // Only depend on handleOverrides, not entire props.data

    // Inner component to throw inside ErrorBoundary, not outside
    const MaybeError: React.FC = () => {
      if (
        process.env.NODE_ENV === "development" &&
        (props.data as any)?.forceError
      ) {
        throw new Error(
          `🧨 Simulated runtime error from node ${props.id} (forceError flag)`
        );
      }
      return null;
    };

    // Initialize node memory if configured
    React.useEffect(() => {
      let hasMemory = false;
      if (spec.memory) {
        globalNodeMemoryManager.get(props.id, spec.memory);
        hasMemory = true;
      }

      return () => {
        if (hasMemory) {
          globalNodeMemoryManager.destroy(props.id);
        }
      };
    }, [props.id]);

    // side-effect: run server actions once
    React.useEffect(() => {
      runServerActions({
        nodeId: props.id,
        nodeKind: spec.kind,
        data: props.data as any,
        onStateUpdate: (updates) => {
          // Update node data with server action results
          if (props.data && typeof props.data === "object") {
            Object.assign(props.data, updates);
          }
        },
        onError: (error) => {
          console.error(`Server action error for node ${props.id}:`, error);
          // Could trigger error UI state here
        },
        onSuccess: (_result) => {
          // Could trigger success UI state here
        },
      });
    }, []);

    return (
      <NodeScaffoldWrapper
        style={style}
        className={themeClasses}
        spec={spec}
        isDisabled={isDisabled}
        nodeId={props.id}
        isExpanded={isExpanded}
        expandedSize={(props.data as any)?.expandedSize || "VE2"}
        collapsedSize={(props.data as any)?.collapsedSize || "C2"}
      >
        {/* Node Toast System - positioned above the node */}
        <NodeToastContainer
          nodeId={props.id}
          isExpanded={isExpanded}
          expandedSize={(props.data as any)?.expandedSize || "VE2"}
          collapsedSize={(props.data as any)?.collapsedSize || "C2"}
        />

        {/* Render registered node plugins */}
        {getNodePlugins().map((Plugin, idx) => (
          <Plugin
            key={`plugin-${props.id}-${idx}`}
            nodeId={props.id}
            nodeKind={spec.kind}
            data={props.data as any}
          />
        ))}
        {/* Telemetry event: node created */}
        <NodeTelemetry nodeId={props.id} nodeKind={spec.kind} />

        {/* Render handles defined in the spec with smart positioning and dynamic overrides */}
        {(() => {
          const allHandles = spec.handles || [];
          const handleOverrides = (props.data as any)?.handleOverrides as
            | Array<{
                handleId: string;
                position: "top" | "bottom" | "left" | "right";
              }>
            | undefined;

          // Create override map for quick lookup
          const overrideMap = new Map<string, string>();
          if (handleOverrides) {
            handleOverrides.forEach((override) => {
              overrideMap.set(override.handleId, override.position);
            });
          }

          return allHandles.map((handle, _index) => {
            // Use override position if available, otherwise use default
            const actualPosition =
              overrideMap.get(handle.id) || handle.position;
            const handlesOnSameSide = handlesByPosition[actualPosition] || [];
            const handleIndex = handlesOnSameSide.findIndex(
              (h) => h.id === handle.id
            );
            const totalHandlesOnSide = handlesOnSameSide.length;

            return (
              <TypeSafeHandle
                key={`${handle.id}-${handleKey}-${actualPosition}`}
                id={`${handle.id}__${handle.code ?? handle.dataType ?? "x"}`}
                type={handle.type}
                position={actualPosition as Position}
                dataType={handle.dataType || "any"}
                code={(handle as any).code}
                tsSymbol={(handle as any).tsSymbol}
                nodeId={props.id}
                handleIndex={handleIndex}
                totalHandlesOnSide={totalHandlesOnSide}
                customTooltip={handle.tooltip}
              />
            );
          });
        })()}

        {/* Error boundary isolates runtime errors per node */}
        <NodeErrorBoundary nodeId={props.id}>
          <>
            <MaybeError />
            <Component {...props} />
          </>
        </NodeErrorBoundary>
      </NodeScaffoldWrapper>
    );
  };

  WrappedComponent.displayName = `withNodeScaffold(${spec.displayName})`;
  return WrappedComponent;
}
