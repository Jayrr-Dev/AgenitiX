import { useMemo, Suspense, lazy, FC } from 'react';
import type { NodeProps } from '@xyflow/react';
import { lazyNodeLoaders } from '../../node-registry/modern-node-loader';

const loadedNodes: Record<string, FC<NodeProps>> = {};

const NodeSuspenseWrapper: FC<NodeProps & { kind: string }> = (props) => {
  const { kind, ...rest } = props;
  
  if (!lazyNodeLoaders[kind]) {
    return <div>Error: Node type "{kind}" is not registered.</div>;
  }

  const NodeComponent = loadedNodes[kind] || (loadedNodes[kind] = lazy(lazyNodeLoaders[kind] as any));

  return (
    <Suspense fallback={<div style={{ width: rest.width, height: rest.height }}>Loading...</div>}>
      <NodeComponent {...rest} />
    </Suspense>
  );
};

/**
 * A hook that provides a memoized `nodeTypes` object for React Flow.
 * It uses a Proxy to dynamically wrap node components with Suspense,
 * enabling lazy loading.
 *
 * @returns A `nodeTypes` object compatible with React Flow.
 */
export function useDynamicNodeTypes() {
  const nodeTypes = useMemo(() => {
    const kinds = Object.keys(lazyNodeLoaders);
    const types: Record<string, FC<NodeProps>> = {};
    for (const kind of kinds) {
        types[kind] = (props: NodeProps) => <NodeSuspenseWrapper kind={kind} {...props} />;
    }
    return types;
  }, []);

  return nodeTypes;
} 