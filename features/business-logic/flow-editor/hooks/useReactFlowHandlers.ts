import { useCallback, useRef } from 'react';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge,
  reconnectEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Edge,
  type OnConnect,
  type OnSelectionChangeFunc,
  ReactFlowInstance
} from '@xyflow/react';
import { toast } from 'sonner';
import type { AgenNode, AgenEdge } from '../types';
import { validateConnection, getConnectionDataType, createEdgeStyle } from '../utils/connectionUtils';

interface ReactFlowHandlersProps {
  nodes: AgenNode[];
  edges: AgenEdge[];
  setNodes: (nodes: AgenNode[] | ((prev: AgenNode[]) => AgenNode[])) => void;
  setEdges: (edges: AgenEdge[] | ((prev: AgenEdge[]) => AgenEdge[])) => void;
  onSelectionChange: (nodeId: string | null) => void;
  onEdgeSelectionChange: (edgeId: string | null) => void;
}

export function useReactFlowHandlers({
  nodes,
  edges,
  setNodes,
  setEdges,
  onSelectionChange,
  onEdgeSelectionChange
}: ReactFlowHandlersProps) {
  // ============================================================================
  // REFS
  // ============================================================================
  
  const flowInstance = useRef<ReactFlowInstance<AgenNode, AgenEdge> | null>(null);
  const edgeReconnectFlag = useRef(true);

  // ============================================================================
  // RECONNECTION HANDLERS
  // ============================================================================
  
  const onReconnectStart = useCallback(() => {
    edgeReconnectFlag.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConn: Connection) => {
      edgeReconnectFlag.current = true;
      setEdges((els) => reconnectEdge(oldEdge, newConn, els) as AgenEdge[]);
    },
    [setEdges]
  );

  const onReconnectEnd = useCallback((_: any, edge: Edge) => {
    if (!edgeReconnectFlag.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
    edgeReconnectFlag.current = true;
  }, [setEdges]);

  // ============================================================================
  // NODE/EDGE CHANGE HANDLERS
  // ============================================================================
  
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds) as AgenNode[]),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds) as AgenEdge[]),
    [setEdges]
  );

  // ============================================================================
  // CONNECTION HANDLER
  // ============================================================================
  
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // Validate connection
      if (!validateConnection(connection)) {
        toast.error('Type mismatch: cannot connect these handles.');
        return;
      }

      // Get data type for styling
      const dataType = getConnectionDataType(connection);
      
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'default',
            style: createEdgeStyle(dataType),
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // ============================================================================
  // SELECTION HANDLER
  // ============================================================================
  
  const onSelectionChangeHandler: OnSelectionChangeFunc<AgenNode, AgenEdge> = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      // Handle node selection first
      const nodeId = selectedNodes.length > 0 ? selectedNodes[0].id : null;
      onSelectionChange(nodeId);
      
      // Only handle edge selection if NO nodes are selected
      if (selectedNodes.length === 0) {
        const edgeId = selectedEdges.length > 0 ? selectedEdges[0].id : null;
        onEdgeSelectionChange(edgeId);
      }
    },
    [onSelectionChange, onEdgeSelectionChange]
  );

  // ============================================================================
  // FLOW INSTANCE HANDLER
  // ============================================================================
  
  const onInit = useCallback((rf: ReactFlowInstance<AgenNode, AgenEdge>) => {
    flowInstance.current = rf;
  }, []);

  // ============================================================================
  // RETURN HANDLERS AND REFS
  // ============================================================================
  
  return {
    // Refs
    flowInstance,
    
    // Handlers
    onReconnectStart,
    onReconnect,
    onReconnectEnd,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange: onSelectionChangeHandler,
    onInit
  };
} 