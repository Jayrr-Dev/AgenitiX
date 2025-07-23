/**
 * USE OPTIMIZED DATA FLOW HOOK - Ultra-fast data propagation for chained values
 *
 * • Optimized for instant propagation when source values change
 * • Minimal re-renders with efficient dependency tracking
 * • Direct data access without unnecessary abstractions
 * • Immediate propagation with optional micro-debouncing
 * • Optimized for text-based data flows and chaining
 * • Uses React Flow's native data flow for maximum performance
 *
 * Keywords: optimized-propagation, instant-updates, minimal-renders, chaining
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { useFlowStore } from "../stores/flowStore";
import type { AgenNode, AgenEdge } from "../types/nodeData";

// ============================================================================
// TYPES
// ============================================================================

export interface OptimizedDataFlowConfig {
  /** Whether to enable instant propagation (default: true) */
  instantPropagation?: boolean;
  /** Micro-debounce delay in ms for rapid changes (default: 16ms = 60fps) */
  debounceDelay?: number;
  /** Whether to batch multiple rapid updates */
  batchUpdates?: boolean;
  /** Custom data extraction function */
  extractData?: (nodeData: any) => any;
  /** Custom data transformation function */
  transformData?: (data: any) => any;
}

export interface OptimizedDataFlowResult {
  /** Current input data from connected nodes */
  inputData: any;
  /** Trigger immediate output propagation */
  propagateOutput: (data: any) => void;
  /** Get connected input nodes */
  getInputNodes: () => AgenNode[];
  /** Get connected output nodes */
  getOutputNodes: () => AgenNode[];
  /** Check if node has inputs */
  hasInputs: boolean;
  /** Check if node has outputs */
  hasOutputs: boolean;
  /** Last propagation timestamp */
  lastPropagation: number;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useOptimizedDataFlow(
  nodeId: string,
  config: OptimizedDataFlowConfig = {}
): OptimizedDataFlowResult {
  const { getNodes, getEdges } = useReactFlow();
  const { updateNodeData } = useFlowStore();
  
  // Get current nodes and edges
  const nodes = getNodes();
  const edges = getEdges();
  
  // Configuration with defaults
  const {
    instantPropagation = true,
    debounceDelay = 16, // 60fps for smooth updates
    batchUpdates = true,
    extractData,
    transformData
  } = config;

  // Refs for performance optimization
  const lastPropagationRef = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputDataRef = useRef<any>(null);
  const isPropagatingRef = useRef<boolean>(false);

  // ============================================================================
  // CONNECTION UTILITIES
  // ============================================================================

  // Get input nodes (nodes that connect TO this node)
  const inputNodes = useMemo(() => {
    return edges
      .filter(edge => edge.target === nodeId)
      .map(edge => nodes.find(node => node.id === edge.source))
      .filter(Boolean) as any[];
  }, [edges, nodes, nodeId]);

  // Get output nodes (nodes that this node connects TO)
  const outputNodes = useMemo(() => {
    return edges
      .filter(edge => edge.source === nodeId)
      .map(edge => nodes.find(node => node.id === edge.target))
      .filter(Boolean) as any[];
  }, [edges, nodes, nodeId]);

  // Check if node has inputs/outputs
  const hasInputs = inputNodes.length > 0;
  const hasOutputs = outputNodes.length > 0;

  // ============================================================================
  // INPUT DATA EXTRACTION
  // ============================================================================

  // Extract input data from connected nodes with stable references
  const inputData = useMemo(() => {
    if (!hasInputs) return null;

    const extractedData = inputNodes.map(node => {
      if (!node?.data) return null;

      // Use custom extraction function if provided
      if (extractData) {
        return extractData(node.data);
      }

      // Default extraction logic optimized for text nodes
      if (node.data.text !== undefined) {
        return node.data.text;
      }
      if (node.data.output !== undefined) {
        return node.data.output;
      }
      if (node.data.value !== undefined) {
        return node.data.value;
      }
      if (typeof node.data === 'string') {
        return node.data;
      }

      // Fallback to stringifying the data
      return String(node.data);
    }).filter(Boolean);

    // Return single value if only one input, array if multiple
    return extractedData.length === 1 ? extractedData[0] : extractedData;
  }, [inputNodes, hasInputs, extractData]);

  // ============================================================================
  // OPTIMIZED OUTPUT PROPAGATION
  // ============================================================================

  // Immediate propagation function
  const propagateImmediate = useCallback((data: any) => {
    if (isPropagatingRef.current) return;

    try {
      isPropagatingRef.current = true;
      lastPropagationRef.current = Date.now();

      // Transform data if custom function provided
      const transformedData = transformData ? transformData(data) : data;

      // Update node data immediately
      updateNodeData(nodeId, { 
        output: transformedData
      });

      // Note: Downstream nodes will automatically detect the input change
      // through their own useOptimizedDataFlow hooks, so we don't need
      // to manually trigger them

    } finally {
      isPropagatingRef.current = false;
    }
  }, [nodeId, outputNodes, updateNodeData, transformData]);

  // Debounced propagation function
  const propagateDebounced = useCallback((data: any) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced propagation
    debounceTimeoutRef.current = setTimeout(() => {
      propagateImmediate(data);
    }, debounceDelay);
  }, [propagateImmediate, debounceDelay]);

  // Main propagation function that chooses immediate or debounced
  const propagateOutput = useCallback((data: any) => {
    // Skip if we're already propagating
    if (isPropagatingRef.current) return;

    // Update the last input data reference
    lastInputDataRef.current = data;

    if (instantPropagation) {
      propagateImmediate(data);
    } else {
      propagateDebounced(data);
    }
  }, [instantPropagation, propagateImmediate, propagateDebounced]);

  // ============================================================================
  // AUTOMATIC INPUT MONITORING
  // ============================================================================

  // Monitor input data changes and auto-propagate
  // DISABLED to prevent infinite loops - nodes will handle their own propagation





  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    inputData,
    propagateOutput,
    getInputNodes: () => inputNodes,
    getOutputNodes: () => outputNodes,
    hasInputs,
    hasOutputs,
    lastPropagation: lastPropagationRef.current
  };
} 