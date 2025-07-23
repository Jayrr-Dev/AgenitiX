/**
 * CONNECTION HANDLERS HOOK - Provides immediate connection/disconnection callbacks
 * 
 * This hook listens to edge changes and provides callbacks for when handles are
 * connected or disconnected, allowing nodes to respond immediately to connection
 * state changes rather than relying on useEffect polling.
 * 
 * Keywords: connection-handlers, edge-changes, immediate-callbacks, node-lifecycle
 */

import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '@xyflow/react';

export interface ConnectionHandlers {
  onConnect?: (edge: any) => void;
  onDisconnect?: (edge: any) => void;
}

export function useConnectionHandlers(
  nodeId: string,
  handlers: ConnectionHandlers
) {
  const edges = useStore((state) => state.edges);
  const previousEdgesRef = useRef<any[]>([]);

  // Check for new connections (edges that exist now but didn't before)
  const checkForNewConnections = useCallback(() => {
    const currentEdges = edges.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    );
    
    const previousEdges = previousEdgesRef.current.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    );

    // Find new connections
    currentEdges.forEach(currentEdge => {
      const isNew = !previousEdges.some(prevEdge => 
        prevEdge.id === currentEdge.id
      );
      
      if (isNew && handlers.onConnect) {
        handlers.onConnect(currentEdge);
      }
    });

    // Find disconnected connections
    previousEdges.forEach(prevEdge => {
      const isDisconnected = !currentEdges.some(currentEdge => 
        currentEdge.id === prevEdge.id
      );
      
      if (isDisconnected && handlers.onDisconnect) {
        handlers.onDisconnect(prevEdge);
      }
    });

    // Update the previous edges reference
    previousEdgesRef.current = [...edges];
  }, [edges, nodeId, handlers]);

  // Monitor edge changes
  useEffect(() => {
    checkForNewConnections();
  }, [checkForNewConnections]);

  return {
    // Helper to manually trigger disconnect (useful for testing)
    triggerDisconnect: useCallback(() => {
      if (handlers.onDisconnect) {
        handlers.onDisconnect({ source: nodeId, target: nodeId });
      }
    }, [nodeId, handlers])
  };
} 