/**
 * REACT FLOW INTEGRATION - Complete Ultimate Typesafe Handle System Integration
 *
 * • Provides complete React Flow integration with connection prevention
 * • Maintains exact colors and behavior from original system
 * • Auto-disconnects incompatible connections
 * • Easy to maintain and reliable
 * • Drop-in replacement for existing React Flow setups
 *
 * Usage:
 * ```jsx
 * import { UltimateReactFlow } from './ReactFlowIntegration';
 *
 * <UltimateReactFlow
 *   nodes={nodes}
 *   edges={edges}
 *   onNodesChange={onNodesChange}
 *   onEdgesChange={onEdgesChange}
 *   // ... other React Flow props
 * />
 * ```
 */

import {
  ReactFlow,
  type ReactFlowProps,
  ReactFlowProvider,
} from "@xyflow/react";
import { useUltimateFlowConnectionPrevention } from "./UltimateTypesafeHandle";

// ===== MAIN INTEGRATION COMPONENT =====

/**
 * Ultimate React Flow - Complete integration with typesafe handles
 *
 * This component provides:
 * • Automatic connection prevention for incompatible types
 * • Preserved original colors and styling
 * • Auto-disconnection of invalid connections
 * • Original toast feedback system
 * • Full union type support
 * • 25+ expanded data types
 */
export function UltimateReactFlow(props: ReactFlowProps) {
  return (
    <ReactFlowProvider>
      <UltimateReactFlowInner {...props} />
    </ReactFlowProvider>
  );
}

/**
 * Inner component that uses the connection prevention hook
 */
function UltimateReactFlowInner(props: ReactFlowProps) {
  const { isValidConnection } = useUltimateFlowConnectionPrevention();

  return <ReactFlow {...props} isValidConnection={isValidConnection} />;
}

// ===== CONVENIENCE EXPORTS =====

/**
 * Direct hook export for custom React Flow setups
 */
export { useUltimateFlowConnectionPrevention } from "./UltimateTypesafeHandle";

/**
 * Component exports
 */
export { default as UltimateTypesafeHandle } from "./UltimateTypesafeHandle";

/**
 * Type system exports for advanced usage
 */
export {
  createUnionType,
  getCompatibleTypes,
  isUnionType,
  parseUnionTypes,
  ULTIMATE_COMPATIBILITY_RULES,
  ULTIMATE_TYPE_MAP,
} from "./UltimateTypesafeHandle";

// ===== QUICK SETUP GUIDE =====

/**
 * QUICK SETUP INSTRUCTIONS:
 *
 * 1. REPLACE YOUR REACT FLOW COMPONENT:
 * ```jsx
 * // OLD:
 * import { ReactFlow } from '@xyflow/react';
 * <ReactFlow nodes={nodes} edges={edges} ... />
 *
 * // NEW:
 * import { UltimateReactFlow } from './ReactFlowIntegration';
 * <UltimateReactFlow nodes={nodes} edges={edges} ... />
 * ```
 *
 * 2. UPDATE YOUR HANDLE COMPONENTS:
 * ```jsx
 * // OLD:
 * import TypesafeHandle from './TypesafeHandle';
 * <TypesafeHandle dataType="s" ... />
 *
 * // NEW:
 * import { UltimateTypesafeHandle } from './ReactFlowIntegration';
 * <UltimateTypesafeHandle dataType="s" ... />
 * // OR with unions:
 * <UltimateTypesafeHandle dataType="s|n|b" unionDisplay="all" ... />
 * ```
 *
 * 3. THAT'S IT!
 * Your system now has:
 * ✅ Complete connection prevention
 * ✅ Auto-disconnection of invalid connections
 * ✅ Original toast styling preserved
 * ✅ 25+ expanded types including unions
 * ✅ Enhanced compatibility rules
 * ✅ Easy maintenance and reliability
 */

export default UltimateReactFlow;
