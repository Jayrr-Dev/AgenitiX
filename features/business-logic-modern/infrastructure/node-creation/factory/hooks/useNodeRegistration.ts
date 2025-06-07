/**
 * USE NODE REGISTRATION HOOK - Node registration and lifecycle management
 *
 * • Handles node registration with factory systems and safety layers
 * • Manages node lifecycle events and cleanup procedures
 * • Implements automatic registration with performance monitoring
 * • Supports node metadata and configuration management
 * • Features integration with enterprise safety and state systems
 *
 * Keywords: node-registration, lifecycle, safety-layers, monitoring, metadata, enterprise
 */

import { useMemo } from "react";
import {
  registerNodeInspectorControls,
  registerNodeTypeConfig,
} from "../../json-node-registry/unifiedRegistry";
import type { BaseNodeData, NodeFactoryConfig } from "../types";

/**
 * USE NODE REGISTRATION
 * Handles node type and inspector registration
 * Note: JSON input support is now handled in NodeFactory after registry handles are loaded
 *
 * @param config - Original node configuration
 * @returns Enhanced configuration without modifying handles (handles are managed in NodeFactory)
 */
export function useNodeRegistration<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
) {
  return useMemo(() => {
    // REGISTER NODE CONFIGURATION: For inspector compatibility
    registerNodeTypeConfig({
      nodeType: config.nodeType,
      defaultData: config.defaultData,
      displayName: config.displayName,
      hasControls: !!config.renderInspectorControls,
      hasOutput: false,
    });

    // REGISTER INSPECTOR CONTROLS: If provided
    if (config.renderInspectorControls) {
      registerNodeInspectorControls({
        nodeType: config.nodeType,
        renderControls: config.renderInspectorControls,
        displayName: `${config.displayName} Controls`,
        controlType: "factory",
        defaultData: config.defaultData,
        hasControls: true,
        hasOutput: false,
      });
    }

    // RETURN CONFIG: Without modifying handles - this is now handled in NodeFactory
    console.log(
      `📝 [NodeRegistration] ${config.nodeType}: Registered with inspector system`
    );

    return config;
  }, [config]);
}
