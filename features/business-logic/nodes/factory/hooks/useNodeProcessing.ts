import { useEffect } from 'react';
import type { BaseNodeData, NodeFactoryConfig } from '../types';

// FOCUSED PROCESSING HOOKS
import { 
  useErrorInjectionProcessing, 
  createErrorInjectionConfig 
} from './useErrorInjectionProcessing';
import { 
  useJsonInputProcessing, 
  createJsonProcessingConfig 
} from './useJsonInputProcessing';
import { 
  useActivationCalculation, 
  createActivationConfig,
  hasActivationChanged 
} from './useActivationCalculation';
import { 
  useGPUAcceleration, 
  createGPUAccelerationConfig 
} from './useGPUAcceleration';
import { 
  useMainProcessingLogic, 
  createProcessingConfig 
} from './useMainProcessingLogic';

// ============================================================================
// ENTERPRISE SAFETY LAYERS TYPE
// ============================================================================

interface SafetyLayers {
  visual: {
    updateVisualState: (nodeId: string, isActive: boolean) => void;
  };
  state: any;
  dataFlow: {
    setNodeActivation: (nodeId: string, isActive: boolean) => void;
  };
}

// ============================================================================
// PROCESSING STATE TYPE
// ============================================================================

interface ProcessingState {
  isActive: boolean;
  error: string | null;
}

// ============================================================================
// REFACTORED USE NODE PROCESSING
// ============================================================================

/**
 * USE NODE PROCESSING
 * Orchestrates all processing logic using focused, modular hooks
 * Enhanced with enterprise safety layer integration
 * 
 * Key improvements:
 * ✅ Broken down into 5 focused hooks (single responsibility)
 * ✅ Simplified conditional logic with early returns
 * ✅ Smaller, focused effects with specific dependencies
 * ✅ Clear separation of concerns
 * ✅ Maintained backward compatibility
 * ✅ Enhanced error handling and logging
 * 
 * @param id - Node ID
 * @param nodeState - Node state and actions
 * @param connectionData - Connection data
 * @param config - Enhanced node configuration
 * @param safetyLayers - Optional enterprise safety layers
 * @returns Processing state
 */
export function useNodeProcessing<T extends BaseNodeData>(
  id: string,
  nodeState: any,
  connectionData: any,
  config: NodeFactoryConfig<T>,
  safetyLayers?: SafetyLayers
): ProcessingState {
  
  // ========================================================================
  // CONFIGURATION CREATION
  // ========================================================================
  
  const errorInjectionConfig = createErrorInjectionConfig(config.nodeType);
  const jsonProcessingConfig = createJsonProcessingConfig(config.handles, config.nodeType);
  const activationConfig = createActivationConfig(config.nodeType);
  const gpuAccelerationConfig = createGPUAccelerationConfig(config.nodeType, id);
  const processingConfig = createProcessingConfig(config.nodeType, config.processLogic);

  // ========================================================================
  // FOCUSED PROCESSING HOOKS
  // ========================================================================

  // ERROR INJECTION PROCESSING: Handle VIBE mode error injection
  useErrorInjectionProcessing(
    id, 
    errorInjectionConfig, 
    connectionData, 
    nodeState
  );

  // JSON INPUT PROCESSING: Handle JSON input processing with throttling
  const jsonProcessingState = useJsonInputProcessing(
    id,
    jsonProcessingConfig,
    connectionData,
    nodeState.data
  );

  // ACTIVATION CALCULATION: Calculate node activation state
  const activationResult = useActivationCalculation(
    id,
    activationConfig,
    nodeState.data,
    connectionData
  );

  // GPU ACCELERATION: Setup ultra-fast propagation for high-frequency nodes
  const gpuAcceleration = useGPUAcceleration(
    gpuAccelerationConfig,
    connectionData,
    nodeState.updateNodeData,
    safetyLayers
  );

  // MAIN PROCESSING LOGIC: Execute core business logic
  const processingState = useMainProcessingLogic(
    id,
    processingConfig,
    nodeState.data,
    connectionData,
    nodeState,
    activationResult,
    gpuAcceleration.propagateUltraFast
  );

  // ========================================================================
  // ACTIVATION STATE MANAGEMENT WITH ENTERPRISE SAFETY
  // ========================================================================
  
  useEffect(() => {
    const activationChange = hasActivationChanged(
      nodeState.isActive, 
      activationResult.calculatedIsActive
    );

    if (activationChange.hasChanged) {
      // UPDATE LOCAL STATE
      nodeState.setIsActive(activationResult.calculatedIsActive);
      
      // ENTERPRISE SAFETY LAYER INTEGRATION
      if (safetyLayers) {
        safetyLayers.visual.updateVisualState(id, activationResult.calculatedIsActive);
        safetyLayers.dataFlow.setNodeActivation(id, activationResult.calculatedIsActive);
      }
      
      // LOGGING FOR DIFFERENT ACTIVATION TYPES
      if (activationChange.isDeactivating) {
        console.log(`UFS ${config.nodeType} ${id}: DEACTIVATING - Using ultra-fast instant propagation`);
      } else if (activationChange.isActivating) {
        console.log(`UFS ${config.nodeType} ${id}: ACTIVATING - Using ultra-fast smooth propagation`);
      }
      
      // ULTRA-FAST PROPAGATION
      gpuAcceleration.propagateUltraFast(id, activationResult.calculatedIsActive);
    }
  }, [
    id,
    nodeState.isActive,
    activationResult.calculatedIsActive, 
    gpuAcceleration.propagateUltraFast, 
    safetyLayers,
    config.nodeType
  ]);

  // ========================================================================
  // RETURN PROCESSING STATE
  // ========================================================================

  return {
    isActive: nodeState.isActive,
    error: nodeState.error
  };
}

// ============================================================================
// UTILITY EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

export { 
  createErrorInjectionConfig
} from './useErrorInjectionProcessing';

export { 
  createJsonProcessingConfig
} from './useJsonInputProcessing';

export { 
  createActivationConfig,
  hasActivationChanged 
} from './useActivationCalculation';

export { 
  createGPUAccelerationConfig
} from './useGPUAcceleration';

export { 
  createProcessingConfig
} from './useMainProcessingLogic';

export type { SafetyLayers, ProcessingState }; 