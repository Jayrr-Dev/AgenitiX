import { useMemo } from 'react';
import type { BaseNodeData, NodeFactoryConfig } from '../types';
import { registerNodeTypeConfig, registerNodeInspectorControls } from '../registry/inspectorRegistry';
import { addJsonInputSupport } from '../utils/jsonProcessor';

/**
 * USE NODE REGISTRATION
 * Handles node type and inspector registration
 * 
 * @param config - Original node configuration
 * @returns Enhanced configuration with JSON support
 */
export function useNodeRegistration<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
) {
  return useMemo(() => {
    // REGISTER NODE CONFIGURATION: For inspector compatibility
    registerNodeTypeConfig(config.nodeType, {
      defaultData: config.defaultData,
      displayName: config.displayName,
      hasControls: !!config.renderInspectorControls,
      hasOutput: false,
    });

    // REGISTER INSPECTOR CONTROLS: If provided
    if (config.renderInspectorControls) {
      registerNodeInspectorControls(config.nodeType, config.renderInspectorControls);
    }

    // ENHANCE CONFIG: Add automatic JSON input support
    const enhancedConfig = {
      ...config,
      handles: addJsonInputSupport(config.handles)
    };

    return enhancedConfig;
  }, [config]);
} 