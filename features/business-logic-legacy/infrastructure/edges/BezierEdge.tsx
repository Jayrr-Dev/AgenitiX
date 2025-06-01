import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';

export default function BezierEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}) {
  const { setEdges } = useReactFlow();

  // Calculate bezier curve path and label position
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  // Delete edge handler
  const handleDelete = () => {
    setEdges((es) => es.filter((e) => e.id !== id));
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <button
          onClick={handleDelete}
          title="Delete edge"
          className="nodrag nopan text-xs bg-white dark:bg-zinc-800 text-black dark:text-white border border-neutral-400 dark:border-neutral-600 rounded px-1 shadow absolute"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          ✕
        </button>
      </EdgeLabelRenderer>
    </>
  );
}