/**
 * NODE CONNECTIONS - Connection information and management
 *
 * • Displays incoming and outgoing connections
 * • Shows connection details including source/target nodes
 * • Displays node output for connected nodes
 * • Part of node inspector accordion system
 *
 * Keywords: node-connections, connection-display, incoming-outgoing, accordion-card
 */

import type { Edge } from "@xyflow/react";
import type React from "react";
import { useMemo } from "react";

import type { AgenNode } from "../../../flow-engine/types/nodeData";

// Helper function to get node output (simplified version)
const getNodeOutput = (
  node: AgenNode,
  nodes: AgenNode[],
  edges: Edge[]
): any => {
  // This is a simplified version - you may need to import the actual getNodeOutput function
  return node.data?.output || node.data?.store || null;
};

interface Connection {
  edge: Edge;
  sourceNode?: AgenNode;
  targetNode?: AgenNode;
  sourceOutput?: any;
  targetInput?: any;
}

interface ConnectionsData {
  incoming: Connection[];
  outgoing: Connection[];
}

interface NodeConnectionsProps {
  selectedNode: AgenNode;
  nodes: AgenNode[];
  edges: Edge[];
}

export const NodeConnections: React.FC<NodeConnectionsProps> = ({
  selectedNode,
  nodes,
  edges,
}) => {
  // Get connections for selected node
  const connections: ConnectionsData = useMemo(() => {
    if (!selectedNode) {
      return { incoming: [], outgoing: [] };
    }

    const incoming = edges
      .filter((edge) => edge.target === selectedNode.id)
      .map((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        return {
          edge,
          sourceNode,
          sourceOutput: sourceNode
            ? getNodeOutput(sourceNode, nodes, edges)
            : null,
        };
      });

    const outgoing = edges
      .filter((edge) => edge.source === selectedNode.id)
      .map((edge) => {
        const targetNode = nodes.find((n) => n.id === edge.target);
        return {
          edge,
          targetNode,
          targetInput: targetNode
            ? getNodeOutput(targetNode, nodes, edges)
            : null,
        };
      });

    return { incoming, outgoing };
  }, [selectedNode, nodes, edges]);

  return (
    <div className="space-y-3">
      {/* Incoming Connections */}
      {connections.incoming.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
              INCOMING
            </span>
            <span className="text-muted-foreground text-xs">
              ({connections.incoming.length})
            </span>
          </div>
          <div className="space-y-2">
            {connections.incoming.map((connection, _index) => (
              <div
                key={connection.edge.id}
                className="rounded border border-border/50 bg-muted/20 p-2"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 font-medium text-muted-foreground text-xs dark:bg-blue-900/30">
                      FROM
                    </span>
                    <span className="font-medium text-foreground text-xs">
                      {connection.sourceNode?.type || "Unknown"}
                    </span>
                  </div>
                  <span className="font-mono text-muted-foreground text-xs">
                    {connection.edge.source}
                  </span>
                </div>
                {connection.sourceOutput && (
                  <div className="rounded border border-border/30 bg-background p-1.5 text-muted-foreground text-xs">
                    {(() => {
                      const output = connection.sourceOutput;
                      if (typeof output === "string") return output;
                      if (output && typeof output === "object")
                        return JSON.stringify(output, null, 2);
                      return String(output);
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Connections */}
      {connections.outgoing.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
              OUTGOING
            </span>
            <span className="text-muted-foreground text-xs">
              ({connections.outgoing.length})
            </span>
          </div>
          <div className="space-y-2">
            {connections.outgoing.map((connection, _index) => (
              <div
                key={connection.edge.id}
                className="rounded border border-border/50 bg-muted/20 p-2"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-green-100 px-1.5 py-0.5 font-medium text-muted-foreground text-xs dark:bg-green-900/30">
                      TO
                    </span>
                    <span className="font-medium text-foreground text-xs">
                      {connection.targetNode?.type || "Unknown"}
                    </span>
                  </div>
                  <span className="font-mono text-muted-foreground text-xs">
                    {connection.edge.target}
                  </span>
                </div>
                {connection.targetInput && (
                  <div className="rounded border border-border/30 bg-background p-1.5 text-muted-foreground text-xs">
                    {(() => {
                      const input = connection.targetInput;
                      if (typeof input === "string") return input;
                      if (input && typeof input === "object")
                        return JSON.stringify(input, null, 2);
                      return String(input);
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Connections */}
      {connections.incoming.length === 0 &&
        connections.outgoing.length === 0 && (
          <div className="py-4 text-center text-muted-foreground/60 text-xs">
            No connections
          </div>
        )}
    </div>
  );
};

export default NodeConnections;
