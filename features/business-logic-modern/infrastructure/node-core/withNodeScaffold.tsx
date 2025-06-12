import type { NodeProps, Position } from '@xyflow/react';
import React from 'react';
import type { NodeSpec } from './NodeSpec';
import TypeSafeHandle from '@/components/nodes/handles/TypeSafeHandle';

/**
 * Lightweight scaffold wrapper that provides sizing and a minimal border while
 * delegating full visual rendering to the wrapped node component.
 *
 * ‑ Removes the hard-coded white/gray backgrounds that caused unwanted backdrops.
 * ‑ Makes the background transparent so the node component can define its own
 *   theme-aware styling.
 * ‑ Keeps a subtle border and radius for hit-testing but they can be overridden.
 */
const NodeScaffoldWrapper = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
}) => (
  <div
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
 * error boundaries, and analytics hooks.
 *
 * @param spec The static NodeSpec object for the node.
 * @param Component The node's raw React UI component.
 * @returns A complete, production-ready node component.
 */
export function withNodeScaffold(spec: NodeSpec, Component: React.FC<NodeProps>) {
  // The returned component is what React Flow will render.
  const WrappedComponent = (props: NodeProps) => {
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
      <NodeScaffoldWrapper style={style}>
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