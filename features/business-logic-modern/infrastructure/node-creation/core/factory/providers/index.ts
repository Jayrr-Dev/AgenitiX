/**
 * CORE PROVIDERS - State Management and Data Flow
 *
 * • Exports enhanced state management providers
 * • Provides React context-based data flow management
 * • Features performance optimization and memory safety
 *
 * Keywords: providers, state-management, data-flow, react-context
 */

// State Management Provider
export {
  SafeStateLayer,
  SafeStateProvider,
  useNodeState,
  useSafeState,
} from "./SafeStateProvider";

export type {
  SafeStateContextValue,
  SafeStateProviderProps,
  StateMetrics,
  StateUpdateCallback,
  StateValidator,
} from "./SafeStateProvider";

// Data Flow Provider
export {
  DataFlowProvider,
  SafeDataFlowController,
  useDataFlow,
  useNodeDataFlow,
} from "./DataFlowProvider";

export type {
  DataFlowContextValue,
  DataFlowMetrics,
  DataFlowProviderProps,
} from "./DataFlowProvider";
