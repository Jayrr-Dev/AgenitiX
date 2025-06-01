import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AgenNode, AgenEdge, NodeError } from '../flow-editor/types';
import { INITIAL_NODES, INITIAL_EDGES } from '../flow-editor/constants';
import { cleanupNodeTimers, emergencyCleanupAllTimers } from '../nodes/utils/timerCleanup';
import { performCompleteMemoryCleanup } from '../nodes/utils/memoryCleanup';

// ============================================================================
// STORE TYPES
// ============================================================================

interface FlowState {
  // Core Flow Data
  nodes: AgenNode[];
  edges: AgenEdge[];
  
  // Selection State
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  
  // UI State
  showHistoryPanel: boolean;
  inspectorLocked: boolean;
  
  // Error State
  nodeErrors: Record<string, NodeError[]>;
  
  // Copy/Paste State
  copiedNodes: AgenNode[];
  copiedEdges: AgenEdge[];

  // Hydration State
  _hasHydrated: boolean;
}

interface FlowActions {
  // Node Operations
  updateNodeData: (nodeId: string, data: Partial<Record<string, unknown>>) => void;
  updateNodeId: (oldId: string, newId: string) => boolean;
  addNode: (node: AgenNode) => void;
  removeNode: (nodeId: string) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  
  // Edge Operations
  addEdge: (edge: AgenEdge) => void;
  removeEdge: (edgeId: string) => void;
  updateEdge: (edgeId: string, updates: Partial<AgenEdge>) => void;
  
  // Selection Operations
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  clearSelection: () => void;
  
  // UI Operations
  toggleHistoryPanel: () => void;
  setInspectorLocked: (locked: boolean) => void;
  
  // Error Operations
  logNodeError: (nodeId: string, message: string, type?: NodeError['type'], source?: string) => void;
  clearNodeErrors: (nodeId: string) => void;
  
  // Copy/Paste Operations
  copySelectedNodes: () => void;
  pasteNodes: () => void;
  pasteNodesAtPosition: (position?: { x: number; y: number }) => void;
  
  // Bulk Operations
  setNodes: (nodes: AgenNode[]) => void;
  setEdges: (edges: AgenEdge[]) => void;
  
  // Reset
  resetFlow: () => void;

  // Force reset to initial state (clears localStorage)
  forceReset: () => void;

  // Hydration
  setHasHydrated: (hasHydrated: boolean) => void;
}

type FlowStore = FlowState & FlowActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: FlowState = {
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  selectedNodeId: null,
  selectedEdgeId: null,
  showHistoryPanel: false,
  inspectorLocked: false,
  nodeErrors: {},
  copiedNodes: [],
  copiedEdges: [],
  _hasHydrated: false,
};

// ============================================================================
// STORE CREATION
// ============================================================================

export const useFlowStore = create<FlowStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ============================================================================
        // NODE OPERATIONS
        // ============================================================================
        
        updateNodeData: (nodeId: string, data: Partial<Record<string, unknown>>) => {
          set((state) => {
            const node = state.nodes.find((n: AgenNode) => n.id === nodeId);
            if (node) {
              Object.assign(node.data, data);
            }
          });
        },

        updateNodeId: (oldId: string, newId: string) => {
          let success = false;
          set((state) => {
            // Check if new ID already exists
            const existingNode = state.nodes.find((n: AgenNode) => n.id === newId);
            if (existingNode) {
              success = false;
              return;
            }
            
            // Update the node ID
            const node = state.nodes.find((n: AgenNode) => n.id === oldId);
            if (node) {
              node.id = newId;
              success = true;
              
              // Update all edges that reference this node
              state.edges.forEach((edge: AgenEdge) => {
                if (edge.source === oldId) {
                  edge.source = newId;
                }
                if (edge.target === oldId) {
                  edge.target = newId;
                }
              });
              
              // Update selected node ID if it was the one being changed
              if (state.selectedNodeId === oldId) {
                state.selectedNodeId = newId;
              }
              
              // Update node errors mapping
              if (state.nodeErrors[oldId]) {
                state.nodeErrors[newId] = state.nodeErrors[oldId];
                delete state.nodeErrors[oldId];
              }
            }
          });
          return success;
        },

        addNode: (node: AgenNode) => {
          set((state) => {
            state.nodes.push(node);
          });
        },

        removeNode: (nodeId: string) => {
          set((state) => {
            // MEMORY LEAK FIX: Clean up all timers for the node before removing
            cleanupNodeTimers(nodeId);
            
            state.nodes = state.nodes.filter((n: AgenNode) => n.id !== nodeId);
            state.edges = state.edges.filter((e: AgenEdge) => e.source !== nodeId && e.target !== nodeId);
            if (state.selectedNodeId === nodeId) {
              state.selectedNodeId = null;
            }
            delete state.nodeErrors[nodeId];
          });
        },

        updateNodePosition: (nodeId: string, position: { x: number; y: number }) => {
          set((state) => {
            const node = state.nodes.find((n: AgenNode) => n.id === nodeId);
            if (node) {
              node.position = position;
            }
          });
        },

        // ============================================================================
        // EDGE OPERATIONS
        // ============================================================================

        addEdge: (edge: AgenEdge) => {
          set((state) => {
            state.edges.push(edge);
          });
        },

        removeEdge: (edgeId: string) => {
          set((state) => {
            state.edges = state.edges.filter((e: AgenEdge) => e.id !== edgeId);
            if (state.selectedEdgeId === edgeId) {
              state.selectedEdgeId = null;
            }
          });
        },

        updateEdge: (edgeId: string, updates: Partial<AgenEdge>) => {
          set((state) => {
            const edge = state.edges.find((e: AgenEdge) => e.id === edgeId);
            if (edge) {
              Object.assign(edge, updates);
            }
          });
        },

        // ============================================================================
        // SELECTION OPERATIONS
        // ============================================================================

        selectNode: (nodeId: string | null) => {
          set((state) => {
            state.selectedNodeId = nodeId;
            state.selectedEdgeId = null; // Clear edge selection when selecting node
          });
        },

        selectEdge: (edgeId: string | null) => {
          set((state) => {
            state.selectedEdgeId = edgeId;
            state.selectedNodeId = null; // Clear node selection when selecting edge
          });
        },

        clearSelection: () => {
          set((state) => {
            state.selectedNodeId = null;
            state.selectedEdgeId = null;
          });
        },

        // ============================================================================
        // UI OPERATIONS
        // ============================================================================

        toggleHistoryPanel: () => {
          set((state) => {
            state.showHistoryPanel = !state.showHistoryPanel;
          });
        },

        setInspectorLocked: (locked: boolean) => {
          set((state) => {
            state.inspectorLocked = locked;
          });
        },

        // ============================================================================
        // ERROR OPERATIONS
        // ============================================================================

        logNodeError: (nodeId: string, message: string, type: NodeError['type'] = 'error', source?: string) => {
          set((state) => {
            if (!state.nodeErrors[nodeId]) {
              state.nodeErrors[nodeId] = [];
            }
            
            const error: NodeError = {
              timestamp: Date.now(),
              message,
              type,
              source,
            };
            
            state.nodeErrors[nodeId].push(error);
            
            // Keep only the last 10 errors per node
            if (state.nodeErrors[nodeId].length > 10) {
              state.nodeErrors[nodeId] = state.nodeErrors[nodeId].slice(-10);
            }
          });
        },

        clearNodeErrors: (nodeId: string) => {
          set((state) => {
            delete state.nodeErrors[nodeId];
          });
        },

        // ============================================================================
        // COPY/PASTE OPERATIONS
        // ============================================================================

        copySelectedNodes: () => {
          const { nodes, edges } = get();
          
          // Get all selected nodes from ReactFlow state
          const selectedNodes = nodes.filter(node => node.selected);
          if (selectedNodes.length === 0) return;

          // Get all selected edges
          const selectedEdges = edges.filter(edge => edge.selected);
          
          // Also include edges between selected nodes (even if edge isn't explicitly selected)
          const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
          const edgesBetweenSelectedNodes = edges.filter(edge => 
            selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
          );
          
          // Combine explicitly selected edges with edges between selected nodes
          const allRelevantEdges = [...selectedEdges];
          edgesBetweenSelectedNodes.forEach(edge => {
            if (!allRelevantEdges.find(e => e.id === edge.id)) {
              allRelevantEdges.push(edge);
            }
          });

          set((state) => {
            state.copiedNodes = [...selectedNodes];
            state.copiedEdges = allRelevantEdges;
          });
        },

        pasteNodes: () => {
          const { copiedNodes, copiedEdges } = get();
          if (copiedNodes.length === 0) return;

          set((state) => {
            // Create mapping from old IDs to new IDs
            const nodeIdMap = new Map<string, string>();
            
            // Generate new nodes with unique IDs and offset positions
            copiedNodes.forEach(node => {
              const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              nodeIdMap.set(node.id, newId);
              
              const newNode: AgenNode = {
                ...node,
                id: newId,
                position: {
                  x: node.position.x + 40, // Standard offset
                  y: node.position.y + 40,
                },
                selected: false, // Don't select pasted nodes initially
              };
              
              state.nodes.push(newNode);
            });

            // Create new edges with updated node references
            copiedEdges.forEach(edge => {
              const newSourceId = nodeIdMap.get(edge.source);
              const newTargetId = nodeIdMap.get(edge.target);
              
              // Only create edge if both nodes were copied
              if (newSourceId && newTargetId) {
                const newEdge: AgenEdge = {
                  ...edge,
                  id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  source: newSourceId,
                  target: newTargetId,
                  selected: false, // Don't select pasted edges initially
                };
                
                state.edges.push(newEdge);
              }
            });
          });
        },

        pasteNodesAtPosition: (position?: { x: number; y: number }) => {
          const { copiedNodes, copiedEdges } = get();
          if (copiedNodes.length === 0) return;

          set((state) => {
            // Calculate the center of the copied nodes
            const bounds = copiedNodes.reduce(
              (acc, node) => {
                return {
                  minX: Math.min(acc.minX, node.position.x),
                  minY: Math.min(acc.minY, node.position.y),
                  maxX: Math.max(acc.maxX, node.position.x),
                  maxY: Math.max(acc.maxY, node.position.y),
                };
              },
              { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
            );

            const centerX = (bounds.minX + bounds.maxX) / 2;
            const centerY = (bounds.minY + bounds.maxY) / 2;

            // Determine paste position
            let pasteX: number;
            let pasteY: number;

            if (position) {
              // Paste at specified position (e.g., mouse cursor)
              pasteX = position.x;
              pasteY = position.y;
            } else {
              // Default offset paste (original behavior)
              pasteX = centerX + 40;
              pasteY = centerY + 40;
            }

            // Calculate offset from original center to paste position
            const offsetX = pasteX - centerX;
            const offsetY = pasteY - centerY;

            // Create mapping from old IDs to new IDs
            const nodeIdMap = new Map<string, string>();
            
            // Generate new nodes with unique IDs and calculated positions
            copiedNodes.forEach(node => {
              const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              nodeIdMap.set(node.id, newId);
              
              const newNode: AgenNode = {
                ...node,
                id: newId,
                position: {
                  x: node.position.x + offsetX,
                  y: node.position.y + offsetY,
                },
                selected: false, // Don't select pasted nodes initially
              };
              
              state.nodes.push(newNode);
            });

            // Create new edges with updated node references
            copiedEdges.forEach(edge => {
              const newSourceId = nodeIdMap.get(edge.source);
              const newTargetId = nodeIdMap.get(edge.target);
              
              // Only create edge if both nodes were copied
              if (newSourceId && newTargetId) {
                const newEdge: AgenEdge = {
                  ...edge,
                  id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  source: newSourceId,
                  target: newTargetId,
                  selected: false, // Don't select pasted edges initially
                };
                
                state.edges.push(newEdge);
              }
            });
          });
        },

        // ============================================================================
        // BULK OPERATIONS
        // ============================================================================

        setNodes: (nodes: AgenNode[]) => {
          set((state) => {
            state.nodes = nodes;
          });
        },

        setEdges: (edges: AgenEdge[]) => {
          set((state) => {
            state.edges = edges;
          });
        },

        // ============================================================================
        // RESET
        // ============================================================================

        resetFlow: () => {
          set((state) => {
            Object.assign(state, initialState);
          });
        },

        // Force reset to initial state (clears localStorage)
        forceReset: () => {
          console.warn('🧹 Force reset initiated - performing comprehensive memory cleanup');
          
          // MEMORY LEAK FIX: Comprehensive cleanup of ALL accumulated data
          try {
            const memoryStats = performCompleteMemoryCleanup();
            console.log('Memory cleanup stats:', memoryStats);
          } catch (error) {
            console.error('Memory cleanup failed:', error);
            // Fallback to timer cleanup only
            emergencyCleanupAllTimers();
          }
          
          set(() => ({
            ...initialState,
            _hasHydrated: true,
          }));
          
          console.log('✅ Force reset complete');
        },

        // Hydration
        setHasHydrated: (hasHydrated: boolean) => {
          set((state) => {
            state._hasHydrated = hasHydrated;
          });
        },
      })),
      {
        name: 'flow-editor-storage',
        partialize: (state) => ({
          // Only persist essential data, not UI state
          nodes: state.nodes,
          edges: state.edges,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.setHasHydrated(true);
          }
        },
      }
    ),
    {
      name: 'flow-editor',
    }
  )
);

// ============================================================================
// SELECTORS (for performance optimization)
// ============================================================================

// Stable empty array to avoid creating new arrays on every render
const EMPTY_ARRAY: never[] = [];

export const useSelectedNode = () => {
  return useFlowStore((state) => {
    const selectedNodeId = state.selectedNodeId;
    return selectedNodeId ? state.nodes.find(n => n.id === selectedNodeId) || null : null;
  });
};

export const useSelectedEdge = () => {
  return useFlowStore((state) => {
    const selectedEdgeId = state.selectedEdgeId;
    return selectedEdgeId ? state.edges.find(e => e.id === selectedEdgeId) || null : null;
  });
};

export const useNodeById = (nodeId: string) => {
  return useFlowStore((state) => state.nodes.find(n => n.id === nodeId) || null);
};

export const useNodeErrors = (nodeId: string | null) => {
  return useFlowStore((state) => {
    if (!nodeId || !state.nodeErrors) return EMPTY_ARRAY;
    return state.nodeErrors[nodeId] || EMPTY_ARRAY;
  });
};

// ============================================================================
// COMPUTED VALUES
// ============================================================================

export const useFlowStats = () => {
  return useFlowStore((state) => ({
    nodeCount: state.nodes.length,
    edgeCount: state.edges.length,
    errorCount: Object.values(state.nodeErrors || {}).flat().length,
  }));
}; 