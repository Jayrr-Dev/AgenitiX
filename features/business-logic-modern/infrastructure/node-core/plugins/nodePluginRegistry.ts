/**
 * NODE PLUGIN REGISTRY - UI add-ons rendered inside every node.
 *
 * Plugins are React components receiving node context.  They can render badges,
 * dev helpers, feature-flag ribbons, etc.  They should be light-weight and
 * side-effect-free (no server calls).
 */

import React from "react";

export interface NodePluginProps {
  nodeId: string;
  nodeKind: string;
  data: Record<string, unknown>;
}

export type NodePlugin = React.FC<NodePluginProps>;

const plugins: NodePlugin[] = [];

export const registerNodePlugin = (plugin: NodePlugin) => {
  plugins.push(plugin);
};

export const getNodePlugins = () => plugins;
