import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useReactFlow,
} from '@xyflow/react';

export default function CustomEdge({
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
  const reactFlowInstance = useReactFlow();

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  // Delete edge handler using ReactFlow's standard deletion
  const handleDelete = () => {
    // Use ReactFlow's built-in deletion which will trigger the proper change handlers
    // and automatically be detected by UndoRedoManager
    reactFlowInstance.deleteElements({ edges: [{ id }] });
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
