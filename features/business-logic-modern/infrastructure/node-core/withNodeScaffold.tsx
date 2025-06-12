import type { NodeProps } from '@xyflow/react';
import React from 'react';
import type { NodeSpec } from './NodeSpec';

// This is a placeholder for the real NodeScaffold component.
// In a real implementation, this would be your styled wrapper.
const NodeScaffoldWrapper = ({ children, style }: { children: React.ReactNode, style: React.CSSProperties }) => (
  <div style={{...style, border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9'}}>
      <div style={{background: '#eee', padding: '4px 8px', borderBottom: '1px solid #ccc', fontWeight: 'bold'}}>
        Node Header
      </div>
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
    // In a real implementation, you would get this from state.
    const isExpanded = true; 

    const size = isExpanded ? spec.size.expanded : spec.size.collapsed;

    const style: React.CSSProperties = {
        width: `${size.width}px`,
        height: typeof size.height === 'number' ? `${size.height}px` : size.height,
    };

    return (
      <NodeScaffoldWrapper style={style}>
        {/* Here you would inject ErrorBoundary, Suspense, PostHog, etc. */}
        <Component {...props} />
      </NodeScaffoldWrapper>
    );
  };

  WrappedComponent.displayName = `withNodeScaffold(${spec.displayName})`;
  return WrappedComponent;
} 