import * as allNodes from '@/features/business-logic-modern/node-domain';
import type { NodeSpec } from '../node-core';
import React from 'react';

type NodeModule = {
  default: React.ComponentType<any> & { spec: NodeSpec };
};

type LazyNodeLoader = () => Promise<NodeModule>;

// The 'allNodes' import is a module namespace object.
// Its keys are the export names (e.g., 'CreateTextNode')
// and its values are the modules themselves.
const nodeLoaderCache: Record<string, LazyNodeLoader> = {};

for (const nodeExportName in allNodes) {
    const nodePromise = (allNodes as any)[nodeExportName];
    // This is a bit of a hack to get the kind from the module without loading it.
    // In a real scenario, the 'kind' might be part of the export name.
    // For now, we assume the export name matches the pattern PascalCaseKind + 'Node'.
    const kind = nodeExportName.replace(/Node$/, '');
    const camelCaseKind = kind.charAt(0).toLowerCase() + kind.slice(1);
    
    nodeLoaderCache[camelCaseKind] = () => Promise.resolve(nodePromise);
}


/**
 * A map of all available node kinds to a function that lazily imports the node module.
 * e.g., 'createText' -> () => import('./domain/create/createText.node')
 */
export const lazyNodeLoaders: Record<string, LazyNodeLoader> = nodeLoaderCache;

/**
 * Retrieves the static NodeSpec for a given node kind without loading the component.
 * NOTE: This is a simplified implementation. A real-world version might involve
 * a build step that extracts specs into a JSON file.
 * @param kind The kind of the node.
 * @returns A promise that resolves to the node's spec.
 */
export async function getNodeSpec(kind: string): Promise<NodeSpec | undefined> {
  const loader = lazyNodeLoaders[kind];
  if (!loader) {
    console.warn(`No loader found for node kind: ${kind}`);
    return undefined;
  }
  const module = await loader();
  return module.default.spec;
} 