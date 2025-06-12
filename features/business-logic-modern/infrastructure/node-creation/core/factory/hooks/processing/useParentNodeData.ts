/**
 * USE PARENT NODE DATA HOOK - Efficiently retrieves and memoizes data from connected parent nodes.
 *
 * This hook is the definitive solution to the race condition caused by inefficiently
 * watching all node data. It ensures that a node's processing logic only re-runs
 * when the data from its direct upstream dependencies actually changes.
 *
 * @param nodeId - The ID of the current node.
 * @param connections - The complete list of connections in the graph.
 * @param nodesData - The complete list of all node data objects.
 * @returns A memoized array of data objects from the connected parent nodes.
 */

import { useMemo } from 'react';
import { Connection } from '@xyflow/react';

interface NodeData {
  id: string;
  data: Record<string, any>;
}

export function useParentNodeData(
  nodeId: string,
  connections: Connection[],
  nodesData: NodeData[]
) {
  const parentNodeData = useMemo(() => {
    // 1. Find all connections where the current node is the target.
    const parentConnections = connections.filter(
      (conn) => conn.target === nodeId
    );
    const parentNodeIds = new Set(
      parentConnections.map((conn) => conn.source)
    );

    // 2. Filter the complete node list to get only the parent nodes.
    const parentNodes = nodesData.filter((node) =>
      parentNodeIds.has(node.id)
    );

    // 3. Extract just their data.
    return parentNodes.map(node => node.data);
  }, [nodeId, connections, nodesData]);

  // 4. Stringify the result for a stable dependency in the main processing hook.
  // This is now hyper-efficient as it only includes data from direct parents.
  return JSON.stringify(parentNodeData);
} 