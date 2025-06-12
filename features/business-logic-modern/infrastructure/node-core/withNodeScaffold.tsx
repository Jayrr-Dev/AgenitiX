import type { NodeProps, Position } from '@xyflow/react';
import React from 'react';
import type { NodeSpec } from './NodeSpec';
import TypeSafeHandle from '@/components/nodes/handles/TypeSafeHandle';
import { useNodeStyleClasses, useCategoryTheme } from '@/features/business-logic-modern/infrastructure/theming/stores/nodeStyleStore';

/**
 * Enhanced scaffold wrapper that provides sizing, theming, and glow effects
 * while delegating full visual rendering to the wrapped node component.
 *
 * ‑ Integrates with the glow effects theming system for selection/hover/activation states
 * ‑ Applies category-based theming from the node registry
 * ‑ Makes the background transparent so the node component can define its own styling
 * ‑ Provides consistent border and radius for hit-testing and visual consistency
 */
const NodeScaffoldWrapper = ({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
  className?: string;
}) => (
  <div
    className={className}
    style={{
      ...style,
      border: '1px solid transparent', // Keep minimal border for selection outline
      borderRadius: '8px',
      background: 'transparent', // Remove the white/gray backdrop
    }}
  >
    {children}
  </div>
);

/**
 * A Higher-Order Component that wraps a node's UI component.
 * It reads the static NodeSpec to apply standard features like sizing, theming,
 * error boundaries, analytics hooks, and glow effects.
 *
 * @param spec The static NodeSpec object for the node.
 * @param Component The node's raw React UI component.
 * @returns A complete, production-ready node component with theming integration.
 */
export function withNodeScaffold(spec: NodeSpec, Component: React.FC<NodeProps>) {
  // The returned component is what React Flow will render.
  const WrappedComponent = (props: NodeProps) => {
    // Extract React Flow state for theming
    const isSelected = props.selected || false;
    const isError = false; // TODO: Extract from node data or validation state
    const isActive = (props.data as any)?.isActive || false;

    // Get theming classes from the theming system
    const nodeStyleClasses = useNodeStyleClasses(isSelected, isError, isActive);
    const categoryTheme = useCategoryTheme(spec.kind);

    // Build the complete className with theming
    const themeClasses = React.useMemo(() => {
      const baseClasses = [
        "relative transition-all duration-200",
        nodeStyleClasses, // Includes hover, selection, error, and activation glow effects
      ];
      
      // Apply category-based theming if available
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

    // TODO: Sync with actual expanded/collapsed state via context or props.
    // Start with collapsed size by default.
    const isExpandedDefault = false;
    const size = isExpandedDefault ? spec.size.expanded : spec.size.collapsed;

    const collapsedSize = spec.size.collapsed as any;
    const style: React.CSSProperties = {
        minWidth: `${collapsedSize.width}px`,
        minHeight:
          typeof collapsedSize.height === 'number'
            ? `${collapsedSize.height}px`
            : collapsedSize.height,
        width: 'auto',
        height: 'auto',
    };

    return (
      <NodeScaffoldWrapper style={style} className={themeClasses}>
        {/* Render handles defined in the spec */}
        {spec.handles?.map((handle) => (
          <TypeSafeHandle
            key={handle.id}
            id={handle.id + '__' + ((handle.code ?? handle.dataType) ?? 'x')}
            type={handle.type}
            position={handle.position as Position}
            dataType={handle.dataType}
            code={(handle as any).code}
            tsSymbol={(handle as any).tsSymbol}
            nodeId={props.id}
          />
        ))}

        {/* Here you would inject ErrorBoundary, Suspense, PostHog, etc. */}
        <Component {...props} />
      </NodeScaffoldWrapper>
    );
  };

  WrappedComponent.displayName = `withNodeScaffold(${spec.displayName})`;
  return WrappedComponent;
} 